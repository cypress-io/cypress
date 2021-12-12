## App Lifecycle

This documents the lifecycle of the application, specifically related to managing the current project,
and the various states & inputs that can feed into state changes, and how they are managed

1. Application starts via `cypress open | run --flags`
  1. The input is run through `cli/lib/cli.js` for normalization
  1. The normalized input is passed into the server, eventually getting to `server/lib/modes/index.ts`
1. The `DataContext` class receives the testing mode (`run` | `open`), and the `modeOptions` (CLI Flags)
1. We call `ctx.initialize`, which based on the `mode` returns a promise for series of steps needed
  1. The `DataContext` should act as the global source of truth for all state in the application. It should be passed along where possible. In the `server` package, we can import/use `getCtx` so we don't need to pass it down the chain.
  1. The CLI flags & environment variables are used set the initial state of the `coreData`
    1. TODO: rename to `appState`?
  1. In `open` mode, if the `--global` flag is passed, we start in "global" mode, which allows us to select multiple projects
  1. Once a project is selected, either via the CLI being run within a project, or via the `--project` flag, we launch into project mode

## Project Lifecycle

1. Once a project is selected, we source the config from `cypress.config.js`, or wherever the config is specified via the `--configFile` CLI flag:
  1. Read the `globalBrowsers`
  1. Execute the `configFile` in a child process & reply back with the config, and the require.cache files in the child process
  1. If there is an error sourcing the config file, we set an error on the `currentProject` in the root state 
  1. We source `cypress.env.json` and validate (if it exists)

## **Config Precedence:**

1. Runtime, inline: `it('should do the thing', { retries: { run: 3 } }` 
2. `port` from spawned server
3. Returned from `setupNodeEvents` (as these get the options from the CLI)
4. Sourced from CLI
5. Sourced from `cypress.env.json`
6. Sourced from `cypress.config.{js|ts}`
7. Default config options

## **Merging**

Config options are deeply merged:

```bash
# CLI:
cypress run --env FOO=bar

# cypress.config.js
env: {
  FOO: 'test'
},
e2e: {
  setupNodeEvents (on, config) {
     return require('@cypress/code-coverage')(on, config)
  },
  env: {
    e2eRunner: true
  }
}

# Would Result in 

{
  env: { FOO: 'bar', e2eRunner: true }
}
```

## Steps of Sourcing / Execution

1. **Application Start**
    1. CLI args & environment are parsed into an "options" object, which is passed along to create the initial application config
    2. Browsers are sourced from the machine at startup
    3. CLI options `--config baseUrl=http://example.com`, `--env` are gathered for merging later
        1. [https://gist.github.com/tgriesser/5111edc0e31b9db61755b0bddbf93e78](https://gist.github.com/tgriesser/5111edc0e31b9db61755b0bddbf93e78)
2. **Project Initialization**
    1. When we have a "projectRoot", we execute the `cypress.config.{js|ts}`, and read the `cypress.env.json` - this will be persisted on the state object, so we can compare the diff as we detect/watch changes to these files
        1. The child process will also send back a list of files that have been sourced so we can watch them for changes to re-execute the config. *We may want to warn against importing things top-level, so as to minimize the work done in child-process blocking the config*
    2. We also pull the "saved state" for the user from the FS App data
        1. We only do this in "open mode"
    3. At this point, we do a first-pass at creating a known config shape, merging the info together into a single object, picking out the "allowed" list of properties to pass to the `setupNodeEvents`
3. **setupNodeEvents**
    1. Once we have selected a `testingType`, we execute the `setupNodeEvents`, passing an "allowed" list of options as the second argument to the function. At this point, we have merged in any CLI options, env vars, 
        1. If they return a new options object, we merge it with the one we passed in
4. **config → FullConfig**
    1. At this point we have the entire config, and we can set the `resolved` property which includes the origin of where the config property was resolved from
