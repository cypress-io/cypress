import { describe, it, expect } from 'vitest'
import url from 'url'
import { connectHostname } from '../../lib/util/parse'

describe('lib/util/parse', () => {
  describe('connectHostname', () => {
    it('reads the hostname of a host:port target', () => {
      expect(connectHostname('www.example.com:443')).toEqual('www.example.com')
    })

    it('reads a target without a port', () => {
      expect(connectHostname('www.example.com')).toEqual('www.example.com')
    })

    it('lowercases the hostname', () => {
      expect(connectHostname('WWW.Example.COM:443')).toEqual('www.example.com')
    })

    it('reads an IPv4 address', () => {
      expect(connectHostname('127.0.0.1:8443')).toEqual('127.0.0.1')
    })

    it('strips the brackets from an IPv6 address', () => {
      expect(connectHostname('[::1]:443')).toEqual('::1')
    })

    it('punycodes an internationalized hostname', () => {
      expect(connectHostname('bücher.example:443')).toEqual('xn--bcher-kva.example')
    })

    it('reads the hostname when the port is out of range', () => {
      expect(connectHostname('www.example.com:99999')).toEqual('www.example.com')
    })

    it('returns an empty string for a blank target', () => {
      expect(connectHostname('')).toEqual('')
      expect(connectHostname(':443')).toEqual('')
      expect(connectHostname(undefined)).toEqual('')
    })

    it('returns an empty string for a host URL rejects', () => {
      expect(connectHostname('exa mple.com:443')).toEqual('')
    })

    it('matches url.parse for the targets a browser sends', () => {
      for (const target of ['www.example.com:443', 'localhost:3500', '127.0.0.1:443', '[::1]:443', 'sub.domain-with-dash.example.co.uk:8443', 'WWW.Example.COM:443']) {
        // eslint-disable-next-line n/no-deprecated-api -- the legacy parser is the reference
        expect(connectHostname(target)).toEqual(url.parse(`https://${target}`).hostname)
      }
    })
  })
})
