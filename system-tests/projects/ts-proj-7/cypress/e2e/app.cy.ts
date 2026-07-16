import { add } from './math'

type Nums = { a: number, b: number }

it('compiles and runs a TypeScript spec under typescript@7', () => {
  const nums: Nums = { a: 1, b: 2 }

  expect(add(nums.a, nums.b)).to.eq(3)
})
