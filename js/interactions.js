/**
 * interactions.js — navigate, toasts, modals, role/version switch, ProtoChrome, shared render helpers
 */
(function () {
  function pathPrefix() {
    // Prefer script src: screens → ../js ; screens/v3 → ../../js ; map → js/
    const scripts = document.getElementsByTagName("script");
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].getAttribute("src") || "";
      if (src.indexOf("interactions.js") === -1) continue;
      if (/^\.\.\/\.\.\//.test(src) || src.indexOf("/../../js/") !== -1) return "../../";
      if (/^\.\.\//.test(src) || src.indexOf("/../js/") !== -1) return "../";
      return "";
    }
    const path = decodeURIComponent(window.location.pathname || "").replace(/\\/g, "/");
    if (path.indexOf("/screens/v3/") !== -1) return "../../";
    if (path.indexOf("/screens/") !== -1) return "../";
    const rel = screenPath();
    if (
      rel &&
      rel !== "index.html" &&
      typeof ProtoState !== "undefined" &&
      ProtoState.DEMO_PATH &&
      ProtoState.DEMO_PATH.some(function (s) {
        return s.file === rel || s.file.split("/").pop() === rel;
      })
    ) {
      return rel.indexOf("v3/") === 0 ? "../../" : "../";
    }
    return "";
  }

  function demoMapHref() {
    const prefix = pathPrefix();
    const v =
      typeof ProtoState !== "undefined" && ProtoState.getProtoVersion
        ? ProtoState.getProtoVersion()
        : "v2";
    return prefix + "index.html?proto=" + v;
  }

  function screenFile() {
    const parts = (window.location.pathname || "").split("/");
    let file = parts[parts.length - 1] || "index.html";
    try {
      file = decodeURIComponent(file);
    } catch (e) {
      /* ignore */
    }
    return file.split("?")[0] || "index.html";
  }

  /** Path relative to screens/ (e.g. v3/01-….html) for DEMO_PATH matching */
  function screenPath() {
    const path = decodeURIComponent(window.location.pathname || "").replace(/\\/g, "/");
    const idx = path.indexOf("/screens/");
    if (idx >= 0) {
      return path.slice(idx + "/screens/".length).split("?")[0];
    }
    return screenFile();
  }

  function isIndex() {
    const f = screenFile();
    return f === "index.html" || f === "" || f === "prototype-v2";
  }

  function findPathIndex(path) {
    const rel = screenPath();
    const file = screenFile();
    let beat = "";
    try {
      beat = new URLSearchParams(window.location.search || "").get("beat") || "";
    } catch (e) {
      /* ignore */
    }
    if (beat) {
      const byId = path.findIndex(function (s) {
        return s.id === beat;
      });
      if (byId >= 0) return byId;
    }
    const matches = [];
    path.forEach(function (s, i) {
      const base = (s.file || "").split("?")[0];
      if (base === rel || base === file || base.split("/").pop() === file) {
        matches.push(i);
      }
    });
    if (!matches.length) return -1;
    return matches[0];
  }

  /** Build screen href; always pass beat= so happy-path screens can reset sticky markPolicy; honor entry.hash */
  function screenHref(entry, version) {
    const prefix = pathPrefix();
    const base = (entry.file || "").split("?")[0];
    let href = prefix + "screens/" + base + "?proto=" + version;
    if (entry.id) {
      href += "&beat=" + encodeURIComponent(entry.id);
    }
    if (entry.hash) {
      href += "#" + String(entry.hash).replace(/^#/, "");
    }
    return href;
  }

  /* ── Toasts ── */
  function ensureToastStack() {
    let stack = document.querySelector('[data-block="Toast"]');
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      stack.setAttribute("data-block", "Toast");
      document.body.appendChild(stack);
    }
    return stack;
  }

  function toast(message, type) {
    const stack = ensureToastStack();
    const el = document.createElement("div");
    el.className = "toast" + (type ? " toast--" + type : "");
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(function () {
      el.style.opacity = "0";
      el.style.transition = "opacity 0.2s";
      setTimeout(function () {
        el.remove();
      }, 200);
    }, 3200);
  }

  /* ── Modal helpers ── */
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add("is-open");
      el.setAttribute("aria-hidden", "false");
    }
  }

  function closeModal(id) {
    const el = typeof id === "string" ? document.getElementById(id) : id;
    if (el) {
      el.classList.remove("is-open");
      el.setAttribute("aria-hidden", "true");
    }
  }

  function closeAllModals() {
    document.querySelectorAll(".modal-backdrop.is-open").forEach(function (m) {
      m.classList.remove("is-open");
      m.setAttribute("aria-hidden", "true");
    });
  }

  /* ── ProtoChrome ── */
  function injectProtoChrome() {
    if (document.querySelector('[data-block="ProtoChrome"]')) return;
    if (document.body.dataset.noProto === "true") return;

    const prefix = pathPrefix();
    const path = ProtoState.DEMO_PATH;
    const idx = findPathIndex(path);
    const current = idx >= 0 ? path[idx] : null;
    const prev = idx > 0 ? path[idx - 1] : null;
    const next = idx >= 0 && idx < path.length - 1 ? path[idx + 1] : null;

    const onMap = isIndex();
    const mapHref = demoMapHref();
    const version = ProtoState.getProtoVersion();
    const versionMeta = ProtoState.PROTO_VERSIONS[version] || ProtoState.PROTO_VERSIONS.v2;

    const bar = document.createElement("div");
    bar.setAttribute("data-block", "ProtoChrome");
    bar.innerHTML =
      '<span class="proto-chrome__brand">Enterprise templates · demo</span>' +
      '<span class="proto-chrome__version-pill">' +
      versionMeta.shortLabel +
      "</span>" +
      '<span class="proto-chrome__step">' +
      (current
        ? current.id + " · " + current.title + " — " + current.beat
        : onMap
          ? "Demo map — " + versionMeta.mapLabel
          : screenFile()) +
      "</span>" +
      '<div data-block="VersionSwitcher" class="version-switcher"></div>' +
      (onMap ? "" : '<div data-block="RoleSwitcher" class="role-switcher"></div>') +
      '<div class="proto-chrome__nav">' +
      (onMap
        ? ""
        : prev
          ? '<a class="proto-chrome__btn" href="' +
            screenHref(prev, version) +
            '">← Back</a>'
          : '<a class="proto-chrome__btn" href="' + mapHref + '">← Map</a>') +
      (next
        ? '<a class="proto-chrome__btn proto-chrome__btn--primary" href="' +
          screenHref(next, version) +
          '">Next →</a>'
        : "") +
      (onMap ? "" : '<a class="proto-chrome__map" href="' + mapHref + '">Demo map</a>') +
      "</div>";

    document.body.insertBefore(bar, document.body.firstChild);
    document.body.classList.add("has-proto-chrome");
    document.body.dataset.proto = version;
    renderVersionSwitcher(bar.querySelector('[data-block="VersionSwitcher"]'));
    if (!onMap) {
      renderRoleSwitcher(bar.querySelector('[data-block="RoleSwitcher"]'));
    }
  }

  function renderVersionSwitcher(container) {
    if (!container) return;
    const version = ProtoState.getProtoVersion();
    const options = Object.keys(ProtoState.PROTO_VERSIONS)
      .map(function (id) {
        const v = ProtoState.PROTO_VERSIONS[id];
        return (
          '<option value="' +
          id +
          '"' +
          (id === version ? " selected" : "") +
          ">" +
          v.shortLabel +
          "</option>"
        );
      })
      .join("");

    container.innerHTML =
      '<span class="version-switcher__label">Proto</span>' +
      '<select class="version-switcher__select" aria-label="Prototype version">' +
      options +
      "</select>";

    container.querySelector("select").addEventListener("change", function (e) {
      const next = e.target.value;
      const mapHref = pathPrefix() + "index.html";
      ProtoState.setProtoVersion(next, { reload: false });
      // Always land on map when switching versions so path/chrome stay coherent
      window.location.href = mapHref + "?proto=" + next;
    });
  }

  function renderRoleSwitcher(container) {
    if (!container) return;
    const role = ProtoState.get().role;
    const roleIds =
      ProtoState.getProtoVersion() === "v3"
        ? ["admin", "builder", "member"]
        : Object.keys(ProtoState.ROLES);
    const options = roleIds
      .map(function (id) {
        const r = ProtoState.ROLES[id];
        if (!r) return "";
        return (
          '<option value="' +
          id +
          '"' +
          (id === role ? " selected" : "") +
          ">" +
          r.label +
          "</option>"
        );
      })
      .join("");

    container.innerHTML =
      '<span class="role-switcher__label">Acting as</span>' +
      '<select class="role-switcher__select" aria-label="Acting as role">' +
      options +
      "</select>";

    container.querySelector("select").addEventListener("change", function (e) {
      ProtoState.setRole(e.target.value);
      toast("Acting as " + ProtoState.getRole().label + " — chrome updated", "success");
      applyRoleChrome();
      document.dispatchEvent(new CustomEvent("proto:rerender"));
    });
  }

  function applyRoleChrome() {
    const role = ProtoState.get().role;
    document.body.dataset.role = role;
    document.body.dataset.proto = ProtoState.getProtoVersion();
    document.querySelectorAll("[data-role-label]").forEach(function (el) {
      el.textContent = ProtoState.getRole().label;
    });
  }

  /* ── Badge helper ── */
  function statusBadge(status) {
    const label =
      status === "golden"
        ? "Golden"
        : status === "pending"
          ? "Pending"
          : status === "changes"
            ? "Needs changes"
            : status === "archived"
              ? "Archived"
              : "Draft";
    return '<span class="badge badge--' + status + '">' + label + "</span>";
  }

  function kindBadge(kind) {
    const k = kind || "skill";
    const label = k.charAt(0).toUpperCase() + k.slice(1);
    return '<span class="badge badge--kind badge--kind-' + k + '">' + label + "</span>";
  }

  function templateCardHtml(t, opts) {
    opts = opts || {};
    const href = opts.href || "#";
    const nodes = (t.nodes || t.caps || [])
      .slice(0, 4)
      .map(function (n) {
        return '<span class="node-chip">' + n + "</span>";
      })
      .join("");
    const owner = t.owner || t.author || "";
    const contribs = (t.contributors || []).filter(function (c) {
      return c && c !== owner;
    });
    const ownership =
      '<div class="template-card__ownership">' +
      "<span>Owner: " +
      owner +
      "</span>" +
      (contribs.length
        ? '<span class="template-card__contribs">· Contributors: ' + contribs.join(", ") + "</span>"
        : "") +
      "</div>";
    const groups = (t.targetGroups || []).slice(0, 2);
    const groupsHtml = groups.length
      ? '<div class="template-card__groups">' +
        groups
          .map(function (g) {
            return '<span class="lib-group-chip">' + g + "</span>";
          })
          .join("") +
        "</div>"
      : "";
    const kindHtml = t.kind ? kindBadge(t.kind) + " " : "";
    return (
      '<a class="template-card is-clickable" data-block="TemplateCard" data-template-id="' +
      t.id +
      '" href="' +
      href +
      '">' +
      '<div class="template-card__top">' +
      '<span class="template-card__cat">' +
      (t.category || "") +
      "</span>" +
      kindHtml +
      statusBadge(t.status) +
      "</div>" +
      '<div class="template-card__name">' +
      t.name +
      "</div>" +
      '<p class="template-card__desc">' +
      t.description +
      "</p>" +
      ownership +
      groupsHtml +
      '<div class="template-card__nodes">' +
      nodes +
      "</div>" +
      '<div class="template-card__footer">' +
      "<span>v" +
      t.version +
      "</span>" +
      "<span>" +
      (t.uses || 0) +
      " uses</span>" +
      "</div>" +
      "</a>"
    );
  }

  /* ── Soft block modal for disallowed capabilities ── */
  function showNodeBlocked(node) {
    let backdrop = document.getElementById("modal-node-blocked");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "modal-node-blocked";
      backdrop.className = "modal-backdrop";
      backdrop.setAttribute("data-block", "Modal");
      backdrop.setAttribute("aria-hidden", "true");
      backdrop.innerHTML =
        '<div class="modal" role="dialog" aria-labelledby="blocked-title">' +
        '<div class="modal__header">' +
        '<h2 class="modal__title" id="blocked-title">Capability not allowed</h2>' +
        '<button type="button" class="icon-btn" data-close-modal="modal-node-blocked" aria-label="Close">✕</button>' +
        "</div>" +
        '<div class="modal__body">' +
        '<p class="secondary" id="blocked-intro">Your company capability allowlist blocks this tool for all builders, API, and MCP.</p>' +
        '<div class="block-reason" id="blocked-reason"></div>' +
        "</div>" +
        '<div class="modal__footer">' +
        '<button type="button" class="btn btn--secondary" data-close-modal="modal-node-blocked">Dismiss</button>' +
        '<button type="button" class="btn btn--primary" id="btn-request-access">Request access</button>' +
        "</div>" +
        "</div>";
      document.body.appendChild(backdrop);
      backdrop.addEventListener("click", function (e) {
        if (e.target === backdrop) closeModal(backdrop);
      });
      backdrop.querySelector("#btn-request-access").addEventListener("click", function () {
        const name = backdrop.dataset.blockedName || "capability";
        closeModal(backdrop);
        toast(
          "Access requested for " + name + " — Security notified (#security-automation)",
          "success"
        );
      });
    }
    backdrop.dataset.blockedName = (node && node.name) || "capability";
    document.getElementById("blocked-reason").textContent =
      (node && node.blockReason) || "This tool is not on the company capability allowlist.";
    openModal("modal-node-blocked");
    toast("Blocked: " + ((node && node.name) || "tool") + " is not allowlisted", "danger");
  }

  /** Admin approval queue: request changes with a message to the builder */
  function showRequestChangesModal(id) {
    let backdrop = document.getElementById("modal-request-changes");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "modal-request-changes";
      backdrop.className = "modal-backdrop";
      backdrop.setAttribute("data-block", "Modal");
      backdrop.setAttribute("aria-hidden", "true");
      backdrop.innerHTML =
        '<div class="modal" role="dialog" aria-labelledby="request-changes-title">' +
        '<div class="modal__header">' +
        '<h2 class="modal__title" id="request-changes-title">Request changes</h2>' +
        '<button type="button" class="icon-btn" data-close-modal="modal-request-changes" aria-label="Close">✕</button>' +
        "</div>" +
        '<div class="modal__body">' +
        '<p class="secondary">Tell the builder what to fix before this can be approved.</p>' +
        '<div class="field">' +
        '<label for="request-changes-message">Message</label>' +
        '<textarea id="request-changes-message" rows="4" placeholder="Describe what the builder should fix…"></textarea>' +
        "</div>" +
        "</div>" +
        '<div class="modal__footer">' +
        '<button type="button" class="btn btn--secondary" data-close-modal="modal-request-changes">Cancel</button>' +
        '<button type="button" class="btn btn--primary" id="btn-send-request-changes">Send</button>' +
        "</div>" +
        "</div>";
      document.body.appendChild(backdrop);
      backdrop.addEventListener("click", function (e) {
        if (e.target === backdrop) closeModal(backdrop);
      });
      backdrop.querySelector("#btn-send-request-changes").addEventListener("click", function () {
        const itemId = backdrop.dataset.itemId;
        if (!itemId) return;
        const ta = document.getElementById("request-changes-message");
        const message = ((ta && ta.value) || "").trim();
        if (!message) {
          toast("Add a short note for the builder", "warning");
          if (ta) ta.focus();
          return;
        }
        const extra = {
          changesNote: message,
          updated: new Date().toISOString().slice(0, 10),
        };
        if (ProtoState.getProtoVersion() === "v3" && ProtoState.updateBlockStatus) {
          ProtoState.updateBlockStatus(itemId, "changes", extra);
        } else {
          ProtoState.updateTemplateStatus(itemId, "changes", extra);
        }
        closeModal(backdrop);
        const preview = message.length > 72 ? message.slice(0, 72) + "…" : message;
        toast("Requested changes — “" + preview + "”", "warning");
        document.dispatchEvent(new CustomEvent("proto:rerender"));
      });
    }
    backdrop.dataset.itemId = id || "";
    const ta = document.getElementById("request-changes-message");
    if (ta) {
      ta.value = "";
      setTimeout(function () {
        ta.focus();
      }, 50);
    }
    openModal("modal-request-changes");
  }

  /** V3: AI/MCP out-of-policy unit → use company block instead */
  function showOutOfPolicyBlock(opts) {
    opts = opts || {};
    let backdrop = document.getElementById("modal-out-of-policy");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "modal-out-of-policy";
      backdrop.className = "modal-backdrop";
      backdrop.setAttribute("data-block", "Modal");
      backdrop.setAttribute("aria-hidden", "true");
      backdrop.innerHTML =
        '<div class="modal" role="dialog" aria-labelledby="oop-title">' +
        '<div class="modal__header">' +
        '<h2 class="modal__title" id="oop-title">Not an approved company block</h2>' +
        '<button type="button" class="icon-btn" data-close-modal="modal-out-of-policy" aria-label="Close">✕</button>' +
        "</div>" +
        '<div class="modal__body">' +
        '<p class="secondary" id="oop-intro"></p>' +
        '<div class="block-reason" id="oop-reason"></div>' +
        "</div>" +
        '<div class="modal__footer">' +
        '<button type="button" class="btn btn--secondary" data-close-modal="modal-out-of-policy">Dismiss</button>' +
        '<button type="button" class="btn btn--primary" id="btn-use-company-block">Use company block</button>' +
        "</div>" +
        "</div>";
      document.body.appendChild(backdrop);
      backdrop.addEventListener("click", function (e) {
        if (e.target === backdrop) closeModal(backdrop);
      });
      backdrop.querySelector("#btn-use-company-block").addEventListener("click", function () {
        closeModal(backdrop);
        const href = backdrop.dataset.altHref || pathPrefix() + "screens/v3/06-blocks-gallery.html?proto=v3";
        toast("Switched to company building blocks", "success");
        setTimeout(function () {
          window.location.href = href;
        }, 350);
      });
    }
    document.getElementById("oop-intro").textContent =
      opts.intro ||
      "AI and MCP already use published company blocks without prompting — non-library units are skipped.";
    document.getElementById("oop-reason").textContent =
      opts.reason || "Suggested unit is not in the company building-blocks library.";
    backdrop.dataset.altHref =
      opts.altHref || pathPrefix() + "screens/v3/06-blocks-gallery.html?proto=v3";
    openModal("modal-out-of-policy");
    toast("Staying on company building blocks", "warning");
  }

  /* ── Global click delegation ── */
  function bindGlobals() {
    document.addEventListener("click", function (e) {
      const closeBtn = e.target.closest("[data-close-modal]");
      if (closeBtn) {
        closeModal(closeBtn.getAttribute("data-close-modal"));
        return;
      }

      const backdrop = e.target.classList.contains("modal-backdrop") ? e.target : null;
      if (backdrop) closeModal(backdrop);

      const useTpl = e.target.closest("[data-use-template]");
      if (useTpl) {
        e.preventDefault();
        const id = useTpl.getAttribute("data-use-template");
        const t = ProtoState.getTemplate(id);
        ProtoState.setProvenance({
          type: "library",
          templateId: id,
          templateName: t ? t.name : id,
          owner: t ? t.owner || t.author : null,
          contributors: t ? t.contributors || [] : [],
        });
        toast("Created workflow from company template", "success");
        const prefix = pathPrefix();
        setTimeout(function () {
          window.location.href = prefix + "screens/08-result.html";
        }, 400);
      }

      const useBlock = e.target.closest("[data-use-block]");
      if (useBlock) {
        e.preventDefault();
        const id = useBlock.getAttribute("data-use-block");
        const b = ProtoState.insertBlockIntoWorkflow(id);
        toast(
          b
            ? "Started workflow from company " + (b.kind || "block") + " · “" + b.name + "”"
            : "Workflow started from building block",
          "success"
        );
        const prefix = pathPrefix();
        setTimeout(function () {
          window.location.href =
            prefix +
            "screens/v3/07-compose-canvas.html?proto=v3&block=" +
            encodeURIComponent(id || "");
        }, 400);
      }

      const approveBtn = e.target.closest("[data-approve]");
      if (approveBtn) {
        e.preventDefault();
        const id = approveBtn.getAttribute("data-approve");
        if (ProtoState.getProtoVersion() === "v3" && ProtoState.updateBlockStatus) {
          ProtoState.updateBlockStatus(id, "golden", {
            updated: new Date().toISOString().slice(0, 10),
          });
          toast("Approved — published as company building block", "success");
        } else {
          ProtoState.updateTemplateStatus(id, "golden", {
            updated: new Date().toISOString().slice(0, 10),
          });
          toast("Approved as golden company template", "success");
        }
        document.dispatchEvent(new CustomEvent("proto:rerender"));
      }

      const rejectBtn = e.target.closest("[data-reject]");
      if (rejectBtn) {
        e.preventDefault();
        const id = rejectBtn.getAttribute("data-reject");
        if (ProtoState.getProtoVersion() === "v3" && ProtoState.updateBlockStatus) {
          ProtoState.updateBlockStatus(id, "draft");
          toast("Rejected — returned to builder as draft", "warning");
        } else {
          ProtoState.updateTemplateStatus(id, "draft");
          toast("Rejected — returned to builder as draft", "warning");
        }
        document.dispatchEvent(new CustomEvent("proto:rerender"));
      }

      const changesBtn = e.target.closest("[data-request-changes]");
      if (changesBtn) {
        e.preventDefault();
        showRequestChangesModal(changesBtn.getAttribute("data-request-changes"));
      }

      const toggleLib = e.target.closest("[data-toggle-library]");
      if (toggleLib) {
        e.preventDefault();
        const on = !ProtoState.get().libraryEnabled;
        ProtoState.setLibraryEnabled(on);
        toggleLib.classList.toggle("is-on", on);
        toggleLib.setAttribute("aria-pressed", on ? "true" : "false");
        toast(
          on
            ? ProtoState.getProtoVersion() === "v3"
              ? "Building-blocks library enabled — catalog is empty until blocks are approved"
              : "Private library left available (recommended default)"
            : ProtoState.getProtoVersion() === "v3"
              ? "Building-blocks library hidden"
              : "Private library hidden — experimental toggle",
          "success"
        );
        document.dispatchEvent(new CustomEvent("proto:rerender"));
      }

      const blockedNode = e.target.closest("[data-node-blocked]");
      if (blockedNode) {
        e.preventDefault();
        const id = blockedNode.getAttribute("data-node-blocked");
        const node = ProtoState.get().nodes.find(function (n) {
          return n.id === id;
        });
        showNodeBlocked(node);
      }

      const oop = e.target.closest("[data-out-of-policy]");
      if (oop) {
        e.preventDefault();
        showOutOfPolicyBlock({
          reason: oop.getAttribute("data-out-of-policy") || undefined,
        });
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAllModals();
    });
  }

  /* ── Public API ── */
  window.ProtoUI = {
    toast: toast,
    openModal: openModal,
    closeModal: closeModal,
    statusBadge: statusBadge,
    kindBadge: kindBadge,
    templateCardHtml: templateCardHtml,
    showNodeBlocked: showNodeBlocked,
    showOutOfPolicyBlock: showOutOfPolicyBlock,
    showRequestChangesModal: showRequestChangesModal,
    pathPrefix: pathPrefix,
    demoMapHref: demoMapHref,
    screenPath: screenPath,
    applyRoleChrome: applyRoleChrome,
    renderVersionSwitcher: renderVersionSwitcher,
  };

  document.addEventListener("DOMContentLoaded", function () {
    // Honor ?proto= before chrome inject
    const params = new URLSearchParams(window.location.search);
    const protoParam = (params.get("proto") || "").toLowerCase();
    if (protoParam === "v2" || protoParam === "v3") {
      if (ProtoState.getProtoVersion() !== protoParam) {
        ProtoState.setProtoVersion(protoParam, { reload: false });
      }
    }

    applyRoleChrome();
    injectProtoChrome();
    bindGlobals();

    let roleParam = params.get("role");
    if (roleParam === "copy") roleParam = "member";
    if (roleParam) {
      ProtoState.setRole(roleParam);
      applyRoleChrome();
      const sel = document.querySelector(".role-switcher__select");
      if (sel) sel.value = roleParam;
    }

    const flash = sessionStorage.getItem("proto-flash");
    if (flash) {
      try {
        const data = JSON.parse(flash);
        toast(data.message, data.type);
      } catch (e) {
        /* ignore */
      }
      sessionStorage.removeItem("proto-flash");
    }
  });
})();
