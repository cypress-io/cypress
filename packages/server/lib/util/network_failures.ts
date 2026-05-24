import { stripIndents, html } from 'common-tags'

const convertNewLinesToBr = (text: string): string => {
  return text.split('\n').join('<br />')
}

export const fileErr = (url: string, status: number): string => {
  return stripIndents`
    Cypress errored trying to serve this file from your system:

    ${url}

    ${status === 404 ? 'The file was not found.' : ''}
  `
}

export const wrap = (contents: string): string => {
  return html`
    <!DOCTYPE html>
    <html>
    <body>
    ${convertNewLinesToBr(contents)}
    </body>
    </html>\
  `
}

export const get = (url: string, status: number): string => {
  const contents = fileErr(url, status)

  return wrap(contents)
}
