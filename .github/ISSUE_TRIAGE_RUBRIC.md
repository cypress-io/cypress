# Issue Triage Rubric — "Likely Already Resolved"

A scoring guide for grading **open issues that are most likely already fixed and just need closing.**

This rubric is for proactive cleanup: finding bugs that have *already been resolved by a
shipped release* (or made obsolete by an architecture change) so a human can close them with a
short "fixed in vX" note. It is **not** a measure of importance, and it is a different axis from
pure inactivity.

> Latest release reference point: **v15.18.0** (June 2026). ~1,100+ open issues.

---

## How this complements the stale bot

The repo already runs [`stale_issues_and_pr_cleanup.yml`](./workflows/stale_issues_and_pr_cleanup.yml):

- 180 days no activity → `stale` label + "re-test on latest" message → closed 14 days later.
- **Exempt labels:** `type: feature`, `type: enhancement`, `routed-to-e2e`, `routed-to-ct`,
  `routed-to-tools`, `routed-to-cloud`, `prevent-stale`, `triaged`, plus anything with a milestone.

The stale bot closes issues for **silence**. This rubric closes issues for being **resolved** —
including ones the stale bot will *never* touch because they carry an exempt label (e.g. an
accepted bug marked `triaged` that has since been fixed). The two are complementary:

- Stale bot: "nobody confirmed this is still happening."
- This rubric: "we have positive evidence this no longer happens / was fixed / is obsolete."

---

## Scope

**In scope:** `type: bug`, `type: unexpected behavior`, and `type: enhancement`/`type: feature`
*whose requested behavior has since shipped*.

**Out of scope:** open feature/enhancement proposals that have **not** shipped (those are backlog,
not "resolved"), and anything that is a duplicate of a still-open issue (consolidate, don't close
as resolved).

---

## Scoring

Score each issue by summing the positive signals, then subtract for disqualifiers. Any single
**hard disqualifier** caps the issue at "Keep open" regardless of score.

### Positive signals (evidence it's already resolved)

