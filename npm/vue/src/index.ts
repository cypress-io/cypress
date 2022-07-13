/* eslint-disable no-redeclare */
/// <reference types="cypress" />
import type {
  ComponentPublicInstance,
  VNodeProps,
  AllowedComponentProps,
  ComponentCustomProps,
  ExtractPropTypes,
  ExtractDefaultPropTypes,
  DefineComponent,
  FunctionalComponent,
  ComputedOptions,
  MethodOptions,
  ComponentOptionsMixin,
  EmitsOptions,
  ComponentOptionsWithObjectProps,
  ComponentPropsOptions,
  ComponentOptionsWithArrayProps,
  ComponentOptionsWithoutProps,
} from 'vue'
import type { MountingOptions, VueWrapper } from '@vue/test-utils'
import {
  injectStylesBeforeElement,
  StyleOptions,
  getContainerEl,
  setupHooks,
} from '@cypress/mount-utils'

import * as _VueTestUtils from '@vue/test-utils'

const {
  // We do not expose the `mount` from VueTestUtils, instead, we wrap it and expose a
  // Cypress-compatible `mount` API.
  mount: VTUmount,
  // We do not expose shallowMount. It doesn't make much sense in the context of Cypress.
  // It might be useful for people who like to migrate some Test Utils tests to Cypress,
  // so if we decide it is useful to expose, just remove the next line, and it will be
  // available on the `VueTestUtils` import.
  shallowMount,
  ...VueTestUtils
} = _VueTestUtils

export { VueTestUtils }

const DEFAULT_COMP_NAME = 'unknown'

type GlobalMountOptions = Required<MountingOptions<any>>['global']

// when we mount a Vue component, we add it to the global Cypress object
// so here we extend the global Cypress namespace and its Cypress interface
declare global {
  // eslint-disable-next-line no-redeclare
  namespace Cypress {
    interface Cypress {
      vueWrapper: VueWrapper<ComponentPublicInstance>
      vue: ComponentPublicInstance
    }
  }
}

export type CyMountOptions<Props, Data= {}> = Omit<MountingOptions<Props, Data>, 'attachTo'> & {
  log?: boolean
  /**
   * @deprecated use vue-test-utils `global` instead
   */
  extensions?: GlobalMountOptions & {
    use?: GlobalMountOptions['plugins']
    mixin?: GlobalMountOptions['mixins']
  }
} & Partial<StyleOptions>

Cypress.on('run:start', () => {
  // `mount` is designed to work with component testing only.
  // it assumes ROOT_SELECTOR exists, which is not the case in e2e.
  // if the user registers a custom command that imports `cypress/vue`,
  // this event will be registered and cause an error when the user
  // launches e2e (since it's common to use Cypress for both CT and E2E.
  // https://github.com/cypress-io/cypress/issues/17438
  if (Cypress.testingType !== 'component') {
    return
  }

  Cypress.on('test:before:run', () => {
    Cypress.vueWrapper?.unmount()
    const el = getContainerEl()

    el.innerHTML = ''
  })
})

/**
 * the types for mount have been copied directly from the VTU mount
 * https://github.com/vuejs/vue-test-utils-next/blob/master/src/mount.ts
 *
 * If they are updated please copy and pase them again here.
 */

type PublicProps = VNodeProps & AllowedComponentProps & ComponentCustomProps;

// Class component - no props
export function mount<V>(
  originalComponent: {
    new (...args: any[]): V
    registerHooks(keys: string[]): void
  },
  options?: MountingOptions<any>
): Cypress.Chainable

// Class component - props
export function mount<V, P>(
  originalComponent: {
    new (...args: any[]): V
    props(Props: P): any
    registerHooks(keys: string[]): void
  },
  options?: CyMountOptions<P & PublicProps>
): Cypress.Chainable

// Functional component with emits
export function mount<Props, E extends EmitsOptions = {}>(
  originalComponent: FunctionalComponent<Props, E>,
  options?: CyMountOptions<Props & PublicProps>
): Cypress.Chainable

// Component declared with defineComponent
export function mount<
  PropsOrPropOptions = {},
  RawBindings = {},
  D = {},
  C extends ComputedOptions = ComputedOptions,
  M extends MethodOptions = MethodOptions,
  Mixin extends ComponentOptionsMixin = ComponentOptionsMixin,
  Extends extends ComponentOptionsMixin = ComponentOptionsMixin,
  E extends EmitsOptions = Record<string, any>,
  EE extends string = string,
  PP = PublicProps,
  Props = Readonly<ExtractPropTypes<PropsOrPropOptions>>,
  Defaults = ExtractDefaultPropTypes<PropsOrPropOptions>
