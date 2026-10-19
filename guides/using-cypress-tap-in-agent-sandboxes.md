# Using `cypress tap` in agent sandboxes

How to run `cypress open` and drive it with [`cypress tap`](../cli/lib/tap/AGENTS.md) from an AI agent in a sandbox, such as Claude Code on the web, Cursor Cloud agents, or a local sandbox. It is written for people maintaining Cypress and for anyone writing instructions for an agent.

`cypress tap` was added in Cypress 15.21.0, and this guide describes Cypress 16.1.0 and later. The sections below that describe a problem as fixed, or Cypress as doing something for an agent, describe the agent sandbox changes. A release from before them needs the steps in [Before these changes](#before-these-changes). Measurements come from repeated runs of a benchmark script in Claude Code on the web on a one-assertion spec, so treat the timings as a floor, not a promise for a real project. Behavior marked **unverified** has not been run on the host named.

## What a sandbox run looks like

An agent starts `cypress open` in the background, waits for `cypress tap` to report an attached browser, then runs a spec and reads the result:

```bash
nohup npx cypress open --e2e --browser chromium --project . > cypress-open.log 2>&1 &

# Wait up to 90 s for a browser, and stop when the project failed to load
deadline=$((SECONDS + 90))

until out=$(npx cypress tap status --json) && echo "$out" | grep -Eq '"browserAttached": *true'; do
  echo "$out" | grep -Eq '"status": *"error"' && { echo "$out"; exit 1; }
  [ "$SECONDS" -ge "$deadline" ] && { echo "no browser after 90 s; see cypress-open.log"; exit 1; }
  sleep 1
done

npx cypress tap run cypress/e2e/my.cy.ts
npx cypress tap status --json
```

Measured on Claude Code on the web: the session registers in about 4 s, the browser attaches about 6 s later, the first verdict arrives about 12 s after start, and a rerun takes 1.4 to 3 s. One session holds 13 to 22 processes and 1.7 to 2.5 GB of memory. Each `tap` call takes 0.4 to 0.9 s, of which telemetry is 0.1 to 0.3 s, and `npx` adds 0.3 to 0.9 s on top.

## Before these changes

On a release from before the agent sandbox changes, each of these needs a workaround:

- Allow the three Cypress hosts (see Requirements), or the binary download fails.
- Dismiss the welcome screen yourself, or the browser never launches: write `{"majorVersionWelcomeDismissed": {"16": 1700000000000}}` to `~/.config/Cypress/cy/production/projects/__global__/state.json` before starting. If the project folder already has a Cypress config file, the app reads this preference from a folder named for the project instead, so the benchmark wrote both. `tap run` also launches the browser, about 4 to 7 s after it is called, and needs neither.
- Put the Chromium binary on `PATH` as `chromium`, because `--browser /path/to/chrome` can be ignored.
- Start `cypress open` with `nohup ... &`, not `--detached`, which can stop the app shortly after the command returns.
- Unset `ELECTRON_RUN_AS_NODE`, or `cypress open` runs as plain Node with no window.
- Create `cypress.config.js` (`module.exports = { e2e: {} }`) and an empty `cypress/support/e2e.js` first. Without a configuration the first launch creates files and registers no session until Cypress is started a second time.

## Requirements

- **Node.** The `cypress` CLI runs on the user's Node, so the range in `engines.node` in [`cli/package.json`](../cli/package.json) applies.
- **A screen is not needed, but Xvfb is.** `cypress open` always creates an Electron window. On Linux the CLI starts its own Xvfb when `DISPLAY` is unset, which needs the `xvfb` package. If `DISPLAY` is set and nothing listens, the CLI now starts its own Xvfb and retries. A missing Xvfb is reported with install commands, and an Xvfb that is installed but could not start is reported with the common causes, such as a display number already in use.
- **System libraries.** If the app cannot load a library, the error names it and, for the common Electron libraries, the Debian and Ubuntu package that provides it. For any other library it gives an `apt-file search` command, and `apt-file` is not installed by default.
- **Network.** `download.cypress.io`, `cdn.cypress.io` and `api.cypress.io` must be reachable. The default network policy of Claude Code on the web blocks all three, and the binary download then fails. Allow them in the environment settings. The binary download is retried up to 3 times on connection errors, after 60 s without data, and on HTTP 408, 429 and 5xx.
- **A fresh cache per session.** Each new Claude Code on the web session starts with an empty Cypress cache, so each pays for the package install, the binary download (about 26 to 34 s in recent runs) and a cold verify (about 7 to 8 s). Whether a cache folder inside the repository survives a new session is **unverified**.

## Agent mode

When an AI agent runs `cypress open`, Cypress skips steps that only a person at the window can complete:

- It launches the browser without waiting for the welcome screen to be dismissed, when `--project` and a testing type are given and the browser comes from `--browser` or from `defaultBrowser` in the config. The dismissal is not saved, so a person's first launch still sees the welcome screen.
- In a project with no Cypress configuration, `cypress open --e2e --project <path>` creates the configuration and support files and starts the project in one launch. It prints the files it created. Before this, the project did not start until Continue was pressed in the window. A scaffolded file that needs a person to merge changes into it still waits.

Agent mode is decided by [`@packages/agent-info`](../packages/agent-info/AGENTS.md), which recognizes hosts by environment variables. Claude Code on the web sets `CLAUDECODE` and `AI_AGENT`. The markers on Cursor Cloud are **unverified**. For a host the table does not know, set `CYPRESS_AGENT_MODE=1` on the same command line as `cypress open` (shells on some hosts start fresh for each command, so an export does not carry over). `CYPRESS_AGENT_MODE=0` turns it off for a person whose shell carries an agent marker.

Error text in the log can arrive wrapped in `<<<CYPRESS.STDERR.START>>>` and `<<<CYPRESS.STDERR.END>>>` markers. The text between them is the error. The CLI removes the markers when it pipes the app's stderr, which it does on macOS, on Linux when it starts Xvfb or `DISPLAY` is set, and for `--detached`. Why they still appear on some hosts is **unverified**.

## Choosing a browser

Electron works and needs no install, but it is deprecated as a test browser, so use it as a fallback. Playwright's bundled Chromium is the usual alternative in a sandbox.

- A browser whose name is on `PATH` works. Linking the binary as `chromium` from `~/bin` and adding that directory to `PATH` was verified.
- `--browser /absolute/path/to/chrome` that Cypress does not recognize as a browser is printed as a warning in the `cypress open` output, and the warning shows what running `<path> --version` printed, which is the first thing to read. The app then selects another browser but does not launch one, so `tap status` stays at `browser not selected` until a spec is run. Why a custom Chromium path is not recognized is not confirmed, so treat the PATH workaround as the supported route until it is.

## When something does not work

| What you see | Likely cause | What to do |
|---|---|---|
| `tap status` reports `error` with a reason | The project could not load, such as a config file with a syntax error or a missing module | Fix the file, then stop Cypress and start it again. After a config file fails to load, or `setupNodeEvents` throws, Cypress stops watching the config, so saving the fix does not recover by itself. The same error is printed in the output of `cypress open`. The other `tap` commands report that the project could not load and point to `tap status` |
| `tap status` reports `not connected`, and the log shows nothing | Cypress is still starting, or has stopped | Check the process is alive and read `cypress-open.log`. A configured project with no support file registered no session in a benchmark run, and whether that error now shows in `tap status` is **unverified**. Create `cypress/support/e2e.js` |
| No browser opens, and `tap run` launches one | The welcome screen was not skipped | Agent mode is off. Set `CYPRESS_AGENT_MODE=1` |
| `status` stays at `spec not selected` after `tap run` | Seen once in a run, on the first launch of an unseeded app | Run `tap run` again |
| `cypress open` shows no window and registers nothing | `ELECTRON_RUN_AS_NODE=1` is exported | `cypress open` now ignores it with a warning. `cypress run` still honors it |
| The app is gone after `cypress open --detached` | The previous behavior closed the app's output pipes and stopped Xvfb | Changed: output goes to files in the temporary directory (the command prints their paths, they are kept for 7 days, and Ctrl-C before the app is ready stops it), and a CLI-managed Xvfb is started in a session of its own and is no longer stopped when the command returns. In a Linux container the app stayed connected after the CLI's process group was ended; a real sandbox host is **unverified**, so a person should run a real `--detached` check on each host. The Xvfb is not stopped when the app closes; stop yours by its process id rather than with `pkill Xvfb`, which stops every Xvfb on the host |
| `tap status` loses a live session | `tap` in a different PID namespace judged the session dead | Fixed: a record whose server still answers is kept. A record that only reports a load error names no server, so a `tap` in another PID namespace can still discard it |
| Component testing shows no session and no error | Missing config, support file, `component-index.html` or Vite config, or an error in `setupNodeEvents` | Errors now print and show in `tap status`. To check a setup first, run `npx cypress run --component --spec <spec>` |

Component testing is not scaffolded for an agent, because it needs a framework and bundler to be chosen and their dependencies installed. Author the configuration, `cypress/support/component.*`, `cypress/support/component-index.html` and a `vite.config.*` first.

## Setting up the host

**Claude Code on the web.** Allow the three Cypress hosts in the environment's network settings. Install the project's dependencies in the environment setup script or in a `SessionStart` hook guarded by `CLAUDE_CODE_REMOTE=true`, and have the agent start Cypress in one command, as in the example above.

**Cursor Cloud.** The image needs Xvfb available (check with `command -v Xvfb`), and `DISPLAY` should stay unset so Cypress starts its own. The `DISPLAY=:1` in this repository's [`.cursor/Dockerfile`](../.cursor/Dockerfile) and the Xvfb start in its [`.cursor/environment.json`](../.cursor/environment.json) are this repository's own setup for building Cypress, not something Cursor Cloud presets for every project. Running the steps above on Cursor Cloud is **unverified**.

## Not covered yet

Recovering from a config load error without a restart, opening Cypress without the Launchpad window, new `tap` commands for starting and waiting, non-interactive component setup, a Chromium installer, and speed work on `tap` calls and builds are not part of this behavior. See the benchmark findings for sizing before starting any of them.

## Where each behavior comes from

The behaviors this guide describes as fixed or new come from separate changes, tracked in the Jira epic AW-190. A release has them only when the change has shipped.

| Behavior | Ticket |
|---|---|
| `cypress open` and `tap` start for an agent without the welcome screen (`CYPRESS_AGENT_MODE`) | AW-181 |
| No-config `--e2e` starts in one launch for an agent | AW-189 |
| Config and project load errors are printed by `cypress open` | AW-182 |
| `tap status` reports an `error` stage | AW-183 |
| `--browser <path>` reports what the path printed | AW-184 |
| `tap` does not delete a live session it cannot see the pid of | AW-185 |
| `--detached` keeps the app running | AW-178 |
| `ELECTRON_RUN_AS_NODE` is ignored by `cypress open` | AW-179 |
| A dead `DISPLAY` is recovered | AW-180 |
| Binary download retries | AW-186 |
| Missing library and Xvfb errors name the problem | AW-187 |

