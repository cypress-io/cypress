import { add } from './math'

it('is true', () => {
  // @ts-ignore
  expect(add(1, 2)).to.eq(3)
})
