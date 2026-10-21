/* eslint-disable no-console */

import { createRequire } from 'module'
import chalk from 'chalk'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import exception from '../../lib/cloud/exception'
import * as errors from '../../lib/errors'

// The worker's stdout is not a TTY, and without color `chalk.red(err.stack)`
// equals `err.stack`, which would make the negative assertions below meaningless.
const errorsChalk = createRequire(require.resolve('@packages/errors/package.json'))('chalk')
const original = { enabled: chalk.enabled, level: chalk.level, errorsLevel: errorsChalk.level }

beforeAll(() => {
  chalk.enabled = true
  chalk.level = 1
  errorsChalk.level = 1
})

afterAll(() => {
  chalk.enabled = original.enabled
  chalk.level = original.level
  errorsChalk.level = original.errorsLevel
})

describe('.logException', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('calls exception.create with unknown error', () => {
    vi.spyOn(exception, 'create').mockResolvedValue(undefined)
    vi.stubEnv('CYPRESS_INTERNAL_ENV', 'production')

    const err = new Error('foo')

    return errors.logException(err)
    .then(() => {
      expect(console.log).toHaveBeenCalledWith(chalk.red(err.stack ?? ''))

      expect(exception.create).toHaveBeenCalledWith(err)
    })
  })

  it('does not call exception.create when known error', () => {
    vi.spyOn(exception, 'create').mockResolvedValue(undefined)
    vi.stubEnv('CYPRESS_INTERNAL_ENV', 'production')

    const err = errors.get('TESTS_DID_NOT_START_FAILED')

    return errors.logException(err)
    .then(() => {
      expect(console.log).not.toHaveBeenCalledWith(err.stack)

      expect(exception.create).not.toHaveBeenCalled()
    })
  })

  it('does not call exception.create when not in production env', () => {
    vi.spyOn(exception, 'create').mockResolvedValue(undefined)
    vi.stubEnv('CYPRESS_INTERNAL_ENV', 'development')

    const err = new Error('foo')

    return errors.logException(err)
    .then(() => {
      expect(console.log).not.toHaveBeenCalledWith(err.stack)

      expect(exception.create).not.toHaveBeenCalled()
    })
  })

  it('swallows creating exception errors', () => {
    vi.spyOn(exception, 'create').mockRejectedValue(new Error('foo'))
    vi.stubEnv('CYPRESS_INTERNAL_ENV', 'production')

    const err = errors.get('TESTS_DID_NOT_START_FAILED')

    return errors.logException(err)
    .then((ret) => {
      expect(ret).toBeUndefined()
    })
  })
})
