exports['cli unknown command shows usage and exits 1'] = `
  command: bin/cypress foo
  code: 0
  failed: false
  killed: false
  signal: null
  timedOut: false

  stdout:
  -------
  Usage: cypress [options] [command]


  Commands:

    version          Prints Cypress version
    run [options]    Runs Cypress Headlessly
    open [options]   Opens Cypress normally, as a desktop application.
    install          Installs the Cypress executable matching this package's version
    verify           Verifies that Cypress is installed correctly and executable

  Options:

    -h, --help  output usage information
  -------
  stderr:
  -------
  Unknown command "foo"
  -------
  `

exports['cli cypress version reports package and binary message 1'] = `Cypress package version: 1.2.3
Cypress binary version: X.Y.Z
`

exports['cli cypress version handles non-existent binary 1'] = `Cypress package version: 1.2.3
Cypress binary version: unavailable
`

