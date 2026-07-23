// Shim definition to export a namespace. Cypress is actually a global module
// so import/export isn't allowed there. We import here and define a global module
/// <reference path="./chai/index.d.ts" />
declare namespace Chai {
  interface Include {
    html(html: string): Assertion
    text(text: string): Assertion
    value(text: string): Assertion

    /**
     * Asserts that the target contains one of the values in the given list.
     * Available when `.oneOf` is chained with `.contain` or `.include`.
     *
     * @example
     *    expect('Today is sunny').to.contain.oneOf(['sunny', 'cloudy'])
     *    expect([1, 2, 3]).to.contain.oneOf([3, 4, 5])
     * @see http://chaijs.com/api/bdd/#method_oneof
     */
    oneOf(list: ReadonlyArray<any>, message?: string): Assertion
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

    /**
     * Asserts that the target is neither `null` nor `undefined`. Alias of `.exist`.
     *
     * @example
     *    expect(0).to.exists
     *    expect('').to.exists
     * @see http://chaijs.com/api/bdd/#method_exist
     */
    exists: Assertion

    /**
     * Asserts that the target is a number or a date greater than or equal to the
     * given number or date. Alias of `.least` (`.gte`).
     *
     * @example
     *    expect(2).to.be.greaterThanOrEqual(1)
     * @see http://chaijs.com/api/bdd/#method_least
     */
    greaterThanOrEqual: NumberComparer

    /**
     * Asserts that the target is a number or a date less than or equal to the
     * given number or date. Alias of `.most` (`.lte`).
     *
     * @example
     *    expect(1).to.be.lessThanOrEqual(2)
     * @see http://chaijs.com/api/bdd/#method_most
     */
    lessThanOrEqual: NumberComparer
  }
}
