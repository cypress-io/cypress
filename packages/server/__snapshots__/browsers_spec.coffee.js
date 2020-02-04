exports['lib/browsers/index .extendLaunchOptionsFromPlugins throws an error if unexpected property passed 1'] = `
The \`launchOptions\` object returned by your plugin's \`browser:before:launch\` handler contained unexpected properties:

 - [34mfoo[39m

\`launchOptions\` may only contain the properties:

- [34mpreferences[39m
- [34mextensions[39m
- [34margs[39m
- [34mwindowSize[39m

https://on.cypress.io/browser-launch-api
`

exports['lib/browsers/index .extendLaunchOptionsFromPlugins warns if array passed and changes it to args 1'] = `
Deprecation Warning: The \`before:browser:launch\` plugin event changed its signature in version \`4.0.0\`

The \`before:browser:launch\` plugin event switched from yielding the second argument as an \`array\` of browser arguments to an options \`object\` with an \`args\` property.

We've detected that your code is still using the previous, deprecated interface signature.

This code will not work in a future version of Cypress. Please see the upgrade guide: [33mhttps://on.cypress.io/deprecated-before-browser-launch-args[39m
`
