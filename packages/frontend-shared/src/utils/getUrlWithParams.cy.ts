import { getUrlWithParams } from './getUrlWithParams'

describe('getUrlWithParams', () => {
  describe('getUrlWithParams', () => {
    it('should handle empty input url', () => {
      const result = getUrlWithParams({
        url: '',
        params: {},
      })

      expect(result).to.equal('')
    })

    it('should handle link without addl params', () => {
      const result = getUrlWithParams({
        url: 'https://www.cypress.io',
        params: {},
      })

      expect(result).to.equal('https://www.cypress.io')
    })

    it('should handle link with addl params', () => {
      const result = getUrlWithParams({
        url: 'https://www.cypress.io',
        params: {
          param1: 'abc',
          param2: '123',
        },
      })

      expect(result).to.equal('https://www.cypress.io?param1=abc&param2=123')
    })

    it('should encode params', () => {
      const result = getUrlWithParams({
        url: 'https://www.cypress.io',
        params: {
          'param/name': 'param=value',
        },
      })

      expect(result).to.equal('https://www.cypress.io?param%2Fname=param%3Dvalue')
    })

    it('should append `utm_source` param when at least one param starts with `utm_*`', () => {
      const result = getUrlWithParams({
        url: 'https://www.cypress.io',
        params: {
          utm_medium: 'unit-test',
        },
      })

      expect(result).to.equal('https://www.cypress.io?utm_medium=unit-test&utm_source=Binary%3A+Launchpad')
    })

    it('should preserve existing params on input url', () => {
      const result = getUrlWithParams({
        url: 'https://www.cypress.io?existing1=value1&existing2=value2',
        params: {
          newParam: 'new1',
        },
      })

      expect(result).to.equal('https://www.cypress.io?existing1=value1&existing2=value2&newParam=new1')
    })

    it('should handle fully-qualified input url', () => {
      const result = getUrlWithParams({
        url: 'https://www.cypress.io',
        params: {
          key1: 'value1',
        },
      })

      expect(result).to.equal('https://www.cypress.io?key1=value1')
    })

    it('should handle absolute input url', () => {
      const result = getUrlWithParams({
        url: '/cypress',
        params: {
          key1: 'value1',
        },
      })

      expect(result).to.equal('/cypress?key1=value1')
    })

    it('should handle relative input url', () => {
      const result = getUrlWithParams({
        url: './cypress',
        params: {
          key1: 'value1',
        },
      })

      expect(result).to.equal('./cypress?key1=value1')
    })

    it('should handle existing empty query params segment', () => {
      const result = getUrlWithParams({
        url: 'https://www.cypress.io?',
        params: {
          key1: 'value1',
        },
      })

      expect(result).to.equal('https://www.cypress.io?key1=value1')
    })

    it('should handle params with empty values', () => {
      const result = getUrlWithParams({
        url: 'https://www.cypress.io',
        params: {
          key1: '',
        },
      })

      expect(result).to.equal('https://www.cypress.io?key1=')
    })
  })
})
