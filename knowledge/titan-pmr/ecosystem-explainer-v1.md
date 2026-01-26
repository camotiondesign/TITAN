---
doc_type: "product_explainer"
product: "Titan PMR"
scope: "PMR only, no Titanverse"
version: "v1.0"
owner: "cam"
---

# Titan PMR – Ecosystem Explainer (Internal)

<!-- SECTION: OVERVIEW -->
## 1. What Titan PMR is

Titan PMR is a digital-first pharmacy management system built around:
	•	Barcode-driven workflows
	•	AI-assisted clinical checks
	•	Kanban-style prescription tracking

It is designed to replace legacy, paper-heavy PMRs and act as the operational engine room for:
	•	Day-to-day dispensing
	•	Repeat prescription management
	•	High-volume batch work
	•	Patient communication around medicines

The core design intent is simple:

Move routine work and admin into the system and the team, so pharmacists can focus on clinical decisions and services rather than stamping paperwork and chasing prescriptions.

⸻

<!-- SECTION: WORKFLOW_LIFECYCLE -->
# 2. The end-to-end lifecycle of a prescription

At a high level, a prescription in Titan PMR goes through the following stages:
	1.	Arrival and ingestion
	2.	AI clinical check
	3.	Workflow triage and routing
	4.	Picking and barcode validation
	5.	Labelling, assembly and second check
	6.	Bagging, shelving and collection or delivery
	7.	Governance and audit trail
	8.	Reporting and insight

For repeat prescriptions, the front of this journey is driven by Repeat Flow. For high-volume sites, the picking and assembly stages are heavily optimised through Batch Flow and robots.

Below we go through each stage in detail, then explain the specialist modules and safety architecture.

⸻

<!-- SECTION: WORKFLOW_STAGES -->
# 3. Stage by stage: how Titan PMR actually works

## 3.1 Arrival and ingestion

What happens
	•	Prescriptions arrive digitally through EPS or eRD.
	•	There is no reliance on printed tokens for the core flow.
	•	Titan ingests each prescription into a Kanban-style board that shows the status and priority of each item or patient.

Why it matters

Legacy systems tend to hide work in lists, piles or print-outs. Titan instead presents work as a visual board, so the team can see:
	•	How much is waiting
	•	What is urgent
	•	Where items are stuck

This is the foundation for everything that follows.

For repeat prescriptions, requests can also originate from Repeat Flow, which automatically triggers orders to surgeries based on patient schedules.

⸻

## 3.2 AI clinical check (Titan AI)

What happens
	•	As prescriptions land, Titan AI runs a structured, multi-point clinical check.
	•	It looks at factors such as dose, interactions and obvious clinical anomalies.
	•	For the majority of routine items, Titan AI can auto-clear them according to configured rules.
	•	Any complex, ambiguous or higher-risk cases are held for pharmacist review.

Why it matters

In most legacy PMRs, pharmacists are the bottleneck because they must manually check everything, even low-risk repeats. Titan AI changes this pattern:
	•	Routine items move through at system speed.
	•	Pharmacists concentrate on the top risk cases rather than the whole pile.
	•	Checking becomes more consistent, because the AI does not get tired or distracted.

This stage is not about removing the pharmacist. It is about reallocating their attention.

⸻

## 3.3 Workflow triage and routing

What happens

Once safety checks are complete or queued:
	•	Items are pushed into different workflow modes:
	•	Batch Flow for high-volume bulk picking
	•	Single-patient flow for more straightforward or ad hoc work
	•	The system applies prioritisation:
	•	Same-day items
	•	Deliveries
	•	Care homes
	•	MDS
	•	Walk-ins
	•	Repeat Flow drives the repeat journey:
	•	Creates structured requests to GP surgeries
	•	Applies surgery-specific rules
	•	Tracks whether all requested items were returned
	•	Flags missing items or changes in dose as exceptions

The workflow engine also tracks stock position, so items do not drift through the system when they cannot be supplied.

