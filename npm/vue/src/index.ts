/// <reference types="cypress" />
import { Component, ComponentPublicInstance } from 'vue'
import { MountingOptions, VueWrapper, mount as VTUmount } from '@vue/test-utils'
import {
  injectStylesBeforeElement,
  StyleOptions,
  ROOT_ID,
  setupHooks,
} from '@cypress/mount-utils'

const DEFAULT_COMP_NAME = 'unknown'

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

type CyMountOptions<Props> = Omit<MountingOptions<Props>, 'attachTo'> & {
  log?: boolean
  /**
   * @deprecated use vue-test-utils `global` instead
   */
  extensions?: MountingOptions<Props>['global'] & {
    use?: MountingOptions<Props>['global']['plugins']
    mixin?: MountingOptions<Props>['global']['mixins']
  }
} & Partial<StyleOptions>

let initialInnerHtml = ''

Cypress.on('run:start', () => {
  if (Cypress.testingType !== 'component') {
    return
  }

  initialInnerHtml = document.head.innerHTML
  Cypress.on('test:before:run', () => {
    Cypress.vueWrapper?.unmount()
    // @ts-ignore
    const document: Document = cy.state('document')
    let el = document.getElementById(ROOT_ID)

    el.innerHTML = ''
    document.head.innerHTML = initialInnerHtml
  })
})

export function mount<Props = any> (
  comp: Component<Props>,
  options: CyMountOptions<Props> = {},
) {
  // TODO: get the real displayName and props from VTU shallowMount
  const componentName = DEFAULT_COMP_NAME

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

    let el = document.getElementById(ROOT_ID)

    injectStylesBeforeElement(options, document, el)

    // merge the extensions with global
    if (options.extensions) {
      options.extensions.plugins = [].concat(options.extensions.plugins || [], options.extensions.use || [])
      options.extensions.mixins = [].concat(options.extensions.mixins || [], options.extensions.mixin || [])
      options.global = { ...options.extensions, ...options.global }
    }

    const componentNode = document.createElement('div')

    componentNode.id = '__cy_vue_root'

    el.append(componentNode)

    // mount the component using VTU and return the wrapper in Cypress.VueWrapper
    const wrapper = VTUmount(comp as any, { attachTo: componentNode, ...options })

    Cypress.vueWrapper = wrapper
    Cypress.vue = wrapper.vm

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
 * Helper function for mounting a component quickly in test hooks.
 * @example
 *  import {mountCallback} from '@cypress/vue'
 *  beforeEach(mountVue(component, options))
 */
export function mountCallback<Props = any> (
  component: Component<Props>,
  options: CyMountOptions<Props> = {},
): () => void {
  return () => mount<Props>(component, options)
}

setupHooks()
