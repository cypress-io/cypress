import * as inject from './inject'
import { strip, stripStream } from './security'

const doctypeRe = /(<\!doctype.*?>)/i
const headRe = /(<head(?!er).*?>)/i
const bodyRe = /(<body.*?>)/i
const htmlRe = /(<html.*?>)/i

export function html (html: string, domainName: string, wantsInjection, wantsSecurityRemoved) {
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
    html = strip(html)
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

export const security = stripStream
