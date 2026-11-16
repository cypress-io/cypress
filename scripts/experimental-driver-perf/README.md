# Experimental driver performance

Tooling for comparing the experimental driver (`CYPRESS_INTERNAL_EXPERIMENTAL_DRIVER`) against the legacy driver: how long each command takes, how long each test takes, and where the experimental driver's agent calls spend their time.

| File | What it does |
| --- | --- |
| `run.mts` | Runs a project once per iteration, browser and mode (`legacy`, `experimental`), writing each run's timings to `--out` |
| `report.mts` | Summarizes a `--out` directory as Markdown tables |
| `agent-report.mts` | Splits the experimental driver's agent calls into install, server, transport and idle time. Needs the server-side instrumentation described in [Server-side breakdown of agent calls](#server-side-breakdown-of-agent-calls) |
| `network-stress/` | A self-contained project for measuring the drivers under heavy network load |

Every project measured needs the same two additions, described in [What a project needs](#what-a-project-needs): a support-file hook that records each command's time, and a config that writes those records and the run results to disk. `network-stress/` already has both and is the reference copy.

## What a project needs

### The timing hook

[`network-stress/cypress/support/perf.ts`](./network-stress/cypress/support/perf.ts) records how long each command takes and how many times it retried, grouped by command kind (query, action, assertion, other). The driver's command queue emits the same `command:*` events in both modes, so one hook covers both. Under the experimental driver, it also times each `remote:agent` round trip and tags it with a `perfId` that the server-side instrumentation records, so the two sides can be joined. It records nothing unless the run sets the `perfOut` expose value, so it can stay in a support file without affecting ordinary runs.

Copy it to the project's `cypress/support/perf.ts` and import it from the project's support file (`import './perf'`). A project without `typescript` installed, such as the kitchensink, can't load a TypeScript support file; for that project, use the JavaScript copy in [The kitchensink](#the-kitchensink).

### The config

The hook flushes its records after each test with `cy.task('perf:record')`, and `cypress run` only takes an output path for its results through the module API, so the config registers both writers. Add this to the project's `setupNodeEvents` (with `fs` and `path` imported), merging the task into any existing `on('task', …)` call:

```ts
on('after:run', (results) => {
  const outFile = config.expose.perfResults

  if (!outFile) {
    return
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2))
})

on('task', {
  'perf:record' ({ outFile, spec, records }) {
    if (!outFile) {
      return null
    }

    fs.mkdirSync(path.dirname(outFile), { recursive: true })

    const lines = records.map((record) => JSON.stringify({ spec, ...record }))

    if (lines.length) {
      fs.appendFileSync(outFile, `${lines.join('\n')}\n`)
    }

    return null
  },
})
```

Also in the config:

- `baseUrl` must be set, because the experimental driver requires it. run.mts passes `--baseUrl` to both modes so the configs match.
- `experimentalWebKitSupport: true` is needed to run in WebKit, along with `playwright-webkit` as a dev dependency of the project.
- If the config file is loaded in dev mode and imports `defineConfig` from `cypress`, `cypress` must resolve from the project's own `node_modules`. A project without its own install, such as `network-stress/`, exports a plain object instead.

## Running

Start the project's app, then run from the root of this repo, so the run uses this branch's driver rather than the project's installed binary:

```bash
node scripts/experimental-driver-perf/run.mts --project <the/path/to/project> --out "$HOME/perf"
```

| Option | Default | Meaning |
| --- | --- | --- |
| `--project` | (required) | The project to run |
| `--out` | (required) | The directory for every run's output |
| `--iterations` | `5` | How many times to run each browser and mode |
| `--first` | `1` | The iteration to start from, to resume an interrupted set of runs into the same `--out` |
| `--browsers` | `chrome,firefox,webkit` | Comma-separated browsers |
| `--modes` | `legacy,experimental` | Comma-separated modes |
| `--baseUrl` | `http://localhost:8080` | The app's URL, passed to both modes |
| `--pause` | `0` | Seconds between runs, for a backend that rate-limits |
| `--start`, `--ready` | | A command to start a server in the project directory before each run and stop after it, and a URL polled until it responds. They go together |
| `--timeout` | `30` | Minutes before a run that never ends is killed and marked as timed out |
| `--record`, `--projectId` | | Records each run to this Cloud project with this key, tagged with the run's name |

run.mts:

- alternates mode and browser inside each iteration, so drift on the machine lands on both sides of the comparison;
- passes `retries=0` and `video=false` to every run, so a flaky test fails instead of quietly doubling its time;
- restarts the `--start` server outside the run's time, and refuses to start if `--ready` already responds, so stop any copy you started yourself;
- prints each run's whole-process time (`experimental-chrome-1: exit 0 in 53s`) and marks runs whose log contains a `429`;
- unsets `ELECTRON_RUN_AS_NODE`, which some agent hosts set and which makes Electron start as plain Node.

Each run named `<mode>-<browser>-<iteration>` writes:

- `<name>.jsonl`: one line per command from the hook;
- `<name>.json`: the run results object that `after:run` receives, with `totalDuration`, `runs[].stats.duration` and `runs[].tests[].duration` (the sum of each attempt's wall-clock time);
- `<name>.log`: the run's output;
- `<name>.agent.jsonl`: the server's side of each agent call, only when the server-side instrumentation is in place;
- `<name>.server.log`: the `--start` server's output, when there is one.

To summarize the results:

```bash
node scripts/experimental-driver-perf/report.mts --out "$HOME/perf"
```

A single run by hand looks like this. Spec paths passed to `--spec` resolve against this repo, not the project, so pass them as absolute paths:

```bash
CYPRESS_INTERNAL_EXPERIMENTAL_DRIVER=true yarn cypress:run -- --project <the/path/to/project> --browser chrome --config baseUrl=http://localhost:8080,video=false,retries=0 --expose perfOut="$HOME/perf/experimental-chrome-1.jsonl",perfResults="$HOME/perf/experimental-chrome-1.json"
```

## The kitchensink

[cypress-example-kitchensink](https://github.com/cypress-io/cypress-example-kitchensink) needs the changes in [cypress-io/cypress-example-kitchensink#1260](https://github.com/cypress-io/cypress-example-kitchensink/pull/1260) to pass under the experimental driver. Until that PR is merged, use its branch, `chrisbreiding/driver-update-compat`. It also sets `baseUrl`.

The kitchensink serves a stand-in for the jsonplaceholder API from `npm start`, so repeated runs aren't rate-limited by the hosted API ([#1259](https://github.com/cypress-io/cypress-example-kitchensink/pull/1259)). If the #1260 branch doesn't include that change yet, merge `master` into it. The branch has it when `scripts/api.js` exists.

```bash
git checkout chrisbreiding/driver-update-compat
git merge origin/master
npm install
```

Then make two changes:

1. Add the hook as `cypress/support/perf.js`, the JavaScript version of `perf.ts`, and import it from `cypress/support/e2e.js` after `import './commands'`:

   ```js
   const ACTIONS = new Set([
     'blur',
     'check',
     'clear',
     'click',
     'dblclick',
     'focus',
     'rightclick',
     'scrollIntoView',
     'scrollTo',
     'select',
     'selectFile',
     'submit',
     'trigger',
     'type',
     'uncheck',
   ])

   const ASSERTIONS = new Set(['should', 'and'])

   const kindOf = (cmd) => {
     if (cmd.get('query')) {
       return 'query'
     }

     if (ASSERTIONS.has(cmd.get('name'))) {
       return 'assertion'
     }

     if (ACTIONS.has(cmd.get('name'))) {
       return 'action'
     }

     return 'other'
   }

   // The flush below is itself a cy.task, and timing it would skew the 'other' bucket
   const isPerfFlush = (cmd) => cmd.get('name') === 'task' && cmd.get('args')?.[0] === 'perf:record'

   if (Cypress.expose('perfOut')) {
     const starts = new Map()
     const retries = new Map()
     const agentCalls = new Map()
     let currentId
     let nextPerfId = 1
     let records = []

     // Times each round trip the experimental driver makes to its in-page agent, and tags it with
     // an id the server can record, to join the two sides
     const automation = Cypress.automation.bind(Cypress)

     Cypress.automation = (eventName, data, ...rest) => {
       if (eventName !== 'remote:agent' || currentId === undefined) {
         return automation(eventName, data, ...rest)
       }

       // the support file reloads for each spec, so the spec keeps ids unique across the run
       const perfId = `${Cypress.spec.relative}#${nextPerfId++}`
       const id = currentId
       const started = performance.now()
       const record = () => {
         const calls = agentCalls.get(id) ?? []

         calls.push({ perfId, ms: performance.now() - started })
         agentCalls.set(id, calls)
       }

       return Promise.resolve(automation(eventName, { ...data, perfId }, ...rest)).finally(record)
     }

     Cypress.on('command:start', (cmd) => {
       currentId = cmd.get('id')
       starts.set(cmd.get('id'), performance.now())
     })

     // A query or action retries together with the assertions chained to it, so retries count against it
     Cypress.on('command:retry', () => {
       if (currentId !== undefined) {
         retries.set(currentId, (retries.get(currentId) ?? 0) + 1)
       }
     })

     const recordEnd = (state) => {
       return (cmd) => {
         const id = cmd.get('id')
         const started = starts.get(id)

         if (!isPerfFlush(cmd) && started !== undefined) {
           records.push({
             test: Cypress.currentTest.titlePath.join(' > '),
             name: cmd.get('name'),
             kind: kindOf(cmd),
             ms: performance.now() - started,
             retries: retries.get(id) ?? 0,
             state,
             agentCalls: agentCalls.get(id) ?? [],
           })
         }

         starts.delete(id)
         retries.delete(id)
         agentCalls.delete(id)
       }
     }

     Cypress.on('command:end', recordEnd('passed'))
     Cypress.on('command:failed', recordEnd('failed'))

     afterEach(() => {
       const batch = records

       records = []

       cy.task('perf:record', { outFile: Cypress.expose('perfOut'), spec: Cypress.spec.relative, records: batch }, { log: false })
     })
   }
   ```

2. Add the [config](#the-config) to `cypress.config.js`. It stays a plain object, because dev mode resolves `cypress` from this repo rather than the kitchensink. With `fs` and `path` required at the top, `e2e` becomes `{ baseUrl: 'http://localhost:8080', setupNodeEvents (on, config) { … } }`. To run in WebKit, also set `experimentalWebKitSupport: true` and add `playwright-webkit` as a dev dependency.

Start the app and its API with `npm start`, then:

```bash
node scripts/experimental-driver-perf/run.mts --project <the/path/to>/cypress-example-kitchensink --out "$HOME/perf"
```

## The Cypress Real World App

[cypress-realworld-app](https://github.com/cypress-io/cypress-realworld-app) is a second, larger project to compare on: 111 tests in 21 specs. Its tests need the changes on the `chrisbreiding/fixes` branch to pass under both drivers, and the branch adds the `start:api:test` script used below. Until those changes are merged, start from that branch.

### Config and support file

1. In `cypress.config.ts`, import `fs` and add the [config](#the-config)'s `after:run` writer and `perf:record` task inside `setupNodeEvents`, beside the existing tasks such as `db:seed`. The existing `retries: { runMode: 2 }` can stay, since run.mts overrides it.
2. Copy [`network-stress/cypress/support/perf.ts`](./network-stress/cypress/support/perf.ts) to `cypress/support/perf.ts`, and add `import "./perf";` to `cypress/support/e2e.ts` after `import "./commands";`.

### Running it

1. Copy in the mock AWS config, which the build's type-check and the API need: `yarn predev:cognito:ci`.
2. Build the frontend and serve the build, as the app's CI does, so the Vite dev server's on-demand transforms stay out of the timings. Run `yarn build`, then `PORT=3000 NODE_ENV=test yarn tsnode:not-instrumented scripts/testServer.ts`. The server only serves static files, so it can stay up across runs.
3. Let run.mts start the API before each run, since the API keeps every login's session in memory:

   ```bash
   node scripts/experimental-driver-perf/run.mts --project <the/path/to>/cypress-realworld-app --out "$HOME/perf-rwa" --baseUrl http://localhost:3000 --start 'yarn start:api:test' --ready http://localhost:3001/testData/users
   ```

The API allows requests only from `http://localhost:$PORT`, and `PORT` defaults to 3000 from `.env`. If the frontend is served on another port, set the same `PORT` for both the frontend server and `--start`, and pass the matching `--baseUrl`.

### With Test Replay

To measure with Test Replay recording, pass `--record <key>` and `--projectId <id>`. Test Replay works with the experimental driver only in Chrome so far, so also pass `--browsers chrome`.

To record to a local cypress-services stack with a local capture bundle:

- Set `CYPRESS_INTERNAL_ENV=development`.
- Set `CYPRESS_LOCAL_PROTOCOL_PATH=<cypress-services>/app/packages/capture-protocol/dist/production.js`.
- If the browser sends network fields the capture schema doesn't accept yet, set `APP_CAPTURE_PROTOCOL_FORCE_ZOD_SAFE_PARSE=0`.
- The local Cloud UI uses port 3000, so serve the Real World App on another port:

```bash
CYPRESS_INTERNAL_ENV=development \
CYPRESS_LOCAL_PROTOCOL_PATH=<cypress-services>/app/packages/capture-protocol/dist/production.js \
APP_CAPTURE_PROTOCOL_FORCE_ZOD_SAFE_PARSE=0 \
node scripts/experimental-driver-perf/run.mts --project <the/path/to>/cypress-realworld-app --out "$HOME/perf-rwa-replay" \
  --browsers chrome --baseUrl http://localhost:3002 \
  --start 'PORT=3002 yarn start:api:test' --ready http://localhost:3001/testData/users \
  --record <record key> --projectId <project id>
```

## Network stress

`network-stress/` is a project in this repo for comparing the drivers under heavy network load. Its server (`server.mts`, no dependencies) serves a page and an API whose responses are as large and as many as a test asks for. Its support file has the timing hook, and its config has the writers. It needs no install: the config is a plain object, and Cypress compiles the specs with the project's `tsconfig.json`.

```bash
node scripts/experimental-driver-perf/run.mts --project scripts/experimental-driver-perf/network-stress --out "$HOME/perf-network" --baseUrl http://localhost:3500 --start 'node server.mts' --ready http://localhost:3500/health
```

Each test does four things:

1. opens the page with the load in its query string;
2. sets up one way of intercepting the API;
3. clicks Start;
4. waits until every request has finished.

`cypress/support/intercepts.ts` defines the ways of intercepting, from none to a handler on every request and response. Each one moves a different amount of traffic between the proxy and the driver.

| Spec | Load |
| --- | --- |
| `many-requests.cy.ts` | 500 parallel 1KB fetches and XHRs, 200 sequential fetches, and 100 fetches each awaited with `cy.wait` |
| `large-payloads.cy.ts` | One 1MB, 10MB or 25MB JSON response, a 25MB text response, and 1MB and 10MB uploads |
| `many-large-requests.cy.ts` | 50 parallel 1MB and 20 parallel 5MB responses, and 20 parallel 1MB uploads |

The page parses each JSON response, as an app would, and counts responses, bytes and errors on the page. Responses are sent with `Cache-Control: no-store`, so every request reaches the network.

## Reading the numbers

- The report compares only tests that passed in every run of both modes. A failing test stops early or waits out a timeout, so including it would skew the comparison.
- Command time covers `command:start` to `command:end` only. It leaves out queue overhead and the gap before the next command. Per-test duration from the results JSON includes them, so compare both.
- A query or action retries together with the assertions chained to it, so its time and `retries` include the assertions' work. The `should` command recorded afterward only confirms the result and is nearly free. Under the experimental driver, every retry is another round trip.
- Commands in `beforeEach` and `afterEach` hooks are recorded under the test they ran for.
- Some costs show up in neither a command's time nor a test's, such as registering a preload script once per spec. Compare the whole-process time run.mts prints, too.

## Server-side breakdown of agent calls

`agent-report.mts` joins the hook's round-trip times with the server's own timing of each `remote:agent` call. It splits the time into agent install, other server work, transport (round trip minus server time) and the time between round trips:

```bash
node scripts/experimental-driver-perf/agent-report.mts --out "$HOME/perf"
```

The server-side timing isn't in the codebase. To recreate it, add an `AgentCallTimer` to `packages/server/lib/automation/commands/remote_agent.ts`:

- **Constructor:** it takes the browser name and the request, which carries the hook's `perfId`.
- **`time(phase, fn)`:** awaits `fn` and adds its duration to `phases[phase]`, and 1 to `counts[phase]`.
- **`end()`:** when `CYPRESS_REMOTE_AGENT_PERF` is set, appends one JSON line to that file: `{ perfId, browser, method, endedAt, totalMs, phases, counts }`. run.mts already sets `CYPRESS_REMOTE_AGENT_PERF` to `<name>.agent.jsonl` for every run.

Wiring:

1. Give each agent class's `call` (`CdpRemoteAgent`, `BidiRemoteAgent`, `WebKitRemoteAgent`) an optional timer argument. It defaults to a no-op whose `time` just calls `fn`.
2. Wrap these phases:
   - `frame`: finding the frame or context the request names;
   - `createWorld`: `Page.createIsolatedWorld`, or the equivalent;
   - `readSource`: awaiting the agent's source;
   - `install`: evaluating the agent bundle into the world;
   - `evaluate`: the agent's own work.
3. In each browser's `remote:agent` handler (`cdp_automation.ts`, `bidi_automation.ts`, `webkit-automation.ts`), create the timer, pass it to `call`, and call `end()` in a `finally`.
4. `agent-report.mts` identifies browsers by the run's file name and reads `counts.install` to tell installing calls from warm ones, so keep those names.

## Agent install findings

These came out of measuring the kitchensink with the tooling above. The code they led to is in `remote_agent.ts` and the runner's webpack config.

**Measure with the production build.** Run `yarn workspace @packages/runner build-prod`, then rebuild with `build` afterward. The development build wraps each module in `eval()`, which makes the agent larger and its install slower. Some driver specs, such as `stack_utils-invocationDetails.cy.ts`, fail with the production build, because it has no eval source maps.

**Chrome** preloads the agent with `Page.addScriptToEvaluateOnNewDocument` in its named world, so the first command after a navigation doesn't wait for the agent to install. Only the AUT frame on an `http(s)` page gets it, which leaves out the runner's frames and the blank page between tests. A document the preload misses, such as a nested frame, still gets the agent on first use.
- The preloaded install adds about 10ms to `cy.visit`, against about 110ms when the agent installs on first use.
- Chrome takes about 0.2ms per non-ASCII character to register a script. The agent's 7,800 of them cost about 2.3s per spec, enough to make a 20-spec run slower with the preload than without it.
- An ASCII script of the same size registers in under 20ms, so the bundle's size barely matters. `toAscii` escapes those characters as `\u` sequences, which brings registration down to about 60ms. Firefox and WebKit also install about 20ms and 10ms faster with the escaped source, so every install sends it.

**Firefox** preloads with `script.addPreloadScript` in the agent's sandbox. That script runs in every document of every frame, so the agent is a string literal that only the AUT frame evaluates, after the guard passes.
- Preloading the agent as code instead made each test about 68ms slower outside its commands, and a run took about 70s instead of 58s.
- As a string, a run takes about 56s, and queries take 16ms instead of 24ms.
- A page CSP without `'unsafe-eval'` blocks the page's own `eval` but not the sandbox's, so the preload still installs the agent there.

**WebKit** installs on first use. Installing when the AUT frame navigates was tried, since Playwright can't preload into its utility world, and it made runs slower.

**Bundle size:** Firefox and WebKit's install time follows how much code the agent has. Three changes took the production agent from 3.8 MB to 0.7 MB:
- the runner's webpack config leaves out modules the agent imports through the driver but never runs (chai, source-map and `@packages/network-tools`);
- it minifies the agent in production;
- `error_utils.ts` imports `strip-ansi` directly rather than through `@packages/errors`, which kept the whole errors package in every driver bundle.

Together, the install went from about 114ms to 42ms in Firefox and from 103ms to 29ms in WebKit.
