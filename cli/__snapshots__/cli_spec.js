exports['shows help for open --foo 1'] = `

  command: bin/cypress open --foo
  code: 1
  failed: true
  killed: false
  signal: null
  timedOut: false

  stdout:
  -------
  error: unknown option: --foo

  Usage: cypress open [options]

  Opens Cypress in the interactive GUI.

  Options:
    -b, --browser <browser-path>     runs Cypress in the browser with the given
                                     name. if a filesystem path is supplied,
                                     Cypress will attempt to use the browser at
                                     that path.
    --component                      runs component tests
    -c, --config <config>            sets configuration values. separate multiple
                                     values with a comma. overrides any value in
                                     cypress.config.{js,ts,mjs,cjs}.
    -C, --config-file <config-file>  path to script file where configuration
                                     values are set. defaults to
                                     "cypress.config.{js,ts,mjs,cjs}".
    -d, --detached [bool]            runs Cypress application in detached mode
    --e2e                            runs end to end tests
    -e, --env <env>                  sets environment variables. separate
                                     multiple values with a comma. overrides any
                                     value in cypress.config.{js,ts,mjs,cjs} or
                                     cypress.env.json
    --global                         force Cypress into global mode as if its
                                     globally installed
    -p, --port <port>                runs Cypress on a specific port. overrides
                                     any value in cypress.config.{js,ts,mjs,cjs}.
    -P, --project <project-path>     path to the project
    --dev                            runs cypress in development and bypasses
                                     binary check
    -h, --help                       display help for command
  -------
  stderr:
  -------
  
  -------
  
`

exports['shows help for run --foo 1'] = `

  command: bin/cypress run --foo
  code: 1
  failed: true
  killed: false
  signal: null
  timedOut: false

  stdout:
  -------
  error: unknown option: --foo

  Usage: cypress run [options]

  Runs Cypress tests from the CLI without the GUI

  Options:
    -b, --browser <browser-name-or-path>       runs Cypress in the browser with the given name. if a filesystem path is supplied, Cypress will attempt to use the browser at that path.
    --ci-build-id <id>                         the unique identifier for a run on your CI provider. typically a "BUILD_ID" env var. this value is automatically detected for most CI providers
    --component                                runs component tests
    -c, --config <config>                      sets configuration values. separate multiple values with a comma. overrides any value in cypress.config.{js,ts,mjs,cjs}.
    -C, --config-file <config-file>            path to script file where configuration values are set. defaults to "cypress.config.{js,ts,mjs,cjs}".
    --e2e                                      runs end to end tests
    -e, --env <env>                            sets environment variables. separate multiple values with a comma. overrides any value in cypress.config.{js,ts,mjs,cjs} or cypress.env.json
    --group <name>                             a named group for recorded runs in Cypress Cloud
    -k, --key <record-key>                     your secret Record Key. you can omit this if you set a CYPRESS_RECORD_KEY environment variable.
    --headed                                   displays the browser instead of running headlessly
    --headless                                 hide the browser instead of running headed (default for cypress run)
    --no-exit                                  keep the browser open after tests finish
    --parallel                                 enables concurrent runs and automatic load balancing of specs across multiple machines or processes
    -p, --port <port>                          runs Cypress on a specific port. overrides any value in cypress.config.{js,ts,mjs,cjs}.
    -P, --project <project-path>               path to the project
    -q, --quiet                                run quietly, using only the configured reporter
    --record [bool]                            records the run. sends test results, screenshots and videos to Cypress Cloud.
    -r, --reporter <reporter>                  runs a specific mocha reporter. pass a path to use a custom reporter. defaults to "spec"
    -o, --reporter-options <reporter-options>  options for the mocha reporter. defaults to "null"
    -s, --spec <spec>                          runs specific spec file(s). defaults to "all"
    -t, --tag <tag>                            named tag(s) for recorded runs in Cypress Cloud
    --dev                                      runs cypress in development and bypasses binary check
    -h, --help                                 display help for command
  -------
  stderr:
  -------
  
  -------
  
`

exports['cli unknown option shows help for cache command - unknown option --foo 1'] = `

  command: bin/cypress cache --foo
  code: 1
  failed: true
  killed: false
  signal: null
  timedOut: false

  stdout:
  -------
  error: unknown option: --foo

  Usage: cypress cache [command]

  Manages the Cypress binary cache

  Options:
    list        list cached binary versions
    path        print the path to the binary cache
    clear       delete all cached binaries
    prune       deletes all cached binaries except for the version currently in
                use
    --size      Used with the list command to show the sizes of the cached
                folders
    -h, --help  display help for command
  -------
  stderr:
  -------
  
  -------
  
`

