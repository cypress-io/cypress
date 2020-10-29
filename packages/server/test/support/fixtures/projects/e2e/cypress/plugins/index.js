require('@packages/ts/register')

const _ = require('lodash')
const { expect } = require('chai')
const http = require('http')
const Jimp = require('jimp')
const path = require('path')
const Promise = require('bluebird')
const { useFixedFirefoxResolution } = require('../../../utils')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  let performance = {
    track: () => Promise.resolve(),
  }

  // TODO: fix this - in open mode, this will throw an error
  // since the relative path is different in open vs run mode
  try {
    performance = require('../../../../test/support/helpers/performance')
  } catch (err) {
    console.error(err)
  }

  // save some time by only reading the originals once
  let cache = {}

  const screenshotsTaken = []
  let browserArgs = null

  function getCachedImage (name) {
    const cachedImage = cache[name]

    if (cachedImage) return Promise.resolve(cachedImage)

    const imagePath = path.join(__dirname, '..', 'screenshots', `${name}.png`)

    return Jimp.read(imagePath).then((image) => {
      cache[name] = image

      return image
    })
  }

  on('after:screenshot', (details) => {
    screenshotsTaken.push(details)
  })

  on('before:browser:launch', (browser, options) => {
    useFixedFirefoxResolution(browser, options, config)

    if (browser.family === 'firefox' && process.env.FIREFOX_FORCE_STRICT_SAMESITE) {
      // @see https://www.jardinesoftware.net/2019/10/28/samesite-by-default-in-2020/
      // this option will eventually become default, but for now, it seems to have inconsistent
      // behavior in the extension vs regular web browsing - default in webextension is still
      // "no_restriction"
      // options.preferences['network.cookie.sameSite.laxByDefault'] = true
      options.preferences['network.cookie.sameSite.noneRequiresSecure'] = true
    }

    if (browser.family === 'chromium' && browser.name !== 'electron') {
      if (process.env.CHROMIUM_EXTRA_LAUNCH_ARGS) {
        options.args = options.args.concat(process.env.CHROMIUM_EXTRA_LAUNCH_ARGS.split(' '))
      }
    }

    browserArgs = options.args

    return options
  })

  on('task', {
    'returns:undefined' () {},

    'errors' (message) {
      throw new Error(message)
    },

    'ensure:pixel:color' ({ name, colors, devicePixelRatio }) {
      const imagePath = path.join(__dirname, '..', 'screenshots', `${name}.png`)

      return Jimp.read(imagePath)
      .then((image) => {
        _.each(colors, ({ coords, color }) => {
          let [x, y] = coords

          x = x * devicePixelRatio
          y = y * devicePixelRatio

          const pixels = Jimp.intToRGBA(image.getPixelColor(x, y))

          const { r, g, b } = pixels

          if (!_.isEqual(color, [r, g, b])) {
            throw new Error(`The pixel color at coords: [${x}, ${y}] does not match the expected pixel color. The color was [${r}, ${g}, ${b}] and was expected to be [${color.join(', ')}].`)
          }
        })

        return null
      })
    },

    'compare:screenshots' ({ a, b, devicePixelRatio, blackout = false }) {
      function isBlack (rgba) {
        return `${rgba.r}${rgba.g}${rgba.b}` === '000'
      }

      const comparePath = path.join(__dirname, '..', 'screenshots', `${b}.png`)

      return Promise.all([
        getCachedImage(a),
        Jimp.read(comparePath),
      ])
      .spread((originalImage, compareImage) => {
        const blackout1XCoord = 11 * devicePixelRatio
        const blackout2XCoord = 31 * devicePixelRatio
        const blackoutYCoord = 11 * devicePixelRatio

        if (
          blackout && (
            !isBlack(Jimp.intToRGBA(compareImage.getPixelColor(blackout1XCoord, blackoutYCoord))) ||
            !isBlack(Jimp.intToRGBA(compareImage.getPixelColor(blackout2XCoord, blackoutYCoord)))
          )
        ) {
          throw new Error('Blackout not present!')
        }

        if (originalImage.hash() !== compareImage.hash()) {
          throw new Error('Screenshot mismatch!')
        }

        return null
      })
    },

    'check:screenshot:size' ({ name, width, height, devicePixelRatio }) {
      return Jimp.read(path.join(__dirname, '..', 'screenshots', name))
      .then((image) => {
        width = width * devicePixelRatio
        height = height * devicePixelRatio

        if (image.bitmap.width !== width || image.bitmap.height !== height) {
          throw new Error(`Screenshot does not match dimensions! Expected: ${width} x ${height} but got ${image.bitmap.width} x ${image.bitmap.height}`)
        }

        return null
      })
    },

    'record:fast_visit_spec' ({ percentiles, url, browser, currentRetry }) {
      percentiles.forEach(([percent, percentile]) => {
        console.log(`${percent}%\t of visits to ${url} finished in less than ${percentile}ms`)
      })

      const data = {
        url,
        browser,
        currentRetry,
        ...percentiles.reduce((acc, pair) => {
          acc[pair[0]] = pair[1]

          return acc
        }, {}),
      }

      return performance.track('fast_visit_spec percentiles', data)
      .return(null)
    },

    'get:screenshots:taken' () {
      return screenshotsTaken
    },

    'get:browser:args' () {
      return browserArgs
    },

    'get:config:value' (key) {
      return config[key]
    },

    'assert:http:max:header:size' (expectedBytes) {
      expect(http.maxHeaderSize).to.eq(expectedBytes)

      return null
    },
  })
}
