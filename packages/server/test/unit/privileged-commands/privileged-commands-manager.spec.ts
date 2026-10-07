import { beforeEach, describe, expect, it } from 'vitest'
import { privilegedCommandsManager } from '../../../lib/privileged-commands/privileged-commands-manager'

const getChannelOptions = async (options: any) => {
  const channel = await privilegedCommandsManager.getPrivilegedChannel({
    browserFamily: 'chromium',
    isSpecBridge: false,
    namespace: '__cypress',
    scripts: [{ relativeUrl: '/__cypress/tests?p=cypress/e2e/spec.cy.js' }],
    url: 'http://localhost:2020/__cypress/iframes/cypress/e2e/spec.cy.js',
    documentDomainContext: false,
    ...options,
  })

  return channel!.slice(channel!.lastIndexOf('browserFamily:'))
}

describe('lib/privileged-commands/privileged-commands-manager', () => {
  beforeEach(() => {
    privilegedCommandsManager.reset()
  })

  describe('#getPrivilegedChannel', () => {
    it('escapes quotes in the url', async () => {
      const channelOptions = await getChannelOptions({
        url: `http://foo'bar.example.com:2020/__cypress/iframes/spec.cy.js`,
      })

      expect(channelOptions).toContain(`url: "http://foo'bar.example.com:2020/__cypress/iframes/spec.cy.js"`)
    })

    it('escapes quotes in the browser family', async () => {
      const channelOptions = await getChannelOptions({
        browserFamily: `chromium',extra:(1),x:'`,
      })

      expect(channelOptions).toContain(`browserFamily: "chromium',extra:(1),x:'"`)
    })

    it('escapes quotes in the spec scripts', async () => {
      const channelOptions = await getChannelOptions({
        scripts: [{ relativeUrl: `/__cypress/tests?p=x',extra:(1),y:'` }],
      })

      expect(channelOptions).toContain(`scripts: "[\\"/__cypress/tests?p=x',extra:(1),y:'\\"]"`)
    })

    it('preserves backslashes in the spec scripts', async () => {
      const relativeUrl = `/__cypress/tests?p=cypress\\e2e\\nested\\foo.cy.js`
      const channelOptions = await getChannelOptions({
        scripts: [{ relativeUrl }],
      })

      const scriptsLiteral = channelOptions.match(/\n\s*scripts: (.+),\n/)![1]
      const parsedScripts = JSON.parse(JSON.parse(scriptsLiteral))

      expect(parsedScripts).toEqual([relativeUrl])
    })

    it('escapes characters that would end the inline script element', async () => {
      const channelOptions = await getChannelOptions({
        browserFamily: '</script><script>doThing()</script>',
      })

      expect(channelOptions).toContain('browserFamily: "\\u003c/script\\u003e\\u003cscript\\u003edoThing()\\u003c/script\\u003e"')
    })
  })
})
