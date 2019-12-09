// This file doesn't use AST because it makes things too complicated.
module.exports = (fileInfo) => {
  return fileInfo.source.replace(/\/\/#/g, '//')
}
