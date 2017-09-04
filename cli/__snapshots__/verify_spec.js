exports['.verify logs error and exits when no version of Cypress is installed 1'] = `[31mError: No version of Cypress executable is installed.[39m
[31m[39m
[31mPlease reinstall Cypress by running: [36mcypress install[31m[39m
[31m----------[39m
[31m[39m
[31mCypress executable not found at: [36m/path/to/executable[31m[39m
[31m----------[39m
[31m[39m
[31mPlatform: darwin (test release)[39m
[31mCypress Version: 1.2.3[39m
`

exports['.verify logs warning when installed version does not match package version 1'] = `[33mInstalled version [36mbloop[33m does not match the expected package version [36m0.19.4[33m[39m
[33m[39m
[33mNote: there is no guarantee these versions will work properly together.[39m
`

exports['.verify logs error and exits when executable cannot be found 1'] = `[31mError: No version of Cypress is installed.[39m
[31m[39m
[31mPlease reinstall Cypress by running: [36mcypress install[31m[39m
[31m----------[39m
[31m[39m
[31mCypress executable not found at: [36m/path/to/executable[31m[39m
[31m----------[39m
[31m[39m
[31mPlatform: darwin (test release)[39m
[31mCypress Version: 1.2.3[39m
`

