import type WebDriverPackage from 'webdriver'

const webDriverPackageName = 'webdriver'

export class WebDriver {
  // Required at runtime rather than bundled into the start bundle
  static getWebDriverPackage: () => typeof WebDriverPackage = () => {
    return require(require.resolve(webDriverPackageName, { paths: [__dirname] }))
  }
}
