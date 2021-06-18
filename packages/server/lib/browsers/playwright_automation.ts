import Bluebird from 'bluebird'
import debugModule from 'debug'
import _ from 'lodash'
import { ChildProcess } from 'child_process'
import playwright, { BrowserServer, BrowserContext } from 'playwright'

const dbg = debugModule('cypress:playwright_automation')

// Type definiton for the convertSameSiteExtensionToCdp which is converting the Playwright cookie format into
// the internal cookie format used by Cypress
export type CyCookie = Pick<chrome.cookies.Cookie, 'name' | 'value' | 'expirationDate' | 'hostOnly' | 'domain' | 'path' | 'secure' | 'httpOnly'> & {
  // use `undefined` instead of `unspecified`
  sameSite?: 'no_restriction' | 'lax' | 'strict'
}

function convertSameSiteExtensionToCypress (str: CyCookie['sameSite']): 'None' | 'Lax' | 'Strict' | undefined {
  return str ? ({
    'no_restriction': 'None',
    'lax': 'Lax',
    'strict': 'Strict',
  })[str] : str as any
}

export interface PlaywrightWrapper {
  navigate(url: string): Promise<void>
  handleDownloads(dir: string, automation: any): Promise<void>

  /**
   * Sends a command to the Chrome remote interface.
   * @example client.send('Page.navigate', { url })
  */
  send (command: string, params?: object): Bluebird<any>

  /**
   * Registers callback for particular event.
   * @see https://github.com/cyrus-and/chrome-remote-interface#class-cdp
   */
  on (eventName: string, cb: Function): void

  /**
   * Calls underlying remote interface client close
  */
  close (browserInstance: BrowserServer): Bluebird<void>
}

/**
 * Url returned by the Playwright to the websocket connection
*/
type websocketUrl = string

type CreateOpts = {
  target?: websocketUrl
  process?: ChildProcess
  browserContext: BrowserContext
}

export const create = Bluebird.method((opts: CreateOpts, onAsynchronousError: Function): Bluebird<PlaywrightWrapper> => {
  dbg('playwrightAutomation.create() opts:', opts)

  const browserContext = opts.browserContext

  return new Bluebird.Promise((resolve, reject) => {
    //
    browserContext.newPage().then((browserPage: playwright.Page) => {
      browserPage.on('download', (downloadItem: playwright.Download) => {
        dbg('Download event occurred:', downloadItem)
      })

      browserPage.on('close', (page: playwright.Page) => {
        dbg('Page is being closed.')
      })

      browserPage.on('websocket', (webSocket: playwright.WebSocket) => {
        dbg('Page has websocket acitivty...')
        dbg('Websocket URL: ', webSocket.url())
        dbg('Websocket Closed: ', webSocket.isClosed())
        webSocket.on('framereceived', (data: any) => {
          dbg('Websocket frame received:', data)
        })

        webSocket.on('framesent', (data: any) => {
          dbg('Websocket frame sent:', data)
        })

        webSocket.on('socketerror', (string: String) => {
          dbg('Websocket error occurred:', string)
        })

        webSocket.on('close', (webSocket: playwright.WebSocket) => {
          dbg('Websocket closed', webSocket.url())
        })
      })

      const client: PlaywrightWrapper = {
        navigate: (url: string) => {
          return new Promise((resolve, reject) => {
            browserPage.goto(url).then(() => {
              resolve()
            }).catch((err) => {
              dbg('Navigation error:', err)
              reject(err)
            })
          })
        },

        // TODO: find out how to do downloads in Cypress
        handleDownloads: (dir, automation) => {
          return Promise.resolve()
        },

        send: Bluebird.method((_command: string, _params?: object) => {
          // NOT IN USE ATM
          return Bluebird.resolve()
        }),
        on: (eventName: string, cb: Function) => {
          dbg('eventName: ', eventName, ' callback:', cb)
        },
        close: (browserInstance: BrowserServer) => {
          return new Bluebird.Promise((resolve, reject) => {
            browserInstance.close().then(() => {
              resolve()
            }).catch((err) => {
              reject(err)
            })
          })
        },
      }

      resolve(client)
    })
  })
})

type SendDebuggerCommand = (message: string, data?: any) => Bluebird<any>