Why it matters

In many pharmacies, this logic lives in someone's head and in piles of paper boxes. If that person is off sick, the whole process collapses.

Titan PMR:
	•	Makes this logic visible and shared
	•	Reduces reliance on one person's memory
	•	Ensures repeats, owings and priorities are handled systematically, not reactively

⸻

## 3.4 Picking and barcode validation

What happens

In the picking stage, Titan PMR and its modules control how medicines move from the shelf to the bag.

Key elements:
	•	Batch Flow can generate bulk pick lists so staff can:
	•	Pick one product for many patients in a single shelf run
	•	Then use barcodes to redistribute those packs back to individual patients
	•	Whether using Batch Flow, robots, or traditional picking, every item is:
	•	Barcode scanned
	•	Matched against the prescription for product, strength, form and quantity
	•	Robot integrations (for example Meditech) receive instructions from Titan, but barcode validation still happens in Titan on the way out, so safety and audit are preserved.

Why it matters

Two big problems in traditional dispensing are:
	•	A lot of unnecessary walking and searching
	•	Selection errors when the wrong item or strength is pulled

Batch Flow and barcode validation:
	•	Cut down physical movement and mental load
	•	Reduce selection errors by enforcing a scan rather than relying on visual checks
	•	Enable high-volume workflows without sacrificing safety

⸻

## 3.5 Labelling, assembly and second check

What happens
	•	Once items are picked and validated, labels are printed.
	•	Items are assembled into patient bags.
	•	For each stage, Titan records:
	•	Who did it
	•	When they did it
	•	What items were involved

This forms a complete audit trail for each prescription.

Why it matters

In legacy systems, it is often unclear who assembled or labelled a prescription, especially if multiple people share a workstation. When something goes wrong, it is difficult to trace.

Titan PMR:
	•	Provides clear accountability for each action
	•	Reduces disputes and guesswork when investigating incidents
	•	Makes process issues visible, not hidden

⸻

## 3.6 Bagging, shelving and collection or delivery

What happens

Once a prescription is assembled:
	•	The bag is assigned to a locationed shelf system such as A1, B3, C7.
	•	Titan records that location against the patient and prescription.
	•	Titan Mobile is used to:
	•	Scan the bag and confirm shelf placement
	•	Trigger SMS or app notifications with unique collection codes when items are ready
	•	At the point of collection or delivery:
	•	Staff or drivers search for the patient in Titan or Titan Mobile
	•	The system displays exact bag location and status
	•	Collection or delivery is recorded to close out the episode

Why it matters

In many pharmacies, collection is where the day visibly falls apart:
	•	Staff rummage through shelves
	•	Bags go missing
	•	Patients turn up before items are ready
	•	Repeated trips and complaints multiply

Titan's location and notification model:
	•	Removes shelf chaos
	•	Reduces inbound phone calls
	•	Cuts multiple wasted patient visits

⸻

## 3.7 Governance and audit trail

What happens

Behind the scenes, Titan continuously builds an audit trail.

This includes:
	•	Per-step logs for:
	•	Creation
	•	Clinical check
	•	Labelling
	•	Assembly
	•	Hand-out or delivery
	•	Barcode auditability:
	•	Which exact pack was scanned for which script
	•	CD register entries:
	•	Controlled drug movements recorded digitally
	•	Expiry checks:
	•	Stock audits and expiry logs carried out through Titan Mobile
	•	RBAC (Role Based Access Control):
	•	Users see and can perform only what their role allows
	•	Actions are tied to user identity and role

Why it matters

Pharmacies operate under intense regulatory and clinical governance scrutiny. When something goes wrong, the question is not only what happened, but whether there was a safe system of work.

Titan PMR gives pharmacies:
	•	Evidence that safe systems are in place
	•	Traceability for individual incidents
	•	Visibility of repeated process issues that need fixing

⸻

## 3.8 Reporting and insight

What happens

