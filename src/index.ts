/// <reference types="cypress" />

import Vue from 'vue'
const { stripIndent } = require('common-tags')

// mountVue options
const defaultOptions: (keyof MountOptions)[] = [
  'vue',
  'extensions',
  'style',
  'stylesheets',
]

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
  const filters: VueFilters | undefined = Cypress._.get(
    options,
    'extensions.filters',
  )
  if (Cypress._.isPlainObject(filters)) {
    Object.keys(filters).forEach((name) => {
      Vue.filter(name, filters[name])
    })
  }
}

const installPlugins = (Vue, options) => {
  const plugins: VuePlugins =
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

// @ts-ignore
const hasStore = ({ store }: { store: object }) => store && store._vm

const forEachValue = (obj: object, fn: Function) =>
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

/**
 * Type for component passed to "mount"
 *
 * @interface VueComponent
 * @example
 *  import Hello from './Hello.vue'
 *         ^^^^^ this type
 *  mount(Hello)
 */
type VueComponent = Vue.ComponentOptions<any>

/**
 * Options to pass to the component when creating it, like
 * props.
 *
 * @interface ComponentOptions
 */
interface ComponentOptions {}

// local placeholder types
type VueLocalComponents = object

type VueFilters = {
  [key: string]: Function
}

type VueMixin = unknown
type VueMixins = VueMixin | VueMixin[]

/**
 * A Vue plugin to register,
 * or a plugin + its options pair inside an array
 */
type VuePlugin = unknown | [unknown, unknown]
/**
 * A single Vue plugin or a list of plugins to register
 */
type VuePlugins = VuePlugin | VuePlugin[]

/**
 * Additional Vue services to register while mounting the component, like
 * local components, plugins, etc.
 *
 * @interface MountOptionsExtensions
 * @see https://github.com/bahmutov/cypress-vue-unit-test#examples
 */
interface MountOptionsExtensions {
  /**
   * Extra local components
   *
   * @memberof MountOptionsExtensions
   * @see https://github.com/bahmutov/cypress-vue-unit-test#examples
   * @example
   *  import Hello from './Hello.vue'
   *  // imagine Hello needs AppComponent
   *  // that it uses in its template like <app-component ... />
   *  // during testing we can replace it with a mock component
   *  const appComponent = ...
   *  const components = {
   *    'app-component': appComponent
   *  },
   *  mount(Hello, { extensions: { components }})
   */
  components?: VueLocalComponents

  /**
   * Optional Vue filters to install while mounting the component
   *
   * @memberof MountOptionsExtensions
   * @see https://github.com/bahmutov/cypress-vue-unit-test#examples
   * @example
   *  const filters = {
   *    reverse: (s) => s.split('').reverse().join(''),
   *  }
   *  mount(Hello, { extensions: { filters }})
   */
  filters?: VueFilters

  /**
   * Optional Vue mixin(s) to install when mounting the component
   *
   * @memberof MountOptionsExtensions
   * @alias mixins
   * @see https://github.com/bahmutov/cypress-vue-unit-test#examples
   */
  mixin?: VueMixins

  /**
   * Optional Vue mixin(s) to install when mounting the component
   *
   * @memberof MountOptionsExtensions
   * @alias mixin
   * @see https://github.com/bahmutov/cypress-vue-unit-test#examples
   */
  mixins?: VueMixins

  /**
   * A single plugin or multiple plugins.
   *
   * @see https://github.com/bahmutov/cypress-vue-unit-test#examples
   * @alias plugins
   * @memberof MountOptionsExtensions
   */
  use?: VuePlugins

  /**
   * A single plugin or multiple plugins.
   *
   * @see https://github.com/bahmutov/cypress-vue-unit-test#examples
   * @alias use
   * @memberof MountOptionsExtensions
   */
  plugins?: VuePlugins
}

/**
 * Options controlling how the component is going to be mounted,
 * including global Vue plugins and extensions.
 *
 * @interface MountOptions
 */
interface MountOptions {
  /**
   * Vue instance to use.
   *
   * @deprecated
   * @memberof MountOptions
   */
  vue: unknown

  /**
   * CSS style string to inject when mounting the component
   *
   * @memberof MountOptions
   * @example
   *  const style = `
   *    .todo.done {
   *      text-decoration: line-through;
   *      color: gray;
   *    }`
   *  mount(Todo, { style })
   */
  style: string

  /**
   * Stylesheet(s) urls to inject as `<link ... />` elements when
   * mounting the component
   *
   * @memberof MountOptions
   * @example
   *  const template = '...'
   *  const stylesheets = '/node_modules/tailwindcss/dist/tailwind.min.css'
   *  mount({ template }, { stylesheets })
   *
   * @example
   *  const template = '...'
   *  const stylesheets = ['https://cdn.../lib.css', 'https://lib2.css']
   *  mount({ template }, { stylesheets })
   */
  stylesheets: string | string[]

  /**
   * Extra Vue plugins, mixins, local components to register while
   * mounting this component
   *
   * @memberof MountOptions
   * @see https://github.com/bahmutov/cypress-vue-unit-test#examples
   */
  extensions: MountOptionsExtensions
}

/**
 * Utility type for union of options passed to "mount(..., options)"
 */
type MountOptionsArgument = Partial<ComponentOptions & MountOptions>

/**
 * Mounts a Vue component inside Cypress browser.
 * @param {object} component imported from Vue file
 * @example
 *  import Greeting from './Greeting.vue'
 *  import { mount } from 'cypress-vue-unit-test'
 *  it('works', () => {
 *    // pass props, additional extensions, etc
 *    mount(Greeting, { ... })
 *    // use any Cypress command to test the component
 *    cy.get('#greeting').should('be.visible')
 *  })
 */
export const mount = (
  component: VueComponent,
  optionsOrProps: MountOptionsArgument = {},
) => {
  checkMountModeEnabled()

  const options: Partial<MountOptions> = Cypress._.pick(
    optionsOrProps,
    defaultOptions,
  )
  const props: Partial<ComponentOptions> = Cypress._.omit(
    optionsOrProps,
    defaultOptions,
  )

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
  // @ts-ignore
  if (hasStore(component)) {
    // @ts-ignore
    component.store = resetStoreVM(Vue, component)
  }

  // render function components should be market to be properly initialized
  // https://github.com/bahmutov/cypress-vue-unit-test/issues/313
  if (
    Cypress._.isPlainObject(component) &&
    Cypress._.isFunction(component.render)
  ) {
    // @ts-ignore
    component._compiled = true
  }

  return cy
    .window({
      log: false,
    })
    .then((win) => {
      // @ts-ignore
      win.Vue = Vue

      // @ts-ignore
      const document: Document = cy.state('document')
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
        // @ts-ignore
        Cypress.vue = new Cmp(props).$mount(componentNode)
      } else {
        // @ts-ignore
        Cypress.vue = new Vue(component).$mount(componentNode)
      }
    })
}

/**
 * Helper function for mounting a component quickly in test hooks.
 * @example
 *  import {mountCallback} from 'cypress-vue-unit-test'
 *  beforeEach(mountVue(component, options))
 */
export const mountCallback = (
  component: VueComponent,
  options?: MountOptionsArgument,
) => () => mount(component, options)
