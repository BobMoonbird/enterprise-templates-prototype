/**
 * state.js — shared fake data + localStorage session state
 * Roles: security | admin | builder | member
 * Allowlist model: capabilities (tools/integrations) + HTTP domains — not raw n8n nodes.
 * Prototype versions: v2 (full Security→Member) | v3 (short building-blocks spine)
 */
(function (global) {
  // Bumped for library rebuild (owner/contributors + default-on private library)
  // and allowlist capability pivot — clears stale localStorage seed
  // Bumped when skills/blocks spur landed (merge still backfills missing skills)
  const STORAGE_KEY_V2 = "ent-templates-v2-skills-v1";
  /** Isolated V3 short-path state — resets do not cross-contaminate V2 */
  const STORAGE_KEY_V3 = "ent-templates-v3-short-v1";
  const PROTO_VERSION_KEY = "ent-templates-proto-version";

  const PROTO_VERSIONS = {
    v2: {
      id: "v2",
      label: "Full demo (V2)",
      shortLabel: "Full · V2",
      mapLabel: "Full demo (prior case)",
      description: "Security allowlist → roles → library → submit/approve → member",
    },
    v3: {
      id: "v3",
      label: "Short · building blocks (V3)",
      shortLabel: "Short · V3",
      mapLabel: "Short · building blocks",
      description: "Admin settings (enable + approve) → Builder submit → Member + AI/MCP rails",
    },
  };

  function resolveProtoVersion() {
    try {
      const params = new URLSearchParams(window.location.search || "");
      const q = (params.get("proto") || "").toLowerCase();
      if (q === "v2" || q === "v3") return q;
    } catch (e) {
      /* ignore */
    }
    try {
      const stored = localStorage.getItem(PROTO_VERSION_KEY);
      if (stored === "v2" || stored === "v3") return stored;
    } catch (e) {
      /* ignore */
    }
    return "v2";
  }

  let protoVersion = resolveProtoVersion();

  function storageKeyFor(version) {
    return version === "v3" ? STORAGE_KEY_V3 : STORAGE_KEY_V2;
  }

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
   * Company skills & blocks — deterministic building units (beneath full templates).
   * Skill = named capability with fixed I/O for AI/humans.
   * Block = reusable certified subflow inserted into a workflow.
   */
  const DEFAULT_SKILLS = [
    {
      id: "sk-okta-jira-user",
      kind: "skill",
      name: "Resolve user from Okta + Jira",
      description:
        "Given a Jira account or work email, fetch Okta profile and return a fixed field set for downstream nodes.",
      status: "golden",
      version: "1.2",
      owner: "Identity CoE",
      contributors: ["Priya Nair", "Alex Rivera"],
      updated: "2026-09-20",
      uses: 64,
      inputs: [
        { name: "jira_account_id", type: "string", required: false },
        { name: "work_email", type: "string", required: true },
      ],
      outputs: [
        { name: "display_name", type: "string" },
        { name: "department", type: "string" },
        { name: "manager_email", type: "string" },
        { name: "okta_status", type: "enum" },
        { name: "jira_account_id", type: "string" },
      ],
      caps: ["Okta", "Jira"],
      changelog: [
        { version: "1.2", note: "Added okta_status · pinned Okta domains", at: "2026-09-20" },
        { version: "1.1", note: "Jira account id optional fallback", at: "2026-08-12" },
        { version: "1.0", note: "Initial certified skill", at: "2026-06-01" },
      ],
    },
    {
      id: "bk-weekly-rnd-review",
      kind: "block",
      name: "Write weekly R&D tracker review",
      description:
        "Certified subflow: pull R&D tracker updates for the week, draft a structured review, post to the ops channel.",
      status: "golden",
      version: "2.0",
      owner: "R&D Ops",
      contributors: ["Casey Brooks", "Jordan Lee"],
      updated: "2026-09-15",
      uses: 28,
      inputs: [
        { name: "week_start", type: "date", required: true },
        { name: "tracker_project", type: "string", required: true },
      ],
      outputs: [
        { name: "review_markdown", type: "string" },
        { name: "posted_message_url", type: "string" },
      ],
      caps: ["Jira", "Slack", "Code"],
      changelog: [
        { version: "2.0", note: "Structured sections + owner sign-off field", at: "2026-09-15" },
        { version: "1.0", note: "Initial block", at: "2026-05-20" },
      ],
    },
  ];

  /**
   * Fake impact analysis when Security blocks a capability or HTTP domain.
   * Keys = capability / domain ids; used by 00b → 00c block flow.
   */
  const BLOCK_IMPACT = {
    "cap-slack": [
      { id: "wf-slack-jira", name: "Slack → Jira triage", owner: "DevOps CoE", email: "devops-coe@acme.co", team: "Support", status: "active", lastRun: "2h ago", runsPerWeek: 840, severity: "will_stop" },
      { id: "wf-hr-onboard", name: "New hire provisioning", owner: "Priya Nair", email: "priya@acme.co", team: "HR ops", status: "active", lastRun: "1d ago", runsPerWeek: 48, severity: "will_stop" },
      { id: "wf-war-room", name: "Incident war-room bot", owner: "Sam Okonkwo", email: "sam@acme.co", team: "Support", status: "active", lastRun: "4h ago", runsPerWeek: 120, severity: "will_stop" },
      { id: "wf-csat", name: "CSAT pulse to Slack", owner: "Jordan Lee", email: "jordan@acme.co", team: "RevOps", status: "paused", lastRun: "12d ago", runsPerWeek: 0, severity: "will_break_on_resume" },
    ],
    "cap-salesforce": [
      { id: "wf-crm-sync", name: "Salesforce ↔ Snowflake sync", owner: "Jordan Lee", email: "jordan@acme.co", team: "RevOps", status: "active", lastRun: "6h ago", runsPerWeek: 7, severity: "will_stop" },
      { id: "wf-lead-enrich", name: "Lead enrich (WIP)", owner: "You", email: "you@acme.co", team: "Sales ops", status: "draft", lastRun: "never", runsPerWeek: 0, severity: "will_break_on_run" },
      { id: "wf-opp-alert", name: "Closed-won Slack alert", owner: "Maya Chen", email: "maya@acme.co", team: "Finance ops", status: "active", lastRun: "3h ago", runsPerWeek: 22, severity: "will_stop" },
    ],
    "cap-jira": [
      { id: "wf-slack-jira", name: "Slack → Jira triage", owner: "DevOps CoE", email: "devops-coe@acme.co", team: "Support", status: "active", lastRun: "2h ago", runsPerWeek: 840, severity: "will_stop" },
      { id: "wf-change-gate", name: "Change-request gate", owner: "Alex Rivera", email: "alex@acme.co", team: "Security eng", status: "active", lastRun: "8h ago", runsPerWeek: 35, severity: "will_stop" },
      { id: "wf-sprint-digest", name: "Sprint digest email", owner: "Casey Brooks", email: "casey@acme.co", team: "Automation CoE", status: "active", lastRun: "1d ago", runsPerWeek: 5, severity: "will_stop" },
    ],
    "cap-netsuite": [
      { id: "wf-invoice", name: "Invoice OCR → NetSuite", owner: "Maya Chen", email: "maya@acme.co", team: "Finance ops", status: "active", lastRun: "45m ago", runsPerWeek: 210, severity: "will_stop" },
      { id: "wf-vendor-bill", name: "Vendor bill matcher", owner: "Casey Brooks", email: "casey@acme.co", team: "Automation CoE", status: "active", lastRun: "3h ago", runsPerWeek: 90, severity: "will_stop" },
      { id: "wf-po-sync", name: "PO status sync", owner: "Maya Chen", email: "maya@acme.co", team: "Finance ops", status: "active", lastRun: "5h ago", runsPerWeek: 14, severity: "will_stop" },
      { id: "wf-ap-draft", name: "AP exception router", owner: "Jordan Lee", email: "jordan@acme.co", team: "RevOps", status: "paused", lastRun: "20d ago", runsPerWeek: 0, severity: "will_break_on_resume" },
    ],
    "cap-okta": [
      { id: "wf-hr-onboard", name: "New hire provisioning", owner: "Priya Nair", email: "priya@acme.co", team: "HR ops", status: "active", lastRun: "1d ago", runsPerWeek: 48, severity: "will_stop" },
      { id: "wf-offboard", name: "Offboarding revoke", owner: "Alex Rivera", email: "alex@acme.co", team: "Security eng", status: "active", lastRun: "2d ago", runsPerWeek: 6, severity: "will_stop" },
    ],
    "cap-gmail": [
      { id: "wf-hr-onboard", name: "New hire provisioning", owner: "Priya Nair", email: "priya@acme.co", team: "HR ops", status: "active", lastRun: "1d ago", runsPerWeek: 48, severity: "will_stop" },
      { id: "wf-sprint-digest", name: "Sprint digest email", owner: "Casey Brooks", email: "casey@acme.co", team: "Automation CoE", status: "active", lastRun: "1d ago", runsPerWeek: 5, severity: "will_stop" },
      { id: "wf-invoice-ack", name: "Invoice received ack", owner: "Maya Chen", email: "maya@acme.co", team: "Finance ops", status: "active", lastRun: "2h ago", runsPerWeek: 60, severity: "will_stop" },
    ],
    "cap-snowflake": [
      { id: "wf-crm-sync", name: "Salesforce ↔ Snowflake sync", owner: "Jordan Lee", email: "jordan@acme.co", team: "RevOps", status: "active", lastRun: "6h ago", runsPerWeek: 7, severity: "will_stop" },
      { id: "wf-revops-dash", name: "RevOps nightly snapshot", owner: "Jordan Lee", email: "jordan@acme.co", team: "RevOps", status: "active", lastRun: "9h ago", runsPerWeek: 7, severity: "will_stop" },
    ],
    "cap-servicenow": [
      { id: "wf-vendor-risk", name: "Vendor risk intake", owner: "Alex Rivera", email: "alex@acme.co", team: "Security eng", status: "active", lastRun: "5h ago", runsPerWeek: 18, severity: "will_stop" },
      { id: "wf-change-gate", name: "Change-request gate", owner: "Alex Rivera", email: "alex@acme.co", team: "Security eng", status: "active", lastRun: "8h ago", runsPerWeek: 35, severity: "will_stop" },
      { id: "wf-itsm-bridge", name: "ITSM ticket bridge", owner: "Sam Okonkwo", email: "sam@acme.co", team: "Support", status: "active", lastRun: "1h ago", runsPerWeek: 200, severity: "will_stop" },
    ],
    "dom-slack": [
      { id: "wf-slack-jira", name: "Slack → Jira triage", owner: "DevOps CoE", email: "devops-coe@acme.co", team: "Support", status: "active", lastRun: "2h ago", runsPerWeek: 840, severity: "will_stop" },
      { id: "wf-war-room", name: "Incident war-room bot", owner: "Sam Okonkwo", email: "sam@acme.co", team: "Support", status: "active", lastRun: "4h ago", runsPerWeek: 120, severity: "will_stop" },
      { id: "wf-http-slack", name: "Custom Slack webhook relay", owner: "Casey Brooks", email: "casey@acme.co", team: "Automation CoE", status: "active", lastRun: "30m ago", runsPerWeek: 55, severity: "will_stop" },
    ],
    "dom-netsuite": [
      { id: "wf-invoice", name: "Invoice OCR → NetSuite", owner: "Maya Chen", email: "maya@acme.co", team: "Finance ops", status: "active", lastRun: "45m ago", runsPerWeek: 210, severity: "will_stop" },
      { id: "wf-vendor-bill", name: "Vendor bill matcher", owner: "Casey Brooks", email: "casey@acme.co", team: "Automation CoE", status: "active", lastRun: "3h ago", runsPerWeek: 90, severity: "will_stop" },
    ],
    "dom-okta": [
      { id: "wf-hr-onboard", name: "New hire provisioning", owner: "Priya Nair", email: "priya@acme.co", team: "HR ops", status: "active", lastRun: "1d ago", runsPerWeek: 48, severity: "will_stop" },
      { id: "wf-offboard", name: "Offboarding revoke", owner: "Alex Rivera", email: "alex@acme.co", team: "Security eng", status: "active", lastRun: "2d ago", runsPerWeek: 6, severity: "will_stop" },
    ],
    "dom-acme": [
      { id: "wf-internal-api", name: "Acme inventory sync", owner: "Casey Brooks", email: "casey@acme.co", team: "Automation CoE", status: "active", lastRun: "1h ago", runsPerWeek: 168, severity: "will_stop" },
      { id: "wf-risk-api", name: "Vendor risk intake", owner: "Alex Rivera", email: "alex@acme.co", team: "Security eng", status: "active", lastRun: "5h ago", runsPerWeek: 18, severity: "will_stop" },
      { id: "wf-hr-api", name: "Workday hire bridge", owner: "Priya Nair", email: "priya@acme.co", team: "HR ops", status: "active", lastRun: "12h ago", runsPerWeek: 12, severity: "will_stop" },
    ],
  };

  const DEFAULT_BLOCK_IMPACT = [
    { id: "wf-generic-1", name: "Shared integration runner", owner: "Casey Brooks", email: "casey@acme.co", team: "Automation CoE", status: "active", lastRun: "3h ago", runsPerWeek: 40, severity: "will_stop" },
    { id: "wf-generic-2", name: "Ops notification bridge", owner: "Sam Okonkwo", email: "sam@acme.co", team: "Support", status: "active", lastRun: "1d ago", runsPerWeek: 15, severity: "will_stop" },
    { id: "wf-generic-3", name: "Sandbox probe workflow", owner: "Alex Rivera", email: "alex@acme.co", team: "Security eng", status: "paused", lastRun: "30d ago", runsPerWeek: 0, severity: "will_break_on_resume" },
  ];

  /**
   * V2 primary demo path (ProtoChrome Back/Next). Titles = JTBD formulas.
   * `role` groups the demo map (Miro Frame 5: Security → Admin → Builder → Member).
   */
  const DEMO_PATH_V2 = [
    { id: "00", file: "00-security-allowlist.html", title: "Set approved capabilities for the instance", beat: "Tools + domains · try Block on Slack", role: "security" },
    { id: "00b", file: "00b-block-impact-review.html", title: "Review workflows that will break", beat: "Impact before block · Confirm / Cancel", role: "security" },
    { id: "00c", file: "00c-block-notify-owners.html", title: "Notify owners of blocked capabilities", beat: "Who was notified · sample copy", role: "security" },
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
    {
      id: "10",
      file: "10-save-as-skill-block.html",
      title: "Save selection as a versioned skill or block",
      beat: "Own it like code · Builder",
      role: "builder",
      spur: true,
    },
    {
      id: "10b",
      file: "10b-add-skill-block.html",
      title: "Add a company skill or block to the workflow",
      beat: "Catalog insert · Builder + Member",
      role: "member",
      spur: true,
    },
  ];

  /**
   * V3 short spine — building blocks + create/copy rails (no Security allowlist).
   * Files live under screens/v3/.
   */
  const DEMO_PATH_V3 = [
    {
      id: "V3-01",
      file: "v3/01-enable-library.html",
      title: "Enable library & approve building blocks",
      beat: "One Admin settings page — opt-in + pending queue",
      role: "admin",
    },
    {
      id: "V3-02",
      file: "v3/02-builder-rails.html",
      title: "Build a reusable tool / skill / agent under rails",
      beat: "Soft-block if out of policy",
      role: "builder",
    },
    {
      id: "V3-03",
      file: "v3/03-mark-company-block.html",
      title: "Submit workflow entities for company approval",
      beat: "Multi-select entities · submit ≠ publish",
      role: "builder",
    },
    {
      id: "V3-04",
      file: "v3/01-enable-library.html",
      title: "Approve pending building blocks",
      beat: "Same Admin page — Approve → published company blocks",
      role: "admin",
    },
    {
      id: "V3-05",
      file: "v3/05-create-workflow.html",
      title: "Create workflow — blank vs approved blocks",
      beat: "Member denied blank · request or start from block",
      role: "member",
    },
    {
      id: "V3-06",
      file: "v3/06-blocks-gallery.html",
      title: "Browse company building blocks",
      beat: "Tools / skills / agents · empty-state beat",
      role: "member",
    },
    {
      id: "V3-07",
      file: "v3/07-compose-canvas.html",
      title: "Compose with suggested company blocks",
      beat: "Provenance on canvas",
      role: "member",
    },
    {
      id: "V3-08",
      file: "v3/08-ai-assist.html",
      title: "AI assist — only approved blocks",
      beat: "Out-of-policy suggestion blocked",
      role: "member",
      spur: true,
    },
    {
      id: "V3-09",
      file: "v3/09-mcp.html",
      title: "MCP prefers company building blocks",
      beat: "Same rails via MCP",
      role: "member",
      spur: true,
    },
  ];

  /** Demo map section order + job blurbs (Frame 5 swimlanes) — V2 */
  const DEMO_MAP_SECTIONS_V2 = [
    { role: "security", job: "Define what builders may use · review impact before block · notify owners" },
    { role: "admin", job: "Assign create vs copy · enable library · approve goldens" },
    { role: "builder", job: "Build under rails · submit templates · save skills/blocks" },
    { role: "member", job: "Copy approved templates · insert skills/blocks (AI + MCP same rails)" },
  ];

  /** V3 map — no Security section */
  const DEMO_MAP_SECTIONS_V3 = [
    { role: "admin", job: "Enable building-blocks library · approve pending blocks (one settings page)" },
    { role: "builder", job: "Build under rails · mark as company building block (pending)" },
    { role: "member", job: "Compose from approved blocks · AI + MCP same create/copy rails" },
  ];

  /**
   * Entities present in the V3 demo workflow “Okta user resolve”.
   * Used by Save as building block — multi-select concrete units, not abstract Type+Name.
   * Preselect skill + Okta tool so the demo story is obvious.
   */
  const WORKFLOW_SUBMIT_ENTITIES = [
    {
      id: "ent-wf-okta-resolve",
      kind: "workflow",
      name: "Okta user resolve",
      description:
        "Full workflow template — webhook → Okta lookup → Code shape for downstream use.",
      category: "Identity",
      caps: ["Webhook", "Okta", "Code"],
      preselected: false,
    },
    {
      id: "ent-tool-okta-api",
      kind: "tool",
      name: "Okta API tool",
      description: "Okta connector configured for user profile resolve in this workflow.",
      category: "Identity",
      caps: ["Okta"],
      preselected: true,
    },
    {
      id: "ent-tool-slack-notify",
      kind: "tool",
      name: "Slack notify",
      description: "Posts a structured notification when resolve succeeds or fails.",
      category: "Communication",
      caps: ["Slack"],
      preselected: false,
    },
    {
      id: "ent-skill-okta-resolve",
      kind: "skill",
      name: "Resolve user from Okta",
      description:
        "Given a work email, fetch Okta profile and return display_name + department.",
      category: "Identity",
      caps: ["Okta"],
      preselected: true,
    },
  ];

  /**
   * V3 building blocks seed (tools / skills / agents).
   * Default V3 state starts empty so the empty-library unhappy path is demoable;
   * ensureDemoBlocks() backfills when jumping into late screens.
   */
  const DEFAULT_V3_BLOCKS = [
    {
      id: "bb-okta-resolve",
      kind: "skill",
      name: "Resolve user from Okta",
      description: "Given a work email, return Okta profile fields for downstream nodes.",
      status: "golden",
      category: "Identity",
      version: "1.2",
      owner: "Identity CoE",
      contributors: ["Priya Nair"],
      updated: "2026-09-20",
      uses: 64,
      caps: ["Okta"],
      inputs: [{ name: "work_email", type: "string", required: true }],
      outputs: [
        { name: "display_name", type: "string" },
        { name: "department", type: "string" },
      ],
    },
    {
      id: "bb-slack-post",
      kind: "tool",
      name: "Post structured Slack update",
      description: "Certified Slack post with channel + markdown body contract.",
      status: "golden",
      category: "Communication",
      version: "2.0",
      owner: "DevOps CoE",
      contributors: ["Sam Okonkwo"],
      updated: "2026-09-18",
      uses: 112,
      caps: ["Slack"],
      inputs: [
        { name: "channel", type: "string", required: true },
        { name: "body_md", type: "string", required: true },
      ],
      outputs: [{ name: "message_url", type: "string" }],
    },
    {
      id: "bb-jira-triage",
      kind: "agent",
      name: "Jira severity triage agent",
      description: "Classifies support text into severity + suggested Jira fields.",
      status: "golden",
      category: "Support",
      version: "1.1",
      owner: "Support CoE",
      contributors: ["Jordan Lee"],
      updated: "2026-09-22",
      uses: 41,
      caps: ["Jira"],
      inputs: [{ name: "ticket_text", type: "string", required: true }],
      outputs: [
        { name: "severity", type: "enum" },
        { name: "suggested_labels", type: "string[]" },
      ],
    },
    {
      id: "bb-netsuite-bill",
      kind: "tool",
      name: "Create NetSuite vendor bill",
      description: "Writes a vendor bill from structured invoice fields.",
      status: "golden",
      category: "Finance",
      version: "1.0",
      owner: "Finance CoE",
      contributors: ["Maya Chen"],
      updated: "2026-09-10",
      uses: 88,
      caps: ["NetSuite"],
      inputs: [
        { name: "vendor_id", type: "string", required: true },
        { name: "amount", type: "number", required: true },
      ],
      outputs: [{ name: "bill_id", type: "string" }],
    },
    {
      id: "bb-weekly-rnd",
      kind: "skill",
      name: "Draft weekly R&D review",
      description: "Pull tracker updates and draft a structured weekly review.",
      status: "golden",
      category: "R&D",
      version: "2.0",
      owner: "R&D Ops",
      contributors: ["Casey Brooks"],
      updated: "2026-09-15",
      uses: 28,
      caps: ["Jira", "Slack", "Code"],
      inputs: [{ name: "week_start", type: "date", required: true }],
      outputs: [{ name: "review_markdown", type: "string" }],
    },
    {
      id: "bb-risk-score",
      kind: "agent",
      name: "Vendor risk scorer",
      description: "Scores vendor intake forms and routes high-risk to ServiceNow.",
      status: "pending",
      category: "Security",
      version: "0.9",
      owner: "Alex Rivera",
      contributors: ["Security eng"],
      updated: "2026-09-23",
      uses: 0,
      caps: ["ServiceNow", "HTTP Request"],
      submittedAt: "2026-09-23",
      submitNote: "Pending CoE — confirm HTTP domains for risk API.",
      inputs: [{ name: "intake_payload", type: "object", required: true }],
      outputs: [{ name: "risk_score", type: "number" }],
    },
  ];

  function defaultStateV2() {
    return {
      role: "security",
      // Miro feedback: a hard “enable private library” setting is questionable —
      // treat private library as on by default for enterprise demos.
      libraryEnabled: true,
      nodes: JSON.parse(JSON.stringify(DEFAULT_NODES)),
      domains: JSON.parse(JSON.stringify(DEFAULT_DOMAINS)),
      templates: JSON.parse(JSON.stringify(DEFAULT_TEMPLATES)),
      skills: JSON.parse(JSON.stringify(DEFAULT_SKILLS)),
      people: JSON.parse(JSON.stringify(DEFAULT_PEOPLE)),
      lastProvenance: null, // { type: 'library'|'ai'|'mcp'|'skill'|'block', … }
      lastInsertedSkill: null, // skill/block just added to canvas
      lastSavedSkill: null, // skill/block just saved from editor
      /** In-flight block review: { kind:'capability'|'domain', id, label, icon? } */
      pendingBlock: null,
      /** After confirm: pendingBlock + workflows + notifiedOwners + notifiedAt */
      lastBlockAction: null,
      toastQueue: [],
    };
  }

  /** V3 starts with library off + empty published catalog (empty-library beat). */
  function defaultStateV3() {
    return {
      role: "admin",
      libraryEnabled: false,
      nodes: JSON.parse(JSON.stringify(DEFAULT_NODES)),
      domains: JSON.parse(JSON.stringify(DEFAULT_DOMAINS)),
      templates: [],
      skills: [],
      /** Company building blocks (tools / skills / agents) */
      blocks: [],
      people: JSON.parse(JSON.stringify(DEFAULT_PEOPLE)),
      lastProvenance: null,
      lastInsertedSkill: null,
      lastSavedSkill: null,
      lastInsertedBlock: null,
      pendingBlock: null,
      lastBlockAction: null,
      toastQueue: [],
    };
  }

  function defaultState() {
    return protoVersion === "v3" ? defaultStateV3() : defaultStateV2();
  }

  function getDemoPath() {
    return protoVersion === "v3" ? DEMO_PATH_V3 : DEMO_PATH_V2;
  }

  function getDemoMapSections() {
    return protoVersion === "v3" ? DEMO_MAP_SECTIONS_V3 : DEMO_MAP_SECTIONS_V2;
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
      return (
        mine &&
        (t.status === "pending" || t.status === "draft" || t.status === "changes")
      );
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
      const raw = localStorage.getItem(storageKeyFor(protoVersion));
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const merged = migrateLegacyRoles(Object.assign(defaultState(), parsed));
      if (protoVersion === "v2" && (!merged.skills || !merged.skills.length)) {
        merged.skills = JSON.parse(JSON.stringify(DEFAULT_SKILLS));
      }
      if (protoVersion === "v3" && !Array.isArray(merged.blocks)) {
        merged.blocks = [];
      }
      return merged;
    } catch (e) {
      return defaultState();
    }
  }

  function save(stateObj) {
    const toSave = Object.assign({}, stateObj);
    delete toSave.toastQueue;
    localStorage.setItem(storageKeyFor(protoVersion), JSON.stringify(toSave));
  }

  let state = load();

  try {
    localStorage.setItem(PROTO_VERSION_KEY, protoVersion);
  } catch (e) {
    /* ignore */
  }

  const ProtoState = {
    ROLES,
    PROTO_VERSIONS,
    DEMO_PATH_V2,
    DEMO_PATH_V3,
    DEMO_MAP_SECTIONS_V2,
    DEMO_MAP_SECTIONS_V3,
    DEFAULT_V3_BLOCKS,
    WORKFLOW_SUBMIT_ENTITIES,
    CORE_PALETTE,
    DEFAULT_SKILLS,
    get DEMO_PATH() {
      return getDemoPath();
    },
    get DEMO_MAP_SECTIONS() {
      return getDemoMapSections();
    },
    getProtoVersion() {
      return protoVersion;
    },
    setProtoVersion(versionId, opts) {
      if (versionId !== "v2" && versionId !== "v3") return;
      if (versionId === protoVersion) {
        if (opts && opts.forceReload) {
          /* fall through */
        } else {
          return protoVersion;
        }
      }
      protoVersion = versionId;
      try {
        localStorage.setItem(PROTO_VERSION_KEY, protoVersion);
      } catch (e) {
        /* ignore */
      }
      state = load();
      document.body.dataset.proto = protoVersion;
      document.dispatchEvent(
        new CustomEvent("proto:versionchange", { detail: { version: protoVersion } })
      );
      if (opts && opts.reload !== false) {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set("proto", protoVersion);
          // Switching versions from a screen in the other path → go to demo map
          const onIndex =
            /index\.html$/i.test(url.pathname) ||
            /\/prototype-v2\/?$/i.test(url.pathname) ||
            url.pathname.endsWith("/");
          if (!onIndex && opts && opts.toMap) {
            const prefix = opts.mapHref || "index.html";
            window.location.href = prefix + (prefix.indexOf("?") >= 0 ? "&" : "?") + "proto=" + protoVersion;
            return protoVersion;
          }
          window.history.replaceState({}, "", url.toString());
        } catch (e) {
          /* ignore */
        }
      }
      return protoVersion;
    },
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
    /** V3: seed demo building blocks when jumping into late screens with empty catalog */
    ensureDemoBlocks() {
      if (!state.blocks) state.blocks = [];
      if (state.blocks.length) return state.blocks;
      state.blocks = JSON.parse(JSON.stringify(DEFAULT_V3_BLOCKS));
      state.libraryEnabled = true;
      save(state);
      return state.blocks;
    },
    getBlocks(kind) {
      if (!state.blocks) state.blocks = [];
      const list = state.blocks.slice();
      if (!kind || kind === "all") return list;
      return list.filter(function (b) {
        return b.kind === kind;
      });
    },
    getBlock(id) {
      if (!state.blocks) state.blocks = [];
      return state.blocks.find(function (b) {
        return b.id === id;
      });
    },
    getPendingBlocks() {
      return this.getBlocks().filter(function (b) {
        return b.status === "pending";
      });
    },
    getGoldenBlocks() {
      return this.getBlocks().filter(function (b) {
        return b.status === "golden";
      });
    },
    /** Builder marks a unit as company building block → pending (not live). */
    submitCompanyBlock(opts) {
      if (!state.blocks) state.blocks = [];
      const kindRaw = (opts && opts.kind) || "skill";
      const kind =
        kindRaw === "tool" ||
        kindRaw === "agent" ||
        kindRaw === "skill" ||
        kindRaw === "workflow"
          ? kindRaw
          : "skill";
      const owner = (opts && opts.owner) || "You";
      const id =
        (opts && opts.idPrefix ? opts.idPrefix + "-" : "bb-submitted-") +
        Date.now() +
        "-" +
        Math.floor(Math.random() * 1000);
      const item = {
        id: id,
        kind: kind,
        name: (opts && opts.name) || "Untitled building block",
        description: (opts && opts.description) || "",
        status: "pending",
        category: (opts && opts.category) || "Ops",
        version: (opts && opts.version) || "1.0",
        owner: owner,
        contributors: (opts && opts.contributors) || [owner],
        updated: new Date().toISOString().slice(0, 10),
        uses: 0,
        caps: (opts && opts.caps) || [],
        inputs: (opts && opts.inputs) || [],
        outputs: (opts && opts.outputs) || [],
        submittedAt: new Date().toISOString().slice(0, 10),
        submitNote: (opts && opts.note) || "Submitted as company building block — awaiting Admin.",
        sourceEntityId: (opts && opts.sourceEntityId) || null,
      };
      state.blocks.unshift(item);
      state.lastSavedSkill = item;
      save(state);
      return item;
    },
    /**
     * Submit multiple concrete entities from a workflow for Admin approval.
     * Each selected entity becomes its own pending company block.
     */
    submitCompanyBlocks(entities, shared) {
      shared = shared || {};
      const list = Array.isArray(entities) ? entities : [];
      const created = [];
      list.forEach(function (ent, i) {
        if (!ent) return;
        const item = this.submitCompanyBlock({
          kind: ent.kind,
          name: ent.name,
          description: ent.description,
          category: ent.category,
          caps: ent.caps,
          inputs: ent.inputs,
          outputs: ent.outputs,
          owner: shared.owner || "You",
          note: shared.note,
          idPrefix: "bb-ent-" + i,
          sourceEntityId: ent.id,
        });
        created.push(item);
      }, this);
      return created;
    },
    updateBlockStatus(id, status, extra) {
      if (!state.blocks) state.blocks = [];
      const b = state.blocks.find(function (x) {
        return x.id === id;
      });
      if (!b) return null;
      b.status = status;
      if (extra) Object.assign(b, extra);
      b.updated = new Date().toISOString().slice(0, 10);
      save(state);
      return b;
    },
    insertBlockIntoWorkflow(id) {
      const item = this.getBlock(id);
      if (!item) return null;
      item.uses = (item.uses || 0) + 1;
      state.lastInsertedBlock = item;
      state.lastProvenance = {
        type: item.kind || "block",
        blockId: item.id,
        blockName: item.name,
        skillId: item.id,
        skillName: item.name,
        version: item.version,
        owner: item.owner,
      };
      save(state);
      return item;
    },
    getLastInsertedBlock() {
      return state.lastInsertedBlock;
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
    /**
     * Start admin review before applying a block (capability or domain).
     * Does not mutate allowlist until confirmPendingBlock().
     */
    beginBlockReview(kind, id) {
      if (kind === "capability") {
        const node = state.nodes.find((n) => n.id === id);
        if (!node || !node.allowed) return null;
        state.pendingBlock = {
          kind: "capability",
          id: node.id,
          label: node.name,
          icon: node.icon || "",
          category: node.category,
        };
      } else if (kind === "domain") {
        if (!state.domains) state.domains = JSON.parse(JSON.stringify(DEFAULT_DOMAINS));
        const domain = state.domains.find((d) => d.id === id);
        if (!domain || !domain.allowed) return null;
        state.pendingBlock = {
          kind: "domain",
          id: domain.id,
          label: domain.pattern,
          icon: "🌐",
          category: domain.note || "HTTP domain",
        };
      } else {
        return null;
      }
      save(state);
      return state.pendingBlock;
    },
    clearPendingBlock() {
      state.pendingBlock = null;
      save(state);
    },
    getPendingBlock() {
      return state.pendingBlock;
    },
    /** Affected workflows for current pendingBlock (or explicit id). */
    getBlockImpact(kind, id) {
      const k = kind || (state.pendingBlock && state.pendingBlock.kind);
      const i = id || (state.pendingBlock && state.pendingBlock.id);
      if (!i) return DEFAULT_BLOCK_IMPACT.slice();
      const list = BLOCK_IMPACT[i];
      return list ? list.slice() : DEFAULT_BLOCK_IMPACT.slice();
    },
    /** Summarize owners from a workflow impact list. */
    summarizeImpactOwners(workflows) {
      const byOwner = {};
      (workflows || []).forEach(function (w) {
        const key = w.owner || "Unknown";
        if (!byOwner[key]) {
          byOwner[key] = {
            owner: key,
            email: w.email || "",
            team: w.team || "",
            workflows: [],
            stopCount: 0,
          };
        }
        byOwner[key].workflows.push(w);
        if (w.severity === "will_stop") byOwner[key].stopCount += 1;
      });
      return Object.keys(byOwner).map(function (k) {
        return byOwner[k];
      });
    },
    /**
     * Apply the pending block + record notification payload for 00c.
     * Returns lastBlockAction or null.
     */
    confirmPendingBlock() {
      const pending = state.pendingBlock;
      if (!pending) return null;
      if (pending.kind === "capability") {
        this.setCapabilityAllowed(pending.id, false);
      } else if (pending.kind === "domain") {
        this.setDomainAllowed(pending.id, false);
      }
      const workflows = this.getBlockImpact(pending.kind, pending.id);
      const owners = this.summarizeImpactOwners(workflows);
      state.lastBlockAction = {
        kind: pending.kind,
        id: pending.id,
        label: pending.label,
        icon: pending.icon || "",
        category: pending.category || "",
        workflows: workflows,
        notifiedOwners: owners,
        notifiedAt: new Date().toISOString(),
        policyRef: pending.kind === "domain" ? "SEC-HTTP-BLOCK" : "SEC-CAP-BLOCK",
      };
      state.pendingBlock = null;
      save(state);
      return state.lastBlockAction;
    },
    getLastBlockAction() {
      return state.lastBlockAction;
    },
    /** Seed a demo pending block when opening 00b without coming from 00. */
    ensureDemoPendingBlock() {
      if (state.pendingBlock) return state.pendingBlock;
      if (state.lastBlockAction && !state.pendingBlock) {
        // Prefer fresh review of Slack if still allowed
      }
      const slack = state.nodes.find(function (n) {
        return n.id === "cap-slack" && n.allowed;
      });
      if (slack) return this.beginBlockReview("capability", "cap-slack");
      const allowed = state.nodes.find(function (n) {
        return n.allowed && n.kind !== "dangerous";
      });
      if (allowed) return this.beginBlockReview("capability", allowed.id);
      // Fallback: synthesize review of already-blocked Slack for demo walkthrough
      state.pendingBlock = {
        kind: "capability",
        id: "cap-slack",
        label: "Slack",
        icon: "💬",
        category: "Communication",
        demoReplay: true,
      };
      save(state);
      return state.pendingBlock;
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
    getSkills(kind) {
      if (!state.skills) state.skills = JSON.parse(JSON.stringify(DEFAULT_SKILLS));
      const list = state.skills.slice();
      if (!kind || kind === "all") return list;
      return list.filter(function (s) {
        return s.kind === kind;
      });
    },
    getSkill(id) {
      if (!state.skills) state.skills = JSON.parse(JSON.stringify(DEFAULT_SKILLS));
      return state.skills.find(function (s) {
        return s.id === id;
      });
    },
    /**
     * Save current editor selection as a company skill or block (thin: lands golden, versioned).
     */
    saveAsSkillBlock(opts) {
      if (!state.skills) state.skills = JSON.parse(JSON.stringify(DEFAULT_SKILLS));
      const kind = (opts && opts.kind) === "block" ? "block" : "skill";
      const version = (opts && opts.version) || "1.0";
      const owner = (opts && opts.owner) || "You";
      const id =
        (kind === "block" ? "bk-" : "sk-") + "saved-" + Date.now();
      const item = {
        id: id,
        kind: kind,
        name: (opts && opts.name) || "Untitled " + kind,
        description: (opts && opts.description) || "",
        status: "golden",
        version: version,
        owner: owner,
        contributors: (opts && opts.contributors) || [owner],
        updated: new Date().toISOString().slice(0, 10),
        uses: 0,
        inputs: (opts && opts.inputs) || [],
        outputs: (opts && opts.outputs) || [],
        caps: (opts && opts.caps) || [],
        changelog: [
          {
            version: version,
            note: (opts && opts.changelogNote) || "Saved from workflow editor · company-owned",
            at: new Date().toISOString().slice(0, 10),
          },
        ],
      };
      state.skills.unshift(item);
      state.lastSavedSkill = item;
      save(state);
      return item;
    },
    insertSkillIntoWorkflow(id) {
      const item = this.getSkill(id);
      if (!item) return null;
      item.uses = (item.uses || 0) + 1;
      state.lastInsertedSkill = item;
      state.lastProvenance = {
        type: item.kind,
        skillId: item.id,
        skillName: item.name,
        version: item.version,
        owner: item.owner,
      };
      save(state);
      return item;
    },
    getLastSavedSkill() {
      return state.lastSavedSkill;
    },
    getLastInsertedSkill() {
      return state.lastInsertedSkill;
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
