/// <reference types="cypress" />
import * as React from 'react'
import i18n from './i18n'
import { LocalizedComponent } from './LocalizedComponent'
import { mount } from 'cypress-react-unit-test'
import { I18nextProvider } from 'react-i18next'

describe('i18n', () => {
  const localizedMount = (node, { locale }) => {
    mount(
      <I18nextProvider i18n={i18n.cloneInstance({ lng: locale })}>
        {node}
      </I18nextProvider>,
    )
  }

  it('Plural in en', () => {
    localizedMount(<LocalizedComponent count={15} name="Josh" />, {
      locale: 'en',
    })

    cy.contains('Hello Josh, you have 15 unread messages.')
  })

  it('Single in en', () => {
    localizedMount(<LocalizedComponent count={1} name="Josh" />, {
      locale: 'en',
    })

    cy.contains('Hello Josh, you have 1 unread message.')
  })

  it('Plural in ru', () => {
    localizedMount(<LocalizedComponent count={15} name="Костя" />, {
      locale: 'ru',
    })

    cy.contains('Привет, Костя, y тебя 15 непрочитанных сообщений.')
  })

  it('Single in ru', () => {
    localizedMount(<LocalizedComponent count={1} name="Костя" />, {
      locale: 'ru',
    })

    cy.contains('Привет, Костя, y тебя 1 непрочитанное сообщение.')
  })
})
