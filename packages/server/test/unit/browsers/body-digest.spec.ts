const { expect } = require('../../spec_helper')

import { createHash } from 'crypto'
import { digestBody, isOriginBody } from '../../../lib/browsers/cdp-protocol/body-digest'

describe('digestBody', () => {
  it('returns the byte length and sha256 hex of the buffer', () => {
    const body = Buffer.from('hello world')
    const expectedSha256 = createHash('sha256').update(body).digest('hex')

    expect(digestBody(body)).to.deep.equal({
      length: body.length,
      sha256: expectedSha256,
    })
  })
})

describe('isOriginBody', () => {
  it('returns true for a Buffer byte-identical to the digested origin', () => {
    const origin = Buffer.from('hello world')
    const digest = digestBody(origin)

    expect(isOriginBody(Buffer.from('hello world'), digest)).to.be.true
  })

  it('returns true for a string whose utf8 bytes match the digested origin', () => {
    const origin = Buffer.from('hello world')
    const digest = digestBody(origin)

    expect(isOriginBody('hello world', digest)).to.be.true
  })

  it('returns false for a body of the same length but different bytes', () => {
    const origin = Buffer.from('hello world')
    const digest = digestBody(origin)

    expect(isOriginBody(Buffer.from('hello vorld'), digest)).to.be.false
  })

  it('returns false for a body of a different length', () => {
    const origin = Buffer.from('hello world')
    const digest = digestBody(origin)

    expect(isOriginBody(Buffer.from('hello world!'), digest)).to.be.false
  })

  it('returns false when the digest argument is undefined', () => {
    expect(isOriginBody(Buffer.from('hello world'), undefined)).to.be.false
  })

  it('returns true for an empty buffer digested from an empty origin body', () => {
    const digest = digestBody(Buffer.alloc(0))

    expect(isOriginBody(Buffer.alloc(0), digest)).to.be.true
  })
})
