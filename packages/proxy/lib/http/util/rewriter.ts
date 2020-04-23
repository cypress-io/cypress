import * as inject from './inject'
import * as astRewriter from './ast-rewriter'
import * as regexRewriter from './regex-rewriter'

export type SecurityOpts = {
  isHtml?: boolean
  url: string
  useAstSourceRewriting: boolean
  deferSourceMapRewrite: (opts: any) => string
}

export type InjectionOpts = {
  domainName: string
  wantsInjection: WantsInjection
  wantsSecurityRemoved: any
}

const doctypeRe = /(<\!doctype.*?>)/i
const headRe = /(<head(?!er).*?>)/i
const bodyRe = /(<body.*?>)/i
const htmlRe = /(<html.*?>)/i

type WantsInjection = 'full' | 'partial' | false

function getRewriter (useAstSourceRewriting: boolean) {
  return useAstSourceRewriting ? astRewriter : regexRewriter
}

function getHtmlToInject ({ domainName, wantsInjection }: InjectionOpts) {
  switch (wantsInjection) {
    case 'full':
      return inject.full(domainName)
    case 'partial':
      return inject.partial(domainName)
    default:
      return
  }
}

export async function html (html: string, opts: SecurityOpts & InjectionOpts) {
  const replace = (re, str) => {
    return html.replace(re, str)
  }

  const htmlToInject = getHtmlToInject(opts)

  // strip clickjacking and framebusting
  // from the HTML if we've been told to
  if (opts.wantsSecurityRemoved) {
    html = await Promise.resolve(getRewriter(opts.useAstSourceRewriting).strip(html, opts))
  }

  if (!htmlToInject) {
    return html
  }

  // TODO: move this into regex-rewriting and have ast-rewriting handle this in its own way
  switch (false) {
    case !headRe.test(html):
      return replace(headRe, `$1 ${htmlToInject}`)

    case !bodyRe.test(html):
      return replace(bodyRe, `<head> ${htmlToInject} </head> $1`)

    case !htmlRe.test(html):
      return replace(htmlRe, `$1 <head> ${htmlToInject} </head>`)

    case !doctypeRe.test(html):
      // if only <!DOCTYPE> content, inject <head> after doctype
      return `${html}<head> ${htmlToInject} </head>`

    default:
      return `<head> ${htmlToInject} </head>${html}`
  }
}

export function security (opts: SecurityOpts) {
  return getRewriter(opts.useAstSourceRewriting).stripStream(opts)
}
