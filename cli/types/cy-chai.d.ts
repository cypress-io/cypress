// Shim definition to export a namespace. Cypress is actually a global module
// so import/export isn't allowed there. We import here and define a global module
/// <reference path="./chai/index.d.ts" />
declare namespace Chai {
  interface Include {
    html(html: string): Assertion
    text(text: string): Assertion
    value(text: string): Assertion
  }

  interface Assertion {
    /**
     * Assert that at least one element of the selection is focused.
     *
     * @example
     *    expect($('#result')).to.have.focus
     *    expect($('#result')).to.be.focused
     * @see http://chaijs.com/plugins/chai-jquery/#focus
     */
    focus: Assertion

    /**
     * Assert that at least one element of the selection is focused.
     *
     * @example
     *    expect($('#result')).to.be.focused
     *    expect($('#result')).to.have.focus
     * @see http://chaijs.com/plugins/chai-jquery/#focus
     */
    focused: Assertion
  }
}
