/// <reference types="cypress" />

const Vue = require('vue').default
const { stripIndent } = require('common-tags')

// mountVue options
const defaultOptions = ['vue', 'extensions', 'style', 'stylesheets']

function checkMountModeEnabled() {
  // @ts-ignore
  if (Cypress.spec.specType !== 'component') {
    throw new Error(
      `In order to use mount or unmount functions please place the spec in component folder`,
    )
  }
}

const deleteConstructor = (comp) => delete comp._Ctor

const deleteCachedConstructors = (component) => {
  if (!component.components) {
    return
  }
  Cypress._.values(component.components).forEach(deleteConstructor)
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
    Object.keys(filters).forEach((name) => {
      Vue.filter(name, filters[name])
    })
  }
}

const installPlugins = (Vue, options) => {
  const plugins =
    Cypress._.get(options, 'extensions.use') ||
    Cypress._.get(options, 'extensions.plugins')
  if (Cypress._.isArray(plugins)) {
    plugins.forEach((plugin) => {
      if (Array.isArray(plugin)) {
        const [aPlugin, options] = plugin
        Vue.use(aPlugin, options)
      } else {
        Vue.use(plugin)
      }
    })
  }
}

const installMixins = (Vue, options) => {
  const mixins =
    Cypress._.get(options, 'extensions.mixin') ||
    Cypress._.get(options, 'extensions.mixins')
  if (Cypress._.isArray(mixins)) {
    mixins.forEach((mixin) => {
      Vue.mixin(mixin)
    })
  }
}

const isConstructor = (object) => object && object._compiled

const hasStore = ({ store }) => store && store._vm

const forEachValue = (obj, fn) =>
  Object.keys(obj).forEach((key) => fn(obj[key], key))

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
      enumerable: true, // for local getters
    })
  })

  store._watcherVM = new Vue()
  store._vm = new Vue({
    data: {
      $$state: store._vm._data.$$state,
    },
    computed,
  })
  return store
}

const mountVue = (component, optionsOrProps = {}) => {
  checkMountModeEnabled()

  const options = Cypress._.pick(optionsOrProps, defaultOptions)
  const props = Cypress._.omit(optionsOrProps, defaultOptions)

  // display deprecation warnings
  if (options.vue) {
    console.warn(stripIndent`
      [DEPRECATION]: 'vue' option has been deprecated.
      'node_modules/vue/dis/vue' is always used.
      Please remove it from your 'mountVue' options.`)
  }

  // set global Vue instance:
  // 1. convenience for debugging in DevTools
  // 2. some libraries might check for this global
  // appIframe.contentWindow.Vue = Vue

  // refresh inner Vue instance of Vuex store
  if (hasStore(component)) {
    component.store = resetStoreVM(Vue, component)
  }

  return cy.window({ log: false }).then((win) => {
    win.Vue = Vue

    const document = cy.state('document')
    let el = document.getElementById('cypress-jsdom')

    // If the target div doesn't exist, create it
    if (!el) {
      const div = document.createElement('div')
      div.id = 'cypress-jsdom'
      document.body.appendChild(div)
      el = div
    }

    if (typeof options.stylesheets === 'string') {
      options.stylesheets = [options.stylesheets]
    }
    if (Array.isArray(options.stylesheets)) {
      console.log('adding stylesheets')
      options.stylesheets.forEach((href) => {
        const link = document.createElement('link')
        link.type = 'text/css'
        link.rel = 'stylesheet'
        link.href = href
        el.append(link)
      })
    }

    if (options.style) {
      const style = document.createElement('style')
      style.appendChild(document.createTextNode(options.style))
      el.append(style)
    }

    const componentNode = document.createElement('div')
    el.append(componentNode)

    // setup Vue instance
    installFilters(Vue, options)
    installMixins(Vue, options)
    installPlugins(Vue, options)
    registerGlobalComponents(Vue, options)
    deleteCachedConstructors(component)

    // create root Vue component
    // and make it accessible via Cypress.vue
    if (isConstructor(component)) {
      const Cmp = Vue.extend(component)
      Cypress.vue = new Cmp(props).$mount(componentNode)
    } else {
      Cypress.vue = new Vue(component).$mount(componentNode)
    }
  })
}

// the double function allows mounting a component quickly
// beforeEach(mountVue(component, options))
const mountCallback = (...args) => () => mountVue(...args)

module.exports = { mount: mountVue, mountCallback }
