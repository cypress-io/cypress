/// <reference types="cypress" />
import {
  injectStylesBeforeElement,
  StyleOptions,
  getContainerEl,
  setupHooks,
} from '@cypress/mount-utils'

const DEFAULT_COMP_NAME = 'unknown'

// when we mount a Svelte component, we add it to the global Cypress object
// so here we extend the global Cypress namespace and its Cypress interface.
// Svelte users are used to using $set and $destroy to trigger the Svelte reactivity engine.
// We have parallels to this in Cypress.vueWrapper.
declare global {
  // eslint-disable-next-line no-redeclare
  namespace Cypress {
    interface Cypress {
      // TODO, types
      svelteComponent: any
    }
  }
}

const svelteComponentOptions = [
  'accessors',
  'anchor',
  'props',
  'hydrate',
  'intro',
  'context',
] as const

export type CyMountOptions = Partial<Record<(typeof svelteComponentOptions)[number], any>> &
{ log?: boolean } &
Partial<StyleOptions>

Cypress.on('run:start', () => {
  // `mount` is designed to work with component testing only.
  // it assumes ROOT_SELECTOR exists, which is not the case in e2e.
  // if the user registers a custom command that imports `cypress/svelte`,
  // this event will be registered and cause an error when the user
  // launches e2e (since it's common to use Cypress for both CT and E2E.
  // https://github.com/cypress-io/cypress/issues/17438
  if (Cypress.testingType !== 'component') {
    return
  }

  Cypress.on('test:before:run', () => {
    Cypress.svelteComponent?.$destroy()
    const el = getContainerEl()

    el.innerHTML = ''
  })
})

// implementation
export function mount (
  Component: any,
  options: CyMountOptions = {},
) {
  // TODO: get the real displayName and props from VTU shallowMount
  const componentName = getComponentDisplayName(Component)

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

    const componentNode = document.createElement('div')

    componentNode.id = '__cy_svelte_root'

    el.append(componentNode)

    // mount the component using VTU and return the component on Cypress.svelteComponent
    const ComponentConstructor = Component.default || Component

    const component = Cypress.svelteComponent = new ComponentConstructor({
      target: componentNode,
      ...options,
    })

    Cypress.svelteComponent = component

    return cy
    .wrap(component, { log: false })
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

    // remove the extension .js, .ts or .svelte from the filename to get the name of the component
    const baseFileName = fileName.replace(/\.(js|ts|svelte)?$/, '')

    // if the filename is index, then we can use the direct parent foldername, else use the name itself
    return (baseFileName === 'index' ? filepathSplit[filepathSplit.length - 2] : baseFileName)
  }

  return DEFAULT_COMP_NAME
}

/**
 * Helper function for mounting a component quickly in test hooks.
 * @example
 *  import {mountCallback} from '@cypress/svelte'
 *  beforeEach(mountSvelte(component, options))
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
