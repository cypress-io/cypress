const Jimp = require('jimp')
const path = require('path')
const Promise = require('bluebird')

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
    'compare:screenshots' ({ a, b }) {
      function isBlack (rgba) {
        return `${rgba.r}${rgba.g}${rgba.b}` === '000'
      }

      const comparePath = path.join(__dirname, '..', 'screenshots', `${b}.png`)
      return Promise.all([
        getCachedImage(a),
        Jimp.read(comparePath),
      ])
      .spread((originalImage, compareImage) => {
        if (!isBlack(Jimp.intToRGBA(compareImage.getPixelColor(11, 11)))) {
          throw new Error('Blackout not present!')
        }

        if (originalImage.hash() !== compareImage.hash()) {
          throw new Error('Screenshot mismatch!')
        }

        return null
      })
    },

    'check:screenshot:size' ({ name, width, height }) {
      return Jimp.read(path.join(__dirname, '..', 'screenshots', name))
      .then((image) => {
        if (image.bitmap.width !== width || image.bitmap.height !== height) {
          throw new Error(`Screenshot does not match dimensions! Expected: ${width} x ${height} but got ${image.bitmap.width} x ${image.bitmap.height}`)
        }

        return null
      })
    },
  })
}
