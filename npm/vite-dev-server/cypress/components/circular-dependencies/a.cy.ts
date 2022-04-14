/// <reference types="cypress" />

import { a } from './a'

it('handles circular dependencies', () => {
  expect(a()).to.eq('This is the message')
})
