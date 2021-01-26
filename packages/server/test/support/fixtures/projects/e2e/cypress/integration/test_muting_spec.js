/// <reference types="cypress"/>

const { expect } = require('chai')

beforeEach(() => {
  assert(true)
})

before(() => {
  assert(true)
})

describe('test muting', { env: { SUITE_ENV_VAR: '1' }, scrollBehavior: 'center' }, () => {
  beforeEach(() => {
    assert(true)
  })

  afterEach(() => {
    assert(true)
  })

  it('pass', { env: { TEST_ENV_VAR: '1' } }, () => {
    expect(true).eq(true)
  })

  it('muted fail 1', () => {
    expect(false).eq(true)
  })

  it('muted fail 2', () => {
    expect(false).eq(true)
  })

  it('muted pass', () => {
    expect(true).eq(true)
  })
})
