import { imFromMjs } from '../fixtures/mjs_file'

it('supports .mjs', () => {
  expect(imFromMjs).to.equal('I am from .mjs :)')
})
