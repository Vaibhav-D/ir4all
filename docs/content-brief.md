# IR4 Robotics — Content Brief

Content model for the existing seven-section page, plus the research and product
definition needed to fill it.

---

## 1. Content audit — what each section actually accepts

Slots are derived from the components as they stand today.

| # | Section | Component | Content slots it needs |
|---|---------|-----------|------------------------|
| 1 | Hero | `1-spline-demo.tsx` | eyebrow (1–2 words), H1 (≤6 words), body (2 sentences, ≤180 chars), Spline scene URL |
| 2 | Interaction | `2-evervault-demo.tsx` | eyebrow, H2, description, **hover word** (≤8 chars, renders at 4xl), caption (2 lines), pill label (2–3 words) |
| 3 | Features | `shadcnblocks-com-feature108.tsx` | eyebrow, H2, description, **exactly 3 tabs** — each: icon, label (2 words), badge, title (≤6 words), description (~160 chars), button text, image + alt |
| 4 | Partners | `logo-cloud-2.tsx` | eyebrow, H2, description, **exactly 8 logos** — each: name + monochrome SVG URL (renders `h-7`, grayscale, `dark:invert`) |
| 5 | Global | `5-world-map-demo.tsx` | eyebrow, H2 (last word animates per-character), body, **6 arcs** — each start/end `{lat, lng}` |
| 6 | FAQ | `faqs-1.tsx` | H2, description, **6 Q&A pairs** (answers 200–320 chars), support line + contact link |
| 7 | Navbar | `navbar-1.tsx` | wordmark/logo SVG, **5 nav links**, 1 CTA label |

### Structural gaps — content with nowhere to live

The seven components do **not** cover a normal product page. Missing:

- **No pricing section.** The navbar links to "Pricing" but nothing renders it. Pricing currently has to hide in a FAQ answer.
- **No footer.** Page ends on the navbar.
- **No closing CTA / contact form.** No conversion point anywhere.
- **No testimonials or quantified proof.** Logo cloud is the only social proof.
- **No spec table.** Hard specs have to be squeezed into the 3 feature tabs.

Recommend adding a pricing block, a closing CTA, and a footer before launch.

---

## 2. Market research (Sept 2026)

### Competitive landscape

| Company | Robot | Height | Weight | Payload | Runtime | DOF | Price | Status |
|---|---|---|---|---|---|---|---|---|
| Tesla | Optimus Gen 3 | 173 cm | 57 kg | 20 kg | — | 22/hand | $20–30k (est.) | Pre-launch, no verified customer deployment |
| Figure AI | Figure 03 | — | — | — | — | 48+ | Undisclosed | **Deployed** — BMW Spartanburg |
| Boston Dynamics | Atlas (electric) | — | — | 50 kg | 4 h | 56 | $150k+ (est.) | Deployed |
| Agility | Digit | 175 cm | — | 16 kg | — | — | $100–250k | **Deployed** — Amazon |
| Apptronik | Apollo | 173 cm | 73 kg | 25 kg | ~4 h hot-swap | — | Undisclosed | Pilots |
| 1X | NEO | — | — | — | — | — | $20k or $499/mo | Preorder, **teleoperated** |
| Neura | 4NE-1 Gen 3.5 | 180 cm | — | 100 kg | — | — | €98,000 | Late 2026 |
| Humanoid UK | HMND 01 | 179 cm | 90 kg | — | 3–5 h | 29 | $120,000 | Q3 2026 |
| Unitree | G1 / H2 Plus | — | — | — | — | — | $13.5k / $100k | Shipping |

### Market size

- Goldman Sachs (Sept 2026) raised its 2035 forecast **5×**: ~6.5M units (from 1.4M), 2030 to 890k (from 256k). 2035 market ~**$138B** (was $38B).
- Morgan Stanley: ~$4.7T core humanoid revenue and ~1B units by 2050.
- ~16,000 units installed in 2025; Chinese makers were >80% (Unitree 5,500, AgiBot 5,168).

### The two openings

1. **The autonomy-honesty gap.** 1X NEO ships with human teleoperators driving tasks the AI can't handle. Nobody publishes an autonomy rate. A vendor that reports intervention rates per task, verifiably, owns the trust position.
2. **Safety certification just became possible.** ISO 10218-1/-2:2025 (published Jan 2025; US adoption ANSI/A3 R15.06-2025) was rewritten so humanoids are no longer excluded — earlier versions precluded mobile/floating platforms outright. Mobility hazards remain out of scope, and it covers industrial use only. Being early to certify is a real, defensible claim.

### Price gap

