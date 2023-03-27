import { getContainerEl, setupHooks } from "@cypress/mount-utils";
import { render } from "solid-js/web";
let dispose;
function cleanup() {
    dispose === null || dispose === void 0 ? void 0 : dispose();
}
export function mount(component, options = {}) {
    // rendering/mounting function.
    const root = getContainerEl();
    // Render component with your library's relevant
    dispose = render(component, root);
    return cy.wait(0, { log: false }).then(() => {
        if (options.log !== false) {
            Cypress.log({
                name: "mount",
                message: "Mounted component",
            });
        }
    });
}
setupHooks(cleanup);
