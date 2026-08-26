# Studio OS Agency Architecture v1

**Status:** Draft for review
**Owner:** Cam Moorcroft (CMotionDesign)
**Scope:** The foundational operating model for Studio OS. Every subsequent agent build (QA, Chief of Staff, Ops, Content Ops, Workers, Automation Manager) references this document. Changes to the architecture require a new version of this spec.
**Repo:** `titan-dashboard` (Next.js on Vercel)
**Target file:** `TITAN/_strategy/agency-architecture-v1.md`

---

## 0. Purpose

Studio OS is the operating layer of CMotionDesign, a one-person contractor running content, strategy and creative for pharma and health-tech clients (Titan PMR primary, ABF / Puri / Pharmappy / Monissa secondary). The goal of the "AI agency" build is not a stack of prompts. It is a real operating model with departments, jobs, budgets, quality tracking, human-in-the-loop gates and multi-client scale, so that Cam's time gets spent on judgement and taste, not on production.

This spec defines what an Agent is, what a Job is, how they communicate, what gets persisted, what requires human approval, how cost and quality are measured, and how the whole thing is invoked. It also defines the Prisma schema that makes it possible.

Three hard rules govern everything below.

### 0.1 The Wrapper Principle (named)

> **No agent runs in production unless it runs through the Studio OS job wrapper.**

This is the single most important rule in this document. Every LLM call, every worker invocation, every system-agent intelligence hop is wrapped by a shared execution middleware that automatically records: `job_id`, `agent_id`, `agent_version`, `prompt_version`, `knowledge_version`, `workflow_version`, `model`, `client_id`, `department`, `input_tokens`, `output_tokens`, `cost_gbp`, `duration_ms`, `status`, `retries`, and (once reviewed) a human-review outcome. Platform-enforced, not agent-remembered. If a Job did not go through the wrapper, it does not exist and its output is not trusted.

### 0.2 Every unit of agent work is a persisted Job

No agent output exists only as a chat message. Every run has a row.

### 0.3 Every HITL gate is a queueable record

Never a modal dialog. Never a synchronous "please approve" prompt. The PA layer aggregates every pending gate into a single review surface, today via Cowork chat, tomorrow via native PA.

---

## 1. Glossary

The whole team (Cam plus future collaborators, plus the agents themselves via their skill files) must use these words in exactly these ways.

| Term | Definition |
|---|---|
| **Agent** | The LLM-driven role that produces work. Two kinds: **system** (LLM inside a code shell) or **worker** (prompt-first, RAG-backed, no persistent code state). |
| **Service** | The CODE half of a system agent. Always-on infrastructure. Owns state, triggers, integrations, calendar. Runs whether or not the LLM is being called. |
| **Job** | A single unit of agent work with a beginning and an end. Has cost, status, input, output, and (if reviewed) a quality outcome. The atomic unit of the whole system. |
| **AgentRun** | A single LLM call inside a Job. A Job may contain one or many AgentRuns (e.g. a Copywriter Job with three drafts is one Job, three AgentRuns). |
| **Department** | A grouping of related agents. Enum: `Content`, `Operations`, `Strategy`, `Creative`, `Quality`, `Interface`. |
| **Client** | A Prisma record for a business Cam is producing work for. Owns its own brand rules, calendar, cadence, approval chain. Titan is client #1. |
| **Brand** | A sub-identity of a Client with its own voice, feed and posting rules (e.g. Titan PMR page vs Titanverse page under the Titan client). |
| **Initiative** | An ongoing multi-Job goal tracked by the Chief of Staff. E.g. "Position Titanverse as the practitioner-side voice on NHS services." |
| **Workflow** | A chained sequence of Jobs across agents, expressed as steps in a template. E.g. NHS post workflow: Content Ops → NHS Specialist → Researcher → Copywriter → Editor → QA → HITL → Scheduler. |
| **HITL Gate** | A human-in-the-loop checkpoint attached to a Job. Has a gate type (approve / edit / reject / decide) and a resolution. |
| **Approval** | A resolved HITL gate with outcome `approved`, `approved_with_edits`, `rejected`, or `delegated_back`. |
| **Memory** | Per-agent persistent knowledge. Three tiers: skill files (system prompt + tools), agent memory JSON (facts the agent has learned), RAG-accessible documents (brand rules, transcripts, past posts, context libraries). |
| **Knowledge Base** | The shared read-only substrate under `TITAN/_context`, brand voice guides, transcripts, past posts, competitor libraries, expert-bench sources. Chunked and indexed for RAG. |
| **Permission** | The right for a given agent to touch a given resource (Notion page, R2 bucket, Prisma table, outbound email, published post). Deny by default. |
| **Budget** | A monthly cap in £ per agent, with an alert threshold. Automation Manager enforces. |
| **Quality Outcome** | Recorded per AgentReview: `approved_unchanged`, `approved_minor_edit`, `major_revision`, `rejected`, `not_reviewed`. |
| **AgentReview** | The persistent quality record. Source of truth. Includes `human_edit_time_seconds`, the field that feeds cost-per-usable. |
| **Cost per usable output** | The north-star economic metric. `(model_cost + human_edit_time × Cam's hourly rate) / approved_outputs`. |
| **Version** | An immutable label on the state of an agent, prompt, knowledge snapshot or workflow at a moment in time. Persisted per Job. |
| **Wrapper Principle** | The rule that no LLM call runs in production without going through `executeJob()`. |
| **Routine** | An Anthropic-shipped packaged prompt / repo / connector that can be invoked as a Job like any other agent. |
| **Escalation** | When an agent fails, exceeds retries, or hits an unrecoverable state, ownership passes to the Automation Manager, which either fixes, replans, or opens a HITL gate to the PA. |
| **PA** | Personal Assistant layer. Voice-adjacent interface, morning brief, HITL aggregator. Not built for v1. Cowork substitutes. |
| **Dispatch** | The router that takes conversational requests and turns them into Jobs. Today: Cowork chat + skill invocations. Future: a Chief of Staff subsystem. |

---

## 2. The Five-Layer Stack

**Interface / system-of-record distinction.** Cowork is the PA interface: the person at your desk. Studio OS is the company underneath them. Cowork does not become the database. Every persistent fact — Jobs, budgets, quality, initiatives, reviews, memory, versions — lives in Studio OS Prisma. Cowork reads and writes through Studio OS APIs. If Cowork went offline tomorrow, the org would still exist; a new interface could sit on top of the same Studio OS.

```
+---------------------------------------------------------------+
| 1. INTERFACE LAYER  (Cowork today, native PA future)          |
|    - "the person at your desk"                                |
|    - reads/writes only through Studio OS APIs                 |
|    - PA aggregates HITL gates + morning brief                 |
|    - Dispatch routes conversational requests into Jobs        |
+---------------------------------------------------------------+
| 2. MANAGEMENT / CONTROL LAYER (systems: code + LLM)           |
|    Chief of Staff | Operations | Content Ops | Automation Mgr |
+---------------------------------------------------------------+
| 3. WORKFORCE (workers: prompt-first + RAG)                    |
|    Researcher | Strategist | Copywriter | Editorial Writer    |
|    Editor | Creative Director | Brand Guardian | QA/Critic    |
|    Fact Checker                                               |
+---------------------------------------------------------------+
| 4. EXPERT BENCH (callable specialists, RAG-heavy)             |
|    NHS Services | Pharmacy Technology | Regulation            |
|    Private Services | Pharmacy Business/Finance               |
|    Clinical/Medicines | Policy/Advocacy                       |
+---------------------------------------------------------------+
| 5. INFRASTRUCTURE (built first)                               |
|    Memory/Knowledge | Jobs/Queues | HITL Gates                |
|    Agent Telemetry | Cost Tracking | Quality Tracking         |
|    Audit Log | Integrations                                   |
+---------------------------------------------------------------+
```

