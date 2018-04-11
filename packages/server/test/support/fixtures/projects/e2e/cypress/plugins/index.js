const Jimp = require('jimp')
const path = require('path')
const Promise = require('bluebird')

module.exports = (on) => {
  // save some time by only reading the original once
  let originalImage
  function getOriginalImage () {
    if (originalImage) return Promise.resolve(originalImage)

    const originalPath = path.join(__dirname, '..', 'screenshots', 'original.png')
    return Jimp.read(originalPath).then((image) => {
      originalImage = image
      return image
    })
  }

  on('task', {
    'compare:screenshots' () {
      const comparePath = path.join(__dirname, '..', 'screenshots', 'compare.png')
      return Promise.all([
        getOriginalImage(),
        Jimp.read(comparePath),
      ])
      .spread((originalImage, compareImage) => {
        if (originalImage.hash() !== compareImage.hash()) {
          throw new Error('Screenshot mismatch!')
        }

        return null
      })
    },
  })
}
