import {
  getContainerEl,
  setupHooks,
} from '@cypress/mount-utils'
import { mount as svelteMount, unmount as svelteUnmount } from 'svelte'
import type { MountOptions, Component } from 'svelte'

const DEFAULT_COMP_NAME = 'unknown'

export interface MountReturn{
  component: Record<string, any>
}

let componentInstance: Record<string, any> | undefined

const cleanup = () => {
  if (componentInstance) {
    svelteUnmount(componentInstance)
  }
}

// Extract the component name from the object passed to mount
const getComponentDisplayName = (Component: Component<Record<string, any>, Record<string, any>, any>): string => {
  if (Component.name) {
    const [, match] = /Proxy\<(\w+)\>/.exec(Component.name) || []

    return match || Component.name
  }

  return DEFAULT_COMP_NAME
}

/**
 * Mounts a Svelte component inside the Cypress browser
 *
 * @param {Record<string, any>} Component Svelte component being mounted
 * @param {MountReturn<T extends SvelteComponent>} options options to customize the component being mounted
 * @returns Cypress.Chainable<MountReturn>
 *
 * @example
 * import Counter from './Counter.svelte'
 * import { mount } from 'cypress/svelte'
 *
 * it('should render', () => {
 *   mount(Counter, { props: { count: 42 } })
 *   cy.get('button').contains(42)
 * })
 *
 * @see {@link https://on.cypress.io/mounting-svelte} for more details.
 */
export function mount (
  Component: Component<Record<string, any>, Record<string, any>, any>,
  options: Omit<MountOptions, 'target'> & {log?: boolean} = {},
): Cypress.Chainable<MountReturn> {
  // In Svelte 5, the component name is no longer easily discoverable and logs as "wrapper"
  // so we default the logging of it to false as it doesn't provide a lot of value
  options.log = options.log || false

  return cy.then(() => {
    // Remove last mounted component if cy.mount is called more than once in a test
    cleanup()

    const target = getContainerEl()

    const ComponentConstructor = ((Component as any).default || Component) as Component<Record<string, any>, Record<string, any>, any>

    // @see https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes
    componentInstance = svelteMount(ComponentConstructor, {
      target,
      ...options,
    })

    // by waiting, we are delaying test execution for the next tick of event loop
    // and letting hooks and component lifecycle methods to execute mount
    return cy.wait(0, { log: false }).then(() => {
      if (options.log !== false) {
        const mountMessage = `<${getComponentDisplayName(Component)} ... />`

        Cypress.log({
          name: 'mount',
          message: [mountMessage],
        })
      }
    })
    .wrap({ component: componentInstance as Record<string, any> }, { log: false })
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
