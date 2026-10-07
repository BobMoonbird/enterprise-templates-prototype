# Architecture — prototype building blocks

Multi-page HTML + shared CSS/JS. Each major region uses `data-block="BlockName"` so you can find and relocate pieces without hunting screenshots.

**Prototype versions:** `v2` (full Security→Member) and `v3` (shippable chunks: Blocks → Admin restrict → Gallery → Admin approvals). Active version from `?proto=v2|v3` or `localStorage` key `ent-templates-proto-version`. ProtoChrome Back/Next and the demo map read `ProtoState.DEMO_PATH` (getter → `DEMO_PATH_V2` or `DEMO_PATH_V3`). V3 map sections use `DEMO_MAP_SECTIONS_V3` + path `section` ids (not role swimlanes).

## Folder map

```
prototype-v2/
  index.html               # demo map + version switch
  README.md
  ARCHITECTURE.md          ← this file
  css/
    tokens.css             # n8n-dark tokens
    base.css               # reset + universal .is-clickable hover/focus
    components.css         # all blocks below
    screens.css            # page-specific layouts
  js/
    state.js               # roles, versions, templates/blocks, localStorage
    interactions.js        # ProtoChrome, VersionSwitcher, toasts, modals
  screens/                 # V2 beats (00–10b)
  screens/v3/              # V3 short spine (01–09)
  data/                    # reference JSON (mirrored in state.js for file://)
```

## Shared scripts on every screen

```html
<link rel="stylesheet" href="../css/tokens.css" />
<link rel="stylesheet" href="../css/base.css" />
<link rel="stylesheet" href="../css/components.css" />
<link rel="stylesheet" href="../css/screens.css" />
<script src="../js/state.js"></script>
<script src="../js/interactions.js"></script>
```

Index uses `css/` and `js/` without `../`.

## Hover / focus system

`base.css` applies hover outline/tint to buttons, links, `[data-action]`, `.btn`, `.nav-item`, `.menu-item`, `.template-card`, `.queue-row`, `.toggle`, `.palette-node`, `.filter-chip`, `.demo-map-card`, etc.

**To add a new clickable:** give it a component class already covered, or add `.is-clickable`, or extend the selector list in `base.css`. Prefer `:focus-visible` (already wired).

---

## Block inventory

### ProtoChrome

| | |
|--|--|
| **Purpose** | Demo-only step label + Back/Next + link to map (not product UI) |
| **CSS** | `[data-block="ProtoChrome"]`, `.proto-chrome__*` in `components.css` |
| **JS** | `interactions.js` → `injectProtoChrome()` on DOMContentLoaded |
| **Screens** | All (auto-injected). Skip with `data-no-proto="true"` on `<body>` |
| **Move/change** | Edit inject HTML in `interactions.js`; styles in `components.css`. Path order: `ProtoState.DEMO_PATH` (version-aware getter). Screen paths under `screens/v3/` use `../../` prefix. |

### VersionSwitcher

| | |
|--|--|
| **Purpose** | Switch Full (V2) ↔ Short · building blocks (V3); reloads demo map with `?proto=` |
| **CSS** | `[data-block="VersionSwitcher"]`, `.version-switcher__*`, `.proto-chrome__version-pill` |
| **JS** | `ProtoState.getProtoVersion` / `setProtoVersion`; `proto:versionchange` event |
| **Screens** | ProtoChrome (all) + hero control on `index.html` |
| **Move/change** | Labels in `PROTO_VERSIONS`; paths in `DEMO_PATH_V2` / `DEMO_PATH_V3`; map sections in `DEMO_MAP_SECTIONS_V2` / `_V3` |

### RoleSwitcher

| | |
|--|--|
| **Purpose** | Switch Security / Admin / Builder / Member; updates `body[data-role]` |
| **CSS** | `[data-block="RoleSwitcher"]`, `.role-switcher__*` |
| **JS** | `ProtoState.setRole`, `ProtoUI.applyRoleChrome`, `proto:rolechange` event |
| **Screens** | Injected in ProtoChrome on product screens only (not demo map). Label: “Acting as” + select. V3 omits Security from the dropdown. |
| **Move/change** | Role capability flags in `state.js` `ROLES`. Chrome visibility: `.role-hide-member`, `.role-show-submit`, etc. in `components.css`. Product screens may also show `<span data-role-label>` live labels. |

### AppShell

