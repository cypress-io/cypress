exports['lib/exec/spawn .start forces colors and streams when supported 1'] = {
  "FORCE_COLOR": "1",
  "DEBUG_COLORS": "1",
  "MOCHA_COLORS": "1",
  "FORCE_STDIN_TTY": "1",
  "FORCE_STDOUT_TTY": "1",
  "FORCE_STDERR_TTY": "1",
  "NODE_OPTIONS": "--max-http-header-size=1048576"
}

exports['lib/exec/spawn .start does not force colors and streams when not supported 1'] = {
  "FORCE_COLOR": "0",
  "DEBUG_COLORS": "0",
  "FORCE_STDIN_TTY": "0",
  "FORCE_STDOUT_TTY": "0",
  "FORCE_STDERR_TTY": "0",
  "NODE_OPTIONS": "--max-http-header-size=1048576"
}
