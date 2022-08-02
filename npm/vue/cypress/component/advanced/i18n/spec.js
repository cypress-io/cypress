/// <reference types="cypress" />
import TranslatedMessageWithJSON from './TranslatedJSONMessage.vue'
import TranslatedMessageI18nBlock from './TranslatedI18nMessage.vue'
import { createI18n } from 'vue-i18n'
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
  describe('with i18n block', () => {
    beforeEach(() => {
      const i18n = createI18n({ locale: 'en' })

      mount(TranslatedMessageI18nBlock, { global: { plugins: [i18n] } })
    })

    it('shows HelloWorld for all locales', expectHelloWorldGreeting)
  })

  describe('with messages argument', () => {
    beforeEach(() => {
      const i18n = createI18n({ locale: 'en', messages })

      mount(TranslatedMessageWithJSON, { global: { plugins: [i18n] } })
    })

    it('shows HelloWorld for all locales', expectHelloWorldGreeting)
  })
})
