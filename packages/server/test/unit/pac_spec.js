require('../spec_helper')

const pacResolver = require('pac-resolver')
const pacServer = require('../../lib/pac_server')

const proxyPort = 8080
let bypassPort

const expects = (url, result) => {
  const jsStr = pacServer.generate(proxyPort, bypassPort)

  const FindProxyForURL = pacResolver(jsStr)

  return FindProxyForURL(url)
  .then((res) => {
    expect(res).to.eq(result)
  })
}

describe('lib/pac_server', () => {
  beforeEach(() => {
    bypassPort = 65656
  })

  it('returns DIRECT when url does match bypassPort', () => {
    return Promise.all([
      expects('http://localhost:65656', 'DIRECT'),
      expects('https://localhost:65656', 'DIRECT'),
      expects('http://127.0.0.1:65656', 'DIRECT'),
      expects('https://127.0.0.1:65656', 'DIRECT'),
      expects('http://google.com:65656', 'DIRECT'),
      expects('https://google.com:65656', 'DIRECT'),
    ])
  })

  it('returns DIRECT when bypassPort is undefined', () => {
    bypassPort = undefined

    return Promise.all([
      expects('http://localhost:65656', 'PROXY http://127.0.0.1:8080'),
      expects('https://localhost:65656', 'PROXY http://127.0.0.1:8080'),
      expects('http://127.0.0.1:65656', 'PROXY http://127.0.0.1:8080'),
      expects('https://127.0.0.1:65656', 'PROXY http://127.0.0.1:8080'),
      expects('http://google.com:65656', 'PROXY http://127.0.0.1:8080'),
      expects('https://google.com:65656', 'PROXY http://127.0.0.1:8080'),
    ])
  })

  it('returns PROXY when url does not match bypassPort', () => {
    return Promise.all([
      expects('http://localhost:1234', 'PROXY http://127.0.0.1:8080'),
      expects('https://localhost:9876', 'PROXY http://127.0.0.1:8080'),
      expects('http://127.0.0.1:1234', 'PROXY http://127.0.0.1:8080'),
      expects('https://127.0.0.1:9876', 'PROXY http://127.0.0.1:8080'),
      expects('http://google.com:1234', 'PROXY http://127.0.0.1:8080'),
      expects('https://google.com:9876', 'PROXY http://127.0.0.1:8080'),
    ])
  })
})
