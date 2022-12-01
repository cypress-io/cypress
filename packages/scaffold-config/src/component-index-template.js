'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const tslib_1 = require('tslib')
const dedent_1 = tslib_1.__importDefault(require('dedent'))
const componentIndexHtmlGenerator = (headModifier = '') => {
  return () => {
    const template = (0, dedent_1.default) `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>Components App</title>
        ${headModifier}
      </head>
      <body>
        <div data-cy-root></div>
      </body>
    </html>
  `

    // If the framework supplies an empty string for the modifier,
    // strip out the empty line
    return template.replace(/\n {4}\n/g, '\n')
  }
}

exports.default = componentIndexHtmlGenerator
