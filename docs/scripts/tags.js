'use strict'
const util = require('hexo-util')
const urlGenerator = require('../lib/url_generator')

/* global hexo */

hexo.extend.tag.register('note', function (args, content) {
  // {% note info Want to see Cypress in action? %}
  // Explore talks, blogs, and podcasts about testing in Cypress.
  // {% endnote %}
  //
  // <<< Transforms into >>>
  //
  // <blockquote class="note info">
  //   <strong class="note-title">Want to see Cypress in action?</strong>
  //   <p>
  //     Explore talks, blogs, and podcasts about testing in Cypress.
  //   </p>
  // </blockquote>

  const iconLookup = {
    info: 'info',
    warning: 'exclamation',
    success: 'check',
    danger: 'times',
  }

  let header = ''
  const className = args.shift()
  const icon = iconLookup[className]

  if (args.length) {
    header += `<strong class="note-title foo">
      ${icon ? `<i class="fa fa-${icon}"></i>` : ''}
      ${args.join(' ')}
    </strong>`
  }

  return hexo.render.render({ text: content, engine: 'markdown' })
  .then((markdown) => {
    return `<blockquote class="note ${className}">${header}${markdown}</blockquote>`
  })
}, { async: true, ends: true })

hexo.extend.tag.register('fa', function (args) {
  // {% fa fa-angle-right green fa-fw %}
  //
  // <<< Transforms into >>>
  //
  // <i class="fa fa-angle-right"></i>

  const classNames = args.join(' ')

  return `<i class="fa ${classNames}"></i>`
})

hexo.extend.tag.register('url', function (args) {
  // {% link `.and()` and %}
  // {% link `.should()` should#notes %}
  // {% link 'Read about why' guides/getting-started/why-cypress %}
  //
  // <<< Transforms into >>>
  //
  // <a href="/api/commands/and.html"><code>.and()</code></a>
  // <a href="/api/commands/should.html#notes"><code>.should()</code></a>
  // <a href="/guides/getting-started/why-cypress.html">Read about why</a>

  const sidebar = this.site.data.sidebar

  const props = {
    text: args[0],
    url: args[1],
    external: args[2],
  }

  return hexo.render.render({ text: props.text, engine: 'markdown' })
  .then((markdown) => {
    // remove <p> and </p> and \n
    markdown = markdown
    .split("<p>").join("")
    .split("</p>").join("")
    .split("\n").join("")

    const attrs = {
      href: props.url,
    }

    if (props.external) {
      attrs.target = '_blank'
    }

    return urlGenerator.validateAndGetUrl(sidebar, attrs.href)
    .then((href) => {
      attrs.href = href

      return util.htmlTag('a', attrs, markdown)
    })

  })

}, { async: true })
