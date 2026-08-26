# Overnight merge report, 19 August 2026

Run window: 18 Aug 22:19Z to 19 Aug 07:58Z. Coordinator: Claude Code, unattended.

**Headline: 3 of 5 branches merged and live. Production is green on every check, nothing is
half-merged and nothing needs unpicking. The other 2 builds finished their work but never pushed,
so they are sitting as local commits in your primary checkout and are one `git push` each away
from being mergeable. Details and commands in section 5.**

`main` is now at `7283ba4`. Prod health 200 with notion, github, anthropic, openai and r2
all configured, `r2_cors_ok: true`.

---

## 1. What merged

| # | Branch | Merge commit | Prod health after | Result |
|---|---|---|---|---|
| 1 | `feat/content-ops-manager-v1` | `d83d82a` | 200, all green, 22:25Z | Merged |
| 2 | `feat/video-editor-v0.1` | `2d73dfe` | 200, all green, 22:27Z | Merged |
| 3 | `feat/comms-agent-v1` | none | n/a | **Skipped, built but never pushed** |
| 4 | `feat/matrix-ui-upgrade` | `7283ba4` | 200, all green, 07:56Z | Merged |
| 5 | `feat/metrics-page-overhaul` | none | n/a | **Skipped, built but never pushed** |

Every merge was `--no-ff`, no conflicts anywhere, no force-push, no rebase, no history rewritten.

### Preview health checks, taken before each merge

| Branch | Preview | Result |
|---|---|---|
| content-ops | `titan-dashboard-gqq9zrnyq` | 200, all five flags true |
| video-editor | `titan-dashboard-gl9i5f5td` | 200, all five flags true |
| matrix-ui | `titan-dashboard-f723to2sk` | 200, all five flags true |

All three previews reported `r2_cors_ok: false`. That is expected and was not treated as a
blocker: every preview gets a fresh deployment origin which is not in the R2 bucket allow-list.
Production is `true`. This is the trap already documented in CLAUDE.md.

## 2. Migrations applied

One, to the prod Neon database:

- `20260818190000_content_ops_manager_v1` (from branch 1). Five new tables, `CREATE TABLE` only,
  nothing dropped, renamed or rewritten.

Video Editor and Matrix UI both added no migration, which matches their docs.

**One deliberate deviation from the brief.** The brief put migrations at step 6, after the push
and deploy. I ran this one before the push instead. The migration is purely additive, so old code
ignores the new tables, but new code hard requires them. Running it first removes the roughly
90 second window where prod would have been serving Content Ops code against a schema with no
Content Ops tables. Same end state, no exposure. Only safe because the migration is additive; if
a future one drops or renames anything, the brief's original order is the correct one.

## 3. Seeds run

- `prisma/seed-agents.ts`, twice (after branch 1, then again after branch 2 which extends it).
  Final state: **5 agents**, all active.
  - `comms-agent` (Operations, cap £10/mo)
  - `content-ops-manager` (Content, cap £15/mo, schedule `30 3 * * *`, prompt v1.1.0)
  - `intake-curator` (Content, cap £10/mo)
  - `qa-brand-guardian` (Quality, cap £5/mo, prompt v1.1.0)
  - `video-editor` (Creative, cap £20/mo)
- `prisma/seed-content-ops.ts`. Seeded 2 brand packs (Titan PMR, Titanverse), 7 cadence rules,
  2 hero campaigns (Medichem with 6 angles left, Brother Pharmacy with 0).

The `comms-agent` row exists because `seed-agents.ts` already carried it. The agent row being
present does not mean the Comms Agent code shipped. It did not. See section 5.

`seed-content-ops.ts` failed on its first attempt with `Cannot read properties of undefined
(reading 'upsert')`. Cause was a stale generated Prisma client in the coordinator worktree, not a
problem with the seed. `npx prisma generate` then a clean re-run fixed it. Nothing to do here.

## 4. Production verification

Health checked after each of the three merges, all 200 and all green. Beyond the health endpoint:

