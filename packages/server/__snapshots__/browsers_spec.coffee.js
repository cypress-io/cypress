exports['lib/browsers/index .extendLaunchOptionsFromPlugins throws an error if unexpected property passed 1'] = `
The \`launchOptions\` returned by your plugin's \`browser:before:launch\` handler contained unexpected properties:

 > foo

\`before:browser:launch\` only expects \`launchOptions\` to have \`args\`, \`preferences\`, \`extensions\`, and \`fullscreen\`.

Please refer to the documentation for \`before:browser:launch\`: [33mhttps://on.cypress.io/browser-launch-api[39m
`

exports['lib/browsers/index .extendLaunchOptionsFromPlugins warns if array passed and changes it to args 1'] = `
Deprecation Warning: The \`before:browser:launch\` plugin event changed its signature in version \`4.0.0\`

The \`before:browser:launch\` plugin event switched from yielding the second argument as an \`array\` of browser arguments to an options \`object\` with an \`args\` property.

We've detected that your code is still using the previous, deprecated interface signature.

This code will not work in a future version of Cypress. Please see the upgrade guide: [33mhttps://on.cypress.io/deprecated-before-browser-launch-args[39m
`
