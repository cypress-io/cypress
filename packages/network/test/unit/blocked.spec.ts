import { describe, it, expect } from 'vitest'
import { blocked } from '../../lib'

const hosts = [
  '*.google.com',
  'shop.apple.com',
  'localhost:6666',
  'adwords.com',
  '*yahoo.com',
]

const matchesStr = function (url: string, host: string, val: boolean) {
  const m = blocked.matches(url, host)

  expect(!!m, `url: '${url}' did not pass`).toEqual(val)
}

const matchesArray = function (url: string, val: boolean) {
  const m = blocked.matches(url, hosts)

  expect(!!m, `url: '${url}' did not pass`).toEqual(val)
}

const matchesHost = (url: string, host: string) => {
  expect(blocked.matches(url, hosts)).toEqual(host)
}

describe('lib/blocked', () => {
  it('handles hosts, ports, wildcards', () => {
    matchesArray('https://mail.google.com/foo', true)
    matchesArray('https://shop.apple.com/bar', true)
    matchesArray('http://localhost:6666/', true)
    matchesArray('https://localhost:6666/', true)
    matchesArray('https://adwords.com:443/', true)
    matchesArray('http://adwords.com:80/quux', true)
    matchesArray('https://yahoo.com:443/asdf', true)
    matchesArray('http://mail.yahoo.com:443/asdf', true)

    matchesArray('https://buy.adwords.com:443/', false)
    matchesArray('http://localhost:66667', false)
    matchesArray('http://mac.apple.com/', false)

    matchesStr('https://localhost:6666/foo', 'localhost:6666', true)
    matchesStr('https://localhost:6666/foo', 'localhost:5555', false)
  })

  it('returns the matched host', () => {
    matchesHost('https://shop.apple.com:443/foo', 'shop.apple.com')
    matchesHost('http://mail.yahoo.com:80/bar', '*yahoo.com')
    matchesHost('https://localhost:6666/bar', 'localhost:6666')
  })
})
