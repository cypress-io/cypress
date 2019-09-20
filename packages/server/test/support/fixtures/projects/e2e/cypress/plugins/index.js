const _ = require('lodash')
const Jimp = require('jimp')
const path = require('path')
const Promise = require('bluebird')

const performance = require('../../../../test/support/helpers/performance')

module.exports = (on) => {
  // save some time by only reading the originals once
  let cache = {}

  function getCachedImage (name) {
    const cachedImage = cache[name]

    if (cachedImage) return Promise.resolve(cachedImage)

    const imagePath = path.join(__dirname, '..', 'screenshots', `${name}.png`)

    return Jimp.read(imagePath).then((image) => {
      cache[name] = image

      return image
    })
  }

  on('task', {
    'returns:undefined' () {},

    'errors' (message) {
      throw new Error(message)
    },

    'ensure:pixel:color' ({ name, coords, color, devicePixelRatio }) {
      const imagePath = path.join(__dirname, '..', 'screenshots', `${name}.png`)

      return Jimp.read(imagePath)
      .then((image) => {
        let [x, y] = coords

        x = x * devicePixelRatio
        y = y * devicePixelRatio

        const pixels = Jimp.intToRGBA(image.getPixelColor(x, y))

        const { r, g, b } = pixels

        if (!_.isEqual(color, [r, g, b])) {
          throw new Error(`The pixel color at coords: [${x}, ${y}] does not match the expected pixel color. The color was [${r}, ${g}, ${b}] and was expected to be [${color.join(', ')}].`)
        }

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
        // eslint-disable-next-line no-console
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
  })
}
