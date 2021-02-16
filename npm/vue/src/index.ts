/// <reference types="cypress" />
import { Component, ComponentPublicInstance } from 'vue'
import { MountingOptions, VueWrapper, mount as VTUmount } from '@vue/test-utils'

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

function getCypressCTRootNode () {
  // Let's mount components under a new div with this id
  const rootId = 'cypress-root'

  // @ts-ignore
  const document = cy.state('document') as Document

  const preRenderedRootNode = document.getElementById(rootId)

  if (preRenderedRootNode) {
    preRenderedRootNode.innerHTML = ''

    return preRenderedRootNode
  }

  const rootNode = document.createElement('div')

  rootNode.id = rootId
  document.body.prepend(rootNode)

  return rootNode
}

interface StyleOptions{
  /**
   * @deprecated all server options are used now so there is no need for this option anymore
   */
  style?: string
  /**
   * @deprecated all server options are used now so there is no need for this option anymore
   */
  stylesheets?: string | string[]
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
} & StyleOptions

function setupStyles (el: HTMLElement, options: StyleOptions) {
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
}

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

    // get of create the root node if it does not exist
    const rootNode = getCypressCTRootNode()

    setupStyles(rootNode, options)

    // merge the extensions with global
    if (options.extensions) {
      options.extensions.plugins = [...options.extensions.plugins || [], ...options.extensions.use || []]
      options.extensions.mixins = [...options.extensions.mixins || [], ...options.extensions.mixin || []]
      options.global = { ...options.extensions, ...options.global }
    }

    // mount the component using VTU and return the wrapper in Cypress.VueWrapper
    const wrapper = VTUmount(comp as any, { attachTo: rootNode, ...options })

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
