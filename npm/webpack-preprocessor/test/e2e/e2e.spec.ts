/* eslint-disable no-console, prefer-rest-params */

import { describe, it, expect } from 'vitest'
import globby from 'globby'
import fs from 'fs-extra'
import _ from 'lodash'
import path from 'path'
import chalk from 'chalk'
import stripAnsi from 'strip-ansi'
import cypress from 'cypress'
import cp from 'child_process'
import json5 from 'json5'

const _spawn = cp.spawn

cp.spawn = function () {
  arguments[2].stdio = 'pipe'
  const ret = _spawn.apply(this, arguments)

  return ret
}

const runTest = async (options: { spec?: string } = {}) => {
  if (!options.spec) {
    throw new Error('options.spec not supplied')
  }

  let parsedSpecOptions = {}

  if (!_.isArray(options.spec)) {
    const fileStr = (await fs.readFile(options.spec)).toString()
    const match = /\/\*\s*EXPECT:\s*({.*})\s*\*\//s.exec(fileStr)

    if (match) {
      console.log(match[1])
      parsedSpecOptions = json5.parse(match[1])
    }
  }

  const opts = _.defaults(options, {
    spec: '',
    expectedResults: {
      totalFailed: 0,
    },
    stdoutInclude: null,
    browser: 'electron',
    exit: true,
  })

  _.merge(opts, parsedSpecOptions)

  if (_.isString(opts.stdoutInclude)) {
    opts.stdoutInclude = [opts.stdoutInclude]
  }

  console.log(chalk.cyanBright(`starting test run: ${opts.spec}`))

  const stdio = captureStdio(process.stdout)

  let stdout

  _.extend(process.env, {
    FAKE_CWD_PATH: '/[cwd]',
    DEBUG_COLORS: '1',
    // prevent any Compression progress
    // messages from showing up
    VIDEO_COMPRESSION_THROTTLE: 120000,

    // don't fail our own tests running from forked PR's
    CYPRESS_INTERNAL_SYSTEM_TESTS: '1',
    CYPRESS_ENV: 'test',
  })

  try {
    const res = await cypress.run({
      spec: opts.spec,
      browser: opts.browser,
      exit: opts.exit,
      dev: true,
    })

    stdout = stdio.toString()
    stdio.restore()

    expect(res).toMatchObject(opts.expectedResults)

    if (opts.stdoutInclude) {
      _.forEach(opts.stdoutInclude, (v) => {
        expect(stdout).toContain(v)
        console.log(`${chalk.bold('run matched stdout:')}\n${v}`)
      })
    }

    console.log(`${chalk.bold('run matched these results:')} ${JSON.stringify(opts.expectedResults, null, 2)}`)
  } catch (e) {
    console.error(stdout)
    throw e
  }
}

const captureStdio = (stdio: NodeJS.WriteStream, tty?: boolean) => {
  let logs = []
  let passThrough = null

  const write = stdio.write
  const isTTY = stdio.isTTY

  stdio.write = function (str) {
    logs.push(str)
    if (passThrough) {
      return write.apply(this, [passThrough(str)])
    }
  }

  if (tty !== undefined) stdio.isTTY = tty

  return {
    toString: () => {
      return stripAnsi(logs.join(''))
    },

    restore () {
      stdio.write = write
      stdio.isTTY = isTTY
    },
  }
}

describe('can test', () => {
  // runs every test in cypress/tests/e2e as its own test
  // the comment above the test will determine the assertion on the results
  globby.sync(path.join(__dirname, '../../cypress/tests/e2e/**/*'))
  .map((v) => {
    const filename = path.relative(process.cwd(), v)

    it(`test: ${filename}`, { timeout: 50000 }, async () => {
      await runTest({
        spec: v,
      })
    })
  })
})
