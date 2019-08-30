exports['cli --version no binary version 1'] = `
Cypress package version: 1.2.3
Cypress binary version: not installed
`

exports['cli -v no binary version 1'] = `
Cypress package version: 1.2.3
Cypress binary version: not installed
`

exports['cli cypress run warns with space-separated --specs 1'] = `
[33m⚠[39m Warning: It looks like you're passing --spec a space-separated list of files:

"a b c d e f g"

This will work, but it's not recommended.

The most common cause of this warning is using an unescaped glob pattern. If you are
trying to pass a glob pattern, escape it using quotes:
  cypress run --spec "**/*.spec.js"

If you are trying to pass multiple spec filenames, separate them by commas instead:
  cypress run --spec spec1,spec2,spec3
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
    -h, --help         output usage information

  Commands:

    help               Shows CLI help and exits
    version            prints Cypress version
    run [options]      Runs Cypress tests from the CLI without the GUI
    open [options]     Opens Cypress in the interactive GUI.
    install [options]  Installs the Cypress executable matching this package's version
    verify [options]   Verifies that Cypress is installed correctly and executable
    cache [options]    Manages the Cypress binary cache
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
    -h, --help         output usage information

  Commands:

    help               Shows CLI help and exits
    version            prints Cypress version
    run [options]      Runs Cypress tests from the CLI without the GUI
    open [options]     Opens Cypress in the interactive GUI.
    install [options]  Installs the Cypress executable matching this package's version
    verify [options]   Verifies that Cypress is installed correctly and executable
    cache [options]    Manages the Cypress binary cache
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
    -h, --help         output usage information

  Commands:

    help               Shows CLI help and exits
    version            prints Cypress version
    run [options]      Runs Cypress tests from the CLI without the GUI
    open [options]     Opens Cypress in the interactive GUI.
    install [options]  Installs the Cypress executable matching this package's version
    verify [options]   Verifies that Cypress is installed correctly and executable
    cache [options]    Manages the Cypress binary cache
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
      -h, --help         output usage information

    Commands:

      help               Shows CLI help and exits
      version            prints Cypress version
      run [options]      Runs Cypress tests from the CLI without the GUI
      open [options]     Opens Cypress in the interactive GUI.
      install [options]  Installs the Cypress executable matching this package's version
      verify [options]   Verifies that Cypress is installed correctly and executable
      cache [options]    Manages the Cypress binary cache
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
  Usage: cache [command]

  Manages the Cypress binary cache

  Options:

    list        list cached binary versions
    path        print the path to the binary cache
    clear       delete all cached binaries
    -h, --help  output usage information
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


  Usage: cache [command]

  Manages the Cypress binary cache

  Options:

    list        list cached binary versions
    path        print the path to the binary cache
    clear       delete all cached binaries
    -h, --help  output usage information
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


  Usage: cache [command]

  Manages the Cypress binary cache

  Options:

    list        list cached binary versions
    path        print the path to the binary cache
    clear       delete all cached binaries
    -h, --help  output usage information
  -------
  stderr:
  -------
  
  -------
  
`

exports['cli version and binary version 1'] = `
Cypress package version: 1.2.3
Cypress binary version: X.Y.Z
`

exports['cli version and binary version 2'] = `
Cypress package version: 1.2.3
Cypress binary version: X.Y.Z
`

exports['cli version no binary version 1'] = `
Cypress package version: 1.2.3
Cypress binary version: not installed
`

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


  Usage: open [options]

  Opens Cypress in the interactive GUI.

  Options:

    -p, --port <port>             runs Cypress on a specific port. overrides any value in cypress.json.
    -e, --env <env>               sets environment variables. separate multiple values with a comma. overrides any value in cypress.json or cypress.env.json
    -c, --config <config>         sets configuration values. separate multiple values with a comma. overrides any value in cypress.json.
    -d, --detached [bool]         runs Cypress application in detached mode
    -b, --browser <browser-path>  path to a custom browser to be added to the list of available browsers in Cypress
    -P, --project <project-path>  path to the project
    --global                      force Cypress into global mode as if its globally installed
    --dev                         runs cypress in development and bypasses binary check
    -h, --help                    output usage information
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


  Usage: run [options]

  Runs Cypress tests from the CLI without the GUI

  Options:

    --record [bool]                            records the run. sends test results, screenshots and videos to your Cypress Dashboard.
    --headed                                   displays the Electron browser instead of running headlessly
    -k, --key <record-key>                     your secret Record Key. you can omit this if you set a CYPRESS_RECORD_KEY environment variable.
    -s, --spec <spec>                          runs a specific spec file. defaults to "all"
    -r, --reporter <reporter>                  runs a specific mocha reporter. pass a path to use a custom reporter. defaults to "spec"
    -o, --reporter-options <reporter-options>  options for the mocha reporter. defaults to "null"
    -p, --port <port>                          runs Cypress on a specific port. overrides any value in cypress.json.
    -e, --env <env>                            sets environment variables. separate multiple values with a comma. overrides any value in cypress.json or cypress.env.json
    -c, --config <config>                      sets configuration values. separate multiple values with a comma. overrides any value in cypress.json.
    -b, --browser <browser-name-or-path>       runs Cypress in the browser with the given name. if a filesystem path is supplied, Cypress will attempt to use the browser at that path.
    -P, --project <project-path>               path to the project
    --parallel                                 enables concurrent runs and automatic load balancing of specs across multiple machines or processes
    --group <name>                             a named group for recorded runs in the Cypress dashboard
    --ci-build-id <id>                         the unique identifier for a run on your CI provider. typically a "BUILD_ID" env var. this value is automatically detected for most CI providers
    --no-exit                                  keep the browser open after tests finish
    --dev                                      runs cypress in development and bypasses binary check
    -h, --help                                 output usage information
  -------
  stderr:
  -------
  
  -------
  
`

exports['cli CYPRESS_ENV allows staging environment 1'] = `
  code: 0
  stderr:
  -------
  
  -------

`

exports['cli CYPRESS_ENV catches environment "foo" 1'] = `
  code: 11
  stderr:
  -------
  The environment variable with the reserved name "CYPRESS_ENV" is set.

  Unset the "CYPRESS_ENV" environment variable and run Cypress again.

  ----------

  CYPRESS_ENV=foo

  ----------

  Platform: xxx
  Cypress Version: 1.2.3
  -------

`