| # | Signal | Points | How to check |
|---|--------|:------:|--------------|
| P1 | **Reported against an obsolete major version** whose subsystem was since rewritten (see version map below) and not re-confirmed since | +3 | `Cypress Version` in body; compare to version map |
| P2 | **A merged PR / fix commit is linked** to the issue (or it's referenced by a release changelog entry) | +4 | Timeline → "closed by"/"referenced", cross-link to a merged PR |
| P3 | **A comment states it's fixed / can't-reproduce-on-latest**, especially from a maintainer or multiple users | +3 (maintainer) / +2 (user) | Read most recent 3–5 comments |
| P4 | **Root cause was an upstream dependency** (Chrome/Firefox/WebKit/Electron/Node/webpack/vite) version long since bumped past the reported one | +2 | Body mentions browser/Node/bundler version |
| P5 | **Duplicate of an issue already closed as fixed** | +4 | Search title/keywords for closed twins |
| P6 | **Uses a removed/renamed API or removed config surface** (`cy.route`/`cy.server`, `pluginsFile`, `cypress.json`, `experimental*` since stabilized) | +3 | Body code samples |
| P7 | **Reproduction link is dead or itself obsolete** (404 repo, removed APIs, ancient deps) and no fresh repro exists | +1 | Open the linked repro |
| P8 | **(enhancements only)** the requested capability now exists in a shipped release | +4 | Cross-check docs/changelog |
| P9 | **Low/declining engagement** — no new reactions or comments in the last ~12 months | +1 | Reaction/comment recency |

### Disqualifiers

| Signal | Effect |
|--------|:------:|
| **`prevent-stale` label** — explicit maintainer decision to keep open | **Hard disqualifier** |
| **`triaged` label** — accepted & deliberately tracked | **Hard disqualifier** |
| **`stage: ready for work`** — accepted bug in the backlog, not resolved | **Hard disqualifier** |
| Has an open **milestone** / is on an active project board | **Hard disqualifier** |
| **Confirmed reproduced on a recent version** (within ~last 2–3 minors) | **Hard disqualifier** |
| `stage: needs information` waiting on the *reporter* | Route to stale bot, don't close-as-resolved (−2) |
| Active engagement (new reactions/comments in last few months) | −2 |
| Open `type: feature`/`type: enhancement` not yet shipped | Out of scope (close as such only via separate backlog review) |

> The hard disqualifiers map 1:1 to the stale bot's exempt list for a reason: those labels are
> how maintainers say "leave this open." Respect them.

---

## Cypress version map (for P1/P6)

Use the reported `Cypress Version` to gauge how much has changed underneath the report.

| Boundary | What changed — bugs filed before this are strong P1/P6 candidates |
|----------|-------------------------------------------------------------------|
| **v6 → v7** (2021) | New plugin/preprocessor defaults; component testing alpha |
| **v9 → v10** (2022) | `cypress.json` → `cypress.config.{js,ts}`; `pluginsFile` removed; new Launchpad/App UI; spec/run rewrite |
| **v11 → v12** (2022) | `cy.route`/`cy.server` (legacy XHR stubbing) **removed**; `cy.origin` GA; detached-DOM & test-isolation overhaul |
| **v12 → v13** (2023) | Major proxy/network + session/origin changes; Node 16+ |
| **v13 → v14** (2024) | Node 18+; legacy config/flags dropped |
| **v14 → v15** (2025) | Current line |

A bug reported on **< v10** that touches config, plugins, the UI, or spec running, with no
activity since, is almost always either fixed or describing software that no longer exists.

---

## Score bands → action

| Band | Score | Action |
|------|:-----:|--------|
| **A — Close now** | ≥ 7, no disqualifier | Close as resolved with a fix reference (template below). |
| **B — Verify, then close** | 4–6, no disqualifier | Spend ≤10 min reproducing on latest. Fixed → close; still repros → relabel `triaged`/`prevent-stale` and keep. |
| **C — Nudge / let stale bot work** | 1–3, no disqualifier | Comment asking the reporter to confirm on latest; let the 180-day stale flow finish the job. |
| **Keep open** | any disqualifier present | Leave it. Add `prevent-stale` if it keeps getting mis-flagged. |

---

## Ready-to-run candidate searches

Paste into GitHub issue search. These surface high-yield buckets; then score each hit.

```text
# Old bugs, never marked keep-open, not yet stale-flagged — the core pool
repo:cypress-io/cypress is:issue is:open label:"type: bug" -label:prevent-stale -label:triaged -label:"stage: ready for work" created:<2022-06-01 sort:updated-asc

# Filed against removed legacy XHR API (cy.route / cy.server) — almost all obsolete
repo:cypress-io/cypress is:issue is:open label:"type: bug" cy.route OR cy.server

# Filed against removed config surface (pre-v10)
repo:cypress-io/cypress is:issue is:open cypress.json OR pluginsFile

# Reporter went quiet after a needs-info request
repo:cypress-io/cypress is:issue is:open label:"stage: needs information" sort:updated-asc

# Old + low engagement (cold)
repo:cypress-io/cypress is:issue is:open label:"type: bug" -label:prevent-stale comments:<3 updated:<2024-06-01 sort:created-asc
```

> Tip: run searches `sort:updated-asc` so the coldest issues surface first, and always add
> `-label:prevent-stale -label:triaged` to skip the deliberate keep-opens.

---

## Triage steps per issue

1. **Disqualify fast.** Check labels (`prevent-stale`, `triaged`, `stage: ready for work`),
   milestone, and last-activity date. Any hard disqualifier → stop, keep open.
2. **Read the reported version** and map it (table above). Score P1/P4/P6.
3. **Scan the last 3–5 comments + timeline** for fix references, dup links, "works now." Score
   P2/P3/P5.
4. **For Band B**, attempt a quick repro on the latest version (or the linked repro if alive).
5. **Total the score, pick the band, act.** Always leave a one-line reason when closing.

---

## Close comment templates

**Fixed in a release (Band A, P2/P3):**
> Closing — this was resolved in Cypress vX.Y.Z (see <PR/changelog link>). Please re-open or file a
> fresh issue with a minimal repro if you still see it on the latest version.

**Obsolete API / architecture (P6):**
> Closing — this targets `<removed API/config>`, which was removed in Cypress v12 (legacy XHR) /
> v10 (config + plugins rewrite). The described behavior no longer applies. Happy to look at a
> fresh report against the current architecture if needed.

**Can't reproduce on latest (Band B):**
> I couldn't reproduce this on Cypress vX.Y.Z. Closing as resolved — please comment with a minimal
> repro on the latest version if it's still happening and we'll re-open.

---

## Notes / known nuances observed in this repo

- **`prevent-stale` is load-bearing.** Many genuinely-old reports (e.g. #1271, filed on v1.4.2 with
  40+ reactions) carry it deliberately — old version alone never justifies closing when this label
  is present.
- **`reopened` issues exist** (e.g. #2319) — check `state_reason`; a reopened issue is an active
  decision to keep it open.
- Stage labels are the maintainer's voice: `stage: needs information` → reporter's court (stale
  bot's job), `stage: ready for work` → accepted backlog (keep), `stage: needs investigating` →
  unverified (score normally).
