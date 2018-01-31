const Vue = require('vue/dist/vue')
const { stripIndent } = require('common-tags')

// mountVue options
const defaultOptions = ['html', 'vue', 'base', 'mountId', 'extensions']

// default mount point element ID for root Vue instance
const defaultMountId = 'app'

const parentDocument = window.parent.document
const projectName = Cypress.config('projectName')
const appIframeId = `Your App: '${projectName}'`
const appIframe = parentDocument.getElementById(appIframeId)

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

const getPageHTML = options => {
  return (
    options.html ||
    stripIndent`
    <html>
      <head>
        ${options.base ? `<base href="${options.base}" />` : ''}
      </head>
      <body>
        <div id="${options.mountId || defaultMountId}"></div>
      </body>
    </html>
  `
  )
}

const registerGlobalComponents = (Vue, options) => {
  const globalComponents = Cypress._.get(options, 'extensions.components')
  if (Cypress._.isPlainObject(globalComponents)) {
    Cypress._.forEach(globalComponents, (component, id) => {
      Vue.component(id, component)
    })
  }
}

const installFilters = (Vue, options) => {
  const filters = Cypress._.get(options, 'extensions.filters')
  if (Cypress._.isPlainObject(filters)) {
    Object.keys(filters).forEach(name => {
      Vue.filter(name, filters[name])
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

const isOptionName = name => defaultOptions.includes(name)

const isOptions = object => Object.keys(object).every(isOptionName)

const isConstructor = object => object && object._compiled

const hasStore = ({ store }) => store && store._vm

const forEachValue = (obj, fn) =>
  Object.keys(obj).forEach(key => fn(obj[key], key))

const resetStoreVM = (Vue, { store }) => {
  // bind store public getters
  store.getters = {}
  const wrappedGetters = store._wrappedGetters
  const computed = {}
  forEachValue(wrappedGetters, (fn, key) => {
    // use computed to leverage its lazy-caching mechanism
    computed[key] = () => fn(store)
    Object.defineProperty(store.getters, key, {
      get: () => store._vm[key],
      enumerable: true // for local getters
    })
  })

  store._watcherVM = new Vue()
  store._vm = new Vue({
    data: {
      $$state: store._vm._data.$$state
    },
    computed
  })
  return store

function setXMLHttpRequest (w) {
  // by grabbing the XMLHttpRequest from app's iframe
  // and putting it here - in the test iframe
  // we suddenly get spying and stubbing 😁
  window.XMLHttpRequest = w.XMLHttpRequest
  return w
}

function setAlert (w) {
  window.alert = w.alert
  return w
}

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

  // display deprecation warnings
  if (options.vue) {
    console.warn(stripIndent`
      [DEPRECATION]: 'vue' option has been deprecated.
      'node_modules/vue/dis/vue' is always used.
      Please remove it from your 'mountVue' options.`)
  }

  // insert base app template
  const doc = appIframe.contentDocument
  doc.write(getPageHTML(options))
  doc.close()

  // get root Vue mount element
  const mountId = options.mountId || defaultMountId
  const el = doc.getElementById(mountId)

  // set global Vue instance:
  // 1. convenience for debugging in DevTools
  // 2. some libraries might check for this global
  appIframe.contentWindow.Vue = Vue

  // refresh inner Vue instance of Vuex store
  if (hasStore(component)) {
    component.store = resetStoreVM(Vue, component)
  }

  // setup Vue instance
  installMixins(Vue, options)
  installPlugins(Vue, options)
  registerGlobalComponents(Vue, options)
  deleteCachedConstructors(component)

  // create root Vue component
  // and make it accessible via Cypress.vue
  if (isConstructor(component)) {
    const Cmp = Vue.extend(component)
    Cypress.vue = new Cmp(props).$mount(el)
    copyStyles(Cmp)
  } else {
    Cypress.vue = new Vue(component).$mount(el)
    copyStyles(component)
  }

  return cy
    .window({ log: false })
    .then(setXMLHttpRequest)
    .then(setAlert)
    .then(() => {
      return cy.wrap(Cypress.vue)
    })
}

module.exports = mountVue
