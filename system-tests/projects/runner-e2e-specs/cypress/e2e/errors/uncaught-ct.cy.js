import Errors from '../../../src/Errors'
import Bluebird from 'bluebird'
import React from 'react'

describe('uncaught errors', { defaultCommandTimeout: 0 }, () => {
  it('sync app mount exception', () => {
    cy.mount(<Errors throwOnMount />)
  })

  it('sync app exception after mount', () => {
    cy.mount(<Errors />)
    cy.get('#trigger-sync-error').click()
  })

  it('async app exception after mount', () => {
    cy.mount(<Errors />)
    cy.get('#trigger-async-error').click()
    cy.wait(10000)
  })

  it('app unhandled rejection', () => {
    cy.mount(<Errors />)
    cy.get('#trigger-unhandled-rejection').click()
    cy.wait(10000)
  })

  it('exception inside uncaught:exception', () => {
    cy.on('uncaught:exception', () => {
      ({}).bar()
    })

    cy.mount(<Errors throwOnMount />)
  })

  it('async spec exception', () => {
    setTimeout(() => {
      ({}).bar()
    })

    cy.wait(10000)
  })

  // eslint-disable-next-line mocha/handle-done-callback
  it('async spec exception with done', (done) => {
    setTimeout(() => {
      ({}).bar()
    })
  })

  it('spec unhandled rejection', () => {
    Promise.reject(new Error('Unhandled promise rejection from the spec'))

    cy.wait(10000)
  })

  // eslint-disable-next-line mocha/handle-done-callback
  it('spec unhandled rejection with done', (done) => {
    Promise.reject(new Error('Unhandled promise rejection from the spec'))
  })

  it('spec Bluebird unhandled rejection', () => {
    Bluebird.reject(new Error('Unhandled promise rejection from the spec'))

    cy.wait(10000)
  })

  // eslint-disable-next-line mocha/handle-done-callback
  it('spec Bluebird unhandled rejection with done', (done) => {
    Bluebird.reject(new Error('Unhandled promise rejection from the spec'))
  })
})
