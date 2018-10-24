/* eslint-disable
    default-case,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const convertNewLinesToBr = (text) => {
  return text.split('\n').join('<br />')
}

module.exports = {
  http (err, url) {
    return `\
Cypress errored attempting to make an http request to this url:

${url}


The error was:

${err.message}


The stack trace was:

${err.stack}\
`
  },

  file (url, status) {
    return `\
Cypress errored trying to serve this file from your system:

${url}

${status === 404 ? 'The file was not found.' : ''}\
`
  },

  wrap (contents) {
    return `\
<!DOCTYPE html>
<html>
<body>
  ${convertNewLinesToBr(contents)}
</body>
</html>\
`
  },

  get (err, url, status, strategy) {
    const contents =
      (() => {
        switch (strategy) {
          case 'http': return this.http(err, url)
          case 'file': return this.file(url, status)
        }
      })()

    return this.wrap(contents)
  },
}
