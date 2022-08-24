import {
  injectStylesBeforeElement,
  StyleOptions,
  getContainerEl,
  setupHooks,
} from '@cypress/mount-utils'
import { SvelteComponentTyped, ComponentConstructorOptions, SvelteComponent } from 'svelte'

const DEFAULT_COMP_NAME = 'unknown'

type SvelteComponentClass = typeof SvelteComponent
type ConstructorOptions = Omit<ComponentConstructorOptions, 'hydrate' | 'target' | '$$inline'>

export interface MountOptions extends ConstructorOptions, Partial<StyleOptions> {
  log?: boolean
}

export interface MountReturn {
  component: SvelteComponentTyped
  unmount: (unmountOptions: { log?: boolean, message?: string }) => Cypress.Chainable<undefined>
}

let componentInstance: SvelteComponentTyped | undefined

const cleanup = () => {
  componentInstance?.$destroy()
}

// Extract the component name from the object passed to mount
const getComponentDisplayName = (Component: SvelteComponentClass): string => {
  if (Component.name) {
    const [_, match] = /Proxy\<(\w+)\>/.exec(Component.name) || []

    return match || Component.name
  }

  return DEFAULT_COMP_NAME
}

export function mount (
  Component: SvelteComponentClass,
  options: MountOptions = {},
): Cypress.Chainable<MountReturn> {
  return cy.then(() => {
    const target = getContainerEl()

    injectStylesBeforeElement(options, document, target)

    const ComponentConstructor = ((Component as any).default || Component) as SvelteComponentClass

    componentInstance = new ComponentConstructor({
      target,
      ...options,
    })

    const unmount: MountReturn['unmount'] = (unmountOptions = {}) => {
      return cy.then(() => {
        cleanup()
        if (unmountOptions.log) {
          Cypress.log({
            name: 'unmount',
            message: [unmountOptions.message ?? 'Unmounted component'],
          })
        }
      })
    }

    // by waiting, we are delaying test execution for the next tick of event loop
    // and letting hooks and component lifecycle methods to execute mount
    return cy.wait(0, { log: false }).then(() => {
      if (options.log) {
        const mountMessage = `<${getComponentDisplayName(Component)} ... />`

        Cypress.log({
          name: 'mount',
          message: [mountMessage],
        }).snapshot('mounted').end()
      }
    })
    .wrap({ component: componentInstance, unmount }, { log: false })
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
