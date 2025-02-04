import fs from 'fs'
import toIco from 'to-ico'

const files = [
  fs.readFileSync('./assets/icons/icon_16x16.png'),
  fs.readFileSync('./assets/icons/icon_24x24.png'),
  fs.readFileSync('./assets/icons/icon_32x32.png'),
  fs.readFileSync('./assets/icons/icon_48x48.png'),
  fs.readFileSync('./assets/icons/icon_64x64.png'),
  fs.readFileSync('./assets/icons/icon_128x128.png'),
  fs.readFileSync('./assets/icons/icon_256x256.png'),
]

// tslint:disable:no-floating-promises
toIco(files).then((buf) => {
  fs.writeFileSync('./dist/icons/cypress.ico', buf)
})
