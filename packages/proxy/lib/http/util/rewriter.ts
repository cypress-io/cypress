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

const doctypeRe = /^[\s]*?<\!doctype.*?>/i

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

  const doctypeMatch = html.match(doctypeRe)

  if (doctypeMatch) {
    return insertAfter(html, doctypeMatch, htmlToInject)
  }

  return `${htmlToInject} ${html}`
}

export function security (opts: SecurityOpts) {
  return getRewriter(opts.useAstSourceRewriting).stripStream(opts)
}
