const util = require('hexo-util')
const urlGenerator = require('../url_generator')

function getUrlProps (hexo, href, text) {
  const sidebar = this.site.data.sidebar

  // onRender callback to generate
  // the markdown for each internal document
  const onRender = (text) => {
    return hexo.render.render({ text, engine: 'markdown' })
  }

  return urlGenerator.validateAndGetUrl(sidebar, href, this.full_source, text, onRender)
}

function urlHash (hexo, args) {
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
}

function isInvalidUrl (text) {
  return text.indexOf('[object Object]') !== -1
}

function url (hexo, args) {
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

  if (isInvalidUrl(props.url)) {
    /* eslint-disable no-console */
    console.error('invalid url', props.url)
    console.error(args)
    /* eslint-enable no-console */
    throw new Error(`Invalid url from args ${JSON.stringify(args)}`)
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

    return getUrlProps.call(this, hexo, attrs.href, props.text)
    .then((href) => {
      attrs.href = href

      return util.htmlTag('a', attrs, markdown)
    })
  })

}

module.exports = {
  url,

  urlHash,
}
