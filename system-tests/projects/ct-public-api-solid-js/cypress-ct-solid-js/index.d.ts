/// <reference types="cypress" />
/// <reference types="cypress" />
import { render } from 'solid-js/web'

interface MountingOptions {
  log?: boolean
}
export declare function mount(component: Parameters<typeof render>[0], options?: MountingOptions): Cypress.Chainable<undefined>;

export {}