export const PlaywrightAutomation = (_sendDebuggerCommandFn: SendDebuggerCommand, context: BrowserContext) => {
  // TODO: find out where sendDebuggerCommandFn is for

  const normalizeGetCookieProps = (cookie: any): CyCookie => {
    if (cookie.expires === -1) {
      delete cookie.expires
    }

    // Use expirationDate instead of expires 🤷‍♀️
    cookie.expirationDate = cookie.expires
    delete cookie.expires

    if (cookie.sameSite === 'None') {
      cookie.sameSite = 'no_restriction'
    }

    return cookie as CyCookie
  }

  const _domainIsWithinSuperdomain = (domain: string, suffix: string) => {
    const suffixParts = suffix.split('.').filter(_.identity)
    const domainParts = domain.split('.').filter(_.identity)

    return _.isEqual(suffixParts, domainParts.slice(domainParts.length - suffixParts.length))
  }

  const _cookieMatches = (cookie: any, filter: Record<string, any>) => {
    if (filter.domain && !(cookie.domain && _domainIsWithinSuperdomain(cookie.domain, filter.domain))) {
      return false
    }

    if (filter.path && filter.path !== cookie.path) {
      return false
    }

    if (filter.name && filter.name !== cookie.name) {
      return false
    }

    return true
  }

  //
  const onRequest = (message, data) => {
    switch (message) {
      // Initial command send from Cypress is this one, which appears to be always true
      case 'is:automation:client:connected':
        return true

      // Second command issued by the Cypress runner is get:cookies
      case 'get:cookies':
        return new Bluebird.Promise((resolve, reject) => {
          context.cookies().then((cookies) => {
            const normalisedCookies = cookies.map((item) => {
              return normalizeGetCookieProps(item)
            })

            resolve(normalisedCookies)
          }).catch((error) => {
            reject(error)
          })
        })

      case 'get:cookie':
        return new Bluebird.Promise((resolve, reject) => {
          context.cookies().then((cookies) => {
            if (cookies.length === 0) {
              resolve(null)

              return
            }

            const findRelevantCookie = cookies.find((cookie) => {
              return _cookieMatches(cookie, {
                domain: data.domain,
                name: data.name,
              })
            })

            if (!findRelevantCookie) {
              resolve(null)

              return
            }

            const normalisedCookieItem = normalizeGetCookieProps(findRelevantCookie)

            resolve(normalisedCookieItem)
          }).catch((err) => reject(err))
        })

      case 'set:cookie':
        return new Bluebird.Promise((resolve, reject) => {
          context.addCookies([{
            name: data.name,
            value: data.value,
            path: data.path,
            domain: data.domain,
            secure: data.secure,
            httpOnly: data.httpOnly,
            expires: data.expirationDate,
            sameSite: convertSameSiteExtensionToCypress(data.sameSite),
          }]).then(() => {
            resolve()
          }).catch((err) => reject(err))
        })

      case 'clear:cookie':
        return new Bluebird.Promise((resolve, reject) => {
          context.cookies().then((cookies) => {
            const cookiesToKeep = cookies.filter((cookie) => {
              return !_cookieMatches(cookie, {
                name: data.name,
                domain: data.domain,
              })
            })

            context.clearCookies().then(() => {
              if (cookiesToKeep.length > 0) {
                context.addCookies(cookiesToKeep).then(() => {
                  resolve()
                }).catch((err) => reject(err))
              } else {
                resolve()
              }
            }).catch((err) => reject(err))
          }).catch((error) => reject(error))
        })

        // Create screenshot of active frame
      case 'take:screenshot':
        return new Bluebird.Promise((resolve) => {
          const browserPages = context.pages()
          const activeBrowserPage = browserPages.shift()

          const shouldFullPage = data.capture === 'fullPage'

          if (!activeBrowserPage) {
            throw new Error(`The browser page missing when Cypress attempted to take a screenshot.`)
          }

          activeBrowserPage.screenshot({
            fullPage: shouldFullPage,
            timeout: 0,
            type: 'png',
          }).then((response) => {
            const data = Buffer.from(response).toString('base64')

            resolve(`data:image/png;base64,${data}`)
          }).catch((err) => {
            throw new Error(`The browser responded with an error when Cypress attempted to take a screenshot.\n\nDetails:\n${err.message}`)
          })
        })

      default:
        throw new Error(`No automation handler registered for: '${message}'`)
    }
  }

  return { onRequest }
}
