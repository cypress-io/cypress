module.exports = function rawRender (hexo, text, options = {}) {
  const { engine } = options

  // renders using the low level hexo methods
  // which enables us to nest async tags
  // in renderable strings
  return hexo.extend.tag.render(text, this)
  .then((text) => {
    if (!engine) {
      return text
    }

    return hexo.render.renderSync({
      text,
      engine,
    })
  })
}
