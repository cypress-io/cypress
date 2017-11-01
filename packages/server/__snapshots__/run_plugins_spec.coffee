exports['lib/plugins/child/run_plugins sends error message if pluginsFile is missing 1'] = {
  "name": "Error",
  "message": "Cannot find module '/does/not/exist.coffee'",
  "code": "MODULE_NOT_FOUND"
}

exports['lib/plugins/child/run_plugins sends error message if requiring pluginsFile errors 1'] = {
  "name": "Error",
  "message": "error thrown by pluginsFile"
}

exports['lib/plugins/child/run_plugins sends error message if pluginsFile has syntax error 1'] = {
  "name": "SyntaxError",
  "message": "missing }",
  "code": "{\n"
}

exports['lib/plugins/child/run_plugins sends error message if pluginsFile does not export a function 1'] = `load:error`

exports['lib/plugins/child/run_plugins on \'load\' message sends error if pluginsFile function throws an error 1'] = {
  "name": "ReferenceError",
  "message": "foo is not defined"
}