| | |
|--|--|
| **Purpose** | Left sidebar + topbar + main content product frame |
| **CSS** | `[data-block="AppShell"]`, `.app-shell__*`, `.nav-item` |
| **JS** | None required |
| **Screens** | Most settings/library/create/result screens |
| **Move/change** | Duplicate sidebar markup per page (no include system). Width: `--sidebar-w` in `tokens.css` |

### Button / IconButton / Menu

| | |
|--|--|
| **Purpose** | Primary actions, icon hits, dropdown menus (e.g. Submit ▾) |
| **CSS** | `[data-block="Button"]` / `.btn*`, `[data-block="IconButton"]` / `.icon-btn`, `[data-block="Menu"]` / `.menu` / `.menu-item` |
| **JS** | Toggle `.is-open` on menu; global click closes |
| **Screens** | 02 (Submit menu), headers everywhere |
| **Move/change** | Variants: `.btn--primary\|secondary\|ghost\|danger\|success`, `.btn--sm\|lg` |

### Modal / Dropdown / Toast

| | |
|--|--|
| **Purpose** | Soft blocks, AI confirm, feedback after Submit/Approve/Use |
| **CSS** | `[data-block="Modal"]` / `.modal-backdrop`, `[data-block="Toast"]` / `.toast-stack` |
| **JS** | `ProtoUI.openModal`, `closeModal`, `toast`; `[data-close-modal]` |
| **Screens** | 02 blocked node; 07 AI confirm; toasts global |
| **Move/change** | Add `<div class="modal-backdrop" id="…">` markup; call `ProtoUI.openModal('id')` |

### SettingsLayout

| | |
|--|--|
| **Purpose** | Settings sub-nav + panel for allowlist / roles / library / approvals |
| **CSS** | `[data-block="SettingsLayout"]`, `.settings-nav`, `.settings-panel` |
| **Screens** | 00, 01, 01b, 03b |
| **Move/change** | Edit left nav links in each settings HTML |

### AllowlistPanel

| | |
|--|--|
| **Purpose** | Security **capability allowlist**: tools/integrations + HTTP domains (prefer allow-list). Not a raw n8n node table. Includes prompt-driven bulk setup from a tech-stack description. **Block** navigates to impact review (00b) before applying. |
| **CSS** | `[data-block="AllowlistPanel"]`, `.allowlist-tabs`, `.cap-setup`, `.allowlist-table`, `.badge--allowed\|blocked` |
| **JS** | `ProtoState.beginBlockReview` → 00b on Block; `toggleNodeAllowed` / `toggleDomainAllowed` on Allow; `suggestFromStackPrompt`, `applyStackSuggestion`; tabs + filters in `00-security-allowlist.html` |
| **Screens** | 00 |
| **Move/change** | Seed data: `state.js` `DEFAULT_NODES` (capabilities) + `DEFAULT_DOMAINS` (+ `data/sample-nodes.json`). Storage key `ent-templates-v2-skills-v1` (V2 only — not on V3 primary path). |

### ImpactReviewPanel

| | |
|--|--|
| **Purpose** | Admin review before a block is applied: affected workflow count, owner breakdown, severity (will stop on next run). Confirm → apply block + notify; Cancel → allowlist. |
| **CSS** | `[data-block="ImpactReviewPanel"]`, `.impact-target`, `.impact-stats`, `.impact-owners`, `.impact-actions` in `screens.css` |
| **JS** | `ProtoState.ensureDemoPendingBlock`, `getBlockImpact`, `summarizeImpactOwners`, `confirmPendingBlock`, `clearPendingBlock`; fake rows in `BLOCK_IMPACT` |
| **Screens** | 00b |
| **Move/change** | Impact seed: `state.js` `BLOCK_IMPACT` keyed by capability/domain id |

### OwnerNotifyPanel

| | |
|--|--|
| **Purpose** | Post-confirm confirmation: who was notified, sample email/in-app copy, list of affected workflows. |
| **CSS** | `[data-block="OwnerNotifyPanel"]`, `.notify-banner`, `.notify-sample`, `.notify-owner-row` in `screens.css` |
| **JS** | Reads `ProtoState.getLastBlockAction()` (seeded if opened via demo map) |
| **Screens** | 00c |
| **Move/change** | Sample copy lives in `00c-block-notify-owners.html` |

### RolesPanel

| | |
|--|--|
| **Purpose** | Create vs copy capability cards + people assignment |
| **CSS** | `[data-block="RolesPanel"]`, `.role-card`, `.people-table`, `.role-select` |
| **JS** | `ProtoState.setPersonRole` |
| **Screens** | 01 |
| **Move/change** | Caps pills driven by `ROLES.*.canCreate/canCopy/…` |