Layers are strict. Higher layers may call lower layers. Lower layers never call higher layers directly, they emit events or write Job records that higher layers observe. This is what keeps the org from becoming a spaghetti of cross-agent function calls.

---

## 3. System vs Worker: The Core Distinction

Every agent above the Infrastructure layer is either a **system** or a **worker**. Getting this distinction right is the difference between an operating model and a prompt library.

### 3.1 System agents

A system agent has two halves:

- **CODE.** Always-on. Owns state. Runs on triggers (cron, webhook, DB event, other agent). Talks to integrations (Metricool, Notion, R2, Prisma, email). Enforces rules. Writes recommendations and Job records. Lives in the `titan-dashboard` repo under `src/agents/<name>/service/`.
- **INTELLIGENCE.** An LLM invoked by the CODE at defined decision points. Makes judgement calls the CODE cannot: "given the mix, this gap should be an NHS-services authority piece, not another product post." The LLM output is written back into the system as structured data by the CODE.

Every Management-layer agent is a system:

| Agent | CODE knows | INTELLIGENCE decides |
|---|---|---|
| **Chief of Staff** | Initiatives table, meeting cadence, active workflows, calendar | Which initiative is starving, which needs a nudge, what to brief Cam on this morning |
| **Operations** | Cost this month, quality outcomes per agent, budget caps, retry log | What's underperforming, what to rebalance, what to raise to Cam |
| **Content Ops** | Scheduled posts per brand, cadence rules, gap in next 14 days, ER tier data | What to fill the gap with, which brand, what angle, which workflow to spin |
| **Automation Manager** | Every Job's status, failure count, retry state, cost velocity | Whether to retry, escalate, kill, or replan a failing workflow |

The four Management agents are the only systems in v1.

### 3.2 Worker agents

A worker agent is prompt-first. It has:

- A **skill file** (system prompt + tools + memory pointers) stored under `TITAN/_skills/` or in the Claude Code skills dir.
- **RAG access** (read-only) to a defined slice of the knowledge base.
- Optional **agent memory JSON** for facts the worker has learned across runs (e.g. "Cam prefers 'authorised' not 'permitted' when writing about NHS services").
- No persistent code state, no cron, no integrations. Invoked only via a Job.

Every Workforce agent and every Expert Bench specialist is a worker.

### 3.3 Why this matters

If Content Ops were a worker, Cam would have to prompt it every time. Because it is a system, it wakes up on Monday morning, sees a 14-day gap, calls its own LLM to decide what to do, and drops a recommendation into Cam's morning brief. That is the difference between an "AI helper" and an operating model.

---

## 4. Departments

An enum, not a folksonomy. Every Agent belongs to exactly one Department.

| Department | Agents (v1) |
|---|---|
| `Interface` | PA (future), Dispatch |
| `Operations` | Chief of Staff, Operations, Automation Manager |
| `Content` | Content Ops, Copywriter, Editorial Writer, Editor |
| `Strategy` | Strategist, Researcher, Fact Checker |
| `Creative` | Creative Director, Brand Guardian |
| `Quality` | QA/Critic |

Expert Bench specialists sit under `Strategy` for reporting purposes but are tagged separately as `is_expert_bench = true`.

Departments are the aggregation unit for cost and quality reporting ("Content Department spent £42 last week, 78% approved without edits").

---

## 5. Client Model

A Client is a Prisma record. Titan is Client #1. All infrastructure supports multi-client from day one. Adding ABF / Puri / Pharmappy / Monissa in month 2-3 must be spinning up new `Client` records and their memory, not architectural changes.

Every Job belongs to a Client. Every Workflow instance belongs to a Client. Every scheduled action, budget, quality report and HITL gate is client-scoped.

A Client owns:

