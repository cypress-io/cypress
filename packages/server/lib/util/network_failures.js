const convertNewLinesToBr = (text) => {
  return text.split('\n').join('<br />')
}

module.exports = {
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

  get (url, status) {
    const contents = this.file(url, status)

    return this.wrap(contents)
  },
}
