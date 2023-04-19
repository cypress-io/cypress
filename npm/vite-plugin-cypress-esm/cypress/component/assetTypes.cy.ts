import './style.css'
import { add } from './add'

it('does not transform non JS assets', () => {
  expect(add(1, 2)).to.eq(3)
})