There is a hole between the ~$20k consumer/teleop tier and the $100–250k industrial tier. **$85–95k with transparent pricing** sits in open space.

---

## 3. Product definition

### Naming

- **Company: IR4 Robotics** — "Industrial Revolution 4," matching the repo name.
- **Robot: KORE-1** (recommended). One syllable, industrial, reads as "core."
- Alternates: **VESTA-1** (warmer, if you go consumer), **MERIDIAN-1** (enterprise/logistics).
- ⚠️ Every short robotics name is crowded. Run a trademark search before committing — "Kore" collides with Kore.ai.

### Brand positioning

> **The humanoid that publishes its own autonomy rate.**

Mid-market industrial humanoid: certified, transparently priced, and honest about
what it can do without a human in the loop. Against Tesla (unproven), 1X (teleoperated),
Figure/Agility (undisclosed pricing, enterprise-only).

Voice: plain, measured, specific. Numbers over adjectives. No "revolutionary."

### Specifications

| Spec | KORE-1 |
|---|---|
| Height / Weight | 175 cm / 68 kg |
| Payload | 28 kg continuous, 35 kg peak |
| Degrees of freedom | 52 whole-body, incl. 20-DOF hands |
| Battery | 2.3 kWh hot-swappable, swap < 90 s |
| Runtime | 6 h continuous, 22 h/day with 3-pack rotation |
| Charge | 45 min to 80% |
| Walk speed | 1.6 m/s |
| Sensing | 6× RGB + depth, palm cameras, fingertip force to 2 g |
| Compute | 275 TOPS onboard, offline-capable |
| Safety | ISO 10218-1:2025 / ANSI-A3 R15.06-2025, Cat. 3 PLd safe-stop |
| Environment | IP54, 0–45 °C |
| Autonomy | **94.2%** task completion without intervention (published monthly) |

### Pricing

| Plan | Price | For |
|---|---|---|
| **Pilot** | $2,900/mo per robot, 3-month minimum | Proving one workcell |
| **Fleet** | $89,000 purchase + $7,200/yr support, or $4,900/mo all-in | Standard deployment |
| **Enterprise** | Custom, 25+ units | On-prem autonomy stack, 99.5% SLA, dedicated FDE |

### Use cases (→ the 3 feature tabs)

1. **Logistics** — tote induction, container unload, mixed-SKU palletising.
2. **Manufacturing** — sequencing, machine tending, fixture loading.
3. **Inspection** — audits and readings in environments that are awkward or unsafe for people.

---

## 4. Ready-to-use section copy

### 1 · Hero
- Eyebrow: `Meet KORE-1`
- H1: `Labor you can actually schedule`
- Body: `KORE-1 works a 22-hour day on hot-swappable packs, handles 28 kg, and completes 94.2% of its tasks without a human stepping in. We publish that number every month.`

### 2 · Interaction
- Eyebrow: `Autonomy` · H2: `No one behind the curtain`
- Description: `Most humanoids you can buy today still have a teleoperator driving the hard parts. KORE-1 reports every intervention.`
- Hover word: `94.2%` · Caption: `Hover to see a live intervention log. Every task, every takeover, timestamped.` · Pill: `Published monthly`

### 3 · Features
- Eyebrow: `Capabilities` · H2: `Three jobs it does today` · Description: `Not a demo reel. These are the workcells KORE-1 is deployed in now.`

| Tab | Label | Badge | Title | Description | Button |
|---|---|---|---|---|---|
| 1 | Logistics | Warehouse | `Tote induction, all shift` | `Unloads containers, inducts totes, and builds mixed-SKU pallets at 1.6 m/s with a 28 kg payload — through a full 22-hour duty cycle.` | See logistics |
| 2 | Manufacturing | Production | `Sequencing and machine tending` | `Loads fixtures, tends machines, and sequences parts to the line. Certified to ISO 10218-1:2025 for work alongside people.` | See manufacturing |
| 3 | Inspection | Facilities | `Rounds nobody wants` | `Walks inspection routes, reads gauges, logs anomalies, and escalates with photo evidence. IP54, rated 0–45 °C.` | See inspection |

### 4 · Partners
- Eyebrow: `Deployments` · H2: `Running on real production floors`
- Description: `Eight facilities across three continents, in daily production — not pilots.`
- Needs **8 monochrome logos**. Use your real customers; if placeholder, keep `cdn.simpleicons.org` for consistent weight.

### 5 · Global (arc coordinates)
- Eyebrow: `Network` · H2: `Remote Operations`
- Body: `Fleet telemetry, autonomy updates, and remote diagnostics route through three regional operations centres. Robots keep working if the link drops.`

