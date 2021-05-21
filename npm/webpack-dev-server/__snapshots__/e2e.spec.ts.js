exports['#startDevServer emits dev-server:compile:error event on error compilation 1'] = `
./test/fixtures/compilation-fails.spec.js 1:5
Module parse failed: Unexpected token (1:5)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
> this is an invalid spec file 
 @ ./dist/browser.js (./dist/loader.js!./dist/browser.js) 5:16-155
 @ ./dist/browser.js
`
