/// <reference types="cypress" />

describe('Screen A', { tags: ['@sanity', '@screen-a'] }, () => {
  it('loads', { tags: ['@screen-b'] }, () => {
    // do something that eventually sends the page to screen b.
  })
})
