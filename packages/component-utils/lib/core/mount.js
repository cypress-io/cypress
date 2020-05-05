"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = require("./util/dom");
var errors_1 = require("./errors");
/**
 * Mounts the target
 * RootEl is present on the ComponentTestInstance after this point
 * @param componentTestInstance
 */
function mount(componentTestInstance) {
    return __awaiter(this, void 0, void 0, function () {
        var rootEl;
        return __generator(this, function (_a) {
            rootEl = dom_1.getRoot(componentTestInstance.options.rootId);
            if (rootEl === null)
                return [2 /*return*/, errors_1.handleError()];
            componentTestInstance.rootEl = rootEl;
            return [2 /*return*/, componentTestInstance];
        });
    });
}
exports.mount = mount;
//
// // Scratchpad notes
//
// // import * as React from 'react'
// // import ReactDOM, { unmountComponentAtNode } from 'react-dom'
// // import getDisplayName from './getDisplayName'
// // import { injectStylesBeforeElement } from './utils'
// //
// // const rootId = 'cypress-root'
//
// // function checkMountModeEnabled() {
// //   // @ts-ignore
// //   if (Cypress.spec.specType !== 'component') {
// //     throw new Error(
// //       `In order to use mount or unmount functions please place the spec in component folder`,
// //     )
// //   }
// // }
//
// /**
//  * Inject custom style text or CSS file or 3rd party style resources
//  */
// // const injectStyles = (options: MountOptions) => () => {
// //   const document = cy.state('document')
// //   const el = document.getElementById(rootId)
// //   return injectStylesBeforeElement(options, document, el)
// // }
//
// /**
//  * Mount a React component in a blank document; register it as an alias
//  * To access: use an alias or original component reference
//  *  @function   cy.mount
//  *  @param      {React.ReactElement}  jsx - component to mount
//  *  @param      {string}  [Component] - alias to use later
//  *  @example
//  ```
//  import Hello from './hello.jsx'
//  // mount and access by alias
//  cy.mount(<Hello />, 'Hello')
//  // using default alias
//  cy.get('@Component')
//  // using original component
//  cy.get(Hello)
//  ```
//  **/
//
// // export const mount = (jsx: React.ReactElement, options: MountOptions = {}) => {
// //     // Base Options
// //   const options = {
// //       checkMountModeEnabled: true,
// //       getDisplayName: () => {},
// //       alias: '',
// //       log: false
// //   }
// //   const hooks = {
// //       // nothing exists
// //       // mutate options to be passed into the setup function
// //       // access to mutate setup options before anything is done
// //       // Global Cypress
// //       beforeSetup() {
// //
// //       },
// //       // target exists, component doesn't
// //       // styles have been appended
// //       // access to mount options
// //       setup() {
// //
// //       },
// //       // define how to mount component
// //       // access to mount options
// //       mount() {
// //
// //       },
// //       // receive the component, log instance
// //       mounted() {
// //
// //       }
// //   }
// //   checkMountModeEnabled()
// //
// //   // Get the display name property via the component constructor
// //   // @ts-ignore FIXME
// //   const displayName = getDisplayName(jsx.type, options.alias)
// //   let logInstance: Cypress.Log
// //
// //   return cy
// //     .then(() => {
// //       if (options.log !== false) {
// //         logInstance = Cypress.log({
// //           name: 'mount',
// //           message: [`ReactDOM.render(<${displayName} ... />)`],
// //         })
// //       }
// //     })
// //     .then(injectStyles(options))
// //     .then(() => {
// //       const document = cy.state('document')
// //       const el = document.getElementById(rootId)options.ReactDom
// //
// //       if (!el) {
// //         throw new Error(
// //           [
// //             '[cypress-react-unit-test] 🔥 Hmm, cannot find root element to mount the component.',
// //             'Did you forget to include the support file?',
// //             'Check https://github.com/bahmutov/cypress-react-unit-test#install please',
// //           ].join(' '),
// //         )
// //       }
// //
// //       const key =
// //         // @ts-ignore provide unique key to the the wrapped component to make sure we are rerendering between tests
// //         (Cypress?.mocha?.getRunner()?.test?.title || '') + Math.random()
// //       const props = {
// //         key,
// //       }
// //
// //       const reactDomToUse = options.ReactDom || ReactDOM
// //       const CypressTestComponent = reactDomToUse.render(
// //         React.createElement(React.Fragment, props, jsx),
// //         el,
// //       )
// //
// //       const logConsoleProps = {
// //         props: jsx.props,
// //       }
// //       if (logInstance) {
// //         logInstance.set('consoleProps', () => logConsoleProps)
// //
// //         if (el.children.length) {
// //           logInstance.set('$el', el.children.item(0))
// //         }
// //       }
// //
// //       return cy
// //         .wrap(CypressTestComponent, { log: false })
// //         .as(options.alias || displayName)
// //         .then(() => {
// //           if (logInstance) {
// //             logInstance.snapshot('mounted')
// //             logInstance.end()
// //           }
// //
// //           return undefined
// //         })
// //     })
// // }
// //
// // /**
// //  * Removes any mounted component
// //  */
// // export const unmount = () => {
// //   checkMountModeEnabled()
// //
// //   cy.log('unmounting...')
// //   const selector = '#' + rootId
// //   return cy.get(selector, { log: false }).then($el => {
// //     unmountComponentAtNode($el[0])
// //   })
// // }
// //
// // export default mount
