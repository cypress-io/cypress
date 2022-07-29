import { STRIPPED_INTEGRITY_TAG } from '@packages/rewriter'
import type { SecurityOpts } from './rewriter'

const pumpify = require('pumpify')
const { replaceStream } = require('./replace_stream')
const utf8Stream = require('utf8-stream')

const topOrParentEqualityBeforeRe = /((?:\bwindow\b|\bself\b)(?:\.|\[['"](?:top|self)['"]\])?\s*[!=]==?\s*(?:(?:window|self)(?:\.|\[['"]))?)(top|parent)(?![\w])/g
const topOrParentEqualityAfterRe = /(top|parent)((?:["']\])?\s*[!=]==?\s*(?:\bwindow\b|\bself\b))/g

// expand the equality checks to also look for patterns similar to e.self === e.top
const topOrParentExpandedEqualityBeforeRe = /((?:\bwindow\b|\bself\b|\b[a-zA-z]\.\b)(?:\.|\[['"](?:top|self)['"]\])?\s*[!=]==?\s*(?:(?:window|self|[a-zA-z])(?:\.|\[['"]))?)(top|parent)(?![\w])/g
const topOrParentExpandedEqualityAfterRe = /(top|parent)((?:["']\])?\s*[!=]==?\s*(?:\bwindow\b|\b(?:[a-zA-z]\.)?self\b))/g

const topOrParentLocationOrFramesRe = /([^\da-zA-Z\(\)])?(\btop\b|\bparent\b)([.])(\blocation\b|\bframes\b)/g

const jiraTopWindowGetterRe = /(!function\s*\((\w{1})\)\s*{\s*return\s*\w{1}\s*(?:={2,})\s*\w{1}\.parent)(\s*}\(\w{1}\))/g
const jiraTopWindowGetterUnMinifiedRe = /(function\s*\w{1,}\s*\((\w{1})\)\s*{\s*return\s*\w{1}\s*(?:={2,})\s*\w{1}\.parent)(\s*;\s*})/g

const integrityTagReplacementRe = new RegExp(`(${STRIPPED_INTEGRITY_TAG}|integrity)(=(?:\"|\')sha(?:256|384|512)-.*?(?:\"|\'))`, 'g')

export function strip (html: string, { modifyObstructiveThirdPartyCode }: Partial<SecurityOpts> = {
  modifyObstructiveThirdPartyCode: false,
}) {
  let rewrittenHTML = html
  .replace(modifyObstructiveThirdPartyCode ? topOrParentExpandedEqualityBeforeRe : topOrParentEqualityBeforeRe, '$1self')
  .replace(modifyObstructiveThirdPartyCode ? topOrParentExpandedEqualityAfterRe : topOrParentEqualityAfterRe, 'self$2')
  .replace(topOrParentLocationOrFramesRe, '$1self$3$4')
  .replace(jiraTopWindowGetterRe, '$1 || $2.parent.__Cypress__$3')
  .replace(jiraTopWindowGetterUnMinifiedRe, '$1 || $2.parent.__Cypress__$3')

  if (modifyObstructiveThirdPartyCode) {
    rewrittenHTML = rewrittenHTML.replace(integrityTagReplacementRe, `${STRIPPED_INTEGRITY_TAG}$2`)
  }

  return rewrittenHTML
}

export function stripStream ({ modifyObstructiveThirdPartyCode }: Partial<SecurityOpts> = {
  modifyObstructiveThirdPartyCode: false,
}) {
  return pumpify(
    utf8Stream(),
    replaceStream(
      [
        modifyObstructiveThirdPartyCode ? topOrParentExpandedEqualityBeforeRe : topOrParentEqualityBeforeRe,
        modifyObstructiveThirdPartyCode ? topOrParentExpandedEqualityAfterRe : topOrParentEqualityAfterRe,
        topOrParentLocationOrFramesRe,
        jiraTopWindowGetterRe,
        jiraTopWindowGetterUnMinifiedRe,
        ...(modifyObstructiveThirdPartyCode ? [
          integrityTagReplacementRe,
        ] : []),
      ],
      [
        '$1self',
        'self$2',
        '$1self$3$4',
        '$1 || $2.parent.__Cypress__$3',
        '$1 || $2.parent.__Cypress__$3',
        ...(modifyObstructiveThirdPartyCode ? [
          `${STRIPPED_INTEGRITY_TAG}$2`,
        ] : []),
      ],
    ),
  )
}
