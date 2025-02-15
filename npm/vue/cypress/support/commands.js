/// <reference types="cypress" />
import { mount } from '@cypress/vue'

Cypress.Commands.add('mount', (comp) => {
  return mount(comp)
})

Cypress.Commands.add('logout', () => {
  const strID = myID + '.logout';

  let myElement;

  // Handle the window.confirm dialog by automatically clicking "OK"
  cy.on('window:confirm', () => true);

  myElement = getTable()
      .find('div[id="C1_W1_V2"]').should('not.be.undefined')
      .find('table[id="th-l-workAreaMainTable"]')
      .find('td[id="th-l-wcheadercontainer"]')
      .find('div[id="th-l-hdr-avatar"]')
      .find('span[class="th-bt-up"]')
      .find('a[title="TA KS IE ALE ADMIN 2"]')
      .click({ timeout: 10, waitForAnimations: true, force: true });

  myElement = getBody()
      .find('body').should('not.be.undefined')
      .find('table[class="th-dym-table"]')
      .find('td[class="th-dym-td th-dym-maincell"]')
      .find('li[aria-posinset="5"]')
      .find('span[class="th-dym-span th-dym-enabled"]')
      .find('a')
      .find('span')
      .contains('span', 'Fin de session')
      .trigger('click');

  cy.wait(1000);
});