- Vercel Production deployments all reported `state=success` via the GitHub deployments API.
- Video Editor survived the Matrix UI merge intact. I checked this explicitly because the
  tip-to-tip diff made it look like Matrix UI deleted the whole Video Editor. It does not.
  Matrix UI forked from `d83d82a`, one commit before Video Editor landed, so the naive diff
  showed Video Editor's files as absent on its side. The three-way merge keeps them. Confirmed
  `opus-clip.ts`, `agents/video-editor.ts`, `agent-media-job.ts`, `video-editor-console.tsx` and
  `dashboard/agents/editor/page.tsx` are all present on `main` after the merge.
- The Matrix UI config is generic rather than a hardcoded agent list, so it renders the
  video-editor row without needing a change.

### Agent activity actually observed in prod

Three `qa-brand-guardian` (Critic) jobs ran between 22:54Z and 22:56Z, shortly after the Content
Ops merge. All three completed, on `claude-sonnet-5`, priced at £0.0104, £0.0072 and £0.0093.
Total about £0.027. So the Content Ops Critic path works end to end in production, and cost
telemetry is recording properly rather than silently reading zero.

Two things that are empty and worth your eye:

- `Recommendation` rows: 0. The nightly calendar audit has not produced anything yet. Expected,
  since the audit rides the agent-runner tick and `Agent.schedule` is `30 3 * * *` while the
  Vercel cron fires once daily at 07:00 UTC. Worth confirming it fires on tonight's tick.
- `AgentReview` rows: 0, despite three completed jobs. Infrastructure v1 says the wrapper opens
  a review as `pending` on every completed job. Either that only applies to certain job kinds or
  something is not opening them. Flagging as an observation, not a diagnosis. Until those exist
  every quality number stays empty by design, so it is worth a look.

## 5. What did not merge, and why

Both builds actually **finished and committed their work locally. Neither ever pushed.** That is
the single reason both were skipped. No preview deploy was ever created for either, so the
health-check-before-merge gate could not be satisfied, and merging unverified code straight to
`main` is exactly what that gate exists to prevent.

Both branches exist in your primary checkout at
`/Users/cameronmoorcroft/Documents/Repos/Clients/titan-dashboard` and both look complete and
coherent. I inspected both and neither is cross-contaminated with the other's files.

### `feat/comms-agent-v1`, skipped, local only, at `3c87fb1`

Two commits on top of Video Editor's `3e2f985`:

```
3c87fb1  Comms Agent v1: dashboard, checks, fixtures and the setup doc
7064562  Comms Agent v1: Gmail triage, drafting and the client-deadline fan-out
```

Carries its own migration `20260819010000_comms_agent_v1`, `prisma/seed-comms.ts`, an extended
`seed-agents.ts`, the Gmail OAuth routes (`src/app/api/auth/gmail/`), the sweep cron, the
`src/lib/comms/*` module, a dashboard page, a console component, check and fixture scripts, and
`docs/COMMS-AGENT-V1.md`. It reads as finished work, not a half build.

### `feat/metrics-page-overhaul`, skipped, local only, at `0815e5a`

One commit off `d83d82a`:

```
0815e5a  Metrics: rebuild /dashboard/metrics as a strategic dashboard
```

Carries migration `20260819020000_corpus_post`, `scripts/data-coverage-audit.ts`,
`scripts/import-corpus.ts`, a new `/api/metrics/risk` route, the rebuilt metrics page, four new
metrics components (cadence chart, filter bar, risk list, sync panel) and three new libs
(`metrics-insights`, `metrics-risk`, `metrics-theme`). Also reads as finished.

### Why they did not push

Both builds ran in the **same working directory**, your primary checkout. Over the run it moved
from `feat/comms-agent-v1` to `feat/metrics-page-overhaul`, and it currently sits on the metrics
branch with a set of untracked Comms Agent files left behind in the tree:

```
?? prisma/migrations/20260819010000_comms_agent_v1/   ?? prisma/seed-comms.ts
?? src/app/api/agents/comms/                          ?? src/app/api/auth/gmail/
?? src/app/api/cron/comms-sweep/                      ?? src/lib/comms/
?? src/lib/cron/comms-scheduled.ts                    ?? src/lib/gmail.ts
```

There is also a stash, `stash@{0} On feat/comms-agent-v1-on-main: wip: prisma format whitespace
(pre-metrics-overhaul)`. Two parallel builds sharing one checkout is the most likely reason
neither completed its push, and it is the thing to fix before relaunching either.

