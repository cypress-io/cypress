import debugModule from 'debug'
import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js'
import { AbstractModule } from './abstract-module'

const debug = debugModule('cypress:server:browsers:bidi:automation:modules:storage')

export class StorageModule extends AbstractModule {
  /**
   * retrieves zero or more cookies which match a set of provided parameters
   * @see https://w3c.github.io/webdriver-bidi/#command-storage-getCookies
   * @param {Bidi.Storage.GetCookiesParameters} getCookieParams - get cookie parameters which can take a filter or partition key
   * @returns {Bidi.Storage.GetCookiesResult} The cookies matching the parameter filters, if applied, as well as the partition key
   */
  async getCookies (getCookieParams: Bidi.Storage.GetCookiesParameters) {
    const payload: Bidi.Storage.GetCookies = {
      method: 'storage.getCookies',
      params: getCookieParams,
    }

    try {
      const result = await this._bidiSocket.sendCommand<Bidi.Storage.GetCookies, Bidi.Storage.GetCookiesResult>(payload)

      return result
    } catch (e) {
      debug(`failed to get storage cookies: ${e}`)
      throw e
    }
  }

  /**
   * creates a new cookie in a cookie store, replacing any cookie in that store which matches according to [COOKIES](https://w3c.github.io/webdriver-bidi/#biblio-cookies).
   * @see https://w3c.github.io/webdriver-bidi/#command-storage-setCookie
   * @param {Bidi.Storage.SetCookieParameters} setCookieParams - set cookie parameters which takes a partial cookie and an optional partition key
   * @returns {Bidi.Storage.SetCookieResult} The partition key of the created cookie
   */
  async setCookie (setCookieParams: Bidi.Storage.SetCookieParameters) {
    const payload: Bidi.Storage.SetCookie = {
      method: 'storage.setCookie',
      params: setCookieParams,
    }

    try {
      const result = await this._bidiSocket.sendCommand<Bidi.Storage.SetCookie, Bidi.Storage.SetCookieResult>(payload)

      return result
    } catch (e) {
      debug(`failed to set storage cookie: ${e}`)
      throw e
    }
  }

  /**
   * removes zero or more cookies which match a set of provided parameters.
   * @see https://w3c.github.io/webdriver-bidi/#command-storage-deleteCookies
   * @param {Bidi.Storage.DeleteCookiesParameters} deleteCookiesParams - delete cookies parameters which can take a filter or partition key
   * @returns {Bidi.Storage.SetCookieResult} The partition key of the deleted cookies
   */
  async deleteCookies (deleteCookiesParams: Bidi.Storage.DeleteCookiesParameters) {
    const payload: Bidi.Storage.DeleteCookies = {
      method: 'storage.deleteCookies',
      params: deleteCookiesParams,
    }

    try {
      const result = await this._bidiSocket.sendCommand<Bidi.Storage.DeleteCookies, Bidi.Storage.DeleteCookiesResult>(payload)

      return result
    } catch (e) {
      debug(`failed to delete storage cookies: ${e}`)
      throw e
    }
  }
}