exports['cli unknown option shows help for cache command - unknown sub-command foo 1'] = `

  command: bin/cypress cache foo
  code: 1
  failed: true
  killed: false
  signal: null
  timedOut: false

  stdout:
  -------
  error: unknown command: cache foo

  Usage: cypress cache [command]

  Manages the Cypress binary cache

  Options:
    list        list cached binary versions
    path        print the path to the binary cache
    clear       delete all cached binaries
    prune       deletes all cached binaries except for the version currently in
                use
    --size      Used with the list command to show the sizes of the cached
                folders
    -h, --help  display help for command
  -------
  stderr:
  -------
  
  -------
  
`

exports['cli unknown option shows help for cache command - no sub-command 1'] = `

  command: bin/cypress cache
  code: 1
  failed: true
  killed: false
  signal: null
  timedOut: false

  stdout:
  -------
  Usage: cypress cache [command]

  Manages the Cypress binary cache

  Options:
    list        list cached binary versions
    path        print the path to the binary cache
    clear       delete all cached binaries
    prune       deletes all cached binaries except for the version currently in
                use
    --size      Used with the list command to show the sizes of the cached
                folders
    -h, --help  display help for command
  -------
  stderr:
  -------
  
  -------
  
`

exports['cli help command shows help 1'] = `

  command: bin/cypress help
  code: 0
  failed: false
  killed: false
  signal: null
  timedOut: false

  stdout:
  -------
  Usage: cypress <command> [options]

  Options:
    -v, --version      prints Cypress version
    -h, --help         display help for command

  Commands:
    help               Shows CLI help and exits
    version            prints Cypress version
    open [options]     Opens Cypress in the interactive GUI.
    run [options]      Runs Cypress tests from the CLI without the GUI
    open-ct [options]  Opens Cypress component testing interactive mode.
                       Deprecated: use "open --component"
    run-ct [options]   Runs all Cypress component testing suites. Deprecated:
                       use "run --component"
    install [options]  Installs the Cypress executable matching this package's
                       version
    verify [options]   Verifies that Cypress is installed correctly and
                       executable
    cache [options]    Manages the Cypress binary cache
    info [options]     Prints Cypress and system information
  -------
  stderr:
  -------
  
  -------
  
`

exports['cli help command shows help for -h 1'] = `

  command: bin/cypress -h
  code: 0
  failed: false
  killed: false
  signal: null
  timedOut: false

  stdout:
  -------
  Usage: cypress <command> [options]

  Options:
    -v, --version      prints Cypress version
    -h, --help         display help for command

  Commands:
    help               Shows CLI help and exits
    version            prints Cypress version
    open [options]     Opens Cypress in the interactive GUI.
    run [options]      Runs Cypress tests from the CLI without the GUI
    open-ct [options]  Opens Cypress component testing interactive mode.
                       Deprecated: use "open --component"
    run-ct [options]   Runs all Cypress component testing suites. Deprecated:
                       use "run --component"
    install [options]  Installs the Cypress executable matching this package's
                       version
    verify [options]   Verifies that Cypress is installed correctly and
                       executable
    cache [options]    Manages the Cypress binary cache
    info [options]     Prints Cypress and system information
  -------
  stderr:
  -------
  
  -------
  
`

exports['cli help command shows help for --help 1'] = `

  command: bin/cypress --help
  code: 0
  failed: false
  killed: false
  signal: null
  timedOut: false

  stdout:
  -------
  Usage: cypress <command> [options]

  Options:
    -v, --version      prints Cypress version
    -h, --help         display help for command

  Commands:
    help               Shows CLI help and exits
    version            prints Cypress version
    open [options]     Opens Cypress in the interactive GUI.
    run [options]      Runs Cypress tests from the CLI without the GUI
    open-ct [options]  Opens Cypress component testing interactive mode.
                       Deprecated: use "open --component"
    run-ct [options]   Runs all Cypress component testing suites. Deprecated:
                       use "run --component"
    install [options]  Installs the Cypress executable matching this package's
                       version
    verify [options]   Verifies that Cypress is installed correctly and
                       executable
    cache [options]    Manages the Cypress binary cache
    info [options]     Prints Cypress and system information
  -------
  stderr:
  -------
  
  -------
  
`

