const { encode, decode } = require('../lib/utils')
const expect = require('chai').expect
const { promises: fs } = require('fs')
const path = require('path')

describe('utils', () => {
  it('encodes and decodes a message with simple data', async () => {
    const message = [{ type: 'test', data: { foo: 'bar' } }]
    const encoded = await encode(message, '/namespace')

    // Ensure we can stringify and parse the result
    const stringifiedEncoded = JSON.stringify(encoded)
    const parsedEncoded = JSON.parse(stringifiedEncoded)

    const decoded = await decode(parsedEncoded)

    expect(decoded).to.deep.equal(message)
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

    expect(decoded).to.deep.equal(message)
  })

  it('encodes and decodes a message with binary data', async () => {
    const message = [{ file: await fs.readFile(path.join(__dirname, 'fixtures', 'cypress.png')) }]
    const encoded = await encode(message, '/namespace')

    // Ensure we can stringify and parse the result
    const stringifiedEncoded = JSON.stringify(encoded)
    const parsedEncoded = JSON.parse(stringifiedEncoded)

    const decoded = await decode(parsedEncoded)

    expect(decoded).to.deep.equal(message)
  })

  it('encodes and decodes a message with circular data', async () => {
    const inner = { foo: 'bar' }

    inner.self = inner
    const message = [{ type: 'test', data: { inner } }]
    const encoded = await encode(message, '/namespace')

    // Ensure we can stringify and parse the result
    const stringifiedEncoded = JSON.stringify(encoded)
    const parsedEncoded = JSON.parse(stringifiedEncoded)

    const decoded = await decode(parsedEncoded)

    expect(decoded).to.deep.equal(message)
  })
})
