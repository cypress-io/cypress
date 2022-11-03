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
  Prop,
} from 'vue'
import type { MountingOptions as VTUMountingOptions, VueWrapper } from '@vue/test-utils'
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

type GlobalMountOptions = Required<VTUMountingOptions<any>>['global']

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

type MountingOptions<Props, Data = {}> = Omit<VTUMountingOptions<Props, Data>, 'attachTo'> & {
  log?: boolean
  /**
   * @deprecated use vue-test-utils `global` instead
   */
  extensions?: GlobalMountOptions & {
    use?: GlobalMountOptions['plugins']
    mixin?: GlobalMountOptions['mixins']
  }
} & Partial<StyleOptions>

export type CyMountOptions<Props, Data = {}> = MountingOptions<Props, Data>

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
 * The types for mount have been copied directly from the VTU mount
 * https://github.com/vuejs/vue-test-utils-next/blob/master/src/mount.ts.
 *
 * There isn't a good way to make them generic enough that we can extend them.
 *
 * In addition, we modify the types slightly.
 *
 * `MountOptions` are modifying, including some Cypress specific options like `styles`.
 * The return type is different. Instead of VueWrapper, it's Cypress.Chainable<VueWrapper<...>>.
 */
type PublicProps = VNodeProps & AllowedComponentProps & ComponentCustomProps

type ComponentMountingOptions<T> = T extends DefineComponent<
  infer PropsOrPropOptions,
  any,
  infer D,
  any,
  any
>
  ? MountingOptions<
      Partial<ExtractDefaultPropTypes<PropsOrPropOptions>> &
      Omit<
          Readonly<ExtractPropTypes<PropsOrPropOptions>> & PublicProps,
          keyof ExtractDefaultPropTypes<PropsOrPropOptions>
        >,
      D
    > &
  Record<string, any>
  : MountingOptions<any>

// Class component (without vue-class-component) - no props
export function mount<V extends {}>(
  originalComponent: {
    new (...args: any[]): V
    __vccOpts: any
  },
  options?: MountingOptions<any> & Record<string, any>
): Cypress.Chainable<VueWrapper<ComponentPublicInstance<V>>>

// Class component (without vue-class-component) - props
export function mount<V extends {}, P>(
  originalComponent: {
    new (...args: any[]): V
    __vccOpts: any
    defaultProps?: Record<string, Prop<any>> | string[]
  },
  options?: MountingOptions<P & PublicProps> & Record<string, any>
): Cypress.Chainable<VueWrapper<ComponentPublicInstance<V>>>

// Class component - no props
export function mount<V extends {}>(
  originalComponent: {
    new (...args: any[]): V
    registerHooks(keys: string[]): void
  },
  options?: MountingOptions<any> & Record<string, any>
): Cypress.Chainable<VueWrapper<ComponentPublicInstance<V>>>

// Class component - props
export function mount<V extends {}, P>(
  originalComponent: {
    new (...args: any[]): V
    props(Props: P): any
    registerHooks(keys: string[]): void
  },
  options?: MountingOptions<P & PublicProps> & Record<string, any>
): Cypress.Chainable<VueWrapper<ComponentPublicInstance<V>>>

// Functional component with emits
export function mount<Props extends {}, E extends EmitsOptions = {}>(
  originalComponent: FunctionalComponent<Props, E>,
  options?: MountingOptions<Props & PublicProps> & Record<string, any>
): Cypress.Chainable<VueWrapper<ComponentPublicInstance<Props>>>

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
  Defaults extends {} = ExtractDefaultPropTypes<PropsOrPropOptions>
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
  options?: MountingOptions<
    Partial<Defaults> & Omit<Props & PublicProps, keyof Defaults>,
    D
  > &
  Record<string, any>
): Cypress.Chainable<
  VueWrapper<
    InstanceType<
      DefineComponent<
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
      >
    >
  >
>

// component declared by vue-tsc ScriptSetup
export function mount<T extends DefineComponent<any, any, any, any>>(
  component: T,
  options?: ComponentMountingOptions<T>
): Cypress.Chainable<VueWrapper<InstanceType<T>>>

// Component declared with no props
export function mount<
  Props = {},
  RawBindings = {},
  D extends {} = {},
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
    D,
    C,
    M,
    E,
    Mixin,
    Extends,
    EE
  >,
  options?: MountingOptions<Props & PublicProps, D>
): Cypress.Chainable<VueWrapper<ComponentPublicInstance<Props, RawBindings, D, C, M, E, VNodeProps & Props>>> & Record<string, any>

// Component declared with { props: [] }
export function mount<
  PropNames extends string,
  RawBindings,
  D extends {},
  C extends ComputedOptions = {},
  M extends Record<string, Function> = {},
  E extends EmitsOptions = Record<string, any>,
  Mixin extends ComponentOptionsMixin = ComponentOptionsMixin,
  Extends extends ComponentOptionsMixin = ComponentOptionsMixin,
  EE extends string = string,
  Props extends Readonly<{ [key in PropNames]?: any }> = Readonly<{
    [key in PropNames]?: any
  }>
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
  options?: MountingOptions<Props & PublicProps, D>
): Cypress.Chainable<VueWrapper<ComponentPublicInstance<Props, RawBindings, D, C, M, E>>>

// Component declared with { props: { ... } }
export function mount<
  // the Readonly constraint allows TS to treat the type of { required: true }
  // as constant instead of boolean.
  PropsOptions extends Readonly<ComponentPropsOptions>,
  RawBindings,
  D extends {},
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
  options?: MountingOptions<ExtractPropTypes<PropsOptions> & PublicProps, D>
): Cypress.Chainable<
  VueWrapper<
    ComponentPublicInstance<
      ExtractPropTypes<PropsOptions>,
      RawBindings,
      D,
      C,
      M,
      E,
      VNodeProps & ExtractPropTypes<PropsOptions>
    >
  >
>

// implementation
export function mount (componentOptions: any, options: any = {}) {
  // wait for cypress to load
  return cy.then(() => {
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
      if (options.log !== false) {
        // TODO: get the real displayName and props from VTU shallowMount
        const message = `<${getComponentDisplayName(componentOptions)} ... />`

        Cypress.log({
          name: 'mount',
          message: [message],
        })
      }

      // by returning undefined we keep the previous subject
      // which is the mounted component
      return undefined
    })
  })
}

/**
 * Extract the component name from the object passed to mount
 * @param componentOptions the component passed to mount
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
