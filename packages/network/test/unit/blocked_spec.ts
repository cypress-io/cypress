import { blocked } from '../..'
import { expect } from 'chai'

const hosts = [
  '*.google.com',
  'shop.apple.com',
  'localhost:6666',
  'adwords.com',
  '*yahoo.com',
]

const matchesStr = function (url, host, val) {
  const m = blocked.matches(url, host)

  expect(!!m).to.eq(val, `url: '${url}' did not pass`)
}

const matchesArray = function (url, val) {
  const m = blocked.matches(url, hosts)

  expect(!!m).to.eq(val, `url: '${url}' did not pass`)
}

const matchesHost = (url, host) => {
  expect(blocked.matches(url, hosts)).to.eq(host)
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
