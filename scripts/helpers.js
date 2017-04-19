'use strict'

var pathFn = require('path')
var _ = require('lodash')
var url = require('url')
var cheerio = require('cheerio')
var lunr = require('lunr')

var localizedPath = ['guides', 'api']

function startsWith(str, start){
  return str.substring(0, start.length) === start
}

hexo.extend.helper.register('page_nav', function(){
  var type = this.page.canonical_path.split('/')[0]
  var sidebar = this.site.data.sidebar[type]
  var path = pathFn.basename(this.path)
  var list = {}
  var prefix = 'sidebar.' + type + '.'

  for (var i in sidebar){
    for (var j in sidebar[i]){
      list[sidebar[i][j]] = j
    }
  }

  var keys = Object.keys(list)
  var index = keys.indexOf(path)
  var result = ''

  if (index > 0){
    result += '<a href="' + keys[index - 1] + '" class="article-footer-prev" title="' + this.__(prefix + list[keys[index - 1]]) + '">' +
      '<i class="fa fa-chevron-left"></i><span>' + this.__('page.prev') + '</span></a>'
  }

  if (index < keys.length - 1){
    result += '<a href="' + keys[index + 1] + '" class="article-footer-next" title="' + this.__(prefix + list[keys[index + 1]]) + '">' +
      '<span>' + this.__('page.next') + '</span><i class="fa fa-chevron-right"></i></a>'
  }

  return result
})

hexo.extend.helper.register('doc_sidebar', function(className){
  var type = this.page.canonical_path.split('/')[0]
  var sidebar = this.site.data.sidebar[type]
  var path = pathFn.basename(this.path)
  var result = ''
  var self = this
  var prefix = 'sidebar.' + type + '.'

  _.each(sidebar, function(menu, title){
    result += '<strong class="' + className + '-title">' + self.__(prefix + title) + '</strong>'

    _.each(menu, function(link, text){
      var href = [type, title, link].join('/')
      var itemClass = className + '-link'
      if (link === path) itemClass += ' current'

      result += '<a href="/' + href + '" class="' + itemClass + '">' + self.__(prefix + text) + '</a>'
    })
  })

  return result
})

hexo.extend.helper.register('header_menu', function(className){
  var menu = this.site.data.menu
  var result = ''
  var self = this
  var lang = this.page.lang
  var isEnglish = lang === 'en'

  _.each(menu, function(path, title){
    if (!isEnglish && ~localizedPath.indexOf(title)) path = lang + path

    result += '<a href="' + self.url_for(path) + '" class="' + className + '-link">' + self.__('menu.' + title) + '</a>'
  })

  return result
})

hexo.extend.helper.register('canonical_url', function(lang){
  var path = this.page.canonical_path
  if (lang && lang !== 'en') path = lang + '/' + path

  return this.config.url + '/' + path
})

hexo.extend.helper.register('url_for_lang', function(path){
  var lang = this.page.lang
  var url = this.url_for(path)

  if (lang !== 'en' && url[0] === '/') url = '/' + lang + url

  return url
})

hexo.extend.helper.register('raw_link', function(path){
  return 'https://github.com/cypress-io/cypress-documentation/edit/master/source/' + path
})

hexo.extend.helper.register('page_anchor', function(str){
  var $ = cheerio.load(str, {decodeEntities: false})
  var headings = $('h1, h2, h3, h4, h5, h6')

  if (!headings.length) return str

  headings.each(function(){
    var id = $(this).attr('id')

    $(this)
      .addClass('article-heading')
      .append('<a class="article-anchor" href="#' + id + '" aria-hidden="true"></a>')
  })

  return $.html()
})

hexo.extend.helper.register('lunr_index', function(data){
  var index = lunr(function(){
    this.field('name', {boost: 10})
    this.field('tags', {boost: 50})
    this.field('description')
    this.ref('id')
  })

  _.sortBy(data, 'name').forEach(function(item, i){
    index.add(_.assign({id: i}, item))
  })

  return JSON.stringify(index.toJSON())
})

hexo.extend.helper.register('canonical_path_for_nav', function(){
  var path = this.page.canonical_path

  if (startsWith(path, 'guides/') || startsWith(path, 'api/')){
    return path
  } else {
    return ''
  }
})

// hexo.extend.helper.register('lang_name', function(lang){
//   var data = this.site.data.languages[lang]
//   return data.name || data
// })

hexo.extend.helper.register('disqus_lang', function(){
  var lang = this.page.lang
  var data = this.site.data.languages[lang]

  return data.disqus_lang || lang
})
