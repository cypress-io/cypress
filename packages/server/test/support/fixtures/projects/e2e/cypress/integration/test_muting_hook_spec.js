/// <reference types="cypress"/>

const { expect } = require('chai')

describe('test muting', () => {
  afterEach(() => {
    assert(false)
  })

  it('fails in afterEach, is muted', () => {
    expect(true).eq(true)
  })

  it('also fails', () => {
    assert(false)
  })
})
