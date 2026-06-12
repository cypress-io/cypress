# Cursor Automations

Version-controlled prompts and config for Cloud Agent automations on this repo.

## Files

| File | Purpose |
|------|---------|
| `babysit-circleci-develop.md` | Prompt for the develop CI babysitter (CircleCI watch + fix + Slack) |
| `github-identity-map.json` | GitHub login → Slack mention + CircleCI username overrides |

## Develop CI babysitter

**Trigger:** push to `develop`

**Known pitfall:** `ready-to-release` runs only in `linux-x64` and does not gate
`windows`, `darwin-*`, or `linux-arm64`. The babysitter must wait for all
platform workflows to finish and treat any platform failure as a failure — not
only `ready-to-release`.

**Regression example:** commit `4408992` / pipeline 82800 — `ready-to-release`
succeeded while `windows` failed. An earlier prompt version incorrectly posted
success.

When editing the prompt, paste the updated contents into the Cursor Automation
UI (Automations are not yet fully config-as-code).

## Identity map

Extend `users` with `slack` and optional `circleci` keys for teammates whose
GitHub login differs from their Slack handle or CircleCI username. Unknown
logins fall back to `@<github-login>` for Slack and the raw GitHub login for
CircleCI.
