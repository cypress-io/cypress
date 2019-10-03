const pumpify = require('pumpify')
const { replaceStream } = require('./replace_stream')
const utf8Stream = require('utf8-stream')

function regexPart (re) {
  return re.toString().split('/')[1]
}

const whitespaceIncNewlinesRe = regexPart(/[^\S]/)

// https://stackoverflow.com/a/2008444/3474615
const javascriptIdentifierRe = regexPart(/[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*/)

const identifierPrefix = regexPart(new RegExp(
  `(${javascriptIdentifierRe})${whitespaceIncNewlinesRe}*`
))

// // validate that there is not identifier preceding this point
// //  $1: prefix of var name
// const notJavascriptIdentifierStartRe = regexPart(new RegExp(
//   `([^_$a-zA-Z\\xA0-\\uFFFF]|^)`,
//   'm'
// ))

// validate that there is not more identifier after this point
//  $1: end of var name
const notJavascriptIdentifierEndRe = regexPart(/([^_$a-zA-Z0-9\xA0-\uFFFF]|$)/m)

const suspectPropertiesRe = regexPart(/(parent|top)/)

// ["prop"]
//  $1: var name
//  $2: entire match after var name
//  $3: prop if 'prop"
//  $4: prop if "prop"
const bracketAccessRe = new RegExp(
  `${identifierPrefix}\[${whitespaceIncNewlinesRe}*(${
    [`'`, `"`].map((mark) => {
      return `${mark}${suspectPropertiesRe}${mark}`
    }).join('|')
  })${whitespaceIncNewlinesRe}*\]`,
  'g'
)

const bracketAccessReplacement = `(window.top.Cypress.resolveWindowReference(window, $1, '$3$4'))`

// .prop
//  $1: var name
//  $2: prop
//  $3: char following prop name
const dotAccessRe = new RegExp(
  `${identifierPrefix}\\.${whitespaceIncNewlinesRe}*${suspectPropertiesRe}${notJavascriptIdentifierEndRe}`,
  'gm'
  // `m` flag needed for $ in `notJavascriptIdentifierEndRe`
  // TODO: how should replace_stream handle `$` when in middle of stream?
)

const dotAccessReplacement = `(window.top.Cypress.resolveWindowReference(window, $1, '$2'))$3`

// const topOrParentEqualityBeforeRe = /((?:window|self)(?:\.|\[['"](?:top|self)['"]\])?\s*[!=]==?\s*(?:(?:window|self)(?:\.|\[['"]))?)(top|parent)(?![\w])/g
// const topOrParentEqualityAfterRe = /(top|parent)((?:["']\])?\s*[!=]==?\s*(?:window|self))/g
// const topOrParentLocationOrFramesRe = /([^\da-zA-Z\(\)])?(top|parent)([.])(location|frames)/g
// const jiraTopWindowGetterRe = /(!function\s*\((\w{1})\)\s*{\s*return\s*\w{1}\s*(?:={2,})\s*\w{1}\.parent)(\s*}\(\w{1}\))/g

const strip = (html) => {
  return html
  .replace(dotAccessRe, dotAccessReplacement)
  .replace(bracketAccessRe, bracketAccessReplacement)
  // .replace(topOrParentEqualityBeforeRe, '$1self')
  // .replace(topOrParentEqualityAfterRe, 'self$2')
  // .replace(topOrParentLocationOrFramesRe, '$1self$3$4')
  // .replace(jiraTopWindowGetterRe, '$1 || $2.parent.__Cypress__$3')
}

const stripStream = () => {
  return pumpify(
    utf8Stream(),
    replaceStream(
      [
        dotAccessRe,
        bracketAccessRe,
        // topOrParentEqualityBeforeRe,
        // topOrParentEqualityAfterRe,
        // topOrParentLocationOrFramesRe,
        // jiraTopWindowGetterRe,
      ],
      [
        dotAccessReplacement,
        bracketAccessReplacement,
        // '$1self',
        // 'self$2',
        // '$1self$3$4',
        // '$1 || $2.parent.__Cypress__$3',
      ]
    )
  )
}

module.exports = {
  strip,

  stripStream,
}
