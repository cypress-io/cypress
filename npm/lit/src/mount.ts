import {
  getContainerEl,
  injectStylesBeforeElement,
  setupHooks,
  StyleOptions,
} from '@cypress/mount-utils'
import { html, LitElement, render, TemplateResult } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'

export interface MountOptions<T extends HTMLElement>
  extends Partial<StyleOptions> {
  log?: boolean
  properties?: Partial<T>
}

export type MountReturn<T extends keyof HTMLElementTagNameMap> =
  Cypress.Chainable<{
    component: HTMLElementTagNameMap[T]
  }>;

let componentInstance: LitElement | HTMLElement | undefined

const cleanup = () => {
  componentInstance?.remove()
}

/**
 * Mounts a Web Component inside the Cypress browser
 *
 * @param {TemplateResult | string} Element Lit element being mounted or valid HTML string
 * @param {MountReturn<T>} options options to customize the element being mounted
 *  pass properties here when using strings. These will be assigned to the element.
 * @returns Cypress.Chainable<MountReturn>
 *
 * @example
 * import './Counter'
 * import { html } from 'lit'
 * import { mount } from 'cypress/lit'
 *
 * it('should render', () => {
 *   mount(html`<my-counter .count=${32}></my-counter>`)
 *   cy.get('counter-lit').shadow().get('button').contains(42)
 * })
 */
export function mount<T extends keyof HTMLElementTagNameMap> (
  Template: TemplateResult | string,
  options: MountOptions<HTMLElementTagNameMap[T]> = {},
): Cypress.Chainable<{
  component: HTMLElementTagNameMap[T]
}> {
  return cy.then(() => {
    const target = getContainerEl()

    injectStylesBeforeElement(options, document, target)

    // If give a string set internal contents unsafely
    const element =
      typeof Template === 'string' ? html`${unsafeHTML(Template)}` : Template

    /**
     * Using get will give default cypress timeouts for the element to register
     * onto the DOM and be ready for interaction.
     */
    return cy
    .wait(0, { log: false })
    .get('[data-cy-root]')
    .then(() => {
      render(element, target)
    })
    .children()
    .first()
    .then((element) => {
      const name = element.prop('tagName').toLowerCase()
      const el = document.getElementsByTagName<T>(name)[0]
      const { properties, log } = options

      /**
         * Pass properties to the component using the property assignment. This
         * enables support for non string types. Not required when using
         * lit-html.
         */
      if (
        properties &&
          typeof properties === 'object' &&
          Array.isArray(properties) === false
      ) {
        Object.entries(properties).forEach(([key, value]) => {
          el[(key as keyof typeof el)] = value
        })
      }

      componentInstance = el

      if (log !== false) {
        const mountMessage = `<${name} ... />`

        Cypress.log({
          name: 'mount',
          message: [mountMessage],
        })
        .snapshot('mounted')
        .end()
      }

      return cy.wrap({ component: el }, { log: false })
    })
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
