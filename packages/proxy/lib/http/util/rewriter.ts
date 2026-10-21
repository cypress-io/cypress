import * as inject from './inject'
import * as regexRewriter from './regex-rewriter'
import type { CypressWantsInjection } from '../../types'
import type { SerializableAutomationCookie } from '@packages/server/lib/automation/cookie/jar'

export type SecurityOpts = {
  url: string
  modifyObstructiveThirdPartyCode: boolean
  modifyObstructiveCode: boolean
  removeSRIAttributes: boolean
}

export type InjectionOpts = {
  cspNonce?: string
  domainName: string
  wantsInjection: CypressWantsInjection
  wantsSecurityRemoved: any
  simulatedCookies: SerializableAutomationCookie[]
  shouldInjectDocumentDomain: boolean
  isXhtml?: boolean
}

const doctypeRe = /<\!doctype.*?>/i
const headRe = /<head(?!er).*?>/i
const bodyRe = /<body.*?>/i
const htmlRe = /<html.*?>/i
const bootstrapScriptRe = /(<script[^>]*\bdata-cy-bootstrap\b[^>]*>)([\s\S]*?)(<\/script>)/i
const selfClosingBootstrapScriptRe = /(<script[^>]*?\bdata-cy-bootstrap\b[^>]*?)\s*\/>/i

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

// An XHTML document goes through the browser's XML parser, which rejects the bare `<` and `&`
// in the injected JavaScript and renders a <parsererror> page in place of the document. A CDATA
// section passes the script through verbatim; any `]]>` inside it is split across two sections.
const wrapScriptInCdata = (script: string) => {
  return script.replace(/^(<script[^>]*>)([\s\S]*)(<\/script>)$/, (match, openTag, body, closeTag) => {
    return `${openTag}<![CDATA[${body.replaceAll(']]>', ']]]]><![CDATA[>')}]]>${closeTag}`
  })
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
  let htmlToInject = await Promise.resolve(getHtmlToInject(opts))

  if (htmlToInject && opts.isXhtml) {
    htmlToInject = wrapScriptInCdata(htmlToInject)
  }

  // strip clickjacking and framebusting
  // from the HTML if we've been told to
  if (opts.wantsSecurityRemoved) {
    html = regexRewriter.strip(html, opts)
  }

  if (!htmlToInject) {
    return html
  }

  // In XHTML a self-closing `<script data-cy-bootstrap="" />` is a complete element, but
  // bootstrapScriptRe reads up to the next `</script>` the way an HTML parser would.
  if (opts.isXhtml) {
    html = html.replace(selfClosingBootstrapScriptRe, '$1></script>')
  }

  const bootstrapMatch = html.match(bootstrapScriptRe)

  if (bootstrapMatch) {
    const contentToInject = htmlToInject.replace(/^<script[^>]*>|<\/script>$/g, '')
    let openTag = bootstrapMatch[1]

    // Ensure nonce is present if provided in options
    if (opts.cspNonce && !openTag.includes('nonce=')) {
      openTag = openTag.replace(/>$/, ` nonce="${opts.cspNonce}">`)
    }

    return html.replace(bootstrapScriptRe, `${openTag}${contentToInject}${bootstrapMatch[3]}`)
  }

  // TODO: move this into regex-rewriting

  const headMatch = html.match(headRe)

  if (headMatch) {
    return insertAfter(html, headMatch, htmlToInject)
  }

  const bodyMatch = html.match(bodyRe)

  if (bodyMatch) {
    return insertBefore(html, bodyMatch, `<head> ${htmlToInject} </head>`)
  }

  const htmlMatch = html.match(htmlRe)

  if (htmlMatch) {
    return insertAfter(html, htmlMatch, `<head> ${htmlToInject} </head>`)
  }

  // if only <!DOCTYPE> content, inject <head> after doctype
  if (doctypeRe.test(html)) {
    return `${html}<head> ${htmlToInject} </head>`
  }

  return `<head> ${htmlToInject} </head>${html}`
}

export function security (opts: SecurityOpts) {
  return regexRewriter.stripStream(opts)
}
