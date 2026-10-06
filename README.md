# Enterprise templates · prototype

Native HTML/CSS/JS click-through for the n8n **Enterprise case-study** depth bet. One static site with a **switchable prototype version**:

| Version | Label | Primary path |
|---------|--------|--------------|
| **V2** (default) | Full demo (prior case) | Security allowlist → roles → library → submit/approve → member |
| **V3** | Short · building blocks | Admin enable → Builder submit block → Approve → Member compose (+ AI/MCP rails) |

**Visual language:** n8n-like dark product shell. No PNG backgrounds. No Miro navy/yellow product theme.

## Open

```bash
open "product work/enterprise templates solution/prototype-v2/index.html"
```

Or open `index.html` in any browser (`file://` works; no build step).

Switch versions from the demo map **Prototype version** control, the ProtoChrome **Proto** dropdown, or `?proto=v2` / `?proto=v3`.

## Why two versions

Meeting + deck cut: go deep on **1 Must + 1 Should** rather than four features.

- **Must:** company **building blocks** library (tools / skills / agents)
- **Should:** **create/copy rules** enforced across **UI, AI, MCP**

Security allowlist depth stays in **V2 only** (struck for the short deep prototype).

## Roles (demo)

The demo map groups screens by **job / role**. Clicking a card sets that role. ProtoChrome **Back / Next** follows the active version’s path. Product screens show **Acting as …**; ProtoChrome keeps a compact role dropdown.

| Role | V2 job | V3 job |
|------|--------|--------|
| **Security** | Allowlist · impact · notify | *(not in V3 primary path)* |
| **Admin** | Roles · library · approve templates | Enable blocks library · approve blocks |
| **Builder** | Build under rails · submit templates | Build under rails · mark company block |
| **Member** | Copy approved templates (+ AI/MCP) | Compose from approved blocks (+ AI/MCP) |

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

## V3 short spine (~60s)

1. **V3-01** Enable building-blocks library (empty until approve)  
2. **V3-02** Build tool/skill/agent under rails (soft-block)  
3. **V3-03** Mark as company building block — **submit ≠ publish**  
4. **V3-04** Admin approve → published  
5. **V3-05** Member create — blank denied (request vs start from block)  
6. **V3-06** Gallery (empty-state beat + tools/skills/agents)  
7. **V3-07** Compose canvas + provenance  
8. **V3-08** AI — only approved blocks / out-of-policy refuse  
9. **V3-09** MCP — same rails  

### V3 unhappy-path beats

1. Empty library after enable  
2. Submit vs publish toast/copy  
3. Member blank-create modal  
4. AI/MCP out-of-policy → use company block  

## Screen list (V3)

| File | Beat |
|------|------|
| `screens/v3/01-enable-library.html` | Admin enable library |
| `screens/v3/02-builder-rails.html` | Builder under rails |
| `screens/v3/03-mark-company-block.html` | Submit ≠ publish |
| `screens/v3/04-approve-block.html` | Approve pending block |
| `screens/v3/05-create-workflow.html` | Member create rails |
| `screens/v3/06-blocks-gallery.html` | Gallery + empty state |
| `screens/v3/07-compose-canvas.html` | Suggested blocks + provenance |
| `screens/v3/08-ai-assist.html` | AI approved-only |
| `screens/v3/09-mcp.html` | MCP same rails |

V2 screens remain under `screens/*.html` (unchanged path).

## Architecture

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for building blocks, version switch, and `data-block` map.

## Hosted / local

- **Local:** open `index.html` (or any static server).
- **Primary Pages:** https://bobmoonbird.github.io/enterprise-templates-prototype/
- **Board embed mirror:** https://bobmoonbird.github.io/enterprise-templates-proto/
- Repos: [enterprise-templates-prototype](https://github.com/BobMoonbird/enterprise-templates-prototype) · [enterprise-templates-proto](https://github.com/BobMoonbird/enterprise-templates-proto)
- Source of truth: this workspace folder; GitHub repos are publish mirrors.

## Fake data

- Runtime seeds in `js/state.js` (`DEFAULT_TEMPLATES`, `DEFAULT_SKILLS`, `DEFAULT_V3_BLOCKS`, allowlist, `BLOCK_IMPACT`)
- Reference JSON in `data/` (mirrored for `file://`)
- V3 defaults start with an **empty** published catalog so the empty-library beat works; late screens call `ensureDemoBlocks()` when jumping ahead
