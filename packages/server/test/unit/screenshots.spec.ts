import _ from 'lodash'
import path from 'path'
import Jimp from 'jimp'
import { Buffer } from 'buffer'
import dataUriToBuffer from 'data-uri-to-buffer'
import sizeOf from 'image-size'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import Fixtures from '@tooling/system-tests'
import screenshots from '../../lib/screenshots'
import { fs } from '../../lib/util/fs'
import * as plugins from '../../lib/plugins'
import { Screenshot } from '../../lib/automation/screenshot'
import { clearCtx, getCtx, makeDataContext, setCtx } from '../../lib/makeDataContext'

// Building the real schemas in this worker loads a second `graphql` realm, which
// `graphql` rejects. Resolving the project config never queries either schema.
vi.mock('@packages/data-context/graphql/schema', () => {
  return { graphqlSchema: {} }
})

vi.mock('@packages/data-context/graphql', () => {
  return { remoteSchemaWrapped: {} }
})

type ArgsStub = Mock & {
  withArgs: (...args: unknown[]) => ArgsStubBehavior
}

type ArgsStubBehavior = {
  returns: (value: unknown) => ArgsStubBehavior
  onCall: (n: number) => { returns: (value: unknown) => ArgsStubBehavior }
  onSecondCall: () => { returns: (value: unknown) => ArgsStubBehavior }
}

// The pixel checks rely on sinon's `withArgs(...).onCall(n)`, which counts calls
// per argument list and answers undefined for unconfigured arguments.
function argsStub (): ArgsStub {
  const callCounts = new Map<string, number>()
  const defaults = new Map<string, unknown>()
  const onCalls = new Map<string, Map<number, unknown>>()

  const fn = vi.fn((...args: unknown[]) => {
    const key = JSON.stringify(args)
    const n = callCounts.get(key) ?? 0

    callCounts.set(key, n + 1)

    const nth = onCalls.get(key)

    return nth?.has(n) ? nth.get(n) : defaults.get(key)
  })

  const withArgs = (...args: unknown[]): ArgsStubBehavior => {
    const key = JSON.stringify(args)
    const onCall = (n: number) => {
      return {
        returns (value: unknown) {
          if (!onCalls.has(key)) {
            onCalls.set(key, new Map())
          }

          onCalls.get(key)!.set(n, value)

          return behavior
        },
      }
    }
    const behavior: ArgsStubBehavior = {
      returns (value: unknown) {
        defaults.set(key, value)

        return behavior
      },
      onCall,
      onSecondCall: () => onCall(1),
    }

    return behavior
  }

  return Object.assign(fn, { withArgs })
}

const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAALlJREFUeNpi1F3xYAIDA4MBA35wgQWqyB5dRoaVmeHJ779wPhOM0aQtyBAoyglmOwmwM6z1lWY44CMDFgcBFmRTGp3EGGJe/WIQ5mZm4GRlBGJmhlm3PqGaeODpNzCtKsbGIARUCALvvv6FWw9XeOvrH4bbQNOQwfabnzHdGK3AwyAjyAqX2HPzC0Pn7Y9wPtyNIMGlD74wmAqwMZz+8AvFxzATVZAFQIqwABWQiWtgAY5uCnKAAwQYAPr8OZysiz4PAAAAAElFTkSuQmCC'
const iso8601Regex = /^\d{4}\-\d{2}\-\d{2}T\d{2}\:\d{2}\:\d{2}\.?\d*Z?$/
let ctx

