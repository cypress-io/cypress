import type { SecurityOpts } from './rewriter'

const pumpify = require('pumpify')
const { replaceStream } = require('./replace_stream')
const utf8Stream = require('utf8-stream')
const integrityStrippedAttributeTag = 'cypress-stripped-integrity'

const topOrParentEqualityBeforeRe = /((?:\bwindow\b|\bself\b)(?:\.|\[['"](?:top|self)['"]\])?\s*[!=]==?\s*(?:(?:window|self)(?:\.|\[['"]))?)(top|parent)(?![\w])/g
const topOrParentEqualityAfterRe = /(top|parent)((?:["']\])?\s*[!=]==?\s*(?:\bwindow\b|\bself\b))/g
const topOrParentLocationOrFramesRe = /([^\da-zA-Z\(\)])?(\btop\b|\bparent\b)([.])(\blocation\b|\bframes\b)/g

const jiraTopWindowGetterRe = /(!function\s*\((\w{1})\)\s*{\s*return\s*\w{1}\s*(?:={2,})\s*\w{1}\.parent)(\s*}\(\w{1}\))/g
const jiraTopWindowGetterUnMinifiedRe = /(function\s*\w{1,}\s*\((\w{1})\)\s*{\s*return\s*\w{1}\s*(?:={2,})\s*\w{1}\.parent)(\s*;\s*})/g

const topIsSelfEqualityRe = /(?<=[a-zA-z]\.self==[a-zA-z]\.)top|(?<=[a-zA-z]\.self===[a-zA-z]\.)top|top(?===[a-zA-z]\.self)|top(?====[a-zA-z]\.self)|^top$/g
const formTopTarget = /target="_top"/g
// since regex lookbehinds must be a fixed quantifier, we cannot match on script/link tags and need to look ahead to known values
// this means we might be striping link integrity when we don't need to, especially link tags
const integrityTagLookAheadRe = /(?<=\s)integrity(?==(?:\"|\')sha(?:256|384|512)-.*?(?:\"|\'))|^integrity$/g
const dynamicIntegritySetAttributeRe = /(?<=[a-zA-z]\.setAttribute\((?:\"|\'))integrity(?=\"|\')|^integrity$/g

export function strip (html: string, { useExpandedModifyObstructiveCode }: Partial<SecurityOpts> = {
  useExpandedModifyObstructiveCode: false,
}) {
  const rewrittenHTML = html
  .replace(topOrParentEqualityBeforeRe, '$1self')
  .replace(topOrParentEqualityAfterRe, 'self$2')
  .replace(topOrParentLocationOrFramesRe, '$1self$3$4')
  .replace(jiraTopWindowGetterRe, '$1 || $2.parent.__Cypress__$3')
  .replace(jiraTopWindowGetterUnMinifiedRe, '$1 || $2.parent.__Cypress__$3')

  if (useExpandedModifyObstructiveCode) {
    return rewrittenHTML
    .replace(topIsSelfEqualityRe, 'self')
    .replace(formTopTarget, 'target="_self"')
    .replace(integrityTagLookAheadRe, integrityStrippedAttributeTag)
    .replace(dynamicIntegritySetAttributeRe, integrityStrippedAttributeTag)
  }

  return rewrittenHTML
}

export function stripStream ({ useExpandedModifyObstructiveCode }: Partial<SecurityOpts> = {
  useExpandedModifyObstructiveCode: false,
}) {
  return pumpify(
    utf8Stream(),
    replaceStream(
      [
        topOrParentEqualityBeforeRe,
        topOrParentEqualityAfterRe,
        topOrParentLocationOrFramesRe,
        jiraTopWindowGetterRe,
        jiraTopWindowGetterUnMinifiedRe,
        ...(useExpandedModifyObstructiveCode ? [
          topIsSelfEqualityRe,
          formTopTarget,
          integrityTagLookAheadRe,
          dynamicIntegritySetAttributeRe,
        ] : []),
      ],
      [
        '$1self',
        'self$2',
        '$1self$3$4',
        '$1 || $2.parent.__Cypress__$3',
        '$1 || $2.parent.__Cypress__$3',
        ...(useExpandedModifyObstructiveCode ? [
          'self',
          'target="_self"',
          integrityStrippedAttributeTag,
          integrityStrippedAttributeTag,
        ] : []),
      ],
    ),
  )
}
