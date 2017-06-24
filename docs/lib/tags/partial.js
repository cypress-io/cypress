const path = require('path')

module.exports = function partial (hexo, fileName) {
  const pathToFile = path.resolve('source', '_partial', `${fileName}.md`)

  return hexo.render.render({ path: pathToFile, engine: 'markdown' })
}