All of the above generates data that Titan can turn into:
	•	Operational metrics
	•	Items dispensed
	•	Turnaround times
	•	Backlogs
	•	AI clear rates
	•	Accuracy and safety metrics
	•	Near misses
	•	Errors intercepted by barcode or AI
	•	Workflow metrics
	•	Repeat success rates and failures
	•	Owings and stock gaps
	•	Staff workload distribution

In wider plans, this data is also used to feed dashboards and inform decisions on staffing, process changes and, at a higher level, the move from pure dispensing to more clinical work.

Why it matters

Without usable data, most process changes in pharmacy are based on gut feeling. Titan PMR's design allows:
	•	Measurement of improvement, not just anecdote
	•	Identification of bottlenecks before they become crises
	•	Evidence to support investment decisions and new models such as hub and spoke

⸻

<!-- SECTION: MODULES -->
# 4. Key modules in the Titan PMR ecosystem

The stages above describe the core workflow. On top of that sit several important modules that give Titan PMR its character.

<!-- SECTION: MODULE_TITAN_AI -->
## 4.1 Titan AI

Titan AI is the clinical checking assistant embedded in Titan PMR.

Core roles:
	•	Run structured multi-point checks on prescriptions at scale.
	•	Auto-clear routine items under configured rules.
	•	Escalate exceptions and ambiguous cases to pharmacists.
	•	Support paperless workflows, since all checks and outcomes are digital and auditable.

The intent is not to make decisions in isolation but to standardise and accelerate checking, so pharmacists can concentrate on cases where their judgement adds the most value.

⸻

<!-- SECTION: MODULE_REPEAT_FLOW -->
## 4.2 Repeat Flow

Repeat Flow is Titan's repeat prescription management engine.

It:
	•	Maintains a central board for repeat requests, so the team sees status at a glance.
	•	Automates ordering to surgeries, following each surgery's preferred process.
	•	Tracks which items were requested and which were returned, identifying missing or changed items.
	•	Manages chasing and exception handling, reducing manual calls.
	•	Drops approved repeats directly into dispensing queues such as Batch Flow.

The effect is a shift from:

Box files, B-side slips and chasing by phone

to

A visible, digital, closed loop that starts and ends inside Titan.

⸻

<!-- SECTION: MODULE_BATCH_FLOW -->
## 4.3 Batch Flow

Batch Flow is the high-volume dispensing mode.

Designed for:
	•	MDS
	•	Large community sites
	•	Hub pharmacies
	•	Robot-enabled workflows

It allows:
	•	Bulk picking: one product, many patients, one shelf run.
	•	Clear pod and conveyor-style flows for big volumes.
	•	Tight integration with robots where present.
	•	Ongoing enforcement of barcode validation, even at scale.

The goal is to ensure that scale does not come at the cost of accuracy or staff burnout.

⸻

<!-- SECTION: MODULE_TITAN_MOBILE -->
## 4.4 Titan Mobile

Titan Mobile brings Titan into the hands of staff on the shop floor, in the stockroom and on the road.

Typical uses:
	•	Scanning bags to a shelf location.
	•	Triggering and managing collection notifications.
	•	Handling deliveries, including proof of delivery records.
	•	Capturing electronic signatures for prescriptions and services.
	•	Carrying out stock audits and CD register entries.

Instead of everything being tied to a back-office PC, the workflow moves around the pharmacy, which removes friction and makes it easier to keep data accurate.

⸻

## 4.5 Mail and communications

Titan includes a communications layer around prescriptions and services.

This covers:
	•	SMS and notification flows such as:
	•	Medicines ready
	•	Follow-up prompts
	•	Email ingestion (often referred to internally as Titan Mail):
	•	Prescriber sends a private prescription or clinical note by email
	•	Email is brought into Titan and converted into a structured item in the workflow
	•	Attachments such as PDFs or discharge letters are linked to the patient record

The aim is to pull communication into the same system that handles dispensing, rather than leaving critical information trapped in separate inboxes or on paper.

⸻

## 4.6 Integrations and Marketplace

