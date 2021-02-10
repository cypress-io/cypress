/// <reference types="cypress" />
import { ComponentPublicInstance } from 'vue'
import { MountingOptions, VueWrapper } from '@vue/test-utils'
// @ts-ignore
import { mount as VTUmount } from '@vue/test-utils/dist/vue-test-utils.esm-bundler'

const DEFAULT_COMP_NAME = 'unknown'

// when we mount a Vue component, we add it to the global Cypress object
// so here we extend the global Cypress namespace and its Cypress interface
declare global {
  // eslint-disable-next-line no-redeclare
  namespace Cypress {
    interface Cypress {
      vueWrapper: VueWrapper<ComponentPublicInstance>
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

export function mount (
  comp: any,
  options: Omit<MountingOptions<any>, 'attachTo'> & { log?: boolean } = {},
) {
  // Find out what to display in the mount message
  let componentForNaming = comp

  if (typeof comp === 'function') {
    componentForNaming = comp()
  } else {
    componentForNaming = comp
  }

  const componentName =
    componentForNaming.name ??
    (() => {
      if (!componentForNaming.type?.__file) return DEFAULT_COMP_NAME

      const compFileFullPath = componentForNaming.type.__file.split('/')

      return compFileFullPath[compFileFullPath.length - 1].replace(/.\w+$/, '')
    })()

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

    // mount the component using VTU and return the wrapper in Cypress.VueWrapper
    const wrapper = VTUmount(comp, { attachTo: rootNode, ...options })

    Cypress.vueWrapper = wrapper

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
export const mountCallback = (
  component: any,
  options: Omit<MountingOptions<any>, 'attachTo'> & { log?: boolean } = {},
) => {
  return () => mount(component, options)
}
