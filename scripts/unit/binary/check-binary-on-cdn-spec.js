const sinon = require('sinon')
const { expect } = require('chai')
const crypto = require('crypto')
const fs = require('fs-extra')
const os = require('os')
const path = require('path')

const { checkIfBinaryExistsOnCdn } = require('../../binary/check-binary-on-cdn')
const uploadUtils = require('../../binary/util/upload')

const sha512 = (body) => crypto.createHash('sha512').update(body).digest('hex')

describe('check-binary-on-cdn', () => {
  const zip = Buffer.from('PK\u0003\u0004 cypress linux-x64 binary')
  const tgz = Buffer.from('\u001f\u008b cypress npm package')
  let out
  let cdn

  const binaryUrl = 'https://cdn.cypress.io/beta/binary/16.4.0/linux-x64/develop-74ade5bf12fcbb67daf597dd38781936b6663417/cypress.zip'
  const npmUrl = 'https://cdn.cypress.io/beta/npm/16.4.0/linux-x64/develop-74ade5bf12fcbb67daf597dd38781936b6663417/cypress.tgz'

  const run = () => checkIfBinaryExistsOnCdn(['--version', '16.4.0', '--out', out])

  beforeEach(async () => {
    out = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'check-binary-on-cdn-')), 'cypress')
    cdn = {}

    sinon.stub(process, 'env').value({
      ...process.env,
      CIRCLECI: 'true',
      CIRCLE_BRANCH: 'develop',
      CIRCLE_SHA1: '74ade5bf12fcbb67daf597dd38781936b6663417',
    })

    sinon.stub(uploadUtils, 'getUploadNameByOsAndArch').returns('linux-x64')
    sinon.stub(global, 'fetch').callsFake(async (url, { method } = {}) => {
      const file = cdn[url]

      if (!file) {
        return new Response(null, { status: 404 })
      }

      if (method !== 'HEAD' && file.downloadError) {
        throw file.downloadError
      }

      return new Response(method === 'HEAD' ? null : file.served, {
        status: 200,
        headers: { 'x-amz-meta-checksum': file.checksum },
      })
    })
  })

  afterEach(async () => {
    sinon.restore()
    await fs.remove(path.dirname(out))
  })

  it('downloads both artifacts and their url files when the CDN has both', async () => {
    cdn[binaryUrl] = { served: zip, checksum: sha512(zip) }
    cdn[npmUrl] = { served: tgz, checksum: sha512(tgz) }

    expect(await run()).to.be.true

    expect(await fs.readFile(path.join(out, 'cypress.zip'))).to.deep.eq(zip)
    expect(await fs.readFile(path.join(out, 'cypress.tgz'))).to.deep.eq(tgz)
    expect(await fs.readJson(path.join(out, 'binary-url.json'))).to.deep.eq({ url: binaryUrl })
    expect(await fs.readJson(path.join(out, 'npm-package-url.json'))).to.deep.eq({ url: npmUrl })
    expect(await fs.readJson(path.join(out, 'binary-reuse.json'))).to.deep.eq({ reused: true })
  })

  it('downloads nothing when the CDN has only the binary', async () => {
    cdn[binaryUrl] = { served: zip, checksum: sha512(zip) }

    expect(await run()).to.be.false

    expect(await fs.readdir(out)).to.deep.eq(['binary-reuse.json'])
    expect(await fs.readJson(path.join(out, 'binary-reuse.json'))).to.deep.eq({ reused: false })
  })

  it('writes binary-reuse.json when the CDN has neither', async () => {
    expect(await run()).to.be.false

    expect(await fs.readdir(out)).to.deep.eq(['binary-reuse.json'])
  })

  it('falls back to building when a download does not match its recorded checksum', async () => {
    cdn[binaryUrl] = { served: zip, checksum: sha512(zip) }
    cdn[npmUrl] = { served: Buffer.from('\u001f\u008b truncated'), checksum: sha512(tgz) }

    expect(await run()).to.be.false

    expect(await fs.readdir(out)).to.deep.eq(['binary-reuse.json'])
    expect(await fs.readJson(path.join(out, 'binary-reuse.json'))).to.deep.eq({ reused: false })
  })

  it('falls back to building when a download fails', async () => {
    cdn[binaryUrl] = { served: zip, checksum: sha512(zip) }
    cdn[npmUrl] = { served: tgz, checksum: sha512(tgz), downloadError: new TypeError('fetch failed') }

    expect(await run()).to.be.false

    expect(await fs.readdir(out)).to.deep.eq(['binary-reuse.json'])
  })
})