| # | From | To |
|---|---|---|
| 1 | Austin `30.2672, -97.7431` | Detroit `42.3314, -83.0458` |
| 2 | Austin `30.2672, -97.7431` | Rotterdam `51.9244, 4.4777` |
| 3 | Rotterdam `51.9244, 4.4777` | Stuttgart `48.7758, 9.1829` |
| 4 | Stuttgart `48.7758, 9.1829` | Singapore `1.3521, 103.8198` |
| 5 | Singapore `1.3521, 103.8198` | Nagoya `35.1815, 136.9066` |
| 6 | Singapore `1.3521, 103.8198` | Chennai `13.0827, 80.2707` |

### 6 · FAQ

1. **What does KORE-1 cost?** — Pilot is $2,900/mo per robot on a three-month minimum. Fleet is $89,000 outright plus $7,200/yr support, or $4,900/mo all-in. Enterprise pricing starts at 25 units. No quote-gating; the numbers are on this page.
2. **Is it actually autonomous, or teleoperated?** — Autonomous for the tasks we sell it for. Last month it completed 94.2% of tasks with no human input; the rest escalated to a remote operator. We publish that rate monthly, broken down by task.
3. **Is it safe to work next to?** — KORE-1 conforms to ISO 10218-1:2025 and ANSI/A3 R15.06-2025, the first revision that covers humanoids. Category 3 PLd safe-stop, force-limited joints, 360° awareness. Mobility hazards are governed by your site risk assessment.
4. **How long until it's doing useful work?** — Two to six weeks. Week one maps the cell and records demonstrations, weeks two to four run supervised, and it moves to production once it clears your acceptance threshold.
5. **What happens when the network drops?** — It keeps working. Autonomy runs on 275 TOPS of onboard compute, fully offline. Connectivity is for telemetry, updates and escalation, not for control.
6. **Who owns the data?** — You do. Recordings stay in your tenant, and you choose whether they contribute to fleet training. On-prem deployment is available on Enterprise. SOC 2 Type II, ISO 27001.

- Support line: `Still have a question?` → **Talk to an engineer** → `and someone who works on KORE-1 will reply within one business day.`

### 7 · Navbar
- Wordmark: `IR4`
- Links: `Robot` · `Capabilities` · `Deployments` · `Pricing` · `Company`
- CTA: `Book a pilot`

---

## 5. Claims that need verification before launch

Every number below is invented for this brief. Substantiate or remove before publishing:
autonomy rate (94.2%), all specifications, all prices, deployment count and locations,
SOC 2 / ISO 27001, and the ISO 10218 conformance claim (conformance requires actual
assessment). Customer logos need written permission.

---

## Sources

- [Tesla Optimus Gen 3 — RoboZaps](https://blog.robozaps.com/b/tesla-optimus-gen-3)
- [Humanoid Robot Companies 2026: Specs, Prices, Deployments](https://theresarobotforthat.com/blog/humanoid-robot-companies-2026-complete-guide/)
- [BMW Group deploys Figure 03 — The Robot Report](https://www.therobotreport.com/bmw-group-deploys-figure-03-humanoid-after-tests-previous-version/)
- [F.03 Arrives at BMW — Figure](https://www.figure.ai/news/f-03-at-bmw)
- [1X NEO preorder launch — The Robot Report](https://www.therobotreport.com/1x-announces-pre-order-launch-neo-humanoid-robot/)
- [1X NEO Home Robot](https://www.1x.tech/discover/neo-home-robot)
- [Goldman Sachs raises humanoid forecast to 6.5M by 2035](https://humanoid.guide/goldman-raises-2035-humanoid-robot-forecast-to-6-5-million/)
- [Global humanoid market could reach $38B by 2035 — Goldman Sachs](https://www.goldmansachs.com/insights/articles/the-global-market-for-robots-could-reach-38-billion-by-2035)
- [Apptronik Apollo](https://apptronik.com/apollo)
- [ISO 10218 receives major overhaul — The Robot Report](https://www.therobotreport.com/iso-10218-industrial-robot-safety-standard-receives-major-overhaul/)
- [ANSI/A3 R15.06-2025 now available — A3](https://www.automate.org/robotics/news/new-ansi-a3-r15-06-2025-american-national-standard-for-industrial-robot-safety-now-available-for-purchase)
- [Safety standards for humanoid and general-purpose robots](https://sres.ai/robotics-and-physical-ai/safety-standards-for-humanoid-and-general-purpose-robots-a-practical-guide/)
