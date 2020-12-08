/// <reference types="cypress" />
import { DefineComponent, ComponentPublicInstance } from 'vue'
import {
  mount as testUtilsMount,
  MountingOptions,
  VueWrapper,
} from '@vue/test-utils/dist/vue-test-utils.esm-bundler.js'

const defaultOptions: (keyof MountOptions)[] = [
  'vue',
  'extensions',
  'style',
  'stylesheets',
]

function checkMountModeEnabled () {
  // @ts-ignore
  if (Cypress.spec.specType !== 'component') {
    throw new Error(
      `In order to use mount or unmount functions please place the spec in component folder`,
    )
  }
}

const globalComponents = (options) => {
  const components = Cypress._.get(options, 'extensions.components')

  if (!Cypress._.isPlainObject(components)) {
    return {}
  }

  return Cypress._.reduce(components, (result, value, key) => {
    result[key] = value

    return result
  }, {})
}

const plugins = (options) => {
  return Cypress._.get(options, 'extensions.use') ||
  Cypress._.get(options, 'extensions.plugins') ||
  []
}

const mixins = (options) => {
  const mixins =
    Cypress._.get(options, 'extensions.mixin') ||
    Cypress._.get(options, 'extensions.mixins')

  return Cypress._.isArray(mixins) ? mixins : []
}

// @ts-ignore
const hasStore = ({ store }: { store: object }) => store && store._vm

const forEachValue = (obj: object, fn: Function) => {
  return Object.keys(obj).forEach((key) => fn(obj[key], key))
}

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

type VuePluginOptions = unknown
type VuePlugin = unknown | [unknown, VuePluginOptions]
/**
 * A single Vue plugin or a list of plugins to register
 */
type VuePlugins = VuePlugin[]

/**
 * Additional Vue services to register while mounting the component, like
 * local components, plugins, etc.
 *
 * @interface MountOptionsExtensions
 * @see https://github.com/cypress-io/cypress/tree/master/npm/vue#examples
 */
interface MountOptionsExtensions {
  /**
   * Extra local components
   *
   * @memberof MountOptionsExtensions
   * @see https://github.com/cypress-io/cypress/tree/master/npm/vue#examples
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
   * @see https://github.com/cypress-io/cypress/tree/master/npm/vue#examples
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
   * @see https://github.com/cypress-io/cypress/tree/master/npm/vue#examples
   */
  mixin?: VueMixins

  /**
   * Optional Vue mixin(s) to install when mounting the component
   *
   * @memberof MountOptionsExtensions
   * @alias mixin
   * @see https://github.com/cypress-io/cypress/tree/master/npm/vue#examples
   */
  mixins?: VueMixins

  /**
   * A single plugin or multiple plugins.
   *
   * @see https://github.com/cypress-io/cypress/tree/master/npm/vue#examples
   * @alias plugins
   * @memberof MountOptionsExtensions
   */
  use?: VuePlugins

  /**
   * A single plugin or multiple plugins.
   *
   * @see https://github.com/cypress-io/cypress/tree/master/npm/vue#examples
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
   * @see https://github.com/cypress-io/cypress/tree/master/npm/vue#examples
   */
  extensions: MountOptionsExtensions
}

/**
 * Utility type for union of options passed to "mount(..., options)"
 */
type MountOptionsArgument = Partial<ComponentOptions & MountOptions & MountingOptions<any, any>>

// when we mount a Vue component, we add it to the global Cypress object
// so here we extend the global Cypress namespace and its Cypress interface
declare global {
  // eslint-disable-next-line no-redeclare
  namespace Cypress {
    interface Cypress {
      /**
       * Mounted Vue instance is available under Cypress.vue
       * @memberof Cypress
       * @example
       *  mount(Greeting)
       *  .then(() => {
       *    Cypress.vue.message = 'Hello There'
       *  })
       *  // new message is displayed
       *  cy.contains('Hello There').should('be.visible')
       */
      vue: ComponentPublicInstance
      vueWrapper: VueWrapper<any>
    }
  }
}

/**
 * Direct Vue errors to the top error handler
 * where they will fail Cypress test
 * @see https://vuejs.org/v2/api/#errorHandler
 * @see https://github.com/cypress-io/cypress/issues/7910
 */
function failTestOnVueError (err, vm, info) {
  console.error(`Vue error`)
  console.error(err)
  console.error('component:', vm)
  console.error('info:', info)
  window.top.onerror(err)
}

/**
 * Mounts a Vue component inside Cypress browser.
 * @param {object} component imported from Vue file
 * @example
 *  import Greeting from './Greeting.vue'
 *  import { mount } from '@cypress/vue'
 *  it('works', () => {
 *    // pass props, additional extensions, etc
 *    mount(Greeting, { ... })
 *    // use any Cypress command to test the component
 *    cy.get('#greeting').should('be.visible')
 *  })
 */
export const mount = (
  component: DefineComponent,
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

  return cy
  .window({
    log: false,
  })
  .then((win) => {
    // 1. convenience for debugging in DevTools
    // 2. some libraries might check for this global

    // @ts-ignore
    if (hasStore(component)) {
      // TODO: Figure out how to reset Vue 3/Vuex 4 store.
      // component.store = resetStoreVM(localVue, component)
    }

    // @ts-ignore
    const document: Document = cy.state('document')

    document.body.innerHTML = ''
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

    // @ts-ignore
    props.attachTo = componentNode

    const VTUWrapper = testUtilsMount(component, {
      global: {
        components: globalComponents(options),
        mixins: mixins(options),
        plugins: plugins(options),
      },
      ...props,
    })

    Cypress.vue = VTUWrapper.vm
    Cypress.vueWrapper = VTUWrapper
  })
}

/**
 * Helper function for mounting a component quickly in test hooks.
 * @example
 *  import {mountCallback} from '@cypress/vue'
 *  beforeEach(mountVue(component, options))
 */
export const mountCallback = (
  component: DefineComponent,
  options?: MountOptionsArgument,
) => {
  return () => mount(component, options)
}
