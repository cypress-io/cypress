import * as inject from './inject'
import * as astRewriter from './ast-rewriter'
import * as regexRewriter from './regex-rewriter'
import type { CypressWantsInjection } from '../../types'
import type { SerializableAutomationCookie } from '@packages/server/lib/util/cookies'

export type SecurityOpts = {
  isNotJavascript?: boolean
  url: string
  useAstSourceRewriting: boolean
  modifyObstructiveThirdPartyCode: boolean
  modifyObstructiveCode: boolean
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

  // TODO: move this into regex-rewriting and have ast-rewriting handle this in its own way

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
  return getRewriter(opts.useAstSourceRewriting).stripStream(opts)
}