exports['cli unknown command shows usage and exits 1'] = `

  command: bin/cypress foo
  code: 1
  failed: true
  killed: false
  signal: null
  timedOut: false

  stdout:
  -------
  Unknown command "foo"
  Usage: cypress <command> [options]

  Options:
    -v, --version      prints Cypress version
    -h, --help         display help for command

  Commands:
    help               Shows CLI help and exits
    version            prints Cypress version
    open [options]     Opens Cypress in the interactive GUI.
    run [options]      Runs Cypress tests from the CLI without the GUI
    open-ct [options]  Opens Cypress component testing interactive mode.
                       Deprecated: use "open --component"
    run-ct [options]   Runs all Cypress component testing suites. Deprecated:
                       use "run --component"
    install [options]  Installs the Cypress executable matching this package's
                       version
    verify [options]   Verifies that Cypress is installed correctly and
                       executable
    cache [options]    Manages the Cypress binary cache
    info [options]     Prints Cypress and system information
  -------
  stderr:
  -------
  
  -------
  
`

exports['cli CYPRESS_INTERNAL_ENV catches environment "foo" 1'] = `
  code: 11
  stderr:
  -------
  The environment variable with the reserved name "CYPRESS_INTERNAL_ENV" is set.

  Unset the "CYPRESS_INTERNAL_ENV" environment variable and run Cypress again.

  ----------

  CYPRESS_INTERNAL_ENV=foo

  ----------

  Platform: xxx
  Cypress Version: 1.2.3
  -------

`

exports['cli version and binary version 1'] = `
Cypress package version: 1.2.3
Cypress binary version: X.Y.Z
Electron version: not found
Bundled Node version: not found
`

exports['cli version and binary version 2'] = `
Cypress package version: 1.2.3
Cypress binary version: X.Y.Z
Electron version: not found
Bundled Node version: not found
`

exports['cli version with electron and node 1'] = `
Cypress package version: 1.2.3
Cypress binary version: X.Y.Z
Electron version: 10.10.88
Bundled Node version: 11.10.3
`

exports['cli version no binary version 1'] = `
Cypress package version: 1.2.3
Cypress binary version: not installed
Electron version: not found
Bundled Node version: not found
`

exports['cli --version no binary version 1'] = `
Cypress package version: 1.2.3
Cypress binary version: not installed
Electron version: not found
Bundled Node version: not found
`

exports['cli -v no binary version 1'] = `
Cypress package version: 1.2.3
Cypress binary version: not installed
Electron version: not found
Bundled Node version: not found
`

exports['cli cypress run warns with space-separated --spec 1'] = `
[33m⚠[39m Warning: It looks like you're passing --spec a space-separated list of arguments:

"a b c d e f g"

This will work, but it's not recommended.

If you are trying to pass multiple arguments, separate them with commas instead:
  cypress run --spec arg1,arg2,arg3
  
The most common cause of this warning is using an unescaped glob pattern. If you are
trying to pass a glob pattern, escape it using quotes:
  cypress run --spec "**/*.spec.js"
`

exports['cli cypress run warns with space-separated --tag 1'] = `
[33m⚠[39m Warning: It looks like you're passing --tag a space-separated list of arguments:

"a b c d e f g"

This will work, but it's not recommended.

If you are trying to pass multiple arguments, separate them with commas instead:
  cypress run --tag arg1,arg2,arg3
`

exports['cli CYPRESS_INTERNAL_ENV allows and warns when staging environment 1'] = `
  code: 0
  stdout:
  -------
  ⚠ Warning: It looks like you're passing CYPRESS_INTERNAL_ENV=staging

  The environment variable "CYPRESS_INTERNAL_ENV" is reserved and should only be used internally.

  Unset the "CYPRESS_INTERNAL_ENV" environment variable and run Cypress again.

  Usage: cypress <command> [options]

  Options:
    -v, --version      prints Cypress version
    -h, --help         display help for command

  Commands:
    help               Shows CLI help and exits
    version            prints Cypress version
    open [options]     Opens Cypress in the interactive GUI.
    run [options]      Runs Cypress tests from the CLI without the GUI
    open-ct [options]  Opens Cypress component testing interactive mode.
                       Deprecated: use "open --component"
    run-ct [options]   Runs all Cypress component testing suites. Deprecated:
                       use "run --component"
    install [options]  Installs the Cypress executable matching this package's
                       version
    verify [options]   Verifies that Cypress is installed correctly and
                       executable
    cache [options]    Manages the Cypress binary cache
    info [options]     Prints Cypress and system information
  -------
  stderr:
  -------
  
  -------

`

exports['cli version and binary version with npm log silent'] = `
Cypress package version: 1.2.3
Cypress binary version: X.Y.Z
Electron version: not found
Bundled Node version: not found
`

exports['cli version and binary version with npm log warn'] = `
Cypress package version: 1.2.3
Cypress binary version: X.Y.Z
Electron version: not found
Bundled Node version: not found
`

exports['prints explanation when no cache'] = `
No cached binary versions were found.
`
