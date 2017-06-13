const cheerio = require('cheerio')

function addPageAnchors (str) {
  // use the htmlParser2 which does not add
  // <html><head><body to the resulting DOM
  // https://github.com/cheeriojs/cheerio/pull/1027/files
  const $ = cheerio.load(str, {
    useHtmlParser2: true,
    decodeEntities: false,
  })

  const $headings = $('h1, h2, h3, h4, h5, h6')

  if (!$headings.length) return str

  $headings.each(function () {
    const id = $(this).attr('id')

    $(this)
      .addClass('article-heading')
      .append(`<a class="article-anchor" href="#${id}" aria-hidden="true"></a>`)
  })

  return $.html()
}

module.exports = {
  addPageAnchors,
}