Titan PMR is designed to act as a hub, not a sealed box.

Key integration types:
	•	Robots
	•	Titan sends pick instructions
	•	Robot returns items that still go through Titan's safety checks and workflows
	•	Delivery and logistics
	•	Delivery runs and status updates driven by Titan data
	•	Wider digital tools and services
	•	Payment, booking or clinical tools that sit alongside Titan and Titanverse

The Marketplace concept is to make these integrations pluggable, so pharmacies do not end up with fragile, one-off bodges.

⸻

## 4.7 Relationship to Titanverse

Titanverse is not part of Titan PMR itself. It is the services layer that sits around it.

In simple terms:
	•	Titan PMR is for dispensing, repeats, stock and core workflow.
	•	Titanverse is for consultations, prescribing, clinical templates, AI documentation and service reporting.

Data flows between the two, but they solve different problems. This distinction is important in both product and messaging.

⸻

<!-- SECTION: SAFETY_ARCHITECTURE -->
# 5. Safety architecture in practice

Titan's safety model rests on four pillars.
	1.	Barcode-first workflow
Every item is scanned and checked against the prescription before it can move on. This significantly reduces wrong-item and wrong-strength errors.
	2.	AI-assisted clinical checking
A structured set of checks runs automatically. Routine items are cleared at speed, while anything unusual is held back for a pharmacist.
	3.	Strict process enforcement
Staff cannot simply skip stages without leaving a trace. This reduces the shortcuts and informal workarounds that lead to near misses.
	4.	Audit and traceability
Every step is logged, including who did what and which pack was scanned. That allows both incident investigation and learning.

Together these move the pharmacy from relying on individual heroics to relying on designed, observable systems.

⸻

<!-- SECTION: AUTOMATION_VS_PHARMACIST -->
# 6. What is automated and what is still pharmacist work

Automated or handled by team plus system
	•	Ingestion and routing of EPS prescriptions
	•	The majority of routine clinical checks, under Titan AI rules
	•	Repeat ordering and reconciling via Repeat Flow
	•	Barcode validation and batch processing
	•	Routine notifications and communication
	•	Basic audit logging for workflow steps

Still pharmacist-led
	•	Complex or ambiguous clinical decisions flagged by Titan AI
	•	Clinical services and prescribing decisions
	•	Final responsibility for safe supply and governance
	•	Local decisions on unusual doses, off-label use or guideline conflicts

The design intent is that most low-risk, repetitive work is handled by the system and team, while pharmacists focus on the small percentage of work where their training actually changes outcomes.

⸻

<!-- SECTION: LEGACY_PROBLEMS -->
# 7. Problems from legacy PMRs that Titan is built to fix

Summarising the main pain points that Titan targets:
	•	Paper everywhere
Replaced by digital boards and records.
	•	No clear view of work in progress
Replaced by Kanban-style status boards and filters.
	•	Manual, inconsistent checking
Replaced by AI checks and enforced barcode validation.
	•	Weak audit trails
Replaced by detailed per-action logs.
	•	Chaotic repeat management
Replaced by Repeat Flow's structured, automated loop.
	•	Poor fit for robots and high-volume models
Replaced by Batch Flow and clear integration patterns.
	•	Pharmacists trapped at the checking bench
Replaced by a model where they focus on complex cases and clinical services.

⸻

<!-- SECTION: KEY_TAKEAWAYS -->
# 8. What someone new should take away

If someone new to Titan PMR reads this document, they should leave with a clear mental picture:
	•	Titan PMR is the core dispensing operating system, not just another PMR screen.
	•	Prescriptions move through a logical, visible pipeline, from arrival to collection.
	•	Safety is built on AI checks plus barcode validation plus auditability.
	•	Repeat Flow, Batch Flow, Mobile and communications sit on top of the core to handle the parts of pharmacy life that normally create chaos.
	•	Titan is meant to be the backbone of modern dispensing, with Titanverse and external tools building on top.
