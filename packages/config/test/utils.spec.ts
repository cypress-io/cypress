import { expect } from 'chai'
import { hideKeys, setUrls } from '../src/utils'

describe('hideKeys', () => {
  it('removes middle part of the string', () => {
    const hidden = hideKeys('12345-xxxx-abcde')

    expect(hidden).to.equal('12345...abcde')
  })

  it('returns undefined for missing key', () => {
    expect(hideKeys()).to.be.undefined
  })

  // https://github.com/cypress-io/cypress/issues/14571
  it('returns undefined for non-string argument', () => {
    expect(hideKeys(true)).to.be.undefined
    expect(hideKeys(1234)).to.be.undefined
  })

  context('.setUrls', () => {
    it('does not mutate existing obj', () => {
      const obj = {}

      expect(setUrls(obj)).not.to.eq(obj)
    })

    it('uses baseUrl when set', () => {
      const obj = {
        port: 65432,
        baseUrl: 'https://www.google.com',
        clientRoute: '/__/',
      }

      const urls = setUrls(obj)

      expect(urls.browserUrl).to.eq('https://www.google.com/__/')
      expect(urls.proxyUrl).to.eq('http://localhost:65432')
    })

    it('strips baseUrl to host when set', () => {
      const obj = {
        port: 65432,
        baseUrl: 'http://localhost:9999/app/?foo=bar#index.html',
        clientRoute: '/__/',
      }

      const urls = setUrls(obj)

      expect(urls.browserUrl).to.eq('http://localhost:9999/__/')
      expect(urls.proxyUrl).to.eq('http://localhost:65432')
    })
  })
})
