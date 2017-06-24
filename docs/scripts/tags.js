'use strict'
const path = require('path')
const util = require('hexo-util')
const chalk = require('chalk')
const beeper = require('beeper')
const urlGenerator = require('../lib/url_generator')

/* global hexo */

function beepAndLog (err) {
  beeper(1)

  /* eslint-disable no-console */
  console.error(chalk.red(err.stack))
}

function rawRender (text, options = {}) {
  const { engine } = options

  // renders using the low level hexo methods
  // which enables us to nest async tags
  // in renderable strings
  return hexo.extend.tag.render(text, this)
  .then((text) => {
    if (!engine) {
      return text
    }

    return hexo.render.render({
      text,
      engine,
    })
  })
  .catch(beepAndLog)
}

function getUrlProps (href, text) {
  const sidebar = this.site.data.sidebar

  // onRender callback to generate
  // the markdown for each internal document
  const onRender = (text) => {
    return hexo.render.render({ text, engine: 'markdown' })
  }

  return urlGenerator.validateAndGetUrl(sidebar, href, this.full_source, text, onRender)
  .catch(beepAndLog)
}

function helperIconUrl (url) {
  const icon = '<i class="fa fa-question-circle"></i>'

  url = `{% url -placeholder- ${url} %}`

  return rawRender.call(this, url)
  .then((markdown) => {
    return markdown.replace('-placeholder-', icon)
  })
}

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
    info: 'info-circle',
    warning: 'exclamation-circle',
    success: 'check-circle',
    danger: 'times-circle',
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
  .catch(beepAndLog)
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

hexo.extend.tag.register('open_an_issue', function (args) {
  // {% open_an_issue %}
  // {% open_an_issue 'here' %}

  const attrs = {
    href: 'https://github.com/cypress-io/cypress/issues/new',
    target: '_blank',
  }

  const text = args[0] || 'Open an issue'

  return util.htmlTag('a', attrs, text)
})

hexo.extend.tag.register('issue', function (args) {
  // {% issue 74 'not currently supported' %}

  const num = args[0]

  const attrs = {
    href: `https://github.com/cypress-io/cypress/issues/${num}`,
    target: '_blank',
  }

  const text = args[1] || `issue #${num}`

  return util.htmlTag('a', attrs, text)
})

hexo.extend.tag.register('default_assertion', function () {
  // {% default_assertion %}

  return helperIconUrl.call(this, 'introduction-to-cypress#Default-Assertions')
}, { async: true })

hexo.extend.tag.register('timeout', function () {
  // {% timeout %}

  return helperIconUrl.call(this, 'introduction-to-cypress#Timeouts')
}, { async: true })

hexo.extend.tag.register('yields', function () {
  // {% yields %}

  return helperIconUrl.call(this, 'introduction-to-cypress#Subject-Management')
}, { async: true })

hexo.extend.tag.register('urlHash', function (args) {
  // {% urlHash 'Standard Output' Standard-Output %}

  const content = this.content
  const text = args[0]
  const hash = `#${args[1]}`

  const attrs = {
    href: hash,
  }

  urlGenerator.assertHashIsPresent(
    this.full_source,
    this.source,
    hash,
    content,
    'urlHash'
  )

  return util.htmlTag('a', attrs, text)
})

hexo.extend.tag.register('url', function (args) {
  // {% url `.and()` and %}
  // {% url `.should()` should#Notes %}
  // {% url 'Read about why' why-cypress %}
  // {% url 'Benefits' guides/getting-started/why-cypress#Benefits %}
  // {% url http://foo.com %}
  //
  // <<< Transforms into >>>
  //
  // <a href="/api/commands/and.html"><code>.and()</code></a>
  // <a href="/api/commands/should.html#Notes"><code>.should()</code></a>
  // <a href="/guides/getting-started/why-cypress.html">Read about why</a>
  // <a href="/guides/getting-started/why-cypress.html#Benefits">Benefits</a>
  // <a href="http://foo.com">http://foo.com</a>

  const props = {
    text: args[0],
    url: args[1] || args[0],
    external: args[2],
  }

  return hexo.render.render({ text: props.text, engine: 'markdown' })
  .then((markdown) => {
    // remove <p> and </p> and \n
    markdown = markdown
    .split('<p>').join('')
    .split('</p>').join('')
    .split('\n').join('')

    const attrs = {
      href: props.url,
    }

    if (props.external) {
      attrs.target = '_blank'
    }

    return getUrlProps.call(this, attrs.href, props.text)
    .then((href) => {
      attrs.href = href

      return util.htmlTag('a', attrs, markdown)
    })
  })

}, { async: true })

hexo.extend.tag.register('partial', (fileName) => {
  const pathToFile = path.resolve('source', '_partial', `${fileName}.md`)

  return hexo.render.render({ path: pathToFile, engine: 'markdown' })
  .catch(beepAndLog)
}, { async: true })
