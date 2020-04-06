import * as inject from './inject'
import * as jsRewriter from './js-rewriter'
import * as regexRewriter from './regex-rewriter'

const doctypeRe = /(<\!doctype.*?>)/i
const headRe = /(<head(?!er).*?>)/i
const bodyRe = /(<body.*?>)/i
const htmlRe = /(<html.*?>)/i

function getRewriter (useSourceRewriting: boolean) {
  return useSourceRewriting ? jsRewriter : regexRewriter
}

export function html (html: string, domainName: string, wantsInjection, wantsSecurityRemoved, isHtml, useSourceRewriting) {
  const replace = (re, str) => {
    return html.replace(re, str)
  }

  const htmlToInject = (() => {
    switch (wantsInjection) {
      case 'full':
        return inject.full(domainName)
      case 'partial':
        return inject.partial(domainName)
      default:
        return
    }
  })()

  // strip clickjacking and framebusting
  // from the HTML if we've been told to
  if (wantsSecurityRemoved) {
    html = getRewriter(useSourceRewriting).strip(html, { isHtml })
  }

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

export function security (opts) {
  return getRewriter(opts.useSourceRewriting).stripStream(opts)
}
