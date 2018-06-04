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
    -P, --project <project path>  path to the project
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
    -b, --browser <browser-name>               runs Cypress in the browser with the given name. note: using an external browser will not record a video.
    -P, --project <project-path>               path to the project
    --no-exit                                  keep the browser open after tests finish
    --dev                                      runs cypress in development and bypasses binary check
    -h, --help                                 output usage information
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
  Usage: cypress [options] [command]


  Options:

    -v, --version  Prints Cypress version
    -h, --help     output usage information


  Commands:

    help                Shows CLI help and exits
    version             Prints Cypress version
    run [options]       Runs Cypress tests from the CLI without the GUI
    open [options]      Opens Cypress in the interactive GUI.
    install [options]   Installs the Cypress executable matching this package's version
    verify              Verifies that Cypress is installed correctly and executable
    cache [options]     Manage the Cypress binary cache
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
  Usage: cypress [options] [command]


  Options:

    -v, --version  Prints Cypress version
    -h, --help     output usage information


  Commands:

    help                Shows CLI help and exits
    version             Prints Cypress version
    run [options]       Runs Cypress tests from the CLI without the GUI
    open [options]      Opens Cypress in the interactive GUI.
    install [options]   Installs the Cypress executable matching this package's version
    verify              Verifies that Cypress is installed correctly and executable
    cache [options]     Manage the Cypress binary cache
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
  Usage: cypress [options] [command]


  Options:

    -v, --version  Prints Cypress version
    -h, --help     output usage information


  Commands:

    help                Shows CLI help and exits
    version             Prints Cypress version
    run [options]       Runs Cypress tests from the CLI without the GUI
    open [options]      Opens Cypress in the interactive GUI.
    install [options]   Installs the Cypress executable matching this package's version
    verify              Verifies that Cypress is installed correctly and executable
    cache [options]     Manage the Cypress binary cache
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

    Usage: cypress [options] [command]


    Options:

      -v, --version  Prints Cypress version
      -h, --help     output usage information


    Commands:

      help                Shows CLI help and exits
      version             Prints Cypress version
      run [options]       Runs Cypress tests from the CLI without the GUI
      open [options]      Opens Cypress in the interactive GUI.
      install [options]   Installs the Cypress executable matching this package's version
      verify              Verifies that Cypress is installed correctly and executable
      cache [options]     Manage the Cypress binary cache
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

exports['cli --version no binary version 1'] = `
Cypress package version: 1.2.3
Cypress binary version: not installed
`

exports['cli -v no binary version 1'] = `
Cypress package version: 1.2.3
Cypress binary version: not installed
`
