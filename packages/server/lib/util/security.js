const _ = require('lodash')
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
  `${identifierPrefix}\\[${whitespaceIncNewlinesRe}*(${
    [`'`, `"`].map((mark) => {
      return `${mark}${suspectPropertiesRe}${mark}`
    }).join('|')
  })${whitespaceIncNewlinesRe}*\\]`,
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

// need to inject a ternary to determine if `prop === window.prop` (has not been redefined in a closure), now we're having fun
const closureDetectionTern = (match) => {
  return `($${match} === window['$${match}'] ? window.top.Cypress.resolveWindowReference(window, window, '$${match}') : $${match})`
}

// if (window != top) {
//  $1: window !=
//  $2: top
const topOrParentEqualityBeforeRe = /((?:window|self)(?:\.|\[['"](?:top|self)['"]\])?\s*[!=]==?\s*(?:(?:window|self)(?:\.|\[['"]))?)(top|parent)(?![\w])/g

const topOrParentEqualityBeforeReplacement = `$1${closureDetectionTern(2)}`

// if (top != self) {
//  $1: top
//  $2:  != self
const topOrParentEqualityAfterRe = /(top|parent)((?:["']\])?\s*[!=]==?\s*(?:window|self))/g

const topOrParentEqualityAfterReplacement = `${closureDetectionTern(1)}$2`

// if (top.location != self.location) run()
//  $1: prefix, if any
//  $2: top
//  $3: location

const topOrParentLocationOrFramesRe = /([^\da-zA-Z\(\)])?(top|parent)\.(location|frames)/g

const topOrParentLocationOrFramesReplacement = `$1${closureDetectionTern(2)}.$3`

// TODO: necessary to still do? should be covered by `dotAccessReplacement`
// const jiraTopWindowGetterRe = /(!function\s*\((\w{1})\)\s*{\s*return\s*\w{1}\s*(?:={2,})\s*\w{1}\.parent)(\s*}\(\w{1}\))/g

const transforms = [
  {
    from: dotAccessRe,
    to: dotAccessReplacement,
  },
  {
    from: bracketAccessRe,
    to: bracketAccessReplacement,
  },
  {
    from: topOrParentEqualityAfterRe,
    to: topOrParentEqualityAfterReplacement,
  },
  {
    from: topOrParentEqualityBeforeRe,
    to: topOrParentEqualityBeforeReplacement,
  },
  {
    from: topOrParentLocationOrFramesRe,
    to: topOrParentLocationOrFramesReplacement,
  },
]

const strip = (html) => {
  transforms.forEach(({ from, to }) => {
    html = html.replace(from, to)
  })

  return html
}

const stripStream = () => {
  return pumpify(
    utf8Stream(),
    replaceStream(
      _.map(transforms, _.property('from')),
      _.map(transforms, _.property('to'))
    )
  )
}

module.exports = {
  strip,

  stripStream,
}