// each test times out after only 1 sec so that durations are handled correctly
describe('lib/screenshots', { timeout: 1000 }, () => {
  let todosPath: string
  let config
  let appData
  let buffer: Buffer
  let jimpImage

  const originalComposite = Jimp.prototype.composite

  beforeAll(async () => {
    await clearCtx()
    setCtx(makeDataContext({} as Parameters<typeof makeDataContext>[0]))
    ctx = getCtx()

    vi.spyOn(ctx.browser, 'machineBrowsers').mockResolvedValue([
      {
        channel: 'stable',
        displayName: 'Electron',
        family: 'chromium',
        majorVersion: '123',
        name: 'electron',
        path: 'path-to-browser-one',
        version: '123.45.67',
      },
    ])

    Fixtures.scaffold()
    todosPath = Fixtures.projectPath('todos')

    await ctx.actions.project.setCurrentProjectAndTestingTypeForTestSetup(todosPath)

    const config1 = await ctx.lifecycleManager.getFullInitialConfig()

    config = config1
  })

  beforeEach(async () => {
    appData = {
      capture: 'viewport',
      appOnly: true,
      hideRunnerUi: false,
      clip: { x: 0, y: 0, width: 10, height: 10 },
      viewport: { width: 40, height: 40 },
    }

    buffer = Buffer.from('image 1 data buffer')

    jimpImage = {
      id: 1,
      bitmap: {
        width: 40,
        height: 40,
        data: buffer,
      },
      crop: vi.fn(() => {
        return jimpImage
      }),
      getBuffer: vi.fn(() => Promise.resolve(buffer)),
      getMIME () {
        return 'image/png'
      },
      hash: vi.fn(() => 'image hash'),
      clone: () => {
        return jimpImage
      },
    }

    Jimp.prototype.composite = vi.fn()
    // Jimp.prototype.getBuffer = sinon.stub().resolves(@buffer)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    Jimp.prototype.composite = originalComposite

    await getCtx()._reset()
    await clearCtx()

    return Fixtures.remove()
  })

  describe('.capture', () => {
    let getPixelColor: ArgsStub
    let automate: Mock
    let passPixelTest: () => void
    let jimpReadOnCall: Map<number, unknown>

    // Mirrors sinon `onCall(n).resolves(...)` on `Jimp.read`, counted across every call.
    const readResolvesOnCall = (n: number, img: unknown) => {
      jimpReadOnCall.set(n, img)
    }

    beforeEach(() => {
      getPixelColor = argsStub()
      getPixelColor.withArgs(0, 0).returns('grey')
      getPixelColor.withArgs(1, 0).returns('white')
      getPixelColor.withArgs(0, 1).returns('white')
      getPixelColor.withArgs(40, 0).returns('white')
      getPixelColor.withArgs(0, 40).returns('white')
      getPixelColor.withArgs(40, 40).returns('black')
      jimpImage.getPixelColor = getPixelColor

      jimpReadOnCall = new Map()
      let jimpReadCalls = 0

      vi.spyOn(Jimp, 'read').mockImplementation((() => {
        const n = jimpReadCalls++

        return Promise.resolve(jimpReadOnCall.has(n) ? jimpReadOnCall.get(n) : jimpImage)
      }) as any)

      const colors = {
        black: { r: 0, g: 0, b: 0 },
        grey: { r: 127, g: 127, b: 127 },
        white: { r: 255, g: 255, b: 255 },
      }

      vi.spyOn(Jimp, 'intToRGBA').mockImplementation(((color: string) => colors[color]) as any)

      automate = vi.fn(() => Promise.resolve(image))

      passPixelTest = () => {
        getPixelColor.withArgs(0, 0).returns('white')
      }
    })

    it('captures screenshot with automation', () => {
      const data = { viewport: jimpImage.bitmap }

      return screenshots.capture(data, automate).then(() => {
        expect(automate).toHaveBeenCalledOnce()

        expect(automate).toHaveBeenCalledWith(data)
      })
    })

    it('retries until helper pixels are no longer present for viewport capture', () => {
      getPixelColor.withArgs(0, 0).onCall(1).returns('white')

      return screenshots.capture(appData, automate).then(() => {
        expect(automate).toHaveBeenCalledTimes(2)
      })
    })

    it('retries until helper pixels are present for runner capture', () => {
      passPixelTest()
      getPixelColor.withArgs(0, 0).onCall(1).returns('black')

      return screenshots.capture({ viewport: jimpImage.bitmap }, automate)
      .then(() => {
        expect(automate).toHaveBeenCalledTimes(2)
      })
    })

    it('adjusts cropping based on pixel ratio', () => {
      appData.viewport = { width: 20, height: 20 }
      appData.clip = { x: 5, y: 5, width: 10, height: 10 }
      passPixelTest()
      getPixelColor.withArgs(2, 0).returns('white')
      getPixelColor.withArgs(0, 2).returns('white')

      return screenshots.capture(appData, automate)
      .then(() => {
        expect(jimpImage.crop).toHaveBeenCalledWith(10, 10, 20, 20)
      })
    })

    it('resolves details w/ image', () => {
      passPixelTest()

      return screenshots.capture(appData, automate).then((details) => {
        expect(details.image).toBe(jimpImage)
        expect(details.multipart).toBe(false)
        expect(details.pixelRatio).toBe(1)

        expect(details.takenAt).toMatch(iso8601Regex)
      })
    })

    describe('runner hidden', { timeout: 5000 }, () => {
      it('crops if this is not an appOnly capture but the runner is hidden', () => {
        appData.hideRunnerUi = true
        appData.capture = 'runner'
        appData.appOnly = false

        passPixelTest()

        return screenshots.capture(appData, automate)
        .then(() => {
          expect(jimpImage.crop).toHaveBeenCalledWith(0, 0, 10, 10)
        })
      })

      it('retries until helper pixels are no longer present for runner capture with runner hidden', () => {
        appData.hideRunnerUi = true
        appData.capture = 'runner'
        appData.appOnly = false

        getPixelColor.withArgs(0, 0).onCall(1).returns('white')

        return screenshots.capture(appData, automate).then(() => {
          expect(automate).toHaveBeenCalledTimes(2)
        })
      })
    })

    describe('simple capture', () => {
      beforeEach(() => {
        appData.simple = true
      })

      it('skips pixel checking / reading into Jimp image', () => {
        return screenshots.capture(appData, automate).then(() => {
          expect(Jimp.read).not.toHaveBeenCalled()
        })
      })

      it('resolves details w/ buffer', () => {
        return screenshots.capture(appData, automate).then((details) => {
          expect(details.takenAt).toMatch(iso8601Regex)
          expect(details.multipart).toBe(false)

          expect(details.buffer).toBeInstanceOf(Buffer)
        })
      })
    })

    describe('userClip', () => {
      it('crops final image if userClip specified', () => {
        appData.userClip = { width: 5, height: 5, x: 2, y: 2 }
        passPixelTest()

        return screenshots.capture(appData, automate).then(() => {
          expect(jimpImage.crop).toHaveBeenCalledWith(2, 2, 5, 5)
        })
      })

      it('does not crop intermediary multi-part images', () => {
        appData.userClip = { width: 5, height: 5, x: 2, y: 2 }
        appData.current = 1
        appData.total = 3
        passPixelTest()

        return screenshots.capture(appData, automate).then(() => {
          expect(jimpImage.crop).not.toHaveBeenCalled()
        })
      })

      it('adjusts cropping based on pixel ratio', () => {
        appData.viewport = { width: 20, height: 20 }
        appData.userClip = { x: 5, y: 5, width: 10, height: 10 }
        passPixelTest()
        getPixelColor.withArgs(2, 0).returns('white')
        getPixelColor.withArgs(0, 2).returns('white')

        return screenshots.capture(appData, automate).then(() => {
          expect(jimpImage.crop).toHaveBeenCalledWith(10, 10, 20, 20)
        })
      })
    })

    describe('multi-part capture (fullPage or element)', () => {
      let jimpImage2
      let jimpImage3
      let jimpImage4

      beforeEach(() => {
        screenshots.clearMultipartState()

        appData.current = 1
        appData.total = 3

        getPixelColor.withArgs(0, 0).onSecondCall().returns('white')

        const clone = (img, props) => {
          return _.defaultsDeep(props, img)
        }

        jimpImage2 = clone(jimpImage, {
          id: 2,
          bitmap: {
            data: Buffer.from('image 2 data buffer'),
          },
        })

        jimpImage3 = clone(jimpImage, {
          id: 3,
          bitmap: {
            data: Buffer.from('image 3 data buffer'),
          },
        })

        jimpImage4 = clone(jimpImage, {
          id: 4,
          bitmap: {
            data: Buffer.from('image 4 data buffer'),
          },
        })
      })

      it('retries until helper pixels are no longer present on first capture', () => {
        return screenshots.capture(appData, automate)
        .then(() => {
          expect(automate).toHaveBeenCalledTimes(2)
        })
      })

      it('retries until images aren\'t the same on subsequent captures', () => {
        return screenshots.capture(appData, automate)
        .then(() => {
          readResolvesOnCall(3, jimpImage2)

          appData.current = 2

          return screenshots.capture(appData, automate)
        }).then(() => {
          expect(automate).toHaveBeenCalledTimes(4)
        })
      })

      it('resolves no image on non-last captures', () => {
        return screenshots.capture(appData, automate)
        .then((image) => {
          expect(image).toBeNull()
        })
      })

      it('resolves details w/ image on last capture', () => {
        return screenshots.capture(appData, automate)
        .then(() => {
          readResolvesOnCall(3, jimpImage2)

          appData.current = 3

          return screenshots.capture(appData, automate)
        }).then(({ image }) => {
          expect(image).toBeInstanceOf(Jimp)
        })
      })

      it('composites images into one image', () => {
        readResolvesOnCall(2, jimpImage2)
        readResolvesOnCall(3, jimpImage3)

        return screenshots.capture(appData, automate)
        .then(() => {
          appData.current = 2

          return screenshots.capture(appData, automate)
        }).then(() => {
          appData.current = 3

          return screenshots.capture(appData, automate)
        }).then(() => {
          const composite = Jimp.prototype.composite as unknown as Mock

          expect(composite).toHaveBeenCalledTimes(3)
          expect(composite.mock.calls[0][0]).toBe(jimpImage)
          expect(composite.mock.calls[0][1]).toBe(0)
          expect(composite.mock.calls[0][2]).toBe(0)
          expect(composite.mock.calls[1][0]).toBe(jimpImage)
          expect(composite.mock.calls[1][2]).toBe(40)
          expect(composite.mock.calls[2][0]).toBe(jimpImage)

          expect(composite.mock.calls[2][2]).toBe(80)
        })
      })

      it('clears previous full page state once complete', () => {
        getPixelColor.withArgs(0, 0).returns('white')

        readResolvesOnCall(1, jimpImage2)
        readResolvesOnCall(2, jimpImage3)
        readResolvesOnCall(3, jimpImage4)

        appData.total = 2

        return screenshots.capture(appData, automate)
        .then(() => {
          appData.current = 2

          return screenshots.capture(appData, automate)
        }).then(() => {
          appData.current = 1

          return screenshots.capture(appData, automate)
        }).then(() => {
          appData.current = 2

          return screenshots.capture(appData, automate)
        }).then(() => {
          expect(Jimp.prototype.composite).toHaveBeenCalledTimes(4)
        })
      })

      it('skips full page process if only one capture needed', () => {
        appData.total = 1

        return screenshots.capture(appData, automate)
        .then(() => {
          expect(Jimp.prototype.composite).not.toHaveBeenCalled()
        })
      })
    })

    describe('integration', { timeout: 10000 }, () => {
      let data1
      let data2
      let data3
      let dataUri: (img: string) => () => Promise<string>

      beforeEach(() => {
        screenshots.clearMultipartState()

        vi.restoreAllMocks()

        data1 = {
          titles: ['cy.screenshot() - take a screenshot'],
          testId: 'r2',
          name: 'app-screenshot',
          capture: 'fullPage',
          clip: { x: 0, y: 0, width: 1000, height: 646 },
          viewport: { width: 1280, height: 646 },
          current: 1,
          total: 3,
        }

        data2 = {
          titles: ['cy.screenshot() - take a screenshot'],
          testId: 'r2',
          name: 'app-screenshot',
          capture: 'fullPage',
          clip: { x: 0, y: 0, width: 1000, height: 646 },
          viewport: { width: 1280, height: 646 },
          current: 2,
          total: 3,
        }

        data3 = {
          titles: ['cy.screenshot() - take a screenshot'],
          testId: 'r2',
          name: 'app-screenshot',
          capture: 'fullPage',
          clip: { x: 0, y: 138, width: 1000, height: 508 },
          viewport: { width: 1280, height: 646 },
          current: 3,
          total: 3,
        }

        dataUri = (img) => {
          return () => {
            return fs.readFileAsync(Fixtures.path(`img/${img}`))
            .then((buf) => {
              return `data:image/png;base64,${buf.toString('base64')}`
            })
          }
        }
      })

      it('stitches together 1x DPI images', () => {
        return screenshots
        .capture(data1, dataUri('DPI-1x/1.png'))
        .then((img1) => {
          expect(img1).toBeNull()

          return screenshots
          .capture(data2, dataUri('DPI-1x/2.png'))
        }).then((img2) => {
          expect(img2).toBeNull()

          return screenshots
          .capture(data3, dataUri('DPI-1x/3.png'))
        }).then((img3) => {
          return Jimp.read(Fixtures.path('img/DPI-1x/stitched.png'))
          .then((img) => {
            expect(screenshots.imagesMatch(img, img3.image))
          })
        })
      })

      it('stiches together 2x DPI images', () => {
        return screenshots
        .capture(data1, dataUri('DPI-2x/1.png'))
        .then((img1) => {
          expect(img1).toBeNull()

          return screenshots
          .capture(data2, dataUri('DPI-2x/2.png'))
        }).then((img2) => {
          expect(img2).toBeNull()

          return screenshots
          .capture(data3, dataUri('DPI-2x/3.png'))
        }).then((img3) => {
          return Jimp.read(Fixtures.path('img/DPI-2x/stitched.png'))
          .then((img) => {
            expect(screenshots.imagesMatch(img, img3.image))
          })
        })
      })
    })
  })

  describe('.crop', () => {
    let dimensions: (overrides?: object) => object

    beforeEach(() => {
      dimensions = (overrides) => {
        return _.extend({ x: 0, y: 0, width: 10, height: 10 }, overrides)
      }
    })

    it('crops to dimension size if less than the image size', () => {
      screenshots.crop(jimpImage, dimensions())

      expect(jimpImage.crop).toHaveBeenCalledWith(0, 0, 10, 10)
    })

    it('crops to dimension size if less than the image size', () => {
      screenshots.crop(jimpImage, dimensions())

      expect(jimpImage.crop).toHaveBeenCalledWith(0, 0, 10, 10)
    })

    it('crops to one less than width if dimensions x is more than the image width', () => {
      screenshots.crop(jimpImage, dimensions({ x: 50 }))

      expect(jimpImage.crop).toHaveBeenCalledWith(39, 0, 1, 10)
    })

    it('crops to one less than height if dimensions y is more than the image height', () => {
      screenshots.crop(jimpImage, dimensions({ y: 50 }))

      expect(jimpImage.crop).toHaveBeenCalledWith(0, 39, 10, 1)
    })

    it('crops only width if dimensions height is more than the image height', () => {
      screenshots.crop(jimpImage, dimensions({ height: 50 }))

      expect(jimpImage.crop).toHaveBeenCalledWith(0, 0, 10, 40)
    })

    it('crops only height if dimensions width is more than the image width', () => {
      screenshots.crop(jimpImage, dimensions({ width: 50 }))

      expect(jimpImage.crop).toHaveBeenCalledWith(0, 0, 40, 10)
    })
  })

  describe('.save', () => {
    it('outputs file and returns details', () => {
      const buf = dataUriToBuffer(image)

      return Jimp.read(buf)
      .then((i) => {
        const details = {
          image: i,
          multipart: false,
          pixelRatio: 2,
          takenAt: '1234-date',
        }

        const dimensions = sizeOf(buf)

        return screenshots.save(
          { name: 'foo bar\\baz/my-screenshot', specName: 'foo.spec.js', testFailure: false },
          details,
          config.screenshotsFolder,
        )
        .then((result) => {
          const expectedPath = path.join(
            config.screenshotsFolder, 'foo.spec.js', 'foo bar', 'baz', 'my-screenshot.png',
          )

          const actualPath = path.normalize(result.path)

          expect(result).toStrictEqual({
            multipart: false,
            pixelRatio: 2,
            path: path.normalize(result.path),
            size: 272,
            name: 'foo bar\\baz/my-screenshot',
            specName: 'foo.spec.js',
            testFailure: false,
            takenAt: '1234-date',
            dimensions: _.pick(dimensions, 'width', 'height'),
          })

          expect(expectedPath).toBe(actualPath)

          return fs.statAsync(expectedPath)
        })
      })
    })

    it('can handle saving buffer', () => {
      const details = {
        multipart: false,
        pixelRatio: 1,
        buffer: dataUriToBuffer(image),
        takenAt: '1234-date',
      }

      const dimensions = sizeOf(details.buffer)

      return screenshots.save(
        { name: 'with-buffer', specName: 'foo.spec.js', testFailure: false },
        details,
        config.screenshotsFolder,
      )
      .then((result) => {
        const expectedPath = path.join(
          config.screenshotsFolder, 'foo.spec.js', 'with-buffer.png',
        )

        const actualPath = path.normalize(result.path)

        expect(result).toStrictEqual({
          name: 'with-buffer',
          multipart: false,
          pixelRatio: 1,
          path: path.normalize(result.path),
          size: 279,
          specName: 'foo.spec.js',
          testFailure: false,
          takenAt: '1234-date',
          dimensions: _.pick(dimensions, 'width', 'height'),
        })

        expect(expectedPath).toBe(actualPath)

        return fs.statAsync(expectedPath)
      })
    })
  })

  describe('.getPath', () => {
    beforeEach(() => {
      vi.spyOn(fs, 'outputFileAsync').mockResolvedValue(undefined as any)
    })

    it('concats spec name, screenshotsFolder, and name', () => {
      return screenshots.getPath({
        specName: 'examples/user/list.js',
        titles: ['bar', 'baz'],
        name: 'quux/lorem',
      }, 'png', 'path/to/screenshots')
      .then((p) => {
        expect(p).toBe(
          'path/to/screenshots/examples/user/list.js/quux/lorem.png',
        )
      })
    })

    it('concats spec name, screenshotsFolder, and titles', () => {
      return screenshots.getPath({
        specName: 'examples/user/list.js',
        titles: ['bar', 'baz'],
        takenPaths: ['a'],
        testFailure: true,
      }, 'png', 'path/to/screenshots')
      .then((p) => {
        expect(p).toBe(
          'path/to/screenshots/examples/user/list.js/bar -- baz (failed).png',
        )
      })
    })

    it('sanitizes file paths', () => {
      return screenshots.getPath({
        specName: 'examples$/user/list.js',
        titles: ['bar*', 'baz..', '語言'],
        takenPaths: ['a'],
        testFailure: true,
      }, 'png', 'path/to/screenshots')
      .then((p) => {
        expect(p).toBe(
          'path/to/screenshots/examples$/user/list.js/bar -- baz -- 語言 (failed).png',
        )
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/2403
    it('truncates long paths with unicode in them', async () => {
      const fullPath = await screenshots.getPath({
        titles: [
          'WMED: [STORY] Тестовые сценарии для CI',
          'Сценарии:',
          'Сценарий 2: Создание обращения, создание медзаписи, привязкапривязка обращения к медзаписи',
          '- Сценарий 2',
        ],
        testFailure: true,
        specName: 'WMED_UAT_Scenarios_For_CI_spec.js',
      }, 'png', '/jenkins-slave/workspace/test-wmed/qa/cypress/wmed_ci/cypress/screenshots/')

      const basename = path.basename(fullPath)

      expect(Buffer.from(basename).byteLength).toBeLessThan(255)
    })

    it('reacts to ENAMETOOLONG errors and tries to shorten the filename', async () => {
      const err: NodeJS.ErrnoException = new Error('enametoolong')

      err.code = 'ENAMETOOLONG'

      _.times(50, () => vi.mocked(fs.outputFileAsync).mockRejectedValueOnce(err))

      const fullPath = await screenshots.getPath({
        specName: 'foo.js',
        name: 'a'.repeat(256),
      }, 'png', '/tmp')

      expect(path.basename(fullPath)).toHaveLength(204)
    })

    it('rejects with ENAMETOOLONG errors if name goes below MIN_PREFIX_LENGTH', async () => {
      const err: NodeJS.ErrnoException = new Error('enametoolong')

      err.code = 'ENAMETOOLONG'

      _.times(150, () => vi.mocked(fs.outputFileAsync).mockRejectedValueOnce(err))

      await expect(screenshots.getPath({
        specName: 'foo.js',
        name: 'a'.repeat(256),
      }, 'png', '/tmp')).rejects.toBe(err)
    })

    _.each([Infinity, 0 / 0, [], {}, 1, false], (value) => {
      it(`doesn't err and stringifies non-string test title: ${value}`, () => {
        return screenshots.getPath({
          specName: 'examples$/user/list.js',
          titles: ['bar*', '語言', value],
          takenPaths: ['a'],
          testFailure: true,
        }, 'png', 'path/to/screenshots')
        .then((p) => {
          expect(p).toBe(`path/to/screenshots/examples$/user/list.js/bar -- 語言 -- ${value} (failed).png`)
        })
      })
    })

    _.each([null, undefined], (value) => {
      it(`doesn't err and removes null/undefined test title: ${value}`, () => {
        return screenshots.getPath({
          specName: 'examples$/user/list.js',
          titles: ['bar*', '語言', value],
          takenPaths: ['a'],
          testFailure: true,
        }, 'png', 'path/to/screenshots')
        .then((p) => {
          expect(p).toBe('path/to/screenshots/examples$/user/list.js/bar -- 語言 --  (failed).png')
        })
      })
    })
  })

  describe('.afterScreenshot', () => {
    let data
    let details

    beforeEach(() => {
      data = {
        titles: ['the', 'title'],
        testId: 'r1',
        name: 'my-screenshot',
        capture: 'runner',
        appOnly: false,
        hideRunnerUi: false,
        clip: { x: 0, y: 0, width: 1000, height: 660 },
        viewport: { width: 1400, height: 700 },
        scaled: true,
        blackout: [],
        startTime: '2018-06-27T20:17:19.537Z',
        specName: 'integration/spec.cy.ts',
      }

      details = {
        size: 100,
        takenAt: new Date().toISOString(),
        dimensions: { width: 1000, height: 660 },
        multipart: false,
        pixelRatio: 1,
        name: 'my-screenshot',
        specName: 'integration/spec.cy.ts',
        testFailure: true,
        path: '/path/to/my-screenshot.png',
      }

      vi.spyOn(plugins, 'has').mockImplementation(() => undefined as any)
      vi.spyOn(plugins, 'execute').mockImplementation(() => undefined as any)
    })

    it('resolves allowed details if no after:screenshot plugin registered', () => {
      vi.mocked(plugins.has).mockReturnValue(false)

      return screenshots.afterScreenshot(data, details).then((result) => {
        expect(_.omit(result, 'duration')).toStrictEqual({
          size: 100,
          takenAt: details.takenAt,
          dimensions: details.dimensions,
          multipart: false,
          pixelRatio: 1,
          name: 'my-screenshot',
          specName: 'integration/spec.cy.ts',
          testFailure: true,
          path: '/path/to/my-screenshot.png',
          scaled: true,
          blackout: [],
        })

        expect(result.duration).toBeTypeOf('number')
      })
    })

    it('executes after:screenshot plugin and merges in size, dimensions, and/or path', () => {
      vi.mocked(plugins.has).mockReturnValue(true)
      vi.mocked(plugins.execute).mockResolvedValue({
        size: 200,
        dimensions: { width: 2000, height: 1320 },
        path: '/new/path/to/screenshot.png',
        pixelRatio: 2,
        takenAt: '1234',
      })

      return screenshots.afterScreenshot(data, details).then((result) => {
        expect(_.omit(result, 'duration')).toStrictEqual({
          size: 200,
          takenAt: details.takenAt,
          dimensions: { width: 2000, height: 1320 },
          multipart: false,
          pixelRatio: 1,
          name: 'my-screenshot',
          specName: 'integration/spec.cy.ts',
          testFailure: true,
          path: '/new/path/to/screenshot.png',
          scaled: true,
          blackout: [],
        })

        expect(result.duration).toBeTypeOf('number')
      })
    })

    it('ignores updates that are not an object', () => {
      vi.mocked(plugins.execute).mockResolvedValue('foo')

      return screenshots.afterScreenshot(data, details).then((result) => {
        expect(_.omit(result, 'duration')).toStrictEqual({
          size: 100,
          takenAt: details.takenAt,
          dimensions: details.dimensions,
          multipart: false,
          pixelRatio: 1,
          name: 'my-screenshot',
          specName: 'integration/spec.cy.ts',
          testFailure: true,
          path: '/path/to/my-screenshot.png',
          scaled: true,
          blackout: [],
        })

        expect(result.duration).toBeTypeOf('number')
      })
    })
  })
})

describe('lib/automation/screenshot', () => {
  let details
  let savedDetails
  let updatedDetails
  let screenshot
  // left undefined; capture is stubbed and only forwards it
  let automate

  beforeEach(() => {
    details = {}
    vi.spyOn(screenshots, 'capture').mockResolvedValue(details)
    savedDetails = {}
    vi.spyOn(screenshots, 'save').mockResolvedValue(savedDetails)
    updatedDetails = {}
    vi.spyOn(screenshots, 'afterScreenshot').mockResolvedValue(updatedDetails)

    screenshot = Screenshot('cypress/screenshots')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('captures screenshot', () => {
    const data = {}
    const automation = () => {}

    return screenshot.capture(data, automation).then(() => {
      expect(screenshots.capture).toHaveBeenCalledWith(data, automation)
    })
  })

  it('saves screenshot if there\'s a buffer', () => {
    const data = {}

    return screenshot.capture(data, automate).then(() => {
      expect(screenshots.save).toHaveBeenCalledWith(data, details, 'cypress/screenshots')
    })
  })

  it('does not save screenshot if there\'s no buffer', () => {
    vi.mocked(screenshots.capture).mockResolvedValue(null)

    return screenshot.capture({}, automate).then(() => {
      expect(screenshots.save).not.toHaveBeenCalled()
    })
  })

  it('calls afterScreenshot', () => {
    const data = {}

    return screenshot.capture(data, automate).then(() => {
      expect(screenshots.afterScreenshot).toHaveBeenCalledWith(data, savedDetails)
    })
  })

  it('resolves with updated details', () => {
    return screenshot.capture({}, automate).then((details) => {
      expect(details).toBe(updatedDetails)
    })
  })
})
