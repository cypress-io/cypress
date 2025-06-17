const path = require('path')
const Jimp = require('jimp')
const _ = require('lodash')
const wbip = require('@cypress/webpack-batteries-included-preprocessor')
const { useFixedBrowserLaunchSize } = require('@tooling/system-tests/lib/pluginUtils')

function getWebpackOptions () {
  const options = wbip.getFullWebpackOptions()

  // our tests need the path built-in for testing, so we need to shim it here into the webpack config
  options.resolve.fallback.path = require.resolve('path-browserify')

  return options
}

module.exports = {
  'e2e': {
    setupNodeEvents (on, config) {
      on('before:browser:launch', (browser, options) => {
        useFixedBrowserLaunchSize(browser, options, config)

        return options
      })

      on('file:preprocessor', wbip({ webpackOptions: getWebpackOptions() }))

      on('task', {
        'ensure:pixel:color' ({ name, colors, devicePixelRatio }) {
          const imagePath = path.join(__dirname, 'cypress', 'screenshots', `${name}.png`)

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

        'check:screenshot:size' ({ name, width, height, devicePixelRatio }) {
          return Jimp.read(path.join(__dirname, 'cypress', 'screenshots', name))
          .then((image) => {
            width = width * devicePixelRatio
            height = height * devicePixelRatio

            if (image.bitmap.width !== width || image.bitmap.height !== height) {
              throw new Error(`Screenshot does not match dimensions! Expected: ${width} x ${height} but got ${image.bitmap.width} x ${image.bitmap.height}`)
            }

            return null
          })
        },
      })
    },
  },
}
