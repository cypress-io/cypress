/* eslint-disable
    default-case,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const inject = require('./inject')
const security = require('./security')

const headRe = /(<head(?!er).*?>)/i
const bodyRe = /(<body.*?>)/i
const htmlRe = /(<html.*?>)/i

const rewriteHtml = function (html, domainName, wantsInjection, wantsSecurityRemoved) {
  const replace = (re, str) => {
    return html.replace(re, str)
  }

  const htmlToInject = (() => {
    switch (wantsInjection) {
      case 'full':
        return inject.full(domainName)
      case 'partial':
        return inject.partial(domainName)
    }
  })()

  //# strip clickjacking and framebusting
  //# from the HTML if we've been told to
  if (wantsSecurityRemoved) {
    html = security.strip(html)
  }

  switch (false) {
    case !headRe.test(html):
      return replace(headRe, `$1 ${htmlToInject}`)

    case !bodyRe.test(html):
      return replace(bodyRe, `<head> ${htmlToInject} </head> $1`)

    case !htmlRe.test(html):
      return replace(htmlRe, `$1 <head> ${htmlToInject} </head>`)

    default:
      return `<head> ${htmlToInject} </head>${html}`
  }
}

module.exports = {
  html: rewriteHtml,

  security: security.stripStream,
}