### LibraryEnableToggle

| | |
|--|--|
| **Purpose** | Experimental hide/show for private library (default **on** V2; **off** V3 until enable beat) |
| **CSS** | `[data-block="LibraryEnableToggle"]`, `.toggle`, `.toggle-row`, `.lib-callout`, `.lib-admin-keys` |
| **JS** | `[data-toggle-library]` → `ProtoState.setLibraryEnabled`; default `libraryEnabled: true` (V2) / `false` (V3) |
| **Screens** | 01b; V3 `01-enable-library`; read on gallery |
| **Move/change** | V3 keeps this as a thin opt-in, not a separate shippable chunk |

### MarkPolicyControl

| | |
|--|--|
| **Purpose** | Admin setting: who may mark building blocks as company level (`any_builder` / `admin_only` / `custom_role`) |
| **CSS** | `[data-block="MarkPolicyControl"]`, `.mark-policy-option*`, `.mark-denied-banner` |
| **JS** | `ProtoState.setMarkPolicy`, `canMarkCompanyLevel`, `setCustomMarkIncludesBuilders`; gates V3-02 Save as building block |
| **Screens** | V3 `01-enable-library` (`#restrict`) |
| **Move/change** | Default `any_builder`. Chunk 2 demo flips to `admin_only` then opens Builder deny beat. |

### WorkflowEditorChrome

| | |
|--|--|
| **Purpose** | Editor topbar + canvas area |
| **CSS** | `[data-block="WorkflowEditorChrome"]`, `.editor-topbar`, `.editor-canvas`, `.canvas-node` |
| **Screens** | 02; stub on 08 |
| **Move/change** | Canvas is CSS stubs (dot grid) — no screenshots |

### NodePalette

| | |
|--|--|
| **Purpose** | Editor palette: core primitives always on; allowlisted integrations; blocked tools soft-stop with **Request access** |
| **CSS** | `[data-block="NodePalette"]`, `.palette-node`, `.palette-node.is-blocked`, `.palette-node__hint`, `[data-block="PolicyRail"]` |
| **JS** | `[data-node-blocked]` → `ProtoUI.showNodeBlocked` (modal + Request access); render loop in `02-builder-editor.html` using `CORE_PALETTE` + `nodes` |
| **Screens** | 02 |
| **Move/change** | Core list: `ProtoState.CORE_PALETTE`. HTTP Request is domain-gated (always on, hosts from domain allowlist). |

### TemplateCard

| | |
|--|--|
| **Purpose** | Library card with lifecycle badge + owner / contributors / optional target groups |
| **CSS** | `[data-block="TemplateCard"]` / `.template-card`, `.template-card__ownership`, `.lib-group-chip`, `.badge--draft\|pending\|golden\|archived` |
| **JS** | `ProtoUI.templateCardHtml(t, { href })`; seed: `owner`, `contributors`, `targetGroups` in `state.js` / `sample-templates.json` |
| **Screens** | 06, 07 match panel |
| **Move/change** | **To relocate TemplateCard:** edit `components.css` `.template-card*` and markup/`templateCardHtml` with `data-block="TemplateCard"` |

### GalleryToolbar

| | |
|--|--|
| **Purpose** | Search + status filter chips on **unified role-filtered** library |
| **CSS** | `[data-block="GalleryToolbar"]`, `.filter-chip`, `.gallery-search`, `.lib-role-banner`, `.lib-pending-strip` |
| **JS** | `ProtoState.templatesForRole(role)` — member=golden; builder=golden+own WIP; admin/security=all |
| **Screens** | 06 (admin also gets pending strip → 03b) |
| **Move/change** | Filter + role logic in `06-company-library.html` |

### ApprovalQueue

| | |
|--|--|
| **Purpose** | Admin key view: pending approvals **and** existing templates inventory |
| **CSS** | `[data-block="ApprovalQueue"]`, `.queue-row`, `.lib-inventory-grid` |
| **JS** | `[data-approve]`, `[data-reject]`, `[data-request-changes]` in `interactions.js` |
| **Screens** | 03b; pending strip also on 06 for admin |
| **Move/change** | Rows show owner, contributors, description; tabs: Pending / Existing |

### LifecycleBanner

