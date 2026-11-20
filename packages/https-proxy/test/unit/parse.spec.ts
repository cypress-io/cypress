import { describe, it, expect } from 'vitest'
import { hostAndPort, hostnameFromAuthority } from '../../lib/util/parse'

describe('lib/util/parse', () => {
  describe('hostnameFromAuthority', () => {
    it('returns the lowercased hostname of a CONNECT target', () => {
      expect(hostnameFromAuthority('www.Example.com:443')).toEqual('www.example.com')
    })

    it('returns an IPv4 address unchanged', () => {
      expect(hostnameFromAuthority('127.0.0.1:8443')).toEqual('127.0.0.1')
    })

    it('strips the brackets from an IPv6 address', () => {
      expect(hostnameFromAuthority('[::1]:8443')).toEqual('::1')
    })

    it('converts an internationalized hostname to punycode', () => {
      expect(hostnameFromAuthority('bücher.example.com:443')).toEqual('xn--bcher-kva.example.com')
    })

    it('keeps the hostname when the port is out of range', () => {
      expect(hostnameFromAuthority('www.example.com:99999')).toEqual('www.example.com')
    })

    it('drops credentials', () => {
      expect(hostnameFromAuthority('jane.doe:s3cr3t-Pa55@www.example.com:443')).toEqual('www.example.com')
    })

    it('returns an empty string when there is no hostname', () => {
      expect(hostnameFromAuthority(':443')).toEqual('')
      expect(hostnameFromAuthority('')).toEqual('')
      expect(hostnameFromAuthority(undefined)).toEqual('')
    })

    it('returns an empty string for a hostname URL rejects', () => {
      expect(hostnameFromAuthority('www example.com:443')).toEqual('')
    })
  })

  describe('hostAndPort', () => {
    it('reads the host and port from the host header', () => {
      expect(hostAndPort('/index.html', { host: 'www.example.com:8443' }, 443)).toEqual({ host: 'www.example.com', port: 8443 })
    })

    it('falls back to the default port', () => {
      expect(hostAndPort('/index.html', { host: 'www.example.com' }, 443)).toEqual({ host: 'www.example.com', port: 443 })
    })

    it('prefers the host and port of an absolute request url', () => {
      expect(hostAndPort('http://api.example.com:8080/users?page=2', { host: 'www.example.com' }, 443)).toEqual({ host: 'api.example.com', port: '8080' })
    })

    it('keeps an explicit default port in an absolute request url', () => {
      expect(hostAndPort('http://api.example.com:80/', { host: 'www.example.com' }, 443)).toEqual({ host: 'api.example.com', port: '80' })
    })

    it('returns a null port for an absolute request url without one', () => {
      expect(hostAndPort('http://api.example.com/users', { host: 'www.example.com' }, 443)).toEqual({ host: 'api.example.com', port: null })
    })

    it('returns the bare address for an IPv6 request url', () => {
      expect(hostAndPort('http://[::1]:8080/', { host: 'www.example.com' }, 443)).toEqual({ host: '::1', port: '8080' })
    })

    it('reads the host and port from an absolute host header', () => {
      expect(hostAndPort('/index.html', { host: 'http://www.example.com:8080' }, 443)).toEqual({ host: 'www.example.com', port: '8080' })
    })
  })
})
