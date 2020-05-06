/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $ = Cypress.$.bind(Cypress);
let changed = 0;

describe("src/cy/commands/actions/type text_mask_spec", function() {
  before(function() {
    cy.visit("/fixtures/text-mask.html");

    //# count the number of change events
    return cy.get('input').then($els => $els.change($el => changed++));
  });

  beforeEach(() => //# reset number of change events before test
  changed = 0);

  return context("#type", function() {
    it("can type into phone", () => cy.get("#phone")
      .type('7701234567')
      .should('have.value', "(770) 123-4567")
      .blur()
      .then(() => expect(changed).to.eql(1)));

    it("backspace works properly", () => cy.get('#phone')
      .clear()
      .type('7{backspace}7709{backspace}123')
      .should('have.value', "(770) 123-____")
      .blur()
      .then(() => expect(changed).to.eql(1)));

    it("can accept bad key and arrowkeys in phone", () => cy.get('#phone')
      .clear()
      .type('{rightarrow}777q{leftarrow}{leftarrow}{leftarrow}01{leftarrow}{rightarrow}26{leftarrow}{leftarrow}345')
      .should('have.value', "(770) 123-4567")
      .blur()
      .then(() => expect(changed).to.eql(1)));

    it("can type into date", () => cy.get('#date')
      .type('10282011')
      .should('have.value', '10/28/2011')
      .blur()
      .then(() => expect(changed).to.eql(1)));

    it("can type into dollar", () => cy.get('#dollar')
      .type('50000')
      .should('have.value', "50,000 $")
      .blur()
      .then(() => expect(changed).to.eql(1)));

    it("can type decimal into dollar", () => cy.get('#dollar')
      .clear()
      .type('50.1234')
      .should('have.value', "50.12 $")
      .blur()
      .then(() => expect(changed).to.eql(1)));

    it("can accept bad key and arrowkeys in dollar", () => cy.get('#dollar')
      .clear()
      .type('50q{leftarrow}5{leftarrow}{rightarrow}00{rightarrow}{rightarrow}{backspace}{backspace}1{enter}')
      .should('have.value', "55,001 $")
      .then(() => expect(changed).to.eql(1)));

    it("can type into credit card", () => cy.get('#card')
      .clear()
      .type('1214q{leftarrow}{leftarrow}2343{rightarrow}56567878{leftarrow}{del}8')
      .should('have.value', "1212 3434 5656 7878")
      .blur()
      .then(() => expect(changed).to.eql(1)));

    return it("can backspace in card", () => cy.get('#card')
      .clear()
      .type('1111222233334444'+'{backspace}'.repeat(8))
      .should('have.value', "1111 2222 ____ ____")
      .clear()
      .type('1111222233334444{selectall}5555555555555555{backspace}')
      .should('have.value', "5555 5555 5555 555_")
      .blur()
      .then(() => expect(changed).to.eql(1)));
  });
});