| | |
|--|--|
| **Purpose** | Draft / Pending / Golden strip on editor or submit |
| **CSS** | `[data-block="LifecycleBanner"]` / `.lifecycle-banner*` |
| **Screens** | 02, 03 |
| **Move/change** | Modifier classes `--draft|--pending|--golden` |

### CreateEmptyState

| | |
|--|--|
| **Purpose** | Blank / Company library / AI entry; role-aware; library is create-from-template SoR |
| **CSS** | `[data-block="CreateEmptyState"]`, `.create-option`, `.lib-create-primary`, `.copy-rail-banner` |
| **JS** | Screen script + `.role-hide-member` CSS |
| **Screens** | 05 |
| **Move/change** | Member: `body[data-role="member"] .role-hide-member { display:none }` |

### AiAssistPanel

| | |
|--|--|
| **Purpose** | Chat + approved match panel + confirm |
| **CSS** | `[data-block="AiAssistPanel"]`, `.ai-chat`, `.ai-match` |
| **JS** | Confirm → `ProtoState.setProvenance({ type:'ai', … })` → 08 |
| **Screens** | 07 |
| **Move/change** | Matched template id in `07-ai-assist.html` |

### McpChatVignette

| | |
|--|--|
| **Purpose** | Optional agent echo of same rails |
| **CSS** | `[data-block="McpChatVignette"]`, `.mcp-*` |
| **JS** | Accept → provenance `type:'mcp'` → 08 |
| **Screens** | 09 |
| **Move/change** | Copy in `.mcp-thread` bubbles |

### ProvenanceChip

| | |
|--|--|
| **Purpose** | Show library / AI / MCP source on result + template owner |
| **CSS** | `[data-block="ProvenanceChip"]`, `.provenance-chip--ai|--mcp`, `.lib-provenance-meta` |
| **JS** | `ProtoState.setProvenance({ type, templateId, templateName, owner, contributors })` |
| **Screens** | 07 header/match, 08 topbar + owner line, 09 header |
| **Move/change** | Render in `08-result.html` from `lastProvenance` |

---

## Screen → blocks matrix

| Screen | Blocks |
|--------|--------|
| index | ProtoChrome, VersionSwitcher, Button |
| 00 | AppShell, SettingsLayout, AllowlistPanel (tools + domains + stack prompt), Button, Toast |
| 00b | AppShell, SettingsLayout, ImpactReviewPanel, Button, Toast |
| 00c | AppShell, SettingsLayout, OwnerNotifyPanel, NotificationPreview, Button, Toast |
| 01 | AppShell, SettingsLayout, RolesPanel, Button, Toast |
| 01b | AppShell, SettingsLayout, LibraryEnableToggle, Button, Toast |
| 02 | WorkflowEditorChrome, PolicyRail, NodePalette, LifecycleBanner, Button, Menu, Modal, Toast |
| 03 | AppShell, LifecycleBanner, Button, Toast |
| 03b | AppShell, SettingsLayout, ApprovalQueue, Button, Toast |
| 04 | AppShell, Button, IconButton |
| 05 | AppShell, CreateEmptyState, Button |
| 06 | AppShell, GalleryToolbar, TemplateCard, Button, Toast |
| 07 | AppShell, AiAssistPanel, TemplateCard, ProvenanceChip, Modal, Button, Toast |
| 08 | AppShell, WorkflowEditorChrome, ProvenanceChip, Button |
| 09 | AppShell, McpChatVignette, ProvenanceChip, Button, Toast |
| 10 | AppShell, LifecycleBanner, SaveSkillForm, Button, Toast |
| 10b | AppShell, GalleryToolbar, SkillCatalog, SkillCard, ProvenanceChip, Button, Toast |
| v3/01 | AppShell, SettingsLayout, LibraryEnableToggle, MarkPolicyControl, ApprovalQueue, Button, Toast |
| v3/02 | WorkflowEditorChrome, NodePalette, Menu, Modal, Toast (markPolicy gate) |
| v3/03 | AppShell, LifecycleBanner, SubmitEntityForm, Button, Toast |
| v3/04 | Redirect → v3/01 approvals |
| v3/05 | AppShell, CreateEmptyState, Modal, Button (demoted spur) |
| v3/06 | AppShell, GalleryToolbar, TemplateCard, Button, Toast (Start workflow) |
| v3/07 | AppShell, WorkflowEditorChrome, BuildingBlocksSidecar, ProvenanceChip, Button |
| v3/08 | AppShell, AiAssistPanel, ProvenanceChip, Modal, Button, Toast |
| v3/09 | AppShell, McpChatVignette, ProvenanceChip, Button, Toast |

