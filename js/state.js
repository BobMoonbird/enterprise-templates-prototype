/**
 * state.js — shared fake data + localStorage session state
 * Roles: security | admin | builder | member
 * Allowlist model: capabilities (tools/integrations) + HTTP domains — not raw n8n nodes.
 */
(function (global) {
  // Bumped for library rebuild (owner/contributors + default-on private library)
  // and allowlist capability pivot — clears stale localStorage seed
  const STORAGE_KEY = "ent-templates-v2-rebuild";

  const ROLES = {
    security: {
      id: "security",
      label: "Security",
      description: "Defines capability allowlist (tools + domains)",
      canCreate: true,
      canCopy: true,
      canSubmit: false,
      canApprove: false,
      canManageRoles: false,
      canManageAllowlist: true,
      canEnableLibrary: false,
    },
    admin: {
      id: "admin",
      label: "Admin",
      description: "Roles + library enable + approve",
      canCreate: true,
      canCopy: true,
      canSubmit: true,
      canApprove: true,
      canManageRoles: true,
      canManageAllowlist: false,
      canEnableLibrary: true,
    },
    builder: {
      id: "builder",
      label: "Builder",
      description: "Create + submit internal templates",
      canCreate: true,
      canCopy: true,
      canSubmit: true,
      canApprove: false,
      canManageRoles: false,
      canManageAllowlist: false,
      canEnableLibrary: false,
    },
    member: {
      id: "member",
      label: "Member",
      description: "Copy/modify company templates only",
      canCreate: false,
      canCopy: true,
      canSubmit: false,
      canApprove: false,
      canManageRoles: false,
      canManageAllowlist: false,
      canEnableLibrary: false,
    },
  };

  /** Tools / integrations Security allowlists (prefer allow-list). Kept as `nodes` for API compat. */
  const DEFAULT_NODES = [
    { id: "cap-slack", name: "Slack", category: "Communication", kind: "integration", allowed: true, icon: "💬" },
    { id: "cap-jira", name: "Jira", category: "DevOps", kind: "integration", allowed: true, icon: "🎫" },
    { id: "cap-salesforce", name: "Salesforce", category: "CRM", kind: "integration", allowed: true, icon: "☁" },
    { id: "cap-snowflake", name: "Snowflake", category: "Data", kind: "integration", allowed: true, icon: "❄" },
    { id: "cap-okta", name: "Okta", category: "Identity", kind: "integration", allowed: true, icon: "🔐" },
    { id: "cap-netsuite", name: "NetSuite", category: "Finance", kind: "integration", allowed: true, icon: "📊" },
    { id: "cap-servicenow", name: "ServiceNow", category: "ITSM", kind: "integration", allowed: true, icon: "🛠" },
    { id: "cap-gmail", name: "Gmail", category: "Communication", kind: "integration", allowed: true, icon: "✉" },
    {
      id: "cap-ssh",
      name: "SSH",
      category: "System",
      kind: "dangerous",
      allowed: false,
      icon: "🖥",
      blockReason:
        "Shell access blocked by Security policy SEC-CAP-12. Request exception via #security-automation.",
    },
    {
      id: "cap-execute-command",
      name: "Execute Command",
      category: "System",
      kind: "dangerous",
      allowed: false,
      icon: "⌘",
      blockReason:
        "Arbitrary command execution is not approved. Prefer HTTP Request (domain-gated) or Code with reviewed libraries.",
    },
    {
      id: "cap-ftp",
      name: "FTP",
      category: "Files",
      kind: "dangerous",
      allowed: false,
      icon: "📁",
      blockReason: "FTP deprecated — use S3 / approved file connectors only.",
    },
  ];

  const DEFAULT_DOMAINS = [
    { id: "dom-netsuite", pattern: "api.netsuite.com", allowed: true, note: "ERP APIs" },
    { id: "dom-acme", pattern: "*.acme.co", allowed: true, note: "Internal services" },
    { id: "dom-okta", pattern: "*.okta.com", allowed: true, note: "IdP" },
    { id: "dom-slack", pattern: "*.slack.com", allowed: true, note: "Messaging APIs" },
    {
      id: "dom-webhook-site",
      pattern: "*.webhook.site",
      allowed: false,
      note: "Public request bins",
      blockReason: "Public requestbin domains blocked by SEC-HTTP-03.",
    },
    {
      id: "dom-ngrok",
      pattern: "*.ngrok.io",
      allowed: false,
      note: "Ephemeral tunnels",
      blockReason: "Ephemeral tunnel hosts are not approved for production workflows.",
    },
  ];

  /** Always-available editor primitives (not on the capability allowlist). */
  const CORE_PALETTE = [
    { id: "core-webhook", name: "Webhook", category: "Core", icon: "⚡", alwaysOn: true },
    {
      id: "core-http",
      name: "HTTP Request",
      category: "Core",
      icon: "🌐",
      alwaysOn: true,
      domainGated: true,
    },
    { id: "core-code", name: "Code", category: "Core", icon: "{ }", alwaysOn: true },
    { id: "core-if", name: "IF", category: "Core", icon: "◇", alwaysOn: true },
    { id: "core-schedule", name: "Schedule Trigger", category: "Core", icon: "⏱", alwaysOn: true },
  ];

  /** Keyword → capability / domain ids for prompt-driven bulk setup */
  const STACK_HINTS = [
    { keys: ["netsuite", "erp"], caps: ["cap-netsuite"], domains: ["dom-netsuite"] },
    { keys: ["salesforce", "crm", "sfdc"], caps: ["cap-salesforce"], domains: [] },
    { keys: ["slack"], caps: ["cap-slack"], domains: ["dom-slack"] },
    { keys: ["snowflake"], caps: ["cap-snowflake"], domains: [] },
    { keys: ["okta", "sso", "idp"], caps: ["cap-okta"], domains: ["dom-okta"] },
    { keys: ["jira", "atlassian"], caps: ["cap-jira"], domains: [] },
    { keys: ["servicenow", "itsm"], caps: ["cap-servicenow"], domains: [] },
    { keys: ["gmail", "google workspace", "workspace"], caps: ["cap-gmail"], domains: [] },
    { keys: ["acme.co", "*.acme"], caps: [], domains: ["dom-acme"] },
  ];

  const DEFAULT_TEMPLATES = [
    {
      id: "tpl-invoice-ocr",
      name: "Invoice OCR → NetSuite",
      description: "Extract invoice fields via OCR and create NetSuite bills. Golden path for AP.",
      status: "golden",
      category: "Finance",
      nodes: ["Webhook", "HTTP Request", "Code", "NetSuite"],
      owner: "Maya Chen",
      contributors: ["Casey Brooks", "Finance CoE"],
      author: "Maya Chen",
      updated: "2026-09-18",
      uses: 142,
      version: "2.1",
      targetGroups: ["Finance ops", "AP shared services"],
    },
    {
      id: "tpl-slack-ticket",
      name: "Slack → Jira triage",
      description: "Route #support messages into Jira with severity labels and assignee rules.",
      status: "golden",
      category: "Support",
      nodes: ["Slack Trigger", "IF", "Jira", "Slack"],
      owner: "DevOps CoE",
      contributors: ["Sam Okonkwo", "Jordan Lee"],
      author: "DevOps CoE",
      updated: "2026-09-12",
      uses: 89,
      version: "1.4",
      targetGroups: ["Support", "IT helpdesk"],
    },
    {
      id: "tpl-hr-onboard",
      name: "New hire provisioning",
      description: "Okta + Google Workspace + Slack welcome for approved Workday hires.",
      status: "golden",
      category: "HR",
      nodes: ["Webhook", "Okta", "Gmail", "Slack"],
      owner: "Priya Nair",
      contributors: ["People Ops"],
      author: "People Ops",
      updated: "2026-08-30",
      uses: 56,
      version: "3.0",
      targetGroups: ["People Ops"],
    },
    {
      id: "tpl-crm-sync",
      name: "Salesforce ↔ Snowflake sync",
      description: "Nightly CRM opportunity snapshot into Snowflake for RevOps dashboards.",
      status: "pending",
      category: "RevOps",
      nodes: ["Schedule", "Salesforce", "Snowflake"],
      owner: "Jordan Lee",
      contributors: ["RevOps", "Data eng"],
      author: "Jordan Lee",
      updated: "2026-09-24",
      uses: 0,
      version: "1.0",
      submittedAt: "2026-09-24",
      submitNote: "Ready for CoE review — uses only allowlisted nodes.",
      targetGroups: ["RevOps"],
    },
    {
      id: "tpl-vendor-risk",
      name: "Vendor risk intake",
      description: "Form → risk score → ServiceNow change request for security review.",
      status: "pending",
      category: "Security",
      nodes: ["Form Trigger", "Code", "HTTP Request", "ServiceNow"],
      owner: "Alex Rivera",
      contributors: ["Security eng"],
      author: "Alex Rivera",
      updated: "2026-09-23",
      uses: 0,
      version: "0.9",
      submittedAt: "2026-09-23",
      submitNote: "Please confirm HTTP Request domain allowlist covers risk API.",
      targetGroups: ["Security eng", "Procurement"],
    },
    {
      id: "tpl-legacy-ftp",
      name: "Legacy FTP file drop",
      description: "Old SFTP ingest — superseded by S3 pattern. Kept for audit trail.",
      status: "archived",
      category: "Ops",
      nodes: ["Schedule", "FTP", "Move Binary Data"],
      owner: "Ops",
      contributors: ["Ops"],
      author: "Ops",
      updated: "2026-06-01",
      uses: 12,
      version: "1.2",
      targetGroups: [],
    },
    {
      id: "tpl-draft-enrich",
      name: "Lead enrich (WIP)",
      description: "Builder draft — Clearbit enrich before CRM write.",
      status: "draft",
      category: "Sales",
      nodes: ["Webhook", "HTTP Request", "Salesforce"],
      owner: "You",
      contributors: ["You"],
      author: "You",
      updated: "2026-09-25",
      uses: 0,
      version: "0.1",
      targetGroups: ["Sales ops"],
    },
  ];

  const DEFAULT_PEOPLE = [
    { id: "u1", name: "Maya Chen", email: "maya@acme.co", role: "builder", team: "Finance ops" },
    { id: "u2", name: "Jordan Lee", email: "jordan@acme.co", role: "builder", team: "RevOps" },
    { id: "u3", name: "Sam Okonkwo", email: "sam@acme.co", role: "member", team: "Support" },
    { id: "u4", name: "Priya Nair", email: "priya@acme.co", role: "member", team: "HR ops" },
    { id: "u5", name: "Alex Rivera", email: "alex@acme.co", role: "builder", team: "Security eng" },
    { id: "u6", name: "Casey Brooks", email: "casey@acme.co", role: "admin", team: "Automation CoE" },
  ];

  /**
   * Primary demo path order (ProtoChrome Back/Next). Titles = JTBD formulas.
   * `role` groups the demo map (Miro Frame 5: Security → Admin → Builder → Member).
   */
  const DEMO_PATH = [
    { id: "00", file: "00-security-allowlist.html", title: "Set approved capabilities for the instance", beat: "Tools + domains · try SSH / stack prompt", role: "security" },
    { id: "01", file: "01-admin-roles.html", title: "Assign who can create vs copy templates", beat: "Not a paywall — role assignment", role: "admin" },
    { id: "01b", file: "01b-library-enable.html", title: "Turn on the company template library", beat: "Settings opt-in", role: "admin" },
    { id: "02", file: "02-builder-editor.html", title: "Build a workflow under policy rails", beat: "Soft-block + request access", role: "builder" },
    { id: "03", file: "03-submit-as-template.html", title: "Submit a workflow as an internal template", beat: "Submit ≠ publish", role: "builder" },
    { id: "03b", file: "03b-approval-queue.html", title: "Approve a pending internal template", beat: "Approve → golden", role: "admin" },
    { id: "04", file: "04-overview.html", title: "Browse workflows after publish", beat: "List → create entry", role: "builder" },
    { id: "05", file: "05-create-empty.html", title: "Start from blank or company template (role-aware)", beat: "Member loses blank", role: "member" },
    { id: "06", file: "06-company-library.html", title: "Pick a golden template from the company library", beat: "Internal SoR — not public gallery", role: "member" },
    { id: "07", file: "07-ai-assist.html", title: "Create a workflow from approved templates with AI", beat: "Match + confirm + trust", role: "member", spur: true },
    { id: "08", file: "08-result.html", title: "Open the workflow created from a golden template", beat: "Provenance chip", role: "member" },
    { id: "09", file: "09-mcp.html", title: "Prefer a golden template via MCP", beat: "Same rails via MCP", role: "member", spur: true },
  ];

  /** Demo map section order + job blurbs (Frame 5 swimlanes) */
  const DEMO_MAP_SECTIONS = [
    { role: "security", job: "Define what builders may use" },
    { role: "admin", job: "Assign create vs copy · enable library · approve goldens" },
    { role: "builder", job: "Build under rails · submit for the company library" },
    { role: "member", job: "Copy / modify approved templates only (AI + MCP same rails)" },
  ];

  function defaultState() {
    return {
      role: "security",
      // Miro feedback: a hard “enable private library” setting is questionable —
      // treat private library as on by default for enterprise demos.
      libraryEnabled: true,
      nodes: JSON.parse(JSON.stringify(DEFAULT_NODES)),
      domains: JSON.parse(JSON.stringify(DEFAULT_DOMAINS)),
      templates: JSON.parse(JSON.stringify(DEFAULT_TEMPLATES)),
      people: JSON.parse(JSON.stringify(DEFAULT_PEOPLE)),
      lastProvenance: null, // { type: 'library'|'ai'|'mcp', templateId, templateName, owner? }
      toastQueue: [],
    };
  }

  /** Role-filtered library: member = golden; builder = golden + own draft/pending; admin = all */
  function templatesForRole(roleId, templates) {
    const role = roleId || state.role;
    const list = templates || state.templates;
    if (role === "admin" || role === "security") return list.slice();
    if (role === "member") return list.filter(function (t) {
      return t.status === "golden";
    });
    // builder (and fallback): golden + own non-golden work
    return list.filter(function (t) {
      if (t.status === "golden") return true;
      if (t.status === "archived") return false;
      const mine =
        t.owner === "You" ||
        t.author === "You" ||
        (t.contributors && t.contributors.indexOf("You") >= 0);
      return mine && (t.status === "pending" || t.status === "draft");
    });
  }

  /** Migrate legacy role id `copy` → `member` (label was Copy-only). */
  function migrateLegacyRoles(s) {
    if (s.role === "copy") s.role = "member";
    if (s.people && s.people.length) {
      s.people.forEach(function (p) {
        if (p.role === "copy") p.role = "member";
      });
    }
    return s;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return migrateLegacyRoles(Object.assign(defaultState(), parsed));
    } catch (e) {
      return defaultState();
    }
  }

  function save(state) {
    const toSave = Object.assign({}, state);
    delete toSave.toastQueue;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }

  let state = load();

  const ProtoState = {
    ROLES,
    DEMO_PATH,
    DEMO_MAP_SECTIONS,
    CORE_PALETTE,
    get() {
      return state;
    },
    persist() {
      save(state);
    },
    reset() {
      state = defaultState();
      save(state);
      return state;
    },
    setRole(roleId) {
      if (!ROLES[roleId]) return;
      state.role = roleId;
      save(state);
      document.body.dataset.role = roleId;
      document.dispatchEvent(new CustomEvent("proto:rolechange", { detail: { role: roleId } }));
    },
    getRole() {
      return ROLES[state.role] || ROLES.builder;
    },
    setLibraryEnabled(on) {
      state.libraryEnabled = !!on;
      save(state);
    },
    toggleNodeAllowed(nodeId) {
      const node = state.nodes.find((n) => n.id === nodeId);
      if (!node) return null;
      node.allowed = !node.allowed;
      save(state);
      return node;
    },
    toggleDomainAllowed(domainId) {
      if (!state.domains) state.domains = JSON.parse(JSON.stringify(DEFAULT_DOMAINS));
      const domain = state.domains.find((d) => d.id === domainId);
      if (!domain) return null;
      domain.allowed = !domain.allowed;
      save(state);
      return domain;
    },
    setCapabilityAllowed(capId, allowed) {
      const node = state.nodes.find((n) => n.id === capId);
      if (!node) return null;
      node.allowed = !!allowed;
      save(state);
      return node;
    },
    setDomainAllowed(domainId, allowed) {
      if (!state.domains) state.domains = JSON.parse(JSON.stringify(DEFAULT_DOMAINS));
      const domain = state.domains.find((d) => d.id === domainId);
      if (!domain) return null;
      domain.allowed = !!allowed;
      save(state);
      return domain;
    },
    /**
     * Prompt-driven bulk setup: parse a free-text tech stack description
     * and return matching capabilities + domains (does not mutate until apply).
     */
    suggestFromStackPrompt(text) {
      const lower = (text || "").toLowerCase();
      const capIds = {};
      const domainIds = {};
      STACK_HINTS.forEach(function (hint) {
        const hit = hint.keys.some(function (k) {
          return lower.indexOf(k) >= 0;
        });
        if (!hit) return;
        hint.caps.forEach(function (id) {
          capIds[id] = true;
        });
        hint.domains.forEach(function (id) {
          domainIds[id] = true;
        });
      });
      const caps = state.nodes.filter(function (n) {
        return capIds[n.id];
      });
      const domains = (state.domains || DEFAULT_DOMAINS).filter(function (d) {
        return domainIds[d.id];
      });
      return { caps: caps, domains: domains };
    },
    applyStackSuggestion(suggestion) {
      if (!suggestion) return;
      (suggestion.caps || []).forEach(function (c) {
        const node = state.nodes.find(function (n) {
          return n.id === c.id;
        });
        if (node && node.kind !== "dangerous") node.allowed = true;
      });
      if (!state.domains) state.domains = JSON.parse(JSON.stringify(DEFAULT_DOMAINS));
      (suggestion.domains || []).forEach(function (d) {
        const domain = state.domains.find(function (x) {
          return x.id === d.id;
        });
        if (domain) domain.allowed = true;
      });
      save(state);
    },
    setPersonRole(personId, roleId) {
      const person = state.people.find((p) => p.id === personId);
      if (!person || !ROLES[roleId]) return;
      person.role = roleId;
      save(state);
      return person;
    },
    getTemplate(id) {
      return state.templates.find((t) => t.id === id);
    },
    getPending() {
      return state.templates.filter((t) => t.status === "pending");
    },
    getGolden() {
      return state.templates.filter((t) => t.status === "golden");
    },
    templatesForRole(roleId) {
      return templatesForRole(roleId);
    },
    updateTemplateStatus(id, status, extra) {
      const t = state.templates.find((x) => x.id === id);
      if (!t) return null;
      t.status = status;
      if (extra) Object.assign(t, extra);
      save(state);
      return t;
    },
    submitDraftAsPending(opts) {
      const draft = state.templates.find((t) => t.id === "tpl-draft-enrich") || state.templates[0];
      const id = "tpl-submitted-" + Date.now();
      const owner = (opts && opts.owner) || "You";
      const contributorsRaw = (opts && opts.contributors) || "";
      const contributors = Array.isArray(contributorsRaw)
        ? contributorsRaw
        : String(contributorsRaw)
            .split(",")
            .map(function (s) {
              return s.trim();
            })
            .filter(Boolean);
      if (contributors.indexOf(owner) < 0) contributors.unshift(owner);
      const groupsRaw = (opts && opts.targetGroups) || "";
      const targetGroups = Array.isArray(groupsRaw)
        ? groupsRaw
        : String(groupsRaw)
            .split(",")
            .map(function (s) {
              return s.trim();
            })
            .filter(Boolean);
      const item = {
        id,
        name: (opts && opts.name) || "AP invoice matcher",
        description:
          (opts && opts.description) ||
          "Matches vendor invoices to POs using allowlisted NetSuite + domain-gated HTTP.",
        status: "pending",
        category: (opts && opts.category) || "Finance",
        nodes: ["Webhook", "HTTP Request", "Code", "NetSuite"],
        owner: owner,
        contributors: contributors,
        author: owner,
        updated: new Date().toISOString().slice(0, 10),
        uses: 0,
        version: "1.0",
        submittedAt: new Date().toISOString().slice(0, 10),
        submitNote: (opts && opts.note) || "Submitting for CoE golden review.",
        targetGroups: targetGroups,
      };
      state.templates.unshift(item);
      if (draft && draft.status === "draft") {
        draft.status = "pending";
        draft.owner = draft.owner || "You";
        draft.contributors = draft.contributors || ["You"];
      }
      save(state);
      return item;
    },
    setProvenance(prov) {
      state.lastProvenance = prov;
      save(state);
    },
    getBlockedNodes() {
      return state.nodes.filter((n) => !n.allowed);
    },
    getAllowedNodes() {
      return state.nodes.filter((n) => n.allowed);
    },
    getDomains() {
      if (!state.domains) {
        state.domains = JSON.parse(JSON.stringify(DEFAULT_DOMAINS));
      }
      return state.domains;
    },
    getBlockedDomains() {
      return this.getDomains().filter((d) => !d.allowed);
    },
  };

  global.ProtoState = ProtoState;
})(window);
