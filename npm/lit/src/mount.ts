import {
  injectStylesBeforeElement,
  StyleOptions,
  getContainerEl,
  setupHooks,
} from '@cypress/mount-utils'
import { LitElement, render, RootPart, TemplateResult } from 'lit'

const DEFAULT_COMP_NAME = 'unknown'

type LitElementConstructor<T> = new (...args: any[]) => T;

export interface MountOptions extends
  Partial<StyleOptions> {
  log?: boolean
}

let componentInstance: LitElement | undefined

const cleanup = () => {
  componentInstance?.remove()
}

// Extract the component name from the object passed to mount
const getComponentDisplayName = <T extends LitElement>(Component: LitElementConstructor<T>): string => {
  if (Component.name) {
    const [_, match] = /Proxy\<(\w+)\>/.exec(Component.name) || []

    return match || Component.name
  }

  return DEFAULT_COMP_NAME
}

/**
 * Mounts a Lit element inside the Cypress browser
 *
 * @param {LitElementConstructor<T>} Element Lit element being mounted
 * @param {MountReturn<T extends SvelteComponent>} options options to customize the element being mounted
 * @returns Cypress.Chainable<MountReturn>
 *
 * @example
 * import Counter from './Counter'
 * import { html } from 'lit'
 * import { mount } from 'cypress/svelte'
 *
 * it('should render', () => {
 *   mount(Counter, html`<my-counter .count=${32}></my-counter>`)
 *   cy.get('button').contains(42)
 * })
 */
export function mount<T extends LitElement> (
  Component: LitElementConstructor<T>,
  Template: TemplateResult,
  options: MountOptions = {},
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.then(() => {
    const target = getContainerEl()

    injectStylesBeforeElement(options, document, target)

    const componentInstance = render(Template, target)

    // by waiting, we are delaying test execution for the next tick of event loop
    // and letting hooks and component lifecycle methods to execute mount
    return cy.wait(0, { log: false }).then(() => {
      if (options.log !== false) {
        const mountMessage = `<${getComponentDisplayName(Component)} ... />`

        Cypress.log({
          name: 'mount',
          message: [mountMessage],
        }).snapshot('mounted').end()
      }
    })
    .wrap({ component: componentInstance }, { log: false })
    .get('[data-cy-root]')
    .children()
    .first()
    .shadow()
  })
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
