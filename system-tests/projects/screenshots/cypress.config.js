const path = require('path')
const Jimp = require('jimp')
const { useFixedBrowserLaunchSize } = require('@tooling/system-tests/lib/pluginUtils')

module.exports = {
  'allowCypressEnv': false,
  'e2e': {
    setupNodeEvents (on, config) {
      on('before:browser:launch', (browser, options) => {
        useFixedBrowserLaunchSize(browser, options, config)

        return options
      })

      on('task', {
        'ensure:pixel:color' ({ name, colors, devicePixelRatio }) {
          const imagePath = path.join(__dirname, 'cypress', 'screenshots', `${name}.png`)

          return Jimp.read(imagePath)
          .then((image) => {
            colors.forEach(({ coords, color }) => {
              let [x, y] = coords

              x = x * devicePixelRatio
              y = y * devicePixelRatio

              const pixels = Jimp.intToRGBA(image.getPixelColor(x, y))

              const { r, g, b } = pixels

              if (color[0] !== r || color[1] !== g || color[2] !== b) {
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
