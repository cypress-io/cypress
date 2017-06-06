'use strict'

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
    danger: 'times'
  }

  var className = args.shift()
  var header = ''
  var result = ''
  var icon = iconLookup[className]

  if (args.length) {
    header += `<strong class="note-title foo">
      ${icon ? `<i class="fa fa-${icon}"></i>` : ''}
      ${args.join(' ')}
    </strong>`
  }

  result += '<blockquote class="note ' + className + '">' + header
  result += hexo.render.renderSync({text: content, engine: 'markdown'})
  result += '</blockquote>'

  return result
}, true)

hexo.extend.tag.register('fa', function (args, content) {
  // {% fa fa-angle-right green fa-fw %}
  //
  // <<< Transforms into >>>
  //
  // <i class="fa fa-angle-right"></i>

  var classNames = args.join(' ')

  return '<i class="fa ' + classNames + '"></i>'
})

hexo.extend.tag.register('docLink', function (args, content) {
  var result = ''
  // {% docLink api `.and()` and %}
  // {% docLink guides 'Read about why' why-cypress %}
  //
  // <<< Transforms into >>>
  //
  // <a href="/api/commands/and.html"><code>.and()</code></a>
  // <a href="/guides/getting-started/why-cypress.html">Read about why</a>

  var attrs = {
    text: args[0],
    url: args[1]
  }

  result += `<a href="${attrs.url}.html">`
  result += hexo.render.renderSync({text: attrs.text, engine: 'markdown'})
  result += `</a>`

  return result
})
