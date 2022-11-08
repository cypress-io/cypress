// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')
import {
  ROOT_SELECTOR,
  setupHooks,
  injectStylesBeforeElement,
  getContainerEl,
  StyleOptions,
} from '@cypress/mount-utils'

Cypress.on('run:start', () => {
  // Consider doing a check to ensure your adapter only runs in Component Testing mode.
  console.log('---------------------------------dsa,fd----------')
  //   if (Cypress.testingType !== "component") {
  //     return;
  //   }

//   Cypress.on("test:before:run", () => {
//     // Do some cleanup from previous test - for example, clear the DOM.
//     getContainerEl().innerHTML = "";
//   });
})

// function maybeRegisterComponent<T extends CustomElementConstructor>(
//   name: string,
//   webComponent: T
// ) {
//   // Avoid double-registering a Web Component.
//   if (window.customElements.get(name)) {
//     return;
//   }

//   window.customElements.define(name, webComponent);
// }

// export function mount(
//   webComponent: CustomElementConstructor,
//   options?: Partial<StyleOptions>
// ): Cypress.Chainable {
//   console.log("-----------------------");
//   // Get root selector defined in `cypress/support.component-index.html
//   const $root = document.querySelector(ROOT_SELECTOR)!;

//   // Change to kebab-case to comply with Web Component naming convention
//   const name = webComponent.name
//     .replace(/([a-z0–9])([A-Z])/g, "$1-$2")
//     .toLowerCase();

//   /// Register Web Component
//   maybeRegisterComponent(name, webComponent);

//   // Inject user styles before mounting the component
//   injectStylesBeforeElement(options ?? {}, document, getContainerEl());

//   // Render HTML containing component.
//   $root.innerHTML = `<${name} id="root"></${name}>`;

//   // Log a messsage in the Command Log.
//   Cypress.log({
//     name: "mount",
//     message: [`<${name} ... />`],
//   });

//   // Return a `Cypress.Chainable` that returns whatever is idiomatic
//   // in the framework your mount adapter targets.
//   return cy.wrap(document.querySelector("#root"), { log: false });
// }

// // Setup Cypress lifecycle hooks. This tears down any styles
// // injected by injectStylesBeforeElement, etc.
// setupHooks();
