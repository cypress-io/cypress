/// <reference types="cypress" />
import Vue from 'vue'
import {
  createLocalVue,
  mount as testUtilsMount,
  VueTestUtilsConfigOptions,
  Wrapper,
} from '@vue/test-utils'
import {
  getContainerEl,
  setupHooks,
  checkForRemovedStyleOptions,
} from '@cypress/mount-utils'

const defaultOptions: (keyof MountOptions)[] = [
  'vue',
  'extensions',
]

const DEFAULT_COMP_NAME = 'unknown'

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

const installPlugins = (Vue, options, props) => {
  const plugins: VuePlugins =
      Cypress._.get(props, 'plugins') ||
      Cypress._.get(options, 'extensions.use') ||
      Cypress._.get(options, 'extensions.plugins') ||
      []

  // @ts-ignore
  plugins.forEach((p) => {
    Array.isArray(p) ? Vue.use(...p) : Vue.use(p)
  })
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

const registerGlobalDirectives = (Vue, options) => {
  const directives =
    Cypress._.get(options, 'extensions.directives')

  if (Cypress._.isPlainObject(directives)) {
    Object.keys(directives).forEach((name) => {
      Vue.directive(name, directives[name])
    })
  }
}

const hasStore = ({ store }: { store: any }) => Boolean(store && store._vm)

const forEachValue = <T>(obj: Record<string, T>, fn: (value: T, key: string) => void) => {
  return Object.keys(obj).forEach((key) => fn(obj[key], key))
}

const resetStoreVM = (Vue, { store }) => {
  // bind store public getters
  store.getters = {}
  const wrappedGetters = store._wrappedGetters as Record<string, (store: any) => void>
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
type VueComponent = Vue.ComponentOptions<any> | Vue.VueConstructor

/**
 * Options to pass to the component when creating it, like
 * props.
 *
 * @interface ComponentOptions
 */
type ComponentOptions = Record<string, unknown>

// local placeholder types
type VueLocalComponents = Record<string, VueComponent>

type VueFilters = {
  [key: string]: (value: string) => string
}

type VueDirectives = {
  [key: string]: Function | Object
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
 * @see https://github.com/cypress-io/cypress/tree/develop/npm/vue#examples
 */
interface MountOptionsExtensions {
  /**
   * Extra local components
   *
   * @memberof MountOptionsExtensions
   * @see https://github.com/cypress-io/cypress/tree/develop/npm/vue#examples
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
   * @see https://github.com/cypress-io/cypress/tree/develop/npm/vue#examples
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
   * @see https://github.com/cypress-io/cypress/tree/develop/npm/vue#examples
   */
  mixin?: VueMixins

  /**
   * Optional Vue mixin(s) to install when mounting the component
   *
   * @memberof MountOptionsExtensions
   * @alias mixin
   * @see https://github.com/cypress-io/cypress/tree/develop/npm/vue#examples
   */
  mixins?: VueMixins

  /**
   * A single plugin or multiple plugins.
   *
   * @see https://github.com/cypress-io/cypress/tree/develop/npm/vue#examples
   * @alias plugins
   * @memberof MountOptionsExtensions
   */
  use?: VuePlugins

  /**
   * A single plugin or multiple plugins.
   *
   * @see https://github.com/cypress-io/cypress/tree/develop/npm/vue#examples
   * @alias use
   * @memberof MountOptionsExtensions
   */
  plugins?: VuePlugins

  /**
   * Optional Vue directives to install while mounting the component
   *
   * @memberof MountOptionsExtensions
   * @see https://github.com/cypress-io/cypress/tree/develop/npm/vue#examples
   * @example
   *  const directives = {
   *    custom: {
   *        name: 'custom',
   *        bind (el, binding) {
   *          el.dataset['custom'] = binding.value
   *        },
   *        unbind (el) {
   *          el.removeAttribute('data-custom')
   *        },
   *    },
   *  }
   *  mount(Hello, { extensions: { directives }})
   */
  directives?: VueDirectives
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
   * Extra Vue plugins, mixins, local components to register while
   * mounting this component
   *
   * @memberof MountOptions
   * @see https://github.com/cypress-io/cypress/tree/develop/npm/vue#examples
   */
  extensions: MountOptionsExtensions
}

/**
 * Utility type for union of options passed to "mount(..., options)"
 */
type MountOptionsArgument = Partial<ComponentOptions & MountOptions & VueTestUtilsConfigOptions>

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
      vue: Vue
      vueWrapper: Wrapper<Vue>
    }
  }
}

const cleanup = () => {
  Cypress.vueWrapper?.destroy()
}

/**
 * Direct Vue errors to the top error handler
 * where they will fail Cypress test
 * @see https://vuejs.org/v2/api/#errorHandler
 * @see https://github.com/cypress-io/cypress/issues/7910
 */
