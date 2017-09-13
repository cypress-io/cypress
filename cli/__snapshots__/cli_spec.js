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


    Commands:

      version          Prints Cypress version
      run [options]    Runs Cypress tests from the CLI without the GUI
      open [options]   Opens Cypress in the interactive GUI.
      install          Installs the Cypress executable matching this package's version
      verify           Verifies that Cypress is installed correctly and executable

    Options:

      -h, --help     output usage information
      -v, --version  Prints Cypress version
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
