import { it, expect } from 'vitest'

it('runs with the sanitized environment', () => {
  expect(process.env.CYPRESS_RECORD_KEY).toBeUndefined()
  expect(process.env.DEBUG).toBeUndefined()
  expect(process.env.CYPRESS_INTERNAL_ENV).toBe('test')
  expect(process.env.PATH).toBeDefined()
})
