const { stripIndent } = require('common-tags')

// having weak reference to styles prevents garbage collection
// and "losing" styles when the next test starts
const stylesCache = new Map()

const copyStyles = component => {
  let styles
  if (stylesCache.has(component)) {
    styles = stylesCache.get(component)
  } else {
    styles = document.querySelectorAll('head style')
    if (styles.length) {
      console.log('injected %d styles', styles.length)
      stylesCache.set(component, styles)
    } else {
      console.log('No styles injected for this component')
      styles = null
    }
  }

  if (!styles) {
    return
  }

  const parentDocument = window.parent.document
  const projectName = Cypress.config('projectName')
  const appIframeId = `Your App: '${projectName}'`
  const appIframe = parentDocument.getElementById(appIframeId)
  const head = appIframe.contentDocument.querySelector('head')
  styles.forEach(style => {
    head.appendChild(style)
  })
}

const deleteConstructor = comp => delete comp._Ctor

const deleteCachedConstructors = component => {
  if (!component.components) {
    return
  }
  Cypress._.values(component.components).forEach(deleteConstructor)
}

const getVuePath = options =>
  options.vue || options.vuePath || '../node_modules/vue/dist/vue.js'

const getPageHTML = options => {
  if (options.html) {
    return options.html
  }
  const vue = getVuePath(options)

  // note: add "base" tag to force loading static assets
  // from the server, not from the "spec" file URL
  if (options.base) {
    if (vue.startsWith('.')) {
      console.error(
        'You are using base tag %s and relative Vue path %s',
        options.base,
        vue
      )
      console.error('the relative path might NOT work')
      console.error(
        'maybe pass Vue url using "https://unpkg.com/vue/dist/vue.js"'
      )
    }
    return stripIndent`
      <html>
        <head>
          <base href="${options.base}" />
        </head>
        <body>
          <div id="app"></div>
          <script src="${vue}"></script>
        </body>
      </html>
    `
  }

  const vueHtml = stripIndent`
    <html>
      <head></head>
      <body>
        <div id="app"></div>
        <script src="${vue}"></script>
      </body>
    </html>
  `
  return vueHtml
}

const registerGlobalComponents = (Vue, options) => {
  const globalComponents = Cypress._.get(options, 'extensions.components')
  if (Cypress._.isPlainObject(globalComponents)) {
    Cypress._.forEach(globalComponents, (component, id) => {
      Vue.component(id, component)
    })
  }
}

const installPlugins = (Vue, options) => {
  const plugins =
    Cypress._.get(options, 'extensions.use') ||
    Cypress._.get(options, 'extensions.plugins')
  if (Cypress._.isArray(plugins)) {
    plugins.forEach(plugin => {
      Vue.use(plugin)
    })
  }
}

const installMixins = (Vue, options) => {
  const mixins =
    Cypress._.get(options, 'extensions.mixin') ||
    Cypress._.get(options, 'extensions.mixins')
  if (Cypress._.isArray(mixins)) {
    mixins.forEach(mixin => {
      Vue.mixin(mixin)
    })
  }
}

const isOptionName = name =>
  ['vue', 'html', 'vuePath', 'base', 'extensions'].includes(name)

const isOptions = object => Object.keys(object).every(isOptionName)

const isConstructor = object => object && object._compiled

// the double function allows mounting a component quickly
// beforeEach(mountVue(component, options))
const mountVue = (component, optionsOrProps = {}) => () => {
  let options = {}
  let props = {}

  if (isOptions(optionsOrProps)) {
    options = optionsOrProps
  } else {
    props = optionsOrProps
  }

  const vueHtml = getPageHTML(options)
  const document = cy.state('document')
  document.write(vueHtml)
  document.close()

  // TODO: do not log out "its(Vue)" command
  // but it currently does not support it
  return cy
    .window({ log: false })
    .its('Vue')
    .then(Vue => {
      installMixins(Vue, options)
      installPlugins(Vue, options)
      registerGlobalComponents(Vue, options)
      deleteCachedConstructors(component)

      if (isConstructor(component)) {
        const Cmp = Vue.extend(component)
        Cypress.vue = new Cmp(props).$mount('#app')
        copyStyles(Cmp)
      } else {
        Cypress.vue = new Vue(component).$mount('#app')
        copyStyles(component)
      }

      return Cypress.vue
    })
}

module.exports = mountVue
