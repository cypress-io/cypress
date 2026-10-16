import { describe, expect, it } from '@jest/globals'
import { maskProxyPassword } from '../../../src/util'

describe('maskProxyPassword', () => {
  it('masks the password and keeps the rest of the proxy', () => {
    expect(maskProxyPassword('http://user:secret@proxy.example.com:8080')).toEqual('http://user:*****@proxy.example.com:8080')
  })

  it('masks a password that contains an @', () => {
    expect(maskProxyPassword('http://user:p@ss@proxy.example.com:8080')).toEqual('http://user:*****@proxy.example.com:8080')
  })

  it('masks a password when the proxy has no scheme', () => {
    expect(maskProxyPassword('user:secret@proxy.example.com:8080')).toEqual('user:*****@proxy.example.com:8080')
  })

  it('leaves a proxy without a password unchanged', () => {
    expect(maskProxyPassword('http://proxy.example.com:8080')).toEqual('http://proxy.example.com:8080')
    expect(maskProxyPassword('http://user@proxy.example.com:8080')).toEqual('http://user@proxy.example.com:8080')
  })
})
