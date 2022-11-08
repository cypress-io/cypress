/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }
// import {
//   injectStylesBeforeElement,
//   StyleOptions,
//   getContainerEl,
//   setupHooks,
// } from '@cypress/mount-utils'
// import { render } from 'solid-js/web'

// import { mount } from './mount'

// Cypress.Commands.add("solidMount", (Comp) => {
//   return cy.then(() => {
// 	console.log(document)
// //     const $root = document.querySelector(ROOT_SELECTOR)!;

// //     injectStylesBeforeElement(options ?? {}, document, getContainerEl());

// //     // Render HTML containing component.
// //     $root.innerHTML = `<${name} id="root"></${name}>`;

//     //     const document: Document = cy.state("document");
//     //     const el = getContainerEl();
//     //     injectStylesBeforeElement({}, document, el);

//     //     const componentNode = document.createElement("div");

//     //     componentNode.id = "__cy_solid_root";

//     //     //     el.append(componentNode);

//     //     componentNode.innerHTML = `<div data-cy-root>heiheihei</div>`;

//     //     el.append(componentNode);

//     //     render(Comp, componentNode);
//     //   return mount(comp);
//   });
// });

// Cypress.on('run:start', () => {
//   // Consider doing a check to ensure your adapter only runs in Component Testing mode.
//   console.log('------start---------------------------dsa,fd----------')
//   //   if (Cypress.testingType !== "component") {
//   //     return;
//   //   }

//   //   Cypress.on("test:before:run", () => {
//   //     // Do some cleanup from previous test - for example, clear the DOM.
//   //     getContainerEl().innerHTML = "";
//   //   });
// })
