exports['lib/plugins/child/run_plugins sends error message if pluginsFile is missing 1'] = `
Error: Cannot find module '/does/not/exist.coffee'
`

exports['lib/plugins/child/run_plugins sends error message if requiring pluginsFile errors 1'] = `
Error: error thrown by pluginsFile
`

exports['lib/plugins/child/run_plugins sends error message if pluginsFile has syntax error 1'] = `
<path>syntax_error.js)



SyntaxError: Unexpected end of input
[stack trace]
`

exports['lib/plugins/child/run_plugins sends error message if pluginsFile does not export a function 1'] = `
null
`
