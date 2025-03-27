import type WebDriverPackage from 'webdriver'

const webDriverPackageName = 'webdriver'

export class WebDriver {
  // We resolve this package in such a way to packherd can discover it.
  static getWebDriverPackage: () => typeof WebDriverPackage = () => {
    /**
     * NOTE: webdriver is an ESM package and does not play well with mksnapshot.
     * Requiring the package in this way, dynamically, will
     * make it undiscoverable by mksnapshot
     */
    return require(require.resolve(webDriverPackageName, { paths: [__dirname] }))
  }
}
