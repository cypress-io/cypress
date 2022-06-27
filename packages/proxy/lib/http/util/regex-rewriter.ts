const pumpify = require('pumpify')
const { replaceStream } = require('./replace_stream')
const utf8Stream = require('utf8-stream')

const topOrParentEqualityBeforeRe = /((?:\bwindow\b|\bself\b)(?:\.|\[['"](?:top|self)['"]\])?\s*[!=]==?\s*(?:(?:window|self)(?:\.|\[['"]))?)(top|parent)(?![\w])/g
const topOrParentEqualityAfterRe = /(top|parent)((?:["']\])?\s*[!=]==?\s*(?:\bwindow\b|\bself\b))/g
const topOrParentEqualityRe = /e.self===e.top/g
const topOrParentLocationOrFramesRe = /([^\da-zA-Z\(\)])?(\btop\b|\bparent\b)([.])(\blocation\b|\bframes\b)/g
const formTopTarget = /target="_top"/g
const jiraTopWindowGetterRe = /(!function\s*\((\w{1})\)\s*{\s*return\s*\w{1}\s*(?:={2,})\s*\w{1}\.parent)(\s*}\(\w{1}\))/g
const jiraTopWindowGetterUnMinifiedRe = /(function\s*\w{1,}\s*\((\w{1})\)\s*{\s*return\s*\w{1}\s*(?:={2,})\s*\w{1}\.parent)(\s*;\s*})/g
// since lookbacks must be a fixed quantifier, we cannot match on script/link tags and need to look ahead to known values
// this means we might be striping link integrity when we don't need to, especially link tags
const integrityTagLookAhead = /(?<=\s)integrity(?==(?:\"|\')sha(?:256|384|512)-.*?(?:\"|\'))|^integrity$/g
const integrityStripped = 'cypress:stripped-integrity'

// TODO: also need to try and handle dynamic integrity. like .setAttribute('integrity') we could likely replace

export function strip (html: string) {
  // TODO: maybe put this behind a flag?
  return html
  .replace(integrityTagLookAhead, integrityStripped)
  .replace(topOrParentEqualityBeforeRe, '$1self')
  .replace(topOrParentEqualityAfterRe, 'self$2')
  .replace(topOrParentLocationOrFramesRe, '$1self$3$4')
  .replace(formTopTarget, 'target="_self"')
  // TODO: add unit tests for this and harden
  .replace(topOrParentEqualityRe, 'e.self===e.self') // TODO: maybe do single character comparison here, like [a-Z].self?
  .replace(jiraTopWindowGetterRe, '$1 || $2.parent.__Cypress__$3')
  .replace(jiraTopWindowGetterUnMinifiedRe, '$1 || $2.parent.__Cypress__$3')
}

export function stripStream () {
  return pumpify(
    utf8Stream(),
    replaceStream(
      [
        topOrParentEqualityBeforeRe,
        topOrParentEqualityAfterRe,
        topOrParentEqualityRe,
        topOrParentLocationOrFramesRe,
        formTopTarget,
        jiraTopWindowGetterRe,
        jiraTopWindowGetterUnMinifiedRe,
        integrityTagLookAhead,
      ],
      [
        '$1self',
        'self$2',
        'e.self===e.self',
        '$1self$3$4',
        'target="_self"',
        '$1 || $2.parent.__Cypress__$3',
        '$1 || $2.parent.__Cypress__$3',
        integrityStripped,
      ],
    ),
  )
}