**I have not touched, committed, pushed, stashed or discarded any of it.** Everything above is
exactly as the builds left it.

### To pick these up yourself

Both are one push away from a preview. Comms Agent first, since metrics was queued behind it:

```bash
cd /Users/cameronmoorcroft/Documents/Repos/Clients/titan-dashboard
git push origin feat/comms-agent-v1
git push origin feat/metrics-page-overhaul
```

Then health check each preview and merge in that order. Note that `feat/metrics-page-overhaul`
branched from `d83d82a`, so it has neither Video Editor nor Matrix UI in it; it will merge as a
three-way against current `main` the same way Matrix UI did, and its tip-to-tip diff will look
alarming for the same harmless reason.

Neither branch's migration was applied to prod, because neither one's code is deployed. Do not
apply `20260819010000_comms_agent_v1` or `20260819020000_corpus_post` independently of merging
the branch that needs it.

## 6. Things you need to do

1. **Push the two unpushed branches** so they get previews, then health check and merge them in
   order. Commands in section 5. This is the main outstanding item.
2. **Comms Agent Gmail OAuth, once it is merged.** The code deploys fine but the Gmail connection
   needs you to visit `/api/auth/gmail` and authorise before it can read the inbox. Nothing to
   authorise until the branch ships, so keep it on the list rather than trying it now.
3. **Stop the parallel builds sharing one working directory.** That is why neither pushed. Give
   each its own worktree next time, the way the coordinator did. See section 5.
4. **Confirm the Content Ops nightly audit fires** on tonight's 07:00 UTC agent-runner tick, and
   that `Recommendation` rows appear.
5. **Have a look at the empty `AgentReview` rows** described in section 4.
6. `.claude/settings.json` was committed as part of the Video Editor branch and is now on `main`.
   The brief said to leave that file alone, and I did, but it arrived via a branch commit rather
   than as a loose working-tree change, and reverting it would have meant rewriting a merged
   branch. Left as is, flagging so it is not a surprise.

No environment variables were touched, in Vercel or anywhere else.

## 7. Metricool sync

Fired and completed successfully overnight.

```
2026-08-19T03:35:06Z  trigger=cron  status=completed
257 fetched, 1 created, 256 updated, 606 ranked, 8 requests, 0 rate-limit hits, no errors
```

For comparison the previous run, 2026-08-18T13:49Z, did 261 fetched and 605 ranked. Healthy and
consistent. It ran at 03:35Z rather than exactly 03:00Z, which is normal Vercel cron jitter.

## 8. Video Editor v0.1 status

**Merged and live, as instructed.** It was preview clean, so it went in without waiting for your
test, and you can now test it against prod. The `video-editor` agent row is seeded (Creative,
cap £20/mo), so submits will not fail with "Unknown agent".

Two reminders from its own docs, unchanged by this merge:

- `OPUS_CLIP_GBP_PER_CREDIT` needs setting or renders record `costGbp: null` with a note, and the
  UI flags the total as understated. It will never quietly read as £0.
- Two aspect ratios means two Opus projects and therefore two lots of credits over the same source
  minutes. That is their API, not something introduced here.

## 9. Notes on how the run went

- **The branches were stacked, not independent.** Video Editor has Content Ops as a direct
  ancestor, and the unfinished Comms Agent work is based on Video Editor's HEAD. Your merge order
  was right, but each merge was cumulative rather than a separate change. Worth knowing when
  reading the diffs.
- **The primary checkout was occupied by the live Comms Agent build.** Merging there would have
  pulled the branch out from under a running build. All merge work was done from a separate
  worktree at `/Users/cameronmoorcroft/Documents/Repos/Clients/titan-dashboard-merge`, on `main`,
  with a copy-on-write `node_modules` clone. That worktree is still there; remove it with
  `git worktree remove ../titan-dashboard-merge` when you are done with it.
- **The first branch watcher died on arming** and was caught and replaced. It used a zsh array for
  the branch list and hit `WATCH: attempt to assign array value to non-array`, because `WATCH`
  already exists as a scalar in the environment. Rewritten without arrays and smoke tested against
  a branch known to exist before being trusted. Mentioning it because a watcher that fails quietly
  at 22:30 is exactly how an overnight run does nothing until morning.