function failTestOnVueError (err, vm, info) {
  // Vue 2 try catches the error-handler so push the error to be caught outside
  // of the handler.
  setTimeout(() => {
    throw err
  })
}

/**
 * Extract the component name from the object passed to mount
 * @param componentOptions the compoennt passed to mount
 * @returns name of the component
 */
function getComponentDisplayName (componentOptions: any): string {
  if (componentOptions.name) {
    return componentOptions.name
  }

  if (componentOptions.__file) {
    const filepathSplit = componentOptions.__file.split('/')
    const fileName = filepathSplit[filepathSplit.length - 1] ?? DEFAULT_COMP_NAME

    // remove the extension .js, .ts or .vue from the filename to get the name of the component
    const baseFileName = fileName.replace(/\.(js|ts|vue)?$/, '')

    // if the filename is index, then we can use the direct parent foldername, else use the name itself
    return (baseFileName === 'index' ? filepathSplit[filepathSplit.length - 2] : baseFileName)
  }

  return DEFAULT_COMP_NAME
}

/**
 * Mounts a Vue component inside Cypress browser.
 * @param {VueComponent} component imported from Vue file
 * @param {MountOptionsArgument} optionsOrProps used to pass options to component being mounted
 * @returns {Cypress.Chainable<{wrapper: Wrapper<T>, component: T}
 * @example
 * import { mount } from '@cypress/vue'
 * import { Stepper } from './Stepper.vue'
 *
 * it('mounts', () => {
 *   cy.mount(Stepper)
 *   cy.get('[data-cy=increment]').click()
 *   cy.get('[data-cy=counter]').should('have.text', '1')
 * })
 * @see {@link https://on.cypress.io/mounting-vue} for more details.
 *
 */
export const mount = (
  component: VueComponent,
  optionsOrProps: MountOptionsArgument = {},
): Cypress.Chainable<{
  wrapper: Wrapper<Vue, Element>
  component: Wrapper<Vue, Element>['vm']
}> => {
  checkForRemovedStyleOptions(optionsOrProps)
  // Remove last mounted component if cy.mount is called more than once in a test
  cleanup()

  const options: Partial<MountOptions> = Cypress._.pick(
    optionsOrProps,
    defaultOptions,
  )
  const props: Partial<ComponentOptions> = Cypress._.omit(
    optionsOrProps,
    defaultOptions,
  )

  const componentName = getComponentDisplayName(component)
  const message = `<${componentName} ... />`

  return cy
  .window({
    log: false,
  })
  .then((win) => {
    const localVue = createLocalVue()

    // @ts-ignore
    win.Vue = localVue
    localVue.config.errorHandler = failTestOnVueError

    // set global Vue instance:
    // 1. convenience for debugging in DevTools
    // 2. some libraries might check for this global
    // appIframe.contentWindow.Vue = localVue

    // refresh inner Vue instance of Vuex store
    // @ts-ignore
    if (hasStore(component)) {
      // @ts-ignore
      component.store = resetStoreVM(localVue, component)
    }

    // @ts-ignore
    const document: Document = cy.state('document')

    let el = getContainerEl()

    const componentNode = document.createElement('div')

    el.append(componentNode)

    // setup Vue instance
    installFilters(localVue, options)
    installMixins(localVue, options)
    installPlugins(localVue, options, props)
    registerGlobalDirectives(localVue, options)
    registerGlobalComponents(localVue, options)

    props.attachTo = componentNode

    const wrapper = localVue.extend(component as any)

    const VTUWrapper = testUtilsMount(wrapper, { localVue, ...props })

    Cypress.vue = VTUWrapper.vm
    Cypress.vueWrapper = VTUWrapper

    return {
      wrapper: VTUWrapper,
      component: VTUWrapper.vm,
    }
  })
  .then(() => {
    if (optionsOrProps.log !== false) {
      return Vue.nextTick(() => {
        Cypress.log({
          name: 'mount',
          message: [message],
        })
      })
    }
  })
}

/**
 * Helper function for mounting a component quickly in test hooks.
 * @example
 *  import {mountCallback} from '@cypress/vue2'
 *  beforeEach(mountVue(component, options))
 *
 * Removed as of Cypress 11.0.0.
 * @see https://on.cypress.io/migration-11-0-0-component-testing-updates
 */
export const mountCallback = (
  component: VueComponent,
  options?: MountOptionsArgument,
) => {
  return () => {
    // @ts-expect-error - undocumented API
    Cypress.utils.throwErrByPath('mount.mount_callback')
  }
}

// Side effects from "import { mount } from '@cypress/<my-framework>'" are annoying, we should avoid doing this
// by creating an explicit function/import that the user can register in their 'component.js' support file,
// such as:
//    import 'cypress/<my-framework>/support'
// or
//    import { registerCT } from 'cypress/<my-framework>'
//    registerCT()
// Note: This would be a breaking change
setupHooks(cleanup)
