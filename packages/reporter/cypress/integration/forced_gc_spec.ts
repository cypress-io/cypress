import { EventEmitter } from 'events'
import { RootRunnable } from './../../src/runnables/runnables-store'

describe('forced gc', () => {
  let runner: EventEmitter
  let runnables: RootRunnable

  beforeEach(() => {
    cy.fixture('runnables').then((_runnables) => {
      runnables = _runnables
    })

    runner = new EventEmitter()

    cy.visit('/').then((win) => {
      win.render({
        runner,
        spec: {
          name: 'foo',
          absolute: '/foo/bar',
          relative: 'foo/bar',
        },
      })
    })

    cy.get('.reporter').then(() => {
      runner.emit('runnables:ready', runnables)
      runner.emit('reporter:start', {})
    })
  })

  it('does not display the warning when interval is undefined', () => {
    cy.get('.forced-gc-warning').should('not.exist')
  })

  describe('when interval is null or a number', () => {
    beforeEach(() => {
      runner.emit('before:firefox:force:gc', { gcInterval: null })
    })

    it('expands on click', () => {
      cy.contains('GC Interval').click()
      cy.contains('Garbage Collection Interval').should('be.visible')
    })

    it('collapses on a second click', () => {
      cy.contains('GC Interval').click().click()
      cy.contains('Garbage Collection Interval').should('not.be.visible')
    })

    it('collapses on a clicking X', () => {
      cy.contains('GC Interval').click()
      cy.get('.forced-gc-warning .fa-times').click()
      cy.contains('Garbage Collection Interval').should('not.be.visible')
    })

    it('opens links externally', () => {
      cy.spy(runner, 'emit')
      cy.contains('GC Interval').click()
      cy.get('.forced-gc-warning a').each(($link) => {
        cy.wrap($link).click()
        cy.wrap(runner.emit).should('be.calledWith', 'external:open', $link.attr('href'))
      })
    })
  })

  describe('when interval is null', () => {
    beforeEach(() => {
      runner.emit('before:firefox:force:gc', { gcInterval: null })
    })

    it('displays the warning with (disabled)', () => {
      cy.get('.forced-gc-warning').should('be.visible')
      cy.contains('GC Interval: disabled')
    })

    it('displays the full message with (disabled)', () => {
      cy.contains('GC Interval').click()
      cy.contains('Garbage Collection Interval: (disabled)').should('be.visible')
    })
  })

  describe('when interval is 0', () => {
    beforeEach(() => {
      runner.emit('before:firefox:force:gc', { gcInterval: 0 })
    })

    it('displays the warning with (disabled)', () => {
      cy.get('.forced-gc-warning').should('be.visible')
      cy.contains('GC Interval: disabled')
    })

    it('displays the full message with (disabled)', () => {
      cy.contains('GC Interval').click()
      cy.contains('Garbage Collection Interval: (disabled)').should('be.visible')
    })
  })

  describe('when interval is greater than 0', () => {
    beforeEach(() => {
      runner.emit('before:firefox:force:gc', { gcInterval: 15 })
    })

    it('displays the warning with duration and running message', () => {
      cy.get('.forced-gc-warning').should('be.visible')
      cy.contains('GC Duration: 0.00')
      cy.contains('Running GC...')

      // ensure the page is loaded before taking snapshot
      cy.contains('test 4').should('be.visible')
      cy.percySnapshot()
    })

    it('displays the full message with (enabled)', () => {
      cy.contains('GC Duration').click()
      cy.contains('Garbage Collection Interval: (enabled)').should('be.visible')
    })
  })
})
