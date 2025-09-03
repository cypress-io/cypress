exports['lib/exec/spawn .start forces colors and streams when supported 1'] = {
  'FORCE_COLOR': '1',
  'DEBUG_COLORS': '1',
  'MOCHA_COLORS': '1',
  'FORCE_STDIN_TTY': '1',
  'FORCE_STDOUT_TTY': '1',
  'FORCE_STDERR_TTY': '1',
}

exports['lib/exec/spawn .start does not force colors and streams when not supported 1'] = {
  'FORCE_COLOR': '0',
  'DEBUG_COLORS': '0',
  'FORCE_STDIN_TTY': '0',
  'FORCE_STDOUT_TTY': '0',
  'FORCE_STDERR_TTY': '0',
}

exports['lib/exec/spawn .start detects kill signal exits with error on SIGKILL 1'] = `
The Test Runner unexpectedly exited via a [36mexit[39m event with signal [36mSIGKILL[39m

Please search Cypress documentation for possible solutions:

[34mhttps://on.cypress.io[39m

Check if there is a GitHub issue describing this crash:

[34mhttps://github.com/cypress-io/cypress/issues[39m

Consider opening a new issue.

----------

Platform: darwin-x64 (Foo-OsVersion)
Cypress Version: 0.0.0-development
`
