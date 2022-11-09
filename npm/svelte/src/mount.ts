import {
  injectStylesBeforeElement,
  StyleOptions,
  getContainerEl,
  setupHooks,
} from '@cypress/mount-utils'
import type { ComponentConstructorOptions, ComponentProps, SvelteComponent } from 'svelte'

const DEFAULT_COMP_NAME = 'unknown'

type SvelteConstructor<T> = new (...args: any[]) => T;
type SvelteComponentOptions<T extends SvelteComponent> = Omit<
  ComponentConstructorOptions<ComponentProps<T>>,
  'hydrate' | 'target' | '$$inline'
>;

export interface MountOptions<T extends SvelteComponent>
  extends SvelteComponentOptions<T>,
  Partial<StyleOptions> {
  log?: boolean
}

export interface MountReturn<T extends SvelteComponent> {
  component: T
}

let componentInstance: SvelteComponent | undefined

const cleanup = () => {
  componentInstance?.$destroy()
}

// Extract the component name from the object passed to mount
const getComponentDisplayName = <T extends SvelteComponent>(Component: SvelteConstructor<T>): string => {
  if (Component.name) {
    const [_, match] = /Proxy\<(\w+)\>/.exec(Component.name) || []

    return match || Component.name
  }

  return DEFAULT_COMP_NAME
}

/**
 * Mounts a Svelte component inside the Cypress browser
 *
 * @param {SvelteConstructor<T>} Component Svelte component being mounted
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
 */
export function mount<T extends SvelteComponent> (
  Component: SvelteConstructor<T>,
  options: MountOptions<T> = {},
): Cypress.Chainable<MountReturn<T>> {
  return cy.then(() => {
    const target = getContainerEl()

    injectStylesBeforeElement(options, document, target)

    const ComponentConstructor = ((Component as any).default || Component) as SvelteConstructor<T>

    componentInstance = new ComponentConstructor({
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
    .wrap({ component: componentInstance as T }, { log: false })
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
