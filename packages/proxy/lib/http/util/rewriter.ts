import * as inject from './inject'
import * as astRewriter from './ast-rewriter'
import * as regexRewriter from './regex-rewriter'
import type { CypressWantsInjection } from '../../types'
import type { SerializableAutomationCookie } from '@packages/server/lib/automation/cookie/jar'

export type SecurityOpts = {
  isNotJavascript?: boolean
  url: string
  useAstSourceRewriting: boolean
  modifyObstructiveThirdPartyCode: boolean
  modifyObstructiveCode: boolean
  removeSRIAttributes: boolean
  deferSourceMapRewrite: (opts: any) => string
}

export type InjectionOpts = {
  cspNonce?: string
  domainName: string
  wantsInjection: CypressWantsInjection
  wantsSecurityRemoved: any
  simulatedCookies: SerializableAutomationCookie[]
  shouldInjectDocumentDomain: boolean
}

const doctypeRe = /<\!doctype.*?>/i
const headRe = /<head(?!er).*?>/i
const bodyRe = /<body.*?>/i
const htmlRe = /<html.*?>/i
const bootstrapScriptRe = /(<script[^>]*\bdata-cy-bootstrap\b[^>]*>)([\s\S]*?)(<\/script>)/i

function getRewriter (useAstSourceRewriting: boolean) {
  return useAstSourceRewriting ? astRewriter : regexRewriter
}

function getHtmlToInject (opts: InjectionOpts & SecurityOpts) {
  const {
    cspNonce,
    domainName,
    wantsInjection,
    modifyObstructiveThirdPartyCode,
    modifyObstructiveCode,
    simulatedCookies,
    shouldInjectDocumentDomain,
  } = opts

  switch (wantsInjection) {
    case 'full':
      return inject.full(domainName, {
        shouldInjectDocumentDomain,
        cspNonce,
      })
    case 'fullCrossOrigin':
      return inject.fullCrossOrigin(domainName, {
        cspNonce,
        modifyObstructiveThirdPartyCode,
        modifyObstructiveCode,
        simulatedCookies,
        shouldInjectDocumentDomain,
      })
    case 'partial':
      return inject.partial(domainName, {
        shouldInjectDocumentDomain,
        cspNonce,
      })
    default:
      return
  }
}

// replaces HTML comments with same-length whitespace so the injection point
// regexes can't match tags inside comments, while every index stays aligned
// with the original html. a small scanner tracks tag and quoted-attribute
// state so `<!--` inside an attribute value is not mistaken for a comment,
// comments may close with `-->`, `--!>` or abruptly (`<!-->`, `<!--->`), and
// an unterminated comment blanks the rest of the document
const maskHtmlComments = (html: string) => {
  const masked: string[] = []
  let i = 0
  let inTag = false
  let quote = ''

  while (i < html.length) {
    const ch = html[i]

    if (inTag) {
      if (quote) {
        if (ch === quote) {
          quote = ''
        }
      } else if (ch === '"' || ch === '\'') {
        quote = ch
      } else if (ch === '>') {
        inTag = false
      }

      masked.push(ch)
      i++

      continue
    }

    if (html.startsWith('<!--', i)) {
      let end

      if (html.startsWith('>', i + 4)) {
        end = i + 5
      } else if (html.startsWith('->', i + 4)) {
        end = i + 6
      } else {
        const normalClose = html.indexOf('-->', i + 4)
        const bangClose = html.indexOf('--!>', i + 4)

        if (normalClose !== -1 && (bangClose === -1 || normalClose < bangClose)) {
          end = normalClose + 3
        } else if (bangClose !== -1) {
          end = bangClose + 4
        } else {
          end = html.length
        }
      }

      masked.push(' '.repeat(end - i))
      i = end

      continue
    }

    if (ch === '<' && /[a-zA-Z!/?]/.test(html[i + 1] || '')) {
      inTag = true
    }

    masked.push(ch)
    i++
  }

  return masked.join('')
}

const insertBefore = (originalString, match, stringToInsert) => {
  const index = match.index || 0

  return `${originalString.slice(0, index)}${stringToInsert} ${originalString.slice(index)}`
}

const insertAfter = (originalString, match, stringToInsert) => {
  const index = (match.index || 0) + match[0].length

  return `${originalString.slice(0, index)} ${stringToInsert}${originalString.slice(index)}`
}

export async function html (html: string, opts: SecurityOpts & InjectionOpts) {
  const htmlToInject = await Promise.resolve(getHtmlToInject(opts))

  // strip clickjacking and framebusting
  // from the HTML if we've been told to
  if (opts.wantsSecurityRemoved) {
    html = await Promise.resolve(getRewriter(opts.useAstSourceRewriting).strip(html, opts))
  }

  if (!htmlToInject) {
    return html
  }

  // search a comment-masked copy so a commented-out tag can't become the
  // injection point, then splice into the original html by index
  const searchableHtml = maskHtmlComments(html)

  const bootstrapMatch = searchableHtml.match(bootstrapScriptRe)

  if (bootstrapMatch) {
    const contentToInject = htmlToInject.replace(/^<script[^>]*>|<\/script>$/g, '')
    let openTag = bootstrapMatch[1]

    // Ensure nonce is present if provided in options
    if (opts.cspNonce && !openTag.includes('nonce=')) {
      openTag = openTag.replace(/>$/, ` nonce="${opts.cspNonce}">`)
    }

    const start = bootstrapMatch.index || 0
    const end = start + bootstrapMatch[0].length

    return `${html.slice(0, start)}${openTag}${contentToInject}${bootstrapMatch[3]}${html.slice(end)}`
  }

  // TODO: move this into regex-rewriting and have ast-rewriting handle this in its own way

  const headMatch = searchableHtml.match(headRe)

  if (headMatch) {
    return insertAfter(html, headMatch, htmlToInject)
  }

  const bodyMatch = searchableHtml.match(bodyRe)

  if (bodyMatch) {
    return insertBefore(html, bodyMatch, `<head> ${htmlToInject} </head>`)
  }

  const htmlMatch = searchableHtml.match(htmlRe)

  if (htmlMatch) {
    return insertAfter(html, htmlMatch, `<head> ${htmlToInject} </head>`)
  }

  // if only <!DOCTYPE> content, inject <head> after doctype
  if (doctypeRe.test(searchableHtml)) {
    return `${html}<head> ${htmlToInject} </head>`
  }

  return `<head> ${htmlToInject} </head>${html}`
}

export function security (opts: SecurityOpts) {
  return getRewriter(opts.useAstSourceRewriting).stripStream(opts)
}
