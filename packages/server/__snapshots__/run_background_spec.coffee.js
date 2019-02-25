exports['lib/background/child/run_background sends error message if backgroundFile is missing 1'] = `
Error: Cannot find module '/does/not/exist.coffee'
    at Function.Module._resolveFilename <path>loader.js
    at Module._load <path>loader.js
    at Function.hookedLoader [as _load] <path>mockery.js
    at Module.require <path>loader.js
    at require <path>helpers.js
    at module.exports <path>run_background.js
    at Context.<anonymous> <path>run_background_spec.coffee
    at callFn <path>runnable.js
    at Test.Runnable.run <path>runnable.js
    at Runner.runTest <path>runner.js
    at <path>runner.js
    at next <path>runner.js
    at <path>runner.js
    at next <path>runner.js
    at <path>runner.js
    at done <path>runnable.js
    at callFn <path>runnable.js
    at Hook.Runnable.run <path>runnable.js
    at next <path>runner.js
    at Immediate._onImmediate <path>runner.js
    at runCallback <path>timers.js
    at tryOnImmediate <path>timers.js
    at processImmediate <path>timers.js

`

exports['lib/background/child/run_background sends error message if requiring backgroundFile errors 1'] = `
Error: error thrown by backgroundFile
    at Object.<anonymous> <path>throws_error.coffee
    at Object.<anonymous> <path>throws_error.coffee
    at Module._compile <path>loader.js
    at Object.loadFile <path>register.js
    at Module.load <path>register.js
    at tryModuleLoad <path>loader.js
    at Module._load <path>loader.js
    at Function.hookedLoader [as _load] <path>mockery.js
    at Module.require <path>loader.js
    at require <path>helpers.js
    at module.exports <path>run_background.js
    at Context.<anonymous> <path>run_background_spec.coffee
    at callFn <path>runnable.js
    at Test.Runnable.run <path>runnable.js
    at Runner.runTest <path>runner.js
    at <path>runner.js
    at next <path>runner.js
    at <path>runner.js
    at next <path>runner.js
    at <path>runner.js
    at done <path>runnable.js
    at callFn <path>runnable.js
    at Hook.Runnable.run <path>runnable.js
    at next <path>runner.js
    at Immediate._onImmediate <path>runner.js
    at runCallback <path>timers.js
    at tryOnImmediate <path>timers.js
    at processImmediate <path>timers.js

`

exports['lib/background/child/run_background sends error message if backgroundFile has syntax error 1'] = `
<path>syntax_error.coffee) error: missing }
<color-code>{<color-code>
<color-code>^<color-code>
`

exports['lib/background/child/run_background sends error message if backgroundFile does not export a function 1'] = `
null
`
