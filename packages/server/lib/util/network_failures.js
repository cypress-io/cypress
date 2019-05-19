const { stripIndents, html } = require('common-tags')

const convertNewLinesToBr = (text) => {
  return text.split('\n').join('<br />')
}

const fileErr = (url, status) => {
  return stripIndents`
    Cypress errored trying to serve this file from your system:

    ${url}

    ${status === 404 ? 'The file was not found.' : ''}
  `
}

const wrap = (contents) => {
  return html`
    <!DOCTYPE html>
    <html>
    <body>
    ${convertNewLinesToBr(contents)}
    </body>
    </html>\
  `
}

const get = (url, status) => {
  const contents = fileErr(url, status)

  return wrap(contents)
}

module.exports = {
  fileErr,

  wrap,

  get,
}
