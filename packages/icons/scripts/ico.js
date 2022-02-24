const fs = require('fs')
const toIco = require('to-ico')

const files = [
  fs.readFileSync('./src/icons/icon_16x16.png'),
  fs.readFileSync('./src/icons/icon_24x24.png'),
  fs.readFileSync('./src/icons/icon_32x32.png'),
  fs.readFileSync('./src/icons/icon_48x48.png'),
  fs.readFileSync('./src/icons/icon_64x64.png'),
  fs.readFileSync('./src/icons/icon_128x128.png'),
  fs.readFileSync('./src/icons/icon_256x256.png'),
]

toIco(files).then((buf) => {
  fs.writeFileSync('./dist/icons/cypress.ico', buf)
})
