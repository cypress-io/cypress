/// <reference types="cypress" />

const parameterized = 'parameterized'

describe('should filter out this spec', () => {
  it(`${parameterized} title`, { tags: '@sanity' }, () => {})

  it(`split title`, { tags: '@sanity' }, () => {})
})
