import './fixtures/style.css'
import { add } from './fixtures/add'

it('does not transform non JS assets', () => {
  expect(add(1, 2)).to.eq(3)
})
