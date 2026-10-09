import { Console } from 'node:console'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { info } from '../../../lib/modes/info'
import * as capture from '../../../lib/capture'
import browserUtils from '../../../lib/browsers/utils'
import { fs } from '../../../lib/util/fs'
import * as detect from '@packages/launcher/lib/detect'
import { stripVTControlCharacters as stripAnsi } from 'util'
import _ from 'lodash'

describe('lib/modes/info', () => {
  beforeEach(() => {
    capture.restore()

    // vitest's console does not write through process.stdout, which capture patches
    vi.stubGlobal('console', new Console({ stdout: process.stdout, stderr: process.stderr }))

    vi.spyOn(browserUtils, 'getBrowserPath').mockImplementation((browser) => {
      if (_.isEqual(browser, chromeStable)) {
        return '/path/to/user/chrome/profile'
      }

      if (_.isEqual(browser, firefoxDev)) {
        return '/path/to/user/firefox/profile'
      }

      return undefined
    })
  })

  afterEach(() => {
    capture.restore()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const chromeStable = {
    displayName: 'Chrome',
    name: 'chrome',
    channel: 'stable',
    version: '12.34.56',
    majorVersion: 12,
    path: '/path/to/google-chrome',
  }

  const firefoxDev = {
    displayName: 'Firefox Dev',
    name: 'firefox',
    channel: 'dev',
    version: '79.0a1',
    majorVersion: 79,
    path: '/path/to/firefox',
  }

  const stubSample = () => {
    // have to make sure random sampling from the browser list
    // to create examples returns same order
    // so Chrome will be picked first, Firefox will be second
    return vi.spyOn(_, 'sample')
    .mockImplementation(() => undefined)
    .mockReturnValueOnce(chromeStable)
    .mockReturnValueOnce(firefoxDev)
  }

  const infoAndSnapshot = async (snapshotName) => {
    expect(snapshotName, 'missing snapshot name').toBeTypeOf('string')

    const captured = capture.stdout()

    await info()

    capture.restore()
    expect(stripAnsi(captured.toString())).toMatchSnapshot(snapshotName)
  }

  it('prints no browsers', async () => {
    vi.spyOn(detect, 'detect').mockResolvedValue([])
    await infoAndSnapshot('output without any browsers')
  })

  it('prints 1 found browser', async () => {
    vi.spyOn(detect, 'detect').mockResolvedValue([chromeStable] as any)

    await infoAndSnapshot('single chrome:stable')
  })

  it('prints 2 found browsers', async () => {
    vi.spyOn(detect, 'detect').mockResolvedValue([chromeStable, firefoxDev] as any)
    const sample = stubSample()

    await infoAndSnapshot('two browsers')
    expect(sample, 'two browsers were picked to create examples').toHaveBeenCalledTimes(2)
  })

  it('adds profile for browser if folder exists', async () => {
    vi.spyOn(detect, 'detect').mockResolvedValue([chromeStable, firefoxDev] as any)

    vi.spyOn(fs, 'statAsync').mockImplementation(((path) => {
      if (path === '/path/to/user/chrome/profile') {
        const err = new Error()

        err.name = 'No Chrome profile folder'
        throw err
      }

      if (path === '/path/to/user/firefox/profile') {
        return Promise.resolve({
          isDirectory: _.stubTrue,
        })
      }

      return undefined
    }) as any)

    stubSample()

    await infoAndSnapshot('two browsers with firefox having profile folder')
  })
})
