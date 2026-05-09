import { describe, it, expect } from 'vitest'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { encode, decode } from '../lib/utils'

describe('utils', () => {
  it('encodes and decodes a message with simple data', async () => {
    const message = [{ type: 'test', data: { foo: 'bar' } }]
    const encoded = await encode(message, '/namespace')

    // Ensure we can stringify and parse the result
    const stringifiedEncoded = JSON.stringify(encoded)
    const parsedEncoded = JSON.parse(stringifiedEncoded)

    const decoded = await decode(parsedEncoded)

    expect(decoded).toEqual(message)
  })

  it('encodes and decodes a message with complex data', async () => {
    const message = [{
      type: 'test',
      data: {
        foo: 'bar',
        baz: [{ selector: '#id\\~\\:r\\:', elementsToHighlight: [{ selector: '#id\\~\\:r\\:' }] }],
      },
    }]
    const encoded = await encode(message, '/namespace')

    // Ensure we can stringify and parse the result
    const stringifiedEncoded = JSON.stringify(encoded)
    const parsedEncoded = JSON.parse(stringifiedEncoded)

    const decoded = await decode(parsedEncoded)

    expect(decoded).toEqual(message)
  })

  it('encodes and decodes a message with binary data', async () => {
    const readFileAsync = promisify(fs.readFile)

    const message = [{ file: await readFileAsync(path.join(__dirname, 'fixtures', 'cypress.png')) }]
    const encoded = await encode(message, '/namespace')

    // Ensure we can stringify and parse the result
    const stringifiedEncoded = JSON.stringify(encoded)
    const parsedEncoded = JSON.parse(stringifiedEncoded)

    const decoded = await decode(parsedEncoded)

    expect(decoded).toEqual(message)
  })

  // socket.io-parser 4.2.x defaults the Decoder's maxAttachments to 10 as part
  // of the GHSA-677m-j7p3-52f9 fix. Cypress's encode/decode helpers must lift
  // that cap so cy.request responses with many binary fields keep flowing.
  it('encodes and decodes a message with more than 10 binary attachments', async () => {
    const buffers = Array.from({ length: 25 }, (_, i) => Buffer.from(`bin-${i}`))
    const message = [{ type: 'test', data: { buffers } }]
    const encoded = await encode(message, '/namespace')

    const stringifiedEncoded = JSON.stringify(encoded)
    const parsedEncoded = JSON.parse(stringifiedEncoded)

    const decoded = await decode(parsedEncoded)

    expect(decoded).toEqual(message)
  })

  it('encodes and decodes a message with circular data', async () => {
    const inner = { foo: 'bar' }

    // @ts-expect-error
    inner.self = inner
    const message = [{ type: 'test', data: { inner } }]
    const encoded = await encode(message, '/namespace')

    // Ensure we can stringify and parse the result
    const stringifiedEncoded = JSON.stringify(encoded)
    const parsedEncoded = JSON.parse(stringifiedEncoded)

    const decoded = await decode(parsedEncoded)

    expect(decoded).toEqual(message)
  })
})
