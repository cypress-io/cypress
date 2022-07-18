import "zone.js";
import "zone.js/testing";

/**
 * @hack fixes "Mocha has already been patched with Zone" error.
 */
// @ts-ignore
window.Mocha["__zone_patch__"] = false;

import { mount } from './angular-mount'

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}


Cypress.Commands.add('mount', mount);
