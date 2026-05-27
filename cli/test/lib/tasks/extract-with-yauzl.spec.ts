import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest'
import fs from 'fs'
import fsp from 'fs/promises'
import os from 'os'
import path from 'path'
import zlib from 'zlib'

import extractWithYauzl from '../../../lib/tasks/extract-with-yauzl'

// ---------------------------------------------------------------------------
// Test helpers: build small zip archives in memory, byte-by-byte, so we can
// exercise the extractor's behavior around modes, symlinks, path traversal,
// and oversized / lying entries without checking in binary fixtures.
// ---------------------------------------------------------------------------

interface ZipEntryInput {
  name: string
  /** raw bytes for the entry body. For symlinks, this is the link target. */
  body?: Buffer
  /** if true, the entry is stored uncompressed (method 0); otherwise deflate (method 8). */
  store?: boolean
  /** Unix mode bits to encode in externalFileAttributes (high 16 bits). */
  unixMode?: number
  /** override the uncompressedSize field in the central + local headers (for "lying" zips). */
  fakeUncompressedSize?: number
}

const buildZip = (entries: ZipEntryInput[]): Buffer => {
  const localBlocks: Buffer[] = []
  const cdrBlocks: Buffer[] = []
  let offset = 0

  for (const e of entries) {
    const isDir = e.name.endsWith('/')
    const fnBuf = Buffer.from(e.name)
    const body = e.body || Buffer.alloc(0)
    const method = isDir || e.store ? 0 : 8
    const stored = method === 8 ? zlib.deflateRawSync(body) : body
    const crc = zlib.crc32(body)
    const declaredUncompressed = e.fakeUncompressedSize !== undefined ? e.fakeUncompressedSize : body.length
    const externalAttr = ((e.unixMode || 0) << 16) >>> 0

    const lfh = Buffer.alloc(30)

    lfh.writeUInt32LE(0x04034b50, 0)
    lfh.writeUInt16LE(20, 4)
    lfh.writeUInt16LE(method, 8)
    lfh.writeUInt32LE(crc, 14)
    lfh.writeUInt32LE(stored.length, 18)
    lfh.writeUInt32LE(declaredUncompressed, 22)
    lfh.writeUInt16LE(fnBuf.length, 26)

    localBlocks.push(lfh, fnBuf, stored)

    const cdr = Buffer.alloc(46)

    cdr.writeUInt32LE(0x02014b50, 0)
    cdr.writeUInt16LE(20, 4)
    cdr.writeUInt16LE(20, 6)
    cdr.writeUInt16LE(method, 10)
    cdr.writeUInt32LE(crc, 16)
    cdr.writeUInt32LE(stored.length, 20)
    cdr.writeUInt32LE(declaredUncompressed, 24)
    cdr.writeUInt16LE(fnBuf.length, 28)
    cdr.writeUInt32LE(externalAttr, 38)
    cdr.writeUInt32LE(offset, 42)

    cdrBlocks.push(cdr, fnBuf)

    offset += lfh.length + fnBuf.length + stored.length
  }

  const cdrConcat = Buffer.concat(cdrBlocks)
  const eocd = Buffer.alloc(22)

  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(entries.length, 8)
  eocd.writeUInt16LE(entries.length, 10)
  eocd.writeUInt32LE(cdrConcat.length, 12)
  eocd.writeUInt32LE(offset, 16)

  return Buffer.concat([...localBlocks, cdrConcat, eocd])
}

const writeZip = (entries: ZipEntryInput[]): string => {
  const zipPath = path.join(os.tmpdir(), `cy-extract-test-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.zip`)

  fs.writeFileSync(zipPath, buildZip(entries))

  return zipPath
}

