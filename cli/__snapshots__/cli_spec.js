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
  -------
  stderr:
  -------
  
  -------
  
`

exports['cli version and binary version 81'] = `
Cypress package version: 1.2.3
Cypress binary version: X.Y.Z
`

exports['cli version and binary version 82'] = `
Cypress package version: 1.2.3
Cypress binary version: X.Y.Z
`

exports['cli version no binary version 36'] = `
Cypress package version: 1.2.3
Cypress binary version: not installed
`

exports['cli --version no binary version 34'] = `
Cypress package version: 1.2.3
Cypress binary version: not installed
`

exports['cli version and binary version 83'] = `
Cypress package version: 1.2.3
Cypress binary version: X.Y.Z
`

exports['cli version and binary version 84'] = `
Cypress package version: 1.2.3
Cypress binary version: X.Y.Z
`

exports['cli version no binary version 37'] = `
Cypress package version: 1.2.3
Cypress binary version: not installed
`

exports['cli --version no binary version 35'] = `
Cypress package version: 1.2.3
Cypress binary version: not installed
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
