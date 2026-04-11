/// <reference types="cypress" />

import dayjs from 'dayjs'

describe('dynamic imports', () => {
  it('uses real implementation', () => {
    expect(dayjs.isDayjs(dayjs())).to.eq(true)
  })

  it('mocks', () => {
    cy.stub(dayjs, 'isDayjs').callsFake(() => false)

    expect(dayjs.isDayjs(dayjs())).to.eq(false)
  })

  it('uses real implementation again', () => {
    expect(dayjs.isDayjs(dayjs())).to.eq(true)
  })

  it('stubs named export from node_modules using dynamic import', () => {
    let done = false

    async function run () {
      const mod = await import('react-router-dom')

      cy.stub(mod, 'createSearchParams').callsFake(() => 'STUB')
      const result = mod.createSearchParams({ q: 'test' })

      expect(result).to.eq('STUB')

      done = true
    }

    cy.wrap(run()).then(() => {
      expect(done).to.be.true
    })
  })

  it('stub local dynamic import', () => {
    let called = false

    async function run () {
      const mod = await import('./fixtures/add')

      cy.stub(mod, 'add')
      mod.add(1, 2)
      called = true
    }

    cy.wrap(run()).then(() => {
      expect(called).to.be.true
    })
  })

  it('stubs named export from node_modules using `then`', () => {
    import('react-router-dom').then((mod) => {
      cy.stub(mod, 'createSearchParams').callsFake(() => 'THEN_STUB')

      const result = mod.createSearchParams({ q: 'test' })

      expect(result).to.eq('THEN_STUB')
    })
  })

  it('destructures named export from dynamic import', () => {
    async function run () {
      const { createSearchParams } = await import('react-router-dom')

      expect(createSearchParams({ q: 'hello' }).toString()).to.eq('q=hello')
    }

    cy.wrap(run())
  })

  it('ignores import-like functions', async () => {
    /*
     * This test will probably explode due to malformed syntax if the exclusion logic isn't working,
     * so the assertion here isn't really necessary but helps mark as a passing test
     */

    const importLike = await import('./fixtures/import-like')

    expect(importLike.custom_import('abc')).to.eql('123abc')
  })
})
