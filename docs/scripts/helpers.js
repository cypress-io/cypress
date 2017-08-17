'use strict'

/* global hexo */

const helpers = require('../lib/helpers')

let pathFn = require('path')
let _ = require('lodash')
let lunr = require('lunr')

let localizedPath = ['guides', 'api']

function startsWith (str, start) {
  return str.substring(0, start.length) === start
}

hexo.extend.helper.register('page_nav', function () {
  let type = this.page.canonical_path.split('/')[0]
  let sidebar = this.site.data.sidebar[type]
  let path = pathFn.basename(this.path)
  let list = {}
  let prefix = `sidebar.${type}.`

  for (let i in sidebar) {
    for (let j in sidebar[i]) {
      list[sidebar[i][j]] = { 'group': i, 'title': j }
    }
  }

  let keys = Object.keys(list)
  let index = keys.indexOf(path)
  let result = ''

  if (index > 0) {
    const group = list[keys[index - 1]].group
    const page = keys[index - 1]
    const title = list[keys[index - 1]].title
    const href = [type, group, page].join('/')

    result += `<a href="${this.config.root + href}" title="Prev Article" class="article-footer-prev"><i class="fa fa-chevron-left"></i><span>${this.__(prefix + title)}</span></a>`
  }

  if (index < keys.length - 1) {
    const group = list[keys[index + 1]].group
    const page = keys[index + 1]
    const title = list[keys[index + 1]].title
    const href = [type, group, page].join('/')

    result += `<a href="${this.config.root + href}" title="Next Article" class="article-footer-next"><span>${this.__(prefix + title)}</span><i class="fa fa-chevron-right"></i></a>`
  }

  return result
})

hexo.extend.helper.register('doc_sidebar', function (className) {
  let type = this.page.canonical_path.split('/')[0]
  let sidebar = this.site.data.sidebar[type]
  let path = pathFn.basename(this.path)
  let result = ''
  let self = this
  let prefix = `sidebar.${type}.`

  _.each(sidebar, function (menu, title) {
    result += `<strong class="${className}-title">${self.__(prefix + title)}</strong>`

    _.each(menu, function (link, text) {
      let href = [type, title, link].join('/')
      let itemClass = `${className}-link`
      if (link === path) itemClass += ' current'

      result += `<li class='sidebar-li'><a href="${self.config.root + href}" class="${itemClass}">
        ${self.__(prefix + text)}</a></li>`
    })
  })

  return result
})

hexo.extend.helper.register('menu', function (type) {
  let file = `${type}-menu`
  let menu = this.site.data[file]
  let self = this
  let lang = this.page.lang
  let isEnglish = lang === 'en'
  let currentPathFolder = this.path.split('/')[0]

  return _.reduce(menu, function (result, menuPath, title) {
    if (!isEnglish && ~localizedPath.indexOf(title)) {
      menuPath = lang + menuPath
    }
    // Sees if our current path is part of the menu's path
    // Capture the first folder
    // /guides/welcome/foo.html captures 'guides'
    let firstPathName = menuPath.split('/')[1]

    // Does our current path match our menu?
    let isCurrent = currentPathFolder === firstPathName

    return `${result}<a href="${self.url_for(menuPath)}" class="${type}-nav-link ${isCurrent ? 'active' : ''}"> ${self.__(`menu.${title}`)}</a>`
  }, '')
})

hexo.extend.helper.register('canonical_url', function (lang) {
  let path = this.page.canonical_path

  if (lang && lang !== 'en') path = `${lang}/${path}`

  return `${this.config.url}/${path}`
})

hexo.extend.helper.register('url_for_lang', function (path) {
  let lang = this.page.lang
  let url = this.url_for(path)

  if (lang !== 'en' && url[0] === '/') url = `/${lang}${url}`

  return url
})

hexo.extend.helper.register('raw_link', function (path) {
  return `https://github.com/cypress-io/cypress-documentation/edit/master/source/${path}`
})

hexo.extend.helper.register('add_page_anchors', helpers.addPageAnchors)

hexo.extend.helper.register('lunr_index', function (data) {
  let index = lunr(function () {
    this.field('name', { boost: 10 })
    this.field('tags', { boost: 50 })
    this.field('description')
    this.ref('id')
  })

  _.sortBy(data, 'name').forEach(function (item, i) {
    index.add(_.assign({ id: i }, item))
  })

  return JSON.stringify(index.toJSON())
})

hexo.extend.helper.register('canonical_path_for_nav', function () {
  let path = this.page.canonical_path

  if (startsWith(path, 'guides/') || startsWith(path, 'api/')) {
    return path
  } else {
    return ''
  }
})

hexo.extend.helper.register('lang_name', function (lang) {
  let data = this.site.data.languages[lang]
  return data.name || data
})

hexo.extend.helper.register('disqus_lang', function () {
  let lang = this.page.lang
  let data = this.site.data.languages[lang]

  return data.disqus_lang || lang
})