>(
  component: DefineComponent<
    PropsOrPropOptions,
    RawBindings,
    D,
    C,
    M,
    Mixin,
    Extends,
    E,
    EE,
    PP,
    Props,
    Defaults
  >,
  options?: CyMountOptions<
    Partial<Defaults> & Omit<Props & PublicProps, keyof Defaults>,
    D
  >
): Cypress.Chainable

// Component declared with no props
export function mount<
  Props = {},
  RawBindings = {},
  D = {},
  C extends ComputedOptions = {},
  M extends Record<string, Function> = {},
  E extends EmitsOptions = Record<string, any>,
  Mixin extends ComponentOptionsMixin = ComponentOptionsMixin,
  Extends extends ComponentOptionsMixin = ComponentOptionsMixin,
  EE extends string = string
>(
  componentOptions: ComponentOptionsWithoutProps<
    Props,
    RawBindings,
    D
  >,
  options?: CyMountOptions<Props & PublicProps, D>
): Cypress.Chainable

// Component declared with { props: [] }
export function mount<
  PropNames extends string,
  RawBindings,
  D,
  C extends ComputedOptions = {},
  M extends Record<string, Function> = {},
  E extends EmitsOptions = Record<string, any>,
  Mixin extends ComponentOptionsMixin = ComponentOptionsMixin,
  Extends extends ComponentOptionsMixin = ComponentOptionsMixin,
  EE extends string = string,
  Props extends Readonly<{ [key in PropNames]?: any }> = Readonly<
    { [key in PropNames]?: any }
  >
>(
  componentOptions: ComponentOptionsWithArrayProps<
    PropNames,
    RawBindings,
    D,
    C,
    M,
    E,
    Mixin,
    Extends,
    EE,
    Props
  >,
  options?: CyMountOptions<Props & PublicProps, D>
): Cypress.Chainable

// Component declared with { props: { ... } }
export function mount<
  // the Readonly constraint allows TS to treat the type of { required: true }
  // as constant instead of boolean.
  PropsOptions extends Readonly<ComponentPropsOptions>,
  RawBindings,
  D,
  C extends ComputedOptions = {},
  M extends Record<string, Function> = {},
  E extends EmitsOptions = Record<string, any>,
  Mixin extends ComponentOptionsMixin = ComponentOptionsMixin,
  Extends extends ComponentOptionsMixin = ComponentOptionsMixin,
  EE extends string = string
>(
  componentOptions: ComponentOptionsWithObjectProps<
    PropsOptions,
    RawBindings,
    D,
    C,
    M,
    E,
    Mixin,
    Extends,
    EE
  >,
  options?: CyMountOptions<ExtractPropTypes<PropsOptions> & PublicProps, D>
): Cypress.Chainable

// implementation
export function mount (
  componentOptions: any,
  options: CyMountOptions<any> = {},
) {
  // TODO: get the real displayName and props from VTU shallowMount
  const componentName = getComponentDisplayName(componentOptions)

  const message = `<${componentName} ... />`
  let logInstance: Cypress.Log

  // then wait for cypress to load
  return cy.then(() => {
    if (options.log !== false) {
      logInstance = Cypress.log({
        name: 'mount',
        message: [message],
      })
    }

    // @ts-ignore
    const document: Document = cy.state('document')

    const el = getContainerEl()

    injectStylesBeforeElement(options, document, el)

    // merge the extensions with global
    if (options.extensions) {
      options.extensions.plugins = ([] as GlobalMountOptions['plugins'])?.concat(options.extensions.plugins || [], options.extensions.use || [])
      options.extensions.mixins = ([] as GlobalMountOptions['mixins'])?.concat(options.extensions.mixins || [], options.extensions.mixin || [])
      options.global = { ...options.extensions, ...options.global }
    }

    const componentNode = document.createElement('div')

    componentNode.id = '__cy_vue_root'

    el.append(componentNode)

    // mount the component using VTU and return the wrapper in Cypress.VueWrapper
    const wrapper = VTUmount(componentOptions, { attachTo: componentNode, ...options })

    Cypress.vueWrapper = wrapper as VueWrapper<ComponentPublicInstance>
    Cypress.vue = wrapper.vm as ComponentPublicInstance

    return cy
    .wrap(wrapper, { log: false })
    .wait(1, { log: false })
    .then(() => {
      if (logInstance) {
        logInstance.snapshot('mounted')
        logInstance.end()
      }

      // by returning undefined we keep the previous subject
      // which is the mounted component
      return undefined
    })
  })
}

/**
 * Extract the compoennt name from the object passed to mount
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
 * Helper function for mounting a component quickly in test hooks.
 * @example
 *  import {mountCallback} from '@cypress/vue'
 *  beforeEach(mountVue(component, options))
 */
export function mountCallback (
  component: any,
  options: any = {},
): () => Cypress.Chainable {
  return () => {
    return mount(component, options)
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
setupHooks()
