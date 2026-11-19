import { describe, it, expect, vi } from 'vitest'
import vm from 'vm'
import { getSuperDomain } from '@packages/network-tools'
import { CookieJar, toughCookieToAutomationCookie } from '@packages/server/lib/automation/cookie/jar'
import * as inject from '../../../../lib/http/util/inject'

vi.mock('@packages/resolve-dist', () => {
  return {
    getRunnerInjectionContents: vi.fn().mockResolvedValue(''),
    getRunnerCrossOriginInjectionContents: vi.fn().mockResolvedValue('window.cypressConfig = cypressConfig'),
  }
})

const runInjection = (injection: string) => {
  const context: Record<string, any> = { document: {}, window: {} }

  vm.runInNewContext(injection.slice(injection.indexOf('>') + 1, -'</script>'.length), context)

  return context
}

const getSiblingSubdomainCookies = (setCookie: string) => {
  const jar = new CookieJar()

  jar.setCookie(setCookie, 'https://attacker.example.com/', undefined)

  return jar.getCookies('https://app.example.com/', undefined).map((cookie) => toughCookieToAutomationCookie(cookie, 'app.example.com'))
}

describe('http/util/inject', () => {
  describe('fullCrossOrigin', () => {
    const payload = '</script><script>alert(1)</script>'

    const getInjection = (simulatedCookies) => {
      return inject.fullCrossOrigin('example.com', {
        shouldInjectDocumentDomain: false,
        modifyObstructiveCode: true,
        modifyObstructiveThirdPartyCode: true,
        simulatedCookies,
      })
    }

    it('does not let a simulated cookie close the injected script', async () => {
      const simulatedCookies = [
        ...getSiblingSubdomainCookies(`value=${payload}; Domain=example.com; Path=/`),
        ...getSiblingSubdomainCookies(`${payload}=name; Domain=example.com; Path=/`),
      ]

      expect(simulatedCookies.map(({ name, value }) => [name, value])).toEqual([['value', payload], [payload, 'name']])

      const injection = await getInjection(simulatedCookies)

      expect(injection.toLowerCase().indexOf('</script')).toEqual(injection.length - '</script>'.length)
    })

    it('passes the options to the injected code unchanged', async () => {
      const simulatedCookies = getSiblingSubdomainCookies(`value=<b>\u2028\u2029</b>; Domain=example.com; Path=/`)

      expect(simulatedCookies.map(({ value }) => value)).toEqual(['<b>\u2028\u2029</b>'])

      const { window } = runInjection(await getInjection(simulatedCookies))

      expect(window.cypressConfig).toEqual({
        shouldInjectDocumentDomain: false,
        modifyObstructiveCode: true,
        modifyObstructiveThirdPartyCode: true,
        simulatedCookies,
      })
    })
  })

  describe('document.domain', () => {
    const domain = getSuperDomain(`http://x';injected=1;'.localhost:3000/`)

    const injections = {
      partial: () => inject.partial(domain, { shouldInjectDocumentDomain: true }),
      full: () => inject.full(domain, { shouldInjectDocumentDomain: true }),
      fullCrossOrigin: () => {
        return inject.fullCrossOrigin(domain, {
          shouldInjectDocumentDomain: true,
          modifyObstructiveCode: true,
          modifyObstructiveThirdPartyCode: true,
          simulatedCookies: [],
        })
      },
    }

    Object.entries(injections).forEach(([name, getInjection]) => {
      it(`${name} sets the super domain from the url without running it as code`, async () => {
        expect(domain).toEqual(`x';injected=1;'.localhost`)

        const context = runInjection(await getInjection())

        expect(context.document.domain).toEqual(domain)
        expect(context.injected).toBeUndefined()
      })
    })
  })
})
