/**
 * interactions.js — navigate, toasts, modals, role switch, ProtoChrome, shared render helpers
 */
(function () {
  function pathPrefix() {
    // Prefer script src: screens load ../js/interactions.js ; map loads js/interactions.js.
    // More reliable than pathname alone (some previews omit /screens/ in the URL).
    const scripts = document.getElementsByTagName("script");
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].getAttribute("src") || "";
      if (src.indexOf("interactions.js") === -1) continue;
      if (/^\.\.\//.test(src) || src.indexOf("/../js/") !== -1) return "../";
      return "";
    }
    const path = decodeURIComponent(window.location.pathname || "").replace(/\\/g, "/");
    if (path.indexOf("/screens/") !== -1) return "../";
    // Fallback: known screen filenames even if /screens/ is missing from the path
    const file = screenFile();
    if (
      file &&
      file !== "index.html" &&
      typeof ProtoState !== "undefined" &&
      ProtoState.DEMO_PATH &&
      ProtoState.DEMO_PATH.some(function (s) {
        return s.file === file;
      })
    ) {
      return "../";
    }
    return "";
  }

  function demoMapHref() {
    // Always the v2 demo map at prototype-v2/index.html (relative for file:// + static server)
    return pathPrefix() + "index.html";
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

  function isIndex() {
    const f = screenFile();
    return f === "index.html" || f === "" || f === "prototype-v2";
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
    const file = screenFile();
    const path = ProtoState.DEMO_PATH;
    const idx = path.findIndex(function (s) {
      return s.file === file;
    });
    const current = idx >= 0 ? path[idx] : null;
    const prev = idx > 0 ? path[idx - 1] : null;
    const next = idx >= 0 && idx < path.length - 1 ? path[idx + 1] : null;

    const onMap = isIndex();
    const mapHref = demoMapHref();
    const bar = document.createElement("div");
    bar.setAttribute("data-block", "ProtoChrome");
    bar.innerHTML =
      '<span class="proto-chrome__brand">Enterprise templates · demo</span>' +
      '<span class="proto-chrome__step">' +
      (current
        ? current.id + " · " + current.title + " — " + current.beat
        : onMap
          ? "Demo map — start the primary path (roles set along the journey)"
          : file) +
      "</span>" +
      (onMap ? "" : '<div data-block="RoleSwitcher" class="role-switcher"></div>') +
      '<div class="proto-chrome__nav">' +
      (onMap
        ? ""
        : prev
          ? '<a class="proto-chrome__btn" href="' + prefix + "screens/" + prev.file + '">← Back</a>'
          : '<a class="proto-chrome__btn" href="' + mapHref + '">← Map</a>') +
      (next
        ? '<a class="proto-chrome__btn proto-chrome__btn--primary" href="' +
          prefix +
          "screens/" +
          next.file +
          '">Next →</a>'
        : "") +
      (onMap ? "" : '<a class="proto-chrome__map" href="' + mapHref + '">Demo map</a>') +
      "</div>";

    document.body.insertBefore(bar, document.body.firstChild);
    document.body.classList.add("has-proto-chrome");
    if (!onMap) {
      renderRoleSwitcher(bar.querySelector('[data-block="RoleSwitcher"]'));
    }
  }

  function renderRoleSwitcher(container) {
    if (!container) return;
    const role = ProtoState.get().role;
    const options = Object.keys(ProtoState.ROLES)
      .map(function (id) {
        const r = ProtoState.ROLES[id];
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

    // Compact demo control: "Acting as" + dropdown (product screens also show live labels)
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
    // Update any live role labels
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
          : status === "archived"
            ? "Archived"
            : "Draft";
    return '<span class="badge badge--' + status + '">' + label + "</span>";
  }

  function templateCardHtml(t, opts) {
    opts = opts || {};
    const href = opts.href || "#";
    const nodes = (t.nodes || [])
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

      const approveBtn = e.target.closest("[data-approve]");
      if (approveBtn) {
        e.preventDefault();
        const id = approveBtn.getAttribute("data-approve");
        ProtoState.updateTemplateStatus(id, "golden", {
          updated: new Date().toISOString().slice(0, 10),
        });
        toast("Approved as golden company template", "success");
        document.dispatchEvent(new CustomEvent("proto:rerender"));
      }

      const rejectBtn = e.target.closest("[data-reject]");
      if (rejectBtn) {
        e.preventDefault();
        const id = rejectBtn.getAttribute("data-reject");
        ProtoState.updateTemplateStatus(id, "draft");
        toast("Rejected — returned to builder as draft", "warning");
        document.dispatchEvent(new CustomEvent("proto:rerender"));
      }

      const changesBtn = e.target.closest("[data-request-changes]");
      if (changesBtn) {
        e.preventDefault();
        toast("Requested changes — builder notified", "warning");
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
            ? "Private library left available (recommended default)"
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
    templateCardHtml: templateCardHtml,
    showNodeBlocked: showNodeBlocked,
    pathPrefix: pathPrefix,
    demoMapHref: demoMapHref,
    applyRoleChrome: applyRoleChrome,
  };

  document.addEventListener("DOMContentLoaded", function () {
    applyRoleChrome();
    injectProtoChrome();
    bindGlobals();

    // Query-param role override: ?role=member (legacy ?role=copy still accepted)
    const params = new URLSearchParams(window.location.search);
    let roleParam = params.get("role");
    if (roleParam === "copy") roleParam = "member";
    if (roleParam) {
      ProtoState.setRole(roleParam);
      applyRoleChrome();
      const sel = document.querySelector(".role-switcher__select");
      if (sel) sel.value = roleParam;
    }

    // Flash toast from session if set
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