### V3 path → shippable chunks

| Chunk | DEMO_PATH ids | Files |
|-------|---------------|-------|
| Blocks | V3-02, V3-03, V3-07b (+ V3-08/09 spurs) | 02, 03, 07, 08, 09 |
| Admin · restrict | V3-01r, V3-02d | 01 `#restrict`, 02 deny |
| Gallery | V3-06, V3-07 (+ V3-05 spur) | 06, 07, 05 |
| Admin · approvals | V3-01a | 01 `#approvals` |

*(ProtoChrome + VersionSwitcher on all; RoleSwitcher on product screens via injection.)*

## State API (quick)

```js
ProtoState.getProtoVersion() // 'v2' | 'v3'
ProtoState.setProtoVersion('v3', { reload: false })
ProtoState.DEMO_PATH // getter → DEMO_PATH_V2 or DEMO_PATH_V3
ProtoState.setRole('member')
ProtoState.setLibraryEnabled(true) // V2 default true; V3 default false
ProtoState.setMarkPolicy('any_builder'|'admin_only'|'custom_role') // V3 chunk 2
ProtoState.canMarkCompanyLevel(roleId?) // gates Save as building block
ProtoState.setCustomMarkIncludesBuilders(true) // when markPolicy === custom_role
ProtoState.templatesForRole('builder') // V2 role-filtered library
ProtoState.beginBlockReview('capability', 'cap-slack') // V2 → 00b
ProtoState.getBlockImpact()
ProtoState.confirmPendingBlock() // V2 applies block + fills lastBlockAction → 00c
ProtoState.submitDraftAsPending({ name, note, owner, contributors, targetGroups })
ProtoState.updateTemplateStatus(id, 'golden')
ProtoState.getBlocks('tool'|'skill'|'agent'|null) // V3
ProtoState.submitCompanyBlock({ kind, name, description, owner, note })
ProtoState.submitCompanyBlocks(entities, shared) // V3 multi-select
ProtoState.updateBlockStatus(id, 'golden'|'changes'|'draft', extra?)
ProtoState.ensureDemoBlocks() // V3 seed when jumping to late screens
ProtoState.insertBlockIntoWorkflow(id)
ProtoState.setProvenance({ type: 'library'|'ai'|'mcp'|'skill'|'block'|…, … })
ProtoState.getSkills('skill'|'block'|null)
ProtoState.saveAsSkillBlock({ kind, name, description, version, owner, inputs, outputs, changelogNote })
ProtoState.insertSkillIntoWorkflow(id)
ProtoState.reset() // resets active version’s storage key only
```

## Storage keys

| Key | Purpose |
|-----|---------|
| `ent-templates-proto-version` | Active prototype version (`v2` / `v3`) |
| `ent-templates-v2-skills-v1` | V2 session state |
| `ent-templates-v3-short-v1` | V3 session state (isolated) |

## Allowlist model (Miro Frame 4 · Capability allow-list)

- **Not** an allow-list of every n8n node — **tools/integrations** + **HTTP domains**.
- Core primitives (Webhook, IF, Code, Schedule, HTTP Request) stay available in the editor; HTTP hosts are domain-gated.
- Dangerous tools (SSH, Execute Command, FTP) stay blocked by default; builders get a soft-block modal with **Request access**.
- **Prompt-driven setup** on screen 00: paste tech stack → suggest → bulk-allow.
- **Block flow:** Allowlist **Block** → **00b** impact review (workflows + owners + severity) → Confirm → **00c** owner notifications (sample copy + who was notified). Cancel returns to allowlist without applying.

## How to add a screen

1. Copy an existing shell (`screens/*.html` for V2, `screens/v3/*.html` for V3 — note `../../` asset paths in V3).  
2. Add entry to `DEMO_PATH_V2` or `DEMO_PATH_V3` in `state.js` (for ProtoChrome Back/Next). Set `role` for the right demo-map section (`DEMO_MAP_SECTIONS_V2` / `_V3`).  
3. Map cards are rendered from `DEMO_PATH` + `DEMO_MAP_SECTIONS` in `index.html` — no hard-coded grid.  
4. Put `data-block` on major regions; reuse component classes for hover.  
5. Document the beat in the HTML comment header.  
6. Bump `?v=` on CSS/JS when publishing so GitHub Pages clients pick up changes.
