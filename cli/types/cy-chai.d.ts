// Shim definition to export a namespace. Cypress is actually a global module
// so import/export isn't allowed there. We import here and define a global module
/// <reference path="./chai/index.d.ts" />
declare namespace Chai {
  interface Include {
    /**
     * Assert that the HTML of the first element of the selection contains the given HTML, using `.html()`.
     *
     * @example
     *    expect($('#result')).to.contain.html('<em>John Doe</em>')
     * @see http://chaijs.com/plugins/chai-jquery/#htmlhtml
     */
    html(html: string): Assertion

    /**
     * Assert that the text of the selection contains the given text, using `.text()`.
     * A number is compared against the text as a string.
     *
     * @example
     *    expect($('#result')).to.contain.text('John')
     *    expect($('#count')).to.contain.text(12)
     * @see http://chaijs.com/plugins/chai-jquery/#texttext
     */
    text(text: string | number): Assertion

    /**
     * Assert that the value of the first element of the selection contains the given value, using `.val()`.
     * A number is compared against the value as a string. Elements whose value is a number,
     * such as `<progress>`, `<meter>`, and `<li>`, never partially match.
     *
     * @example
     *    expect($('input')).to.contain.value('red')
     * @see http://chaijs.com/plugins/chai-jquery/#valuevalue
     */
    value(value: string | number): Assertion

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

    /**
     * Assert that the first element of the selection has the given attribute, using `.attr()`.
     * Optionally, assert a particular value as well. A number is compared against the attribute's string value.
     *
     * @example
     *    expect($('#result')).to.have.attr('role', 'menu')
     *    expect($('#result')).to.have.attr('tabindex', 0)
     * @see http://chaijs.com/plugins/chai-jquery/#attrname-value
     */
    attr(name: string, value?: string | number): Assertion

    /**
     * Assert that the first element of the selection has the given data value, using `.data()`.
     * jQuery parses numeric, boolean, and `null` `data-*` attributes into those types, and the value is compared with `===`,
     * so an object or array parsed from JSON never matches.
     *
     * @example
     *    expect($('#result')).to.have.data('foo', 'bar')
     *    expect($('#result')).to.have.data('count', 3)
     * @see http://chaijs.com/plugins/chai-jquery/#dataname-value
     */
    data(name: string, value?: string | number | boolean | null): Assertion

    /**
     * Assert that the first element of the selection has the given id, using `.prop('id')`.
     * A number is compared against the id as a string.
     *
     * @example
     *    expect($('#result')).to.have.id('result')
     *    expect($('#456')).to.have.id(456)
     * @see http://chaijs.com/plugins/chai-jquery/#idid
     */
    id(id: string | number): Assertion

    /**
     * Assert that the text of the selection equals the given text, using `.text()`.
     * A number is compared against the text as a string.
     *
     * @example
     *    expect($('#result')).to.have.text('pending')
     *    expect($('#count')).to.have.text(123)
     * @see http://chaijs.com/plugins/chai-jquery/#texttext
     */
    text(text: string | number): Assertion

    /**
     * Assert that the first element of the selection has the given value, using `.val()`.
     * A number is compared against the value as a string, except for elements whose value is a number: `<progress>`, `<meter>`, and `<li>`.
     *
     * @example
     *    expect($('input')).to.have.value('red')
     *    expect($('progress')).to.have.value(0.72)
     * @see http://chaijs.com/plugins/chai-jquery/#valuevalue
     */
    value(value: string | number): Assertion
  }

  interface Match {
    /**
     * Assert that the selection matches the given element, elements, jQuery object, or predicate, using `.is()`.
     * The subject must be a DOM element or jQuery object; any other subject accepts only a regular expression,
     * and a regular expression never matches a DOM element or jQuery object.
     *
     * @example
     *    expect($('#result')).to.match($('.menu'))
     *    expect($('#result')).to.match((index, element) => element.id === 'result')
     * @see http://chaijs.com/plugins/chai-jquery/#matchselector
     */
    (selector: Cypress.JQueryMatchable): Assertion
  }
}
