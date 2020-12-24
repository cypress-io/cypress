/// <reference types="cypress" />

import State from './state'
import { expect } from 'chai'

const spec: Cypress.Cypress['spec'] = {
  specFilter: '',
  specType: 'component',
  name: '',
  absolute: '',
  relative: '',
}

describe('state', () => {
  it('returns filteredSpecs by name', () => {
    const fooSpec = { ...spec, name: 'foo.spec.js' }
    const barSpec = { ...spec, name: 'bar.spec.js' }
    const store = new State({
      specs: [fooSpec, barSpec],
    })

    store.setSearchSpecText('foo')

    expect(store.filteredSpecs).to.eql([fooSpec])
  })

  it('returns all specs when search spec is an empty string', () => {
    const fooSpec = { ...spec, name: 'foo.spec.js' }
    const barSpec = { ...spec, name: 'bar.spec.js' }
    const store = new State({
      specs: [fooSpec, barSpec],
    })

    store.setSearchSpecText('')

    expect(store.filteredSpecs).to.eql([fooSpec, barSpec])
  })
})
