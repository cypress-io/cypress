/// <reference types="cypress" />
import Vue from 'vue'
import TranslatedMessageWithJSON from './TranslatedJSONMessage.vue'
import TranslatedMessageI18nBlock from './TranslatedI18nMessage.vue'
import VueI18n from 'vue-i18n'
import { mount } from '@cypress/vue'
import messages from './translations.json'

function expectHelloWorldGreeting () {
  cy.viewport(400, 200)
  const allLocales = Cypress.vue.$i18n.availableLocales

  // ensure we don't strip locales
  expect(Object.keys(messages)).to.have.members(allLocales)

  allLocales.forEach((locale) => {
    cy.get('select').select(locale).should('have.value', locale)
    const hello = messages[locale].hello

    cy.contains(hello)
  })
}

describe('VueI18n', () => {
  Vue.use(VueI18n)

  describe('with i18n block', () => {
    beforeEach(() => {
      const i18n = new VueI18n({ locale: 'en' })

      mount(TranslatedMessageI18nBlock, { i18n })
    })

    it('shows HelloWorld for all locales', expectHelloWorldGreeting)
  })

  describe('with messages argument', () => {
    beforeEach(() => {
      const i18n = new VueI18n({ locale: 'en', messages })

      mount(TranslatedMessageWithJSON, { i18n })
    })

    it('shows HelloWorld for all locales', expectHelloWorldGreeting)
  })
})
