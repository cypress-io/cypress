import { describe, expect, it } from 'vitest'
import { unbracket } from '../../../lib/util/unbracket'

describe('lib/util/unbracket', () => {
  it('strips the brackets URL keeps around an IPv6 hostname', () => {
    expect(unbracket(new URL('http://[::1]:3000').hostname)).toBe('::1')
  })

  it('leaves other hostnames alone', () => {
    expect(unbracket('localhost')).toBe('localhost')
    expect(unbracket('127.0.0.1')).toBe('127.0.0.1')
  })
})
