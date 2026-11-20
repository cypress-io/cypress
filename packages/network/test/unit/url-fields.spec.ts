import { describe, it, expect } from 'vitest'
import { parseUrlFields } from '../../lib/url-fields'

describe('lib/url-fields', () => {
  describe('parseUrlFields', () => {
    it('returns the fields of a proxy url', () => {
      expect(parseUrlFields('http://proxy.example.com:3128')).toEqual({
        protocol: 'http:',
        auth: null,
        hostname: 'proxy.example.com',
        port: '3128',
        path: '/',
        href: 'http://proxy.example.com:3128/',
      })
    })

    it('keeps an explicit default port', () => {
      expect(parseUrlFields('https://proxy.example.com:443').port).toEqual('443')
      expect(parseUrlFields('http://www.example.com:80/users').port).toEqual('80')
    })

    it('returns a null port when there is none', () => {
      expect(parseUrlFields('https://www.example.com/users').port).toBeNull()
    })

    it('does not read a port out of the path', () => {
      expect(parseUrlFields('https://www.example.com/a:443').port).toBeNull()
    })

    it('decodes credentials', () => {
      expect(parseUrlFields('http://jane.doe:s3cr3t%40Pa55@proxy.example.com:3128').auth).toEqual('jane.doe:s3cr3t@Pa55')
    })

    it('returns a username without a password on its own', () => {
      expect(parseUrlFields('http://jane.doe@proxy.example.com:3128').auth).toEqual('jane.doe')
    })

    it('strips the brackets from an IPv6 hostname', () => {
      expect(parseUrlFields('https://[::1]:8443/a').hostname).toEqual('::1')
      expect(parseUrlFields('https://[::1]:443/a').port).toEqual('443')
    })

    it('lowercases the hostname', () => {
      expect(parseUrlFields('https://WWW.Example.com/').hostname).toEqual('www.example.com')
    })

    it('includes the query in the path', () => {
      expect(parseUrlFields('https://www.example.com/users?page=2').path).toEqual('/users?page=2')
    })

    it('returns the protocol of a scheme it does not know', () => {
      expect(parseUrlFields('socksv5://proxy.example.com:1080')).toMatchObject({ protocol: 'socksv5:', hostname: 'proxy.example.com', port: '1080' })
    })

    it('returns null fields for a string that is not a url', () => {
      expect(parseUrlFields('proxy.example.com')).toEqual({
        protocol: null,
        auth: null,
        hostname: null,
        port: null,
        path: null,
        href: 'proxy.example.com',
      })
    })
  })
})