describe('lib/tasks/extract-with-yauzl', () => {
  let destDir: string
  let onEntry: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    destDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'cy-extract-test-'))
    onEntry = vi.fn()
  })

  afterEach(async () => {
    await fsp.rm(destDir, { recursive: true, force: true })
  })

  it('extracts a single deflated file with default permissions', async () => {
    const zip = writeZip([{ name: 'hello.txt', body: Buffer.from('hi there') }])

    await extractWithYauzl(zip, destDir, onEntry)

    const out = await fsp.readFile(path.join(destDir, 'hello.txt'), 'utf8')

    expect(out).to.equal('hi there')
    expect(onEntry).toHaveBeenCalledTimes(1)
  })

  it('creates directory entries', async () => {
    const zip = writeZip([
      { name: 'sub/', unixMode: 0o755 },
      { name: 'sub/inner.txt', body: Buffer.from('inside') },
    ])

    await extractWithYauzl(zip, destDir, onEntry)

    expect((await fsp.stat(path.join(destDir, 'sub'))).isDirectory()).to.equal(true)
    expect(await fsp.readFile(path.join(destDir, 'sub/inner.txt'), 'utf8')).to.equal('inside')
    expect(onEntry).toHaveBeenCalledTimes(2)
  })

  it('treats entries with the Unix directory mode as directories even without a trailing slash', async () => {
    // S_IFDIR (0o040000) in the high 16 bits of externalFileAttributes,
    // and no trailing slash on the entry name.
    const zip = writeZip([{ name: 'sub', unixMode: 0o040755, store: true }])

    await extractWithYauzl(zip, destDir, onEntry)

    expect((await fsp.stat(path.join(destDir, 'sub'))).isDirectory()).to.equal(true)
  })

  it('preserves Unix file modes on extracted files', async () => {
    const zip = writeZip([{ name: 'bin', body: Buffer.from('payload'), unixMode: 0o755 }])

    await extractWithYauzl(zip, destDir, onEntry)

    const stat = await fsp.stat(path.join(destDir, 'bin'))

    // mask off file-type bits, keep only permission bits
    expect(stat.mode & 0o777).to.equal(0o755)
  })

  it('creates symlinks for entries with the Unix symlink mode', async () => {
    const zip = writeZip([
      { name: 'target.txt', body: Buffer.from('real') },
      { name: 'link', body: Buffer.from('target.txt'), unixMode: 0o120777, store: true },
    ])

    await extractWithYauzl(zip, destDir, onEntry)

    const stat = await fsp.lstat(path.join(destDir, 'link'))

    expect(stat.isSymbolicLink()).to.equal(true)
    expect(await fsp.readlink(path.join(destDir, 'link'))).to.equal('target.txt')
    expect(await fsp.readFile(path.join(destDir, 'link'), 'utf8')).to.equal('real')
  })

  it('refuses an entry whose path escapes the destination', async () => {
    const zip = writeZip([{ name: '../escape.txt', body: Buffer.from('nope') }])

    // yauzl 3.x rejects the entry name itself ("invalid relative path"); our own
    // path-traversal guard would also catch this. Either rejection is acceptable.
    await expect(extractWithYauzl(zip, destDir, onEntry)).rejects.toThrow()

    expect(fs.existsSync(path.join(destDir, '..', 'escape.txt'))).to.equal(false)
  })

  it('refuses a symlink whose target resolves outside the destination', async () => {
    const zip = writeZip([
      { name: 'link', body: Buffer.from('../../etc/passwd'), unixMode: 0o120777, store: true },
    ])

    await expect(extractWithYauzl(zip, destDir, onEntry)).rejects.toThrow(/symlink pointing outside of destination/)

    expect(fs.existsSync(path.join(destDir, 'link'))).to.equal(false)
  })

  it('refuses a symlink whose declared size exceeds the cap', async () => {
    const big = Buffer.alloc(8 * 1024, 'a')
    const zip = writeZip([{ name: 'link', body: big, unixMode: 0o120777, store: true }])

    await expect(extractWithYauzl(zip, destDir, onEntry)).rejects.toThrow(/symlink with target larger than/)
  })

  it('refuses a symlink whose actual streamed body exceeds the cap (lying uncompressedSize)', async () => {
    // declare 4 bytes in the headers, but actually stream 8 KB. yauzl 3.x
    // catches the size mismatch during read; if a future yauzl ever surfaces
    // the body anyway, our own per-chunk cap in readEntryAsString catches it.
    const big = Buffer.alloc(8 * 1024, 'a')
    const zip = writeZip([
      { name: 'link', body: big, unixMode: 0o120777, store: true, fakeUncompressedSize: 4 },
    ])

    await expect(extractWithYauzl(zip, destDir, onEntry)).rejects.toThrow()
  })

  it('rejects an invalid zip file', async () => {
    const bogus = path.join(os.tmpdir(), `cy-extract-test-bogus-${Date.now()}.zip`)

    fs.writeFileSync(bogus, 'not a zip file')

    await expect(extractWithYauzl(bogus, destDir, onEntry)).rejects.toThrow()

    await fsp.unlink(bogus)
  })

  it('rejects (not resolves) when a per-entry write fails — even with a falsy rejection', async () => {
    // simulate a write failure by making the destination a file that already
    // has a child path that should be a directory — fsp.mkdir on the parent
    // will reject, and we want to make sure that rejection surfaces.
    const blocker = path.join(destDir, 'blocked')

    await fsp.writeFile(blocker, 'i am a file, not a directory')

    const zip = writeZip([{ name: 'blocked/inside.txt', body: Buffer.from('hi') }])

    await expect(extractWithYauzl(zip, destDir, onEntry)).rejects.toThrow()
  })
})