- Brand rules reference (path in `TITAN/_context/<client>/brand/`)
- Approval chain (who signs off, which gates are needed, whether Cam has delegated any)
- Cadence rules (per brand, per channel, per week)
- Active brand list (Titan → `titan-pmr`, `titanverse`)
- Voice guide reference
- Expert bench allowlist (which specialists this client's work may draw on)
- Active flag

A Brand is a sub-identity under a Client with its own voice, feed and posting rules. In v1, Titan has two brands. In practice, `titan-pmr` and `titanverse` behave like two different voices posting from the same operating chassis.

---

## 6. The Job as the Atomic Unit

Everything that happens in Studio OS is a Job. If there is no Job row, it didn't happen.

A Job has:

- A **requesting agent** (or `human` if triggered by Cam directly)
- An **executing agent**
- A **client** and (optionally) a **brand**
- A **department** (of the executing agent)
- A **model** used (e.g. `claude-sonnet-4-5`)
- **Input payload** — the brief, context refs, upstream job outputs
- **Output payload** — the produced work
- **Cost** — tokens in, tokens out, £ cost (computed at write time from a model pricing table)
- **Wallclock** — start, finish, elapsed ms
- **Status** — `queued`, `running`, `awaiting_hitl`, `completed`, `failed`, `cancelled`
- **Workflow context** — the workflow this Job belongs to (nullable for one-off Jobs) and the step index
- **Quality outcome** — set when reviewed
- **HITL flag** — whether this Job requires review before its output is considered final

A Job may contain multiple **AgentRuns**. E.g. a Copywriter Job that generates three drafts and picks the best is one Job with three AgentRuns. Costs aggregate up.

**Rule:** No agent ever executes work outside a Job. If Cam types "give me three hook variants" into Cowork, Cowork creates a Job for the Copywriter, the Copywriter runs, and the output comes back. Not a hidden LLM call.

---

## 7. Workflows

A Workflow is a template of chained Jobs. Instances of a Workflow are tracked; steps advance as each Job completes.

A Workflow definition (JSON) specifies:

- An ordered list of steps
- For each step: the executing agent, the input contract (which upstream outputs it consumes), the HITL gate rule, the failure policy
- Branching rules (rare in v1; if used, expressed as conditional next-step selectors)

A Workflow **instance** tracks:

- Which template it is
- Which step is current
- Which Jobs correspond to which steps
- Overall status (`in_progress`, `awaiting_hitl`, `completed`, `failed`, `abandoned`)
- Client, brand, initiative (if any)

A canonical example is worked in section 17.

---

## 8. HITL Gates

Every gate is a persisted `HITLGate` record attached to a Job. Never a synchronous prompt. Never a modal.

Gate types:

| Gate type | Meaning | Valid resolutions |
|---|---|---|
| `approve` | Yes / no on the output as-is | `approved`, `rejected` |
| `edit` | Approve with modifications | `approved_with_edits` (edits captured), `rejected` |
| `reject` | Explicit reject with reason (used for QA-flagged output) | `rejected` (reason required) |
| `decide` | Human must choose between N options the agent produced | `decision_made` (choice captured) |
| `delegate_back` | Human returns the Job to the agent with new guidance | `delegated_back` (guidance captured) |

Gate lifecycle:

1. Agent completes work. Job status becomes `awaiting_hitl`. `HITLGate` row created, `presented_at` set.
2. PA (or Cowork today) surfaces the gate in the morning brief, or immediately if the workflow is time-sensitive.
3. Cam resolves. `resolved_at` and `resolution` set. Workflow advances.

**Rule:** Any Job producing work that will be sent, published, spent-on, or communicated externally requires a HITL gate. See section 12 for the full list.

---

## 9. Memory and Knowledge

Three tiers, distinct storage.

### 9.1 Skill files (system prompt + tools)

Where: `TITAN/_skills/<agent-name>/SKILL.md` and adjacent files. Also mirrored where Claude Code / Cowork can load them.

Contents: the system prompt, the tools the agent may call, the RAG collections it may query, the memory file it may read/write. This is the agent's identity.

Immutable at runtime. Changes go through Cam.

### 9.2 Agent memory JSON

Where: `TITAN/_memory/<agent-name>.json` (or a Prisma `AgentMemory` table, decision below).

Contents: facts the agent has learned across runs, e.g. Copywriter noting "Cam replaced 'permitted' with 'authorised' in three consecutive NHS pieces." Rate-limited writes, structured schema, small (< 100 KB per agent).

**Open decision:** file vs Prisma table. File is simpler and diff-able in git. Prisma is queryable and auditable. Cam should red-pen. Default recommendation: **Prisma table with git-exported snapshots**, so it's live and auditable but also inspectable in the repo.

### 9.3 Knowledge base (RAG)

Where: `TITAN/_context/**` plus transcripts, past posts, competitor libraries, expert-bench sources, brand voice guides. Chunked and indexed (v1: pgvector inside the existing Postgres; option to move to a dedicated store later).

Access is read-only per agent per collection. E.g. NHS Specialist gets `_context/nhs/*`, Copywriter gets `_context/voice/*` and per-Client brand rules, Content Ops gets scheduling history.

---

## 10. Permissions and Boundaries

Deny by default. Every write action from an agent to a resource must be explicitly permitted, per agent, per resource.

Resources and default permissions in v1:

| Resource | Read | Write |
|---|---|---|
| Prisma: `Job`, `AgentRun` | All agents (own rows only) | Automation Manager, Ops, service layer |
| Prisma: `Initiative` | Chief of Staff, Cam | Chief of Staff |
| Prisma: `AgentBudget` | Ops, Automation Manager | Ops |
| Prisma: `AgentQualityStat` | All (aggregate view) | Ops (compute), Automation Manager (compute) |
| Prisma: `HITLGate` | Owning agent, PA/Cowork, Cam | Owning agent (create), Cam (resolve) |
| Prisma: `AuditLog` | Ops, Cam | Any agent (append only), never update or delete |
| Notion: any page | Read: named agents per space | Write: none in v1 (all Notion edits go through HITL) |
| R2 bucket: any | Read: named agents per bucket | Write: named agents per bucket, HITL for public buckets |
| Outbound email | none | none in v1 (draft only, HITL required to send) |
| Metricool | Read: Content Ops | Write: none in v1 (drafts to Notion, Cam publishes) |

Enforced in the service layer, not in agent prompts. An agent asking to touch a forbidden resource returns an error, gets logged in `AuditLog`, and the Job fails with a permission failure code.

---

## 11. What Requires HITL

Hard list. Non-negotiable in v1.

- **Publishing** — any post to LinkedIn, X, Instagram, TikTok, YouTube, Substack, a client's site, or any external surface.
- **Sending** — any outbound email, DM, Slack message to a person outside CMotionDesign, or booking confirmation.
- **Financial actions** — any spend outside the automatic model-cost budget, any invoice raised or paid, any subscription bought.
- **Strategy changes** — any Initiative created, closed, or materially edited by an agent.
- **Client-facing comms** — any output the client will see: recommendations, decks, reports, briefs.
- **Deletions** — any Prisma delete other than expired transient rows, any file deletion outside `TITAN/_tmp/`.
- **Cross-client actions** — any Job or automation that touches more than one Client.

Soft list (HITL by default, can be delegated back by Cam):

- Content draft approvals (Cam may say "Copywriter is now trusted for Titanverse educational posts up to 1200 chars, auto-approve").
- Notion page structure edits.
- Non-published creative variations (concepts, mood boards).

Delegation itself is a `HITLGate` of type `decide` with resolution captured in the agent's memory or the Client's approval chain.

---

## 12. How Agents Are Invoked

Three paths only.

### 12.1 Path A: Cron or webhook trigger

A Service (Management-layer CODE) wakes on schedule or event, evaluates its state, and either produces work directly or creates a Job for another agent.

```
[cron: Mon 07:00]
       |
       v
[Content Ops service]
       |
       |-- reads: schedule for next 14d, cadence rules, ER tier data
       |
       v
[Content Ops INTELLIGENCE call: "what should fill the gap?"]
       |
       v
[Content Ops writes: Recommendation row + Job (Workflow instance: NHS-post-v1)]
       |
       v
[Job queued for NHS Specialist as step 1 of the workflow]
```

### 12.2 Path B: Agent-to-agent delegation

An agent inside a running Job needs work from another agent. It creates a downstream Job. The upstream Job pauses (status `awaiting_downstream`) until the downstream Job completes.

```
[Copywriter Job running]
       |
       |-- needs: three fact checks on NHS Pharmacy First scope
       |
       v
[Copywriter creates Job for Fact Checker, workflow_id inherits]
       |
       v
[Copywriter Job status: awaiting_downstream, pauses]
       |
       v
[Fact Checker Job completes, writes output]
       |
       v
[Automation Manager resumes upstream Copywriter Job with downstream output attached]
```

**Rule:** agents never call other agents directly (no function call). Delegation is always via a Job record. This is what makes cost, quality and audit legible.

### 12.3 Path C: Human via PA / Dispatch

Cam speaks or types a request. Cowork (v1) or PA (future) routes it.

```
[Cam: "give me three hook variants for the Titanverse NHS Pharmacy First launch"]
       |
       v
[Dispatch parses: intent = generate hooks, client = titan, brand = titanverse, agent = Copywriter]
       |
       v
[Dispatch creates Job for Copywriter with brief embedded]
       |
       v
[Copywriter runs, output returned to Cam via Cowork thread]
       |
       v
[Job persisted with quality outcome initially = not_reviewed]
       |
       v
[If Cam edits and uses one, an AgentReview row is written: outcome=approved_minor_edit, human_edit_time_seconds=<measured>]
```

---

## 13. How Agents Communicate

Async only. Via Job records. Never direct function calls.

- Upstream agent creates downstream Job with `input_payload` populated.
- Downstream agent writes to `output_payload` on completion.
- Automation Manager observes state transitions and resumes waiting upstream Jobs.

Rationale: every hop has cost, quality and audit. Direct function calls make some hops invisible. The uniform Job substrate is what makes the whole thing measurable.

Trade-off: latency. A five-step workflow with async hops has real overhead vs a chained function call. Accepted for v1. Optimisation later can batch same-agent calls, but the interface stays Job-based.

---

## 14. How Context Is Passed

Two channels:

1. **Job payload.** The brief, the upstream Job outputs, the client and brand refs, the workflow context. Everything the agent needs for this specific run.
2. **Agent memory and RAG.** Persistent context the agent brings to every Job (voice preferences, learned facts, brand rules, source library).

Prompts are assembled at Job execution time by the service layer:

```
[System prompt from skill file]
  +
[Relevant agent memory (top-K facts by embedding)]
  +
[Relevant RAG chunks (top-K from allowed collections by embedding)]
  +
[Job input_payload]
  +
[Workflow context: initiative, upstream outputs]
```

This is Cam-inspectable per Job (stored in `AgentRun.assembled_prompt` as a truncated snapshot for audit).

---

## 15. Cost Tracking

### 15.1 Cost per usable output (north-star metric)

Model cost is not the metric. **Cost per usable output** is.

> £0.04 + 14 minutes of Cam's editing time is more expensive than £0.29 + 40 seconds.

Formula:

```
cost_per_usable = (model_cost_gbp + (human_edit_time_seconds * cam_hourly_rate_gbp_per_sec))
                  / approved_outputs
```

Where `approved_outputs` counts Jobs resolved as `approved_unchanged` or `approved_minor_edit`. `major_revision` and `rejected` do not count toward the denominator. `cam_hourly_rate_gbp_per_sec` is a configurable constant in `ModelPricing`-adjacent config, defaulted to a self-chosen rate Cam will set.

This metric is what drives model choice, prompt iteration, and whether an agent stays in the roster.

### 15.2 What is recorded

Every AgentRun records: `input_tokens`, `output_tokens`, `model`, `wallclock_ms`. Cost in £ is computed at write time from a `ModelPricing` table (updated as Anthropic and OpenAI change prices).

Aggregation views:

- Per agent per month
- Per department per month
- Per client per month
- Per initiative (sum across Jobs tagged to it)
- Per workflow instance
- Cumulative for the current month, projected against monthly cap

`AgentBudget` holds a monthly cap and alert threshold per agent. Automation Manager runs a cost check on every Job creation:

- If `spend_month_gbp + estimated_cost > cap`, the Job is either queued for HITL (if the workflow is high-value) or rejected (with a Cam alert).
- If `spend_month_gbp / cap > alert_threshold_pct`, a soft alert lands in the morning brief.

Cost estimation: pre-Job, use average tokens for that (agent, workflow-step) pair from the last 30 days.

---

## 16. Quality Tracking

### 16.1 Source of truth: AgentReview

The atomic quality record is the `AgentReview` row. One review per AgentRun (or per Job for the aggregate case). Written by whoever resolves the associated HITL gate, or backfilled by Cam via the reviews view.

Fields (full schema in section 19):

- `agent_run_id` (or `job_id` for whole-Job reviews)
- `outcome` enum: `approved_unchanged` | `approved_minor_edit` | `major_revision` | `rejected`
- `human_edit_time_seconds` — first-class economics field, feeds the north-star metric
- `reviewer` — human id or "cam"
- `reviewed_at`
- `feedback` — nullable free text

**AgentQualityStat is a derived view, not source of truth.** It is computed on demand (or on a schedule) from `AgentReview` rows, sliceable by any combination of: `agent`, `agent_version`, `prompt_version`, `knowledge_version`, `model`, `client`, `department`, time window.

### 16.2 Derived stats

Computed metrics available through the stats view:

| Metric | Definition |
|---|---|
| `reviews` | Total reviewed AgentRuns in slice |
| `approved_unchanged_pct` | % resolved as `approved_unchanged` |
| `approved_minor_edit_pct` | % resolved as `approved_minor_edit` |
| `major_revision_pct` | % resolved as `major_revision` |
| `rejected_pct` | % resolved as `rejected` |
| `avg_edit_time_sec` | Mean `human_edit_time_seconds` across reviewed rows |
| `avg_model_cost_gbp` | Mean model cost per AgentRun |
| `avg_cost_per_usable_gbp` | Applies the formula in 15.1 |
| `avg_turnaround_ms` | Mean wallclock |

`avg_cost_per_usable_gbp` is the number Cam reads. Not model cost. Not approval rate alone. The combined number.

### 16.3 Slice-by-version

Because `agent_version`, `prompt_version`, `knowledge_version` and `workflow_version` are persisted on every Job, quality stats can be sliced by version. This is what enables root-cause: "Why did approval rate drop? Because Copywriter `prompt_version` 1.7 shipped on Tuesday and the last twelve `major_revision` rows are all on 1.7."

### 16.4 Where it shows up

Ops morning brief. Example: "Copywriter approval-unchanged rate dropped 14 points this week on Titanverse educational posts. All twelve reviewed rows are on `prompt_version` 1.7 shipped Tuesday. Suggest rolling back or reviewing the diff."

---

## 17. Canonical Workflow: NHS Post from Content Ops to Schedule

The reference workflow. Every future workflow follows this shape.

**Workflow name:** `nhs-authority-post-v1`
**Client:** `titan`
**Brand:** `titanverse` (or `titan-pmr` depending on angle)

### 17.1 Step map

| # | Agent | Kind | Produces | HITL gate |
|---|---|---|---|---|
| 1 | Content Ops | system | Gap analysis + workflow trigger, brief with topic angle | None (internal recommendation) |
| 2 | NHS Specialist | worker (expert bench) | Fact pack: current NHS Pharmacy First scope, service uptake data, policy movements, direct sources | None (feeds downstream) |
| 3 | Researcher | worker | Contextual research: what's been posted this week by adjacent voices, which numbers are contested, competitor angles | None (feeds downstream) |
| 4 | Strategist | worker | Angle brief: what this specific post argues, why now, what changes in the reader's head, how it ladders to the Initiative | HITL: `approve` (Cam can redirect angle before drafting) |
| 5 | Copywriter | worker | Three hook variants + full draft against approved angle | None (feeds Editor) |
| 6 | Editor | worker | Polished single draft with voice + structural edits applied | None (feeds QA) |
| 7 | Fact Checker | worker (parallel with 6) | Fact check report on every specific claim, sources linked | None (feeds QA) |
| 8 | QA / Brand Guardian | worker | Combined report: voice fit, brand rule compliance, factual soundness (using Fact Checker output), pass / flag / block | HITL: `approve` (Cam sees QA report + draft, decides ship or send back) |
| 9 | Scheduler (service, not agent) | service | Post scheduled in Metricool draft or Notion queue for Cam to publish | HITL: `approve` (Cam publishes from the tool of record) |

### 17.2 Sequence

```
[Content Ops cron Mon 07:00]
  -> creates Workflow instance "nhs-authority-post-v1" (client=titan, brand=titanverse)
  -> creates Job #1: Content Ops recommendation
        completes, writes: topic angle brief
  -> creates Job #2: NHS Specialist fact pack
        completes, writes: fact pack (with source URIs)
  -> creates Job #3: Researcher contextual scan
        completes, writes: research pack
  -> creates Job #4: Strategist angle brief
        completes, status = awaiting_hitl
        HITLGate #A created, presented in morning brief
        Cam approves (or edits) angle
        Workflow advances
  -> creates Job #5: Copywriter draft
        completes, writes: hooks + draft
  -> creates Job #6: Editor polish  }
  -> creates Job #7: Fact Checker    } parallel
        both complete
  -> creates Job #8: QA / Brand Guardian
        completes, status = awaiting_hitl
        HITLGate #B created with combined QA report + final draft
        Cam resolves: approve, approve_with_edits, or delegate_back
  -> creates Job #9: Scheduler service action
        drafts post into Metricool + Notion queue
        HITLGate #C created (publish trigger)
        Cam publishes from Metricool
  -> Workflow status = completed
```

### 17.3 Failure paths

- Fact Checker flags a claim as unverified: QA sees flag, blocks, HITLGate #B is presented with block reason. Cam decides delegate back to Copywriter with a rewrite instruction, or accept the flag and cut the claim.
- NHS Specialist fact pack returns thin (< N sources): Automation Manager escalates, creates a HITL asking Cam whether to proceed with a lighter angle or defer the post.
- Any Job fails with a permission error: Job status = `failed`, Automation Manager logs, PA alert.

### 17.4 Cost profile (target)

Rough per-post budget for the reference workflow: **£0.60 to £1.20**. If a specific run exceeds £2.00, Automation Manager pauses at Job #5 and asks Cam whether to continue.

---

## 18. The PA Layer (Designed, Not Built)

Cowork is the v1 interface. Native PA is future work but the architecture assumes it. Two implications drive design decisions today.

### 18.1 Every HITL gate must be aggregatable

Never a synchronous modal. Every gate is a `HITLGate` row that a PA can list, sort, batch and present. Cowork today does this via chat, tomorrow PA does it via voice + a review dashboard. Same underlying rows.

### 18.2 Every morning-brief-relevant fact must be persisted as a structured record

Not a chat message. Not a Slack line. A row. Examples:

- Content Ops writes a `Recommendation` row with brand, gap, suggested angle, cost estimate, workflow it wants to spin.
- Ops writes an `AgentAlert` row for cost anomalies.
- Chief of Staff writes an `InitiativeStatus` row when an initiative moves.

Morning brief generation is a pure read query across these tables plus HITL gates plus calendar. The brief is a projection, not a source of truth.

### 18.3 PA-adjacent primitives to build now

- `Recommendation` table (author agent, client, kind, body, status, presented_at, resolved_at)
- `AgentAlert` table (agent, severity, body, ack_required, ack_at)
- `InitiativeStatus` snapshot table (initiative_id, status, delta, snapshot_at)
- Morning brief query stub in the API layer that composes these into the brief JSON

---

## 19. Prisma Schema

Reference schema for v1. Comments call out decisions. British spelling in strings, US spelling in code identifiers where convention demands (e.g. `color` in enums, but we don't have any here).

```prisma
// ---------- ENUMS ----------

enum Department {
  Interface
  Operations
  Content
  Strategy
  Creative
  Quality
}

enum AgentKind {
  system
  worker
}

enum JobStatus {
  queued
  running
  awaiting_downstream
  awaiting_hitl
  completed
  failed
  cancelled
}

enum HITLGateType {
  approve
  edit
  reject
  decide
  delegate_back
}

enum HITLResolution {
  approved
  approved_with_edits
  rejected
  decision_made
  delegated_back
}

enum QualityOutcome {
  approved_unchanged
  approved_minor_edit
  major_revision
  rejected
  not_reviewed
}

enum WorkflowStatus {
  in_progress
  awaiting_hitl
  completed
  failed
  abandoned
}

// ---------- CORE ----------

model Client {
  id                String   @id @default(cuid())
  slug              String   @unique
  name              String
  brandRulesRef     String   // path in TITAN/_context/<client>/brand/
  approvalChainRef  String   // path or JSON blob describing sign-off
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  brands            Brand[]
  jobs              Job[]
  workflows         WorkflowInstance[]
  initiatives       Initiative[]
  hitlGates         HITLGate[]
  budgets           AgentBudget[]
  recommendations   Recommendation[]
}

model Brand {
  id            String   @id @default(cuid())
  clientId      String
  client        Client   @relation(fields: [clientId], references: [id])
  slug          String
  name          String
  voiceGuideRef String
  cadenceRules  Json     // per-channel rules
  isActive      Boolean  @default(true)

  @@unique([clientId, slug])
}

model Agent {
  id                 String     @id @default(cuid())
  name               String     @unique
  department         Department
  kind               AgentKind
  currentVersion     String     // semver of the agent as a whole
  model              String     // e.g. claude-sonnet-4-5
  currentPromptVer   String     // semver of the active prompt/skill file
  currentKnowledgeVer String    // hash or semver of the active RAG snapshot
  skillRef           String     // path in TITAN/_skills/<name>/SKILL.md
  ragCollections     String[]   // allowed knowledge base slices
  permissions        Json       // resource -> {read, write} rules
  policy             Json?      // retry, escalation, budget behaviour
  isExpertBench      Boolean    @default(false)
  isActive           Boolean    @default(true)
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  budgets            AgentBudget[]
  memoryFacts        AgentMemoryFact[]
  jobsAsExec         Job[]      @relation("ExecutingAgent")
  jobsAsRequest      Job[]      @relation("RequestingAgent")
  reviews            AgentReview[]
  versions           AgentVersionSnapshot[]
}

// Immutable snapshots of an agent at a point in time. Written on every version bump.
// Lets us reconstruct exactly what agent v1.7 looked like when it produced a Job.
model AgentVersionSnapshot {
  id             String   @id @default(cuid())
  agentId        String
  agent          Agent    @relation(fields: [agentId], references: [id])
  agentVersion   String
  promptVersion  String
  knowledgeVersion String
  model          String
  skillFileHash  String
  skillFileBody  String   // truncated or full snapshot
  ragManifest    Json     // list of RAG doc hashes at snapshot time
  createdAt      DateTime @default(now())

  @@unique([agentId, agentVersion, promptVersion, knowledgeVersion])
  @@index([agentId])
}

model Initiative {
  id           String   @id @default(cuid())
  clientId     String
  client       Client   @relation(fields: [clientId], references: [id])
  title        String
  description  String
  ownerAgent   String   // agent name; usually chief-of-staff
  status       String   // active | paused | done | abandoned
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  jobs         Job[]
  workflows    WorkflowInstance[]
  statuses     InitiativeStatus[]
}

model WorkflowTemplate {
  id            String   @id @default(cuid())
  slug          String
  name          String
  version       String   // semver; multiple rows per slug for version history
  steps         Json     // ordered list of {agent, inputContract, hitl, failurePolicy}
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())

  instances     WorkflowInstance[]

  @@unique([slug, version])
}

model WorkflowInstance {
  id            String           @id @default(cuid())
  templateId    String
  template      WorkflowTemplate @relation(fields: [templateId], references: [id])
  clientId      String
  client        Client           @relation(fields: [clientId], references: [id])
  brandSlug     String?
  initiativeId  String?
  initiative    Initiative?      @relation(fields: [initiativeId], references: [id])
  currentStep   Int              @default(0)
  status        WorkflowStatus   @default(in_progress)
  startedAt     DateTime         @default(now())
  finishedAt    DateTime?
  context       Json             // rolling context passed between steps

  jobs          Job[]
}

model Job {
  id                    String            @id @default(cuid())
  workflowInstanceId    String?
  workflowInstance      WorkflowInstance? @relation(fields: [workflowInstanceId], references: [id])
  workflowStepIndex     Int?
  initiativeId          String?
  initiative            Initiative?       @relation(fields: [initiativeId], references: [id])

  requestingAgentId     String?           // null if human-initiated
  requestingAgent       Agent?            @relation("RequestingAgent", fields: [requestingAgentId], references: [id])
  requestingHuman       String?           // "cam" or a future user id

  executingAgentId      String
  executingAgent        Agent             @relation("ExecutingAgent", fields: [executingAgentId], references: [id])

  clientId              String
  client                Client            @relation(fields: [clientId], references: [id])
  brandSlug             String?
  department            Department

  // Versioning: platform middleware stamps these on every Job. Never null in v1.
  agentVersion          String
  promptVersion         String
  knowledgeVersion      String
  workflowVersion       String?

  model                 String
  inputPayload          Json
  outputPayload         Json?

  inputTokens           Int               @default(0)
  outputTokens          Int               @default(0)
  costGbp               Decimal           @default(0) @db.Decimal(10, 4)
  wallclockMs           Int?

  status                JobStatus         @default(queued)
  humanReviewRequired   Boolean           @default(false)
  qualityOutcome        QualityOutcome    @default(not_reviewed)

  reviewerHuman         String?
  reviewedAt            DateTime?
  reviewNotes           String?

  createdAt             DateTime          @default(now())
  startedAt             DateTime?
  finishedAt            DateTime?

  agentRuns             AgentRun[]
  hitlGates             HITLGate[]
  auditLogs             AuditLog[]

  @@index([clientId, createdAt])
  @@index([executingAgentId, createdAt])
  @@index([status])
}

model AgentRun {
  id                String   @id @default(cuid())
  jobId             String
  job               Job      @relation(fields: [jobId], references: [id])
  agentId           String
  agentVersion      String
  promptVersion     String
  knowledgeVersion  String
  model             String
  inputTokens       Int
  outputTokens      Int
  costGbp           Decimal  @db.Decimal(10, 4)
  wallclockMs       Int
  retries           Int      @default(0)
  status            String   // succeeded | failed | refused | timed_out
  assembledPrompt   String?  // truncated snapshot for audit
  rawResponse       String?  // truncated snapshot for audit
  createdAt         DateTime @default(now())

  reviews           AgentReview[]

  @@index([jobId])
  @@index([agentId, promptVersion])
}

// The source of truth for quality. Every reviewed AgentRun gets a row.
// AgentQualityStat is a derived view over this table.
model AgentReview {
  id                     String   @id @default(cuid())
  agentRunId             String?
  agentRun               AgentRun? @relation(fields: [agentRunId], references: [id])
  jobId                  String?  // for whole-Job reviews when granularity below Job isn't useful
  job                    Job?     @relation(fields: [jobId], references: [id])
  agentId                String
  agent                  Agent    @relation(fields: [agentId], references: [id])

  outcome                QualityOutcome
  humanEditTimeSeconds   Int      @default(0)   // first-class economics field
  reviewer               String   // "cam" or future user id
  reviewedAt             DateTime @default(now())
  feedback               String?

  // Denormalised for slice speed. Populated at write time from the referenced Job.
  agentVersion           String
  promptVersion          String
  knowledgeVersion       String
  workflowVersion        String?
  model                  String
  clientId               String
  department             Department

  @@index([agentId, reviewedAt])
  @@index([agentId, promptVersion])
  @@index([clientId, reviewedAt])
}

model HITLGate {
  id            String          @id @default(cuid())
  jobId         String
  job           Job             @relation(fields: [jobId], references: [id])
  clientId      String
  client        Client          @relation(fields: [clientId], references: [id])
  gateType      HITLGateType
  description   String
  presentedAt   DateTime        @default(now())
  resolvedAt    DateTime?
  resolution    HITLResolution?
  resolutionData Json?          // captured edits, chosen option, guidance
  reviewerHuman String?
  slaMinutes    Int?            // optional deadline for morning brief prioritisation

  @@index([resolvedAt])
  @@index([clientId, presentedAt])
}

// ---------- COST / QUALITY / OPS ----------

model AgentBudget {
  id                   String   @id @default(cuid())
  agentId              String
  agent                Agent    @relation(fields: [agentId], references: [id])
  clientId             String?  // null = across all clients
  client               Client?  @relation(fields: [clientId], references: [id])
  monthlyCapGbp        Decimal  @db.Decimal(10, 2)
  spendMonthGbp        Decimal  @default(0) @db.Decimal(10, 2)
  alertThresholdPct    Int      @default(80)
  monthKey             String   // "2026-08"
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@unique([agentId, clientId, monthKey])
}

// DERIVED. Not source of truth. Materialised on schedule or on demand.
// Source is AgentReview. This table exists only as a cache for common slices.
// Any real question about quality is answered by a fresh query over AgentReview.
model AgentQualityStat {
  id                     String   @id @default(cuid())
  agentId                String
  // Slice keys. Any subset may be null to represent an aggregate on that axis.
  agentVersion           String?
  promptVersion          String?
  knowledgeVersion       String?
  model                  String?
  clientId               String?
  department             Department?
  window                 String   // "30d" | "90d" | "all"

  reviews                Int
  approvedUnchangedPct   Float
  approvedMinorEditPct   Float
  majorRevisionPct       Float
  rejectedPct            Float
  avgEditTimeSec         Float
  avgModelCostGbp        Decimal  @db.Decimal(10, 4)
  avgCostPerUsableGbp    Decimal  @db.Decimal(10, 4)
  avgTurnaroundMs        Int
  computedAt             DateTime @default(now())

  @@index([agentId, window])
  @@index([agentId, promptVersion, window])
}

model AgentMemoryFact {
  id           String   @id @default(cuid())
  agentId      String
  agent        Agent    @relation(fields: [agentId], references: [id])
  clientId     String?  // null = global to the agent
  key          String
  value        String
  embedding    Bytes?   // pgvector column in migration
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([agentId, clientId])
}

model ModelPricing {
  id             String   @id @default(cuid())
  model          String   @unique
  inputPerMtok   Decimal  @db.Decimal(10, 4)  // GBP per million input tokens
  outputPerMtok  Decimal  @db.Decimal(10, 4)  // GBP per million output tokens
  effectiveFrom  DateTime
  effectiveTo    DateTime?
}

// ---------- AUDIT / TELEMETRY ----------

model AuditLog {
  id         String   @id @default(cuid())
  jobId      String?
  job        Job?     @relation(fields: [jobId], references: [id])
  actorAgent String?
  actorHuman String?
  action     String
  resource   String
  before     Json?
  after      Json?
  createdAt  DateTime @default(now())

  @@index([createdAt])
  @@index([resource])
}

// ---------- PA / MORNING BRIEF PRIMITIVES ----------

model Recommendation {
  id           String   @id @default(cuid())
  authorAgent  String
  clientId     String
  client       Client   @relation(fields: [clientId], references: [id])
  kind         String   // "content-gap" | "budget-rebalance" | "initiative-nudge" ...
  body         String
  metadata     Json?
  status       String   @default("open") // open | actioned | dismissed
  presentedAt  DateTime @default(now())
  resolvedAt   DateTime?

  @@index([status, presentedAt])
}

model AgentAlert {
  id           String   @id @default(cuid())
  agentId      String
  severity     String   // info | warn | error | critical
  body         String
  metadata     Json?
  ackRequired  Boolean  @default(false)
  ackAt        DateTime?
  createdAt    DateTime @default(now())

  @@index([severity, createdAt])
}

model InitiativeStatus {
  id           String     @id @default(cuid())
  initiativeId String
  initiative   Initiative @relation(fields: [initiativeId], references: [id])
  status       String
  delta        String?    // what changed since last snapshot
  snapshotAt   DateTime   @default(now())

  @@index([initiativeId, snapshotAt])
}
```

Notes on the schema:

- `Decimal(10, 4)` on cost to keep sub-penny resolution for individual model calls.
- `AgentMemoryFact.embedding` uses a `Bytes?` placeholder; the actual pgvector column is added in the migration, not expressible in vanilla Prisma types.
- `AgentRun.assembledPrompt` and `rawResponse` are truncated snapshots (first N chars) for audit. Full payloads live in R2 if needed.
- `HITLGate.slaMinutes` lets PA prioritise time-sensitive gates.
- `AgentBudget` is monthly-keyed so historic budgets remain queryable.
- `AuditLog` is append-only. Enforced at the service layer, not by DB.
- **Versioning is denormalised onto `Job`, `AgentRun` and `AgentReview`** so historical slices remain valid after a version bump. `AgentVersionSnapshot` lets us reconstruct exactly what an agent looked like at any past moment.
- **The wrapper is not optional.** Every call site that touches an LLM goes through `executeJob()` in the service layer. There is no back door. Direct SDK calls are a lint failure.

---

## 20. Failure Handling

Per-agent retry policy stored in `Agent.permissions` (or a dedicated `Agent.policy` JSON field, decision noted below). Default:

- Transient errors (network, model 5xx, rate limit): retry up to 3 times with exponential backoff (2s, 8s, 32s).
- Model refusal or safety block: no retry, escalate.
- Permission error: no retry, fail hard, `AuditLog` entry.
- Quality gate reject at QA: not a failure, workflow branches to Copywriter with delegate_back guidance.
- Cost cap hit mid-Job: pause Job, HITL to Cam.

Escalation flow:

```
[Job fails, retries exhausted]
       |
       v
[Automation Manager receives event]
       |
       |-- can it be replanned? (e.g. swap to a cheaper model, split into smaller Jobs)
       |
       v
[If replan possible: create replacement Job with new plan]
[If not: create HITLGate type=decide, options=[retry_manually, skip, abandon_workflow]]
       |
       v
[If unrecoverable: AgentAlert severity=critical, ackRequired=true, PA notifies immediately]
```

**Open decision:** where the retry / escalation policy lives. Options: (a) a `policy` JSON field on `Agent`, (b) a separate `AgentPolicy` model with versioning, (c) code constants per agent. Default recommendation: **(a) for v1, migrate to (b) if we start versioning policies.**

---

## 21. Committed Build Sequence

This is the committed plan. Anything not on this list waits.

### 21.1 Week 1

- **Agency Architecture V1 doc** (this document) approved
- **Infrastructure V1**: Prisma migrations for `Agent`, `AgentVersionSnapshot`, `Job` (renamed to `AgentJob` in code if clearer), `AgentRun`, `AgentReview`, `HITLGate`, `AgentBudget`, `ModelPricing`, `AuditLog`, plus the universal execution wrapper (`executeJob()`) enforcing the Wrapper Principle from section 0.1
- **QA + Brand Guardian**: skill files, RAG wiring, end-to-end run through the wrapper

### 21.2 Week 2

- **Chief of Staff**: system with initiatives memory, morning brief composer
- **Content Ops V1**: cron gap analysis, angle recommendation, workflow spin

### 21.3 Week 3

- **Researcher, Writer, Editor, Fact Checker** (workers)
- **Automation Manager** (system, watches Job stream, retries, escalations, nightly AgentQualityStat compute)

### 21.4 After the seven-person system

- Expert Bench specialists (NHS Services, Pharmacy Technology, Regulation, Private Services, Pharmacy Business, Clinical/Medicines, Policy/Advocacy)
- PA refinement toward voice
- Smarter routing (learned dispatch, not rule-based)
- Model and prompt optimisation driven by AgentReview slices

### 21.5 Hard constraint

> **No new agents beyond the Week 1-3 list until the seven-person system is observable, interruptible, measurable, improvable, and trusted.**

Observable: every Job visible in the admin view with cost, versions, outcome.
Interruptible: any running workflow can be paused and inspected via HITL.
Measurable: AgentReview populated for every reviewed Job, cost-per-usable computed.
Improvable: a prompt bump ships as a new `prompt_version`, its stats read against the previous version.
Trusted: Cam has run at least one full workflow per agent to completion and would send the output.

Adding an eighth agent before all five conditions hold makes the org harder to reason about, not easier.

### 21.6 Prerequisite risks

| Prerequisite | Needed for | Status | Risk if missing |
|---|---|---|---|
| Metricool API sync (read) | Content Ops gap analysis | In flight | Content Ops slips into Week 3 |
| ER tier data | Content Ops angle recommendation | In flight | Content Ops recommends blind |
| Notion write scope | Recommendation delivery surface | Exists | None |
| R2 bucket for snapshots | Audit at scale | Exists | None |
| pgvector on Postgres | RAG memory + review embeddings | Needs migration | Slips RAG until Week 2 |
| ModelPricing seed | Any cost tracking | Trivial | None |
| Cam hourly rate constant | Cost-per-usable computation | Trivial | Report defaults to a placeholder until set |

---

## 21A. Claude Code Routines: Integration Boundary

Anthropic ships **Routines**: packaged prompts + repos + connectors that can be scheduled and executed as first-class runnables. This is adjacent to what Studio OS does but not a substitute.

**Rule:** do not architect Studio OS around Routines. Studio OS is the system of record. But keep the integration boundary clean so a Routine can be invoked from a Studio OS workflow if it turns out to be the better tool for a given step.

Concrete boundary:

- A Routine invocation is a `Job` like any other. `executing_agent` is `routine:<slug>`. The wrapper still records `input_tokens`, `output_tokens`, `cost_gbp`, `duration_ms`.
- Routine outputs flow back into the Job's `output_payload` as structured data (JSON or markdown) so downstream steps consume them like any other agent output.
- Routines never bypass HITL. A published Routine artefact still requires an approval gate if it would trigger any HITL rule in section 11.
- Routines never talk to Studio OS Prisma directly. If a Routine needs client context, it comes in via the Job payload. If it needs to write, it writes into its `output_payload` and a Studio OS agent persists.

Result: if a Routine is genuinely the best worker for a step later, we swap it in without rewriting the workflow. Until then, Studio OS-native workers cover everything.

---

## 22. Multi-Client Considerations

v1 implements Titan only. All infrastructure is client-scoped from day one so that adding ABF / Puri / Pharmappy / Monissa in month 2-3 is a matter of:

1. Creating a `Client` row and its `Brand` rows.
2. Populating `TITAN/_context/<client>/` with brand rules, voice guide, transcripts.
3. Creating client-specific `AgentBudget` rows.
4. Defining or reusing `WorkflowTemplate` rows appropriate to the client.
5. Configuring the approval chain.

No agent code should reference "titan" by name. Client and brand come in via the Job payload and drive RAG collection selection at runtime.

If a workflow template needs to differ materially between clients (e.g. NHS-heavy angle for Titan, pharmacist-facing angle for a hypothetical prescriber client), create a new template rather than branching inside one. Templates are cheap.

---

## 23. Decisions Cam Should Red-Pen

Places where a reasonable-alternative decision was made. Flagging so Cam can override.

1. **Agent memory storage.** Chose Prisma `AgentMemoryFact` table with git-exported snapshots. Alternative: JSON files as source of truth. Prisma wins on queryability and audit; file wins on inspectability. Decision: **Prisma with export**.
2. **Job vs AgentRun split.** `Job` is the workflow-visible atom, `AgentRun` is the LLM-call granularity. `AgentReview` attaches at either level. Decision: **split, review can hang off either**.
3. **AgentReview vs review columns on Job.** Chose a separate `AgentReview` table so multiple reviews or re-reviews of the same run remain valid history. Decision: **separate table**.
4. **Retry policy location.** Chose `Agent.policy` JSON field for v1. Alternative: separate `AgentPolicy` model with versioning. Decision: **JSON now, promote to model if versioning becomes necessary**.
5. **Async-only inter-agent comms.** No direct function calls, everything via Job records. Trade-off: latency. Decision: **async only**.
6. **QA + Fact Checker parallelism.** Fact Checker parallel to Editor, combined into QA. Costs one extra Job per workflow. Decision: **parallel**.
7. **Brand as separate model.** First-class model under `Client` for RAG scoping and cadence rule complexity. Decision: **separate model**.
8. **HITL SLA field.** Added `slaMinutes` to `HITLGate`. Optional. Decision: **include**.
9. **Cost cap enforcement point.** Pre-Job estimation using rolling averages. Decision: **pre-Job**, add mid-Job hard cap only if a workflow burns unexpectedly.
10. **Morning brief composition.** PA reads from Recommendation + AgentAlert + HITLGate + calendar. Brief is a projection, not a persisted table. Snapshots to R2 if Cam wants historical briefs.
11. **Skill file location.** `TITAN/_skills/<agent-name>/SKILL.md` is source, Claude Code skills dir is a mirror.
12. **Versioning granularity.** Chose four independent version axes on Job (`agent_version`, `prompt_version`, `knowledge_version`, `workflow_version`) rather than a single bundled `snapshot_version`. Alternative: one bundled version. Independent axes let us slice: "did the model bump help or hurt?" separately from "did the prompt bump help or hurt?". Decision: **four axes**.
13. **Version bump policy.** Semver on prompts and agents. Knowledge version is a content hash of the RAG manifest. Workflow version is semver on the template. Decision: **semver where human-authored, hash where derived**.
14. **Cam hourly rate.** Configurable constant, not persisted per-review. Kept in a config table adjacent to `ModelPricing`. Decision: **config, not per-row**. If the rate changes materially, historic cost-per-usable is recomputable on demand.
15. **Job renaming.** Considered renaming `Job` to `AgentJob` in code (as Cam wrote in the additions) to avoid clashing with the generic term "job". Decision: **use `AgentJob` at the Prisma model name, keep "Job" as the conceptual term in this doc**. Migrate if the name collision bites.

---

## 24. Appendix A: v1 Agent Registry

Seed data for the `Agent` table when infrastructure ships.

| Name | Department | Kind | Model | Notes |
|---|---|---|---|---|
| `dispatch` | Interface | system | claude-haiku-4-5 | Router; upgraded from Cowork skill wiring |
| `chief-of-staff` | Operations | system | claude-sonnet-4-5 | Initiatives, morning brief composition |
| `operations` | Operations | system | claude-sonnet-4-5 | Cost, quality, rebalancing |
| `automation-manager` | Operations | system | claude-haiku-4-5 | Watches Job stream, retries, escalations |
| `content-ops` | Content | system | claude-sonnet-4-5 | Gap analysis, workflow spin |
| `researcher` | Strategy | worker | claude-sonnet-4-5 | Contextual scans |
| `strategist` | Strategy | worker | claude-sonnet-4-5 | Angle briefs |
| `copywriter` | Content | worker | claude-sonnet-4-5 | Hooks + drafts |
| `editorial-writer` | Content | worker | claude-sonnet-4-5 | Long-form pieces |
| `editor` | Content | worker | claude-sonnet-4-5 | Voice + structural polish |
| `creative-director` | Creative | worker | claude-sonnet-4-5 | Visual direction, moodboards |
| `brand-guardian` | Quality | worker | claude-sonnet-4-5 | Brand rule compliance |
| `qa-critic` | Quality | worker | claude-sonnet-4-5 | Combined QA (may absorb brand-guardian later) |
| `fact-checker` | Quality | worker | claude-sonnet-4-5 | Claim verification |
| `expert-nhs-services` | Strategy | worker | claude-sonnet-4-5 | Expert bench flag = true |
| `expert-pharmacy-technology` | Strategy | worker | claude-sonnet-4-5 | Expert bench |
| `expert-regulation` | Strategy | worker | claude-sonnet-4-5 | Expert bench |
| `expert-private-services` | Strategy | worker | claude-sonnet-4-5 | Expert bench |
| `expert-pharmacy-business` | Strategy | worker | claude-sonnet-4-5 | Expert bench |
| `expert-clinical-medicines` | Strategy | worker | claude-sonnet-4-5 | Expert bench |
| `expert-policy-advocacy` | Strategy | worker | claude-sonnet-4-5 | Expert bench |

**Open decision:** whether `qa-critic` and `brand-guardian` should be one agent or two. Two is cleaner conceptually; one is cheaper per workflow. v1 recommendation: **build both, run in sequence (Brand Guardian then QA), merge later if the split isn't earning its keep.** Reflected in the workflow in section 17.

---

## 25. Appendix B: Non-Goals for v1

Explicit list so scope does not creep.

- Multi-user auth (Cam-only for v1)
- Fine-grained SSO
- Native voice PA
- Auto-publishing to any surface
- Auto-spending on any subscription or third-party tool
- Cross-client workflows
- Agent-to-agent negotiation (agents don't argue)
- Long-term forecasting / capacity planning (Ops answers "what happened", not "what will happen" in v1)
- A UI for editing WorkflowTemplates (edit JSON directly for now)
- A UI for editing Agent skill files (edit in repo for now)

---

## 26. Appendix C: Terms Reserved for Later Versions

Named now so we don't accidentally reuse them.

- **Squad** — a temporarily grouped set of agents for a specific initiative, will land in v2.
- **Playbook** — a client-specific bundle of preferred workflows, will land in v2.
- **Reflection** — an agent's post-run self-critique, will land in v2 once quality data is rich enough to compare.
- **Contract** — a formal input/output schema for a Job type, currently free-form JSON. Will land in v2 once patterns settle.

---

*End of spec.*
