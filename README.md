# Enterprise templates · prototype

Native HTML/CSS/JS click-through for the n8n **Enterprise case-study** depth bet. One static site with a **switchable prototype version**:

| Version | Label | Primary path |
|---------|--------|--------------|
| **V2** (default) | Full demo (prior case) | Security allowlist → roles → library → submit/approve → member |
| **V3** | Short · shippable chunks | **Blocks** → **Admin restrict** → **Gallery** → **Admin approvals** |

**Visual language:** n8n-like dark product shell. No PNG backgrounds. No Miro navy/yellow product theme.

## Open

```bash
open "product work/enterprise templates solution/prototype-v2/index.html"
```

Or open `index.html` in any browser (`file://` works; no build step).

Switch versions from the demo map **Prototype version** control, the ProtoChrome **Proto** dropdown, or `?proto=v2` / `?proto=v3`.

## Why two versions

Meeting + deck cut: go deep on shippable chunks rather than four unrelated features.

V3 maps to the deck frame **Shippable chunks and releases**:

| Chunk | Capability |
|-------|------------|
| **1 · Blocks** | Any builder marks company level · use on canvas · AI/MCP use blocks **without prompting** |
| **2 · Admin · restrict** | Who can mark: any builder / only admin / custom role |
| **3 · Gallery** | In-app library · filter by type · **Start workflow** from a card |
| **4 · Admin · approvals** | Pending queue · Approve / Request changes / Reject |

Security allowlist depth stays in **V2 only**.

## Roles (demo)

V2 map groups by **job / role**. V3 map groups by **shippable chunk** (actor role still set when you open a card).

| Role | V2 job | V3 job |
|------|--------|--------|
| **Security** | Allowlist · impact · notify | *(not in V3 primary path)* |
| **Admin** | Roles · library · approve templates | Restrict who can mark · approve blocks |
| **Builder** | Build under rails · submit templates | Mark company blocks (when policy allows) |
| **Member** | Copy approved templates (+ AI/MCP) | Start workflow from gallery (+ AI/MCP spurs) |

State persists in `localStorage`:

- V2: `ent-templates-v2-skills-v1`
- V3: `ent-templates-v3-short-v1` (isolated — resets don’t cross-contaminate)
- Active version: `ent-templates-proto-version`

Use **Reset demo data** on the index map (resets the **active** version’s key only).

## V2 primary click path (~90s)

1. **00** Set approved capabilities — try **Block** on Slack  
2. **00b** Review workflows that will break → Confirm  
3. **00c** Notify owners  
4. **01** Assign create vs copy  
5. **01b** Company template library  
6. **02** Build under policy rails  
7. **03** Submit as internal template (≠ publish)  
8. **03b** Approve pending → golden  
9. **05** Create as Member (blank denied)  
10. **06** Company library → Use  
11. **08** Result + provenance  

Spurs: **07** AI, **09** MCP, **10** / **10b** skills/blocks.

## V3 shippable chunks (~60s)

1. **Blocks · V3-02** Builder canvas → Publish ▾ → Save as building block  
2. **Blocks · V3-03** Multi-select entities · mark → **publish immediately** (any_builder)  
3. **Blocks · V3-07b** Use company blocks on canvas (sidecar)  
4. *(spurs)* **V3-08 / V3-09** AI + MCP use blocks **without prompting**  
5. **Admin · restrict · V3-01r** Who can mark → flip to Only admin  
6. **Admin · restrict · V3-02d** Builder Save as building block denied · request access  
7. **Gallery · V3-06** Filter Tools / Skills / Agents → **Start workflow**  
8. **Gallery · V3-07** Compose canvas with block pre-pinned  
9. **Admin · approvals · V3-01a** Approve / Request changes / Reject (seed pending or use gated policy)

Blank create (`V3-05`) is a **demoted spur** — not the Member primary path.

### Mark policy → publish behavior

| Policy | Builder can mark? | On mark |
|--------|-------------------|---------|
| **any_builder** (default) | Yes | **Published / golden immediately** — no approvals queue |
| **admin_only** | No (denied · request access) | — |
| **custom_role** | Only if CoE grant is on | **Pending** → Admin approvals |

### V3 unhappy-path beats

1. Empty library after enable  
2. Mark policy → Builder denied (admin_only / custom without grant)  
3. Gated mark → pending ≠ publish (custom_role with grant)  
4. AI/MCP secondary out-of-policy refuse (primary story = ambient use)

## Screen list (V3)

| File | Chunk | Beat |
|------|-------|------|
| `screens/v3/02-builder-rails.html` | Blocks / Restrict deny | Mark gated by `markPolicy` |
| `screens/v3/03-mark-company-block.html` | Blocks | Multi-select · publish now (any_builder) or pending |
| `screens/v3/07-compose-canvas.html` | Blocks + Gallery | Sidecar / Start workflow landing |
| `screens/v3/08-ai-assist.html` | Blocks spur | Uses blocks without prompting |
| `screens/v3/09-mcp.html` | Blocks spur | Uses blocks without prompting |
| `screens/v3/01-enable-library.html` | Restrict + Approvals | `#restrict` / `#approvals` · enable toggle |
| `screens/v3/06-blocks-gallery.html` | Gallery | Filters · Start workflow CTA |
| `screens/v3/05-create-workflow.html` | Gallery spur | Demoted blank-create |
| `screens/v3/04-approve-block.html` | — | Redirect → Admin settings |

V2 screens remain under `screens/*.html` (unchanged path).

## Architecture

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for building blocks, version switch, chunk map, and `data-block` inventory.

## Hosted / local

- **Local:** open `index.html` (or any static server).
- **Primary Pages:** https://bobmoonbird.github.io/enterprise-templates-prototype/?proto=v3
- **Board embed mirror:** https://bobmoonbird.github.io/enterprise-templates-proto/?proto=v3
- Repos: [enterprise-templates-prototype](https://github.com/BobMoonbird/enterprise-templates-prototype) · [enterprise-templates-proto](https://github.com/BobMoonbird/enterprise-templates-proto)
- Source of truth: this workspace folder; GitHub repos are publish mirrors.

## Fake data

- Runtime seeds in `js/state.js` (`DEFAULT_TEMPLATES`, `DEFAULT_SKILLS`, `DEFAULT_V3_BLOCKS`, allowlist, `BLOCK_IMPACT`)
- V3 `markPolicy`: `any_builder` (default) · `admin_only` · `custom_role`
- Reference JSON in `data/` (mirrored for `file://`)
- V3 defaults start with an **empty** published catalog so the empty-library beat works; late screens call `ensureDemoBlocks()` when jumping ahead
