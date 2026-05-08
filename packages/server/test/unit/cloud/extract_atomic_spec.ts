import path from 'path'
import { proxyquire, sinon } from '../../spec_helper'
import { EventEmitter } from 'events'
import { Readable } from 'stream'

describe('extractAtomic', () => {
  let extractAtomic: typeof import('../../../lib/cloud/extract_atomic').extractAtomic
  let createReadStreamStub: sinon.SinonStub
  let ParseStub: sinon.SinonStub
  let ensureDirStub: sinon.SinonStub
  let writeFileAtomicStub: sinon.SinonStub
  let mockStream: Readable
  let mockParser: EventEmitter & { pipe: sinon.SinonStub }

  beforeEach(() => {
    createReadStreamStub = sinon.stub()
    ParseStub = sinon.stub()
    ensureDirStub = sinon.stub().resolves()
    writeFileAtomicStub = sinon.stub().resolves()

    // Create a mock parser first (needed for stream pipe)
    mockParser = Object.assign(new EventEmitter(), {
      pipe: sinon.stub().returns(mockParser),
    })

    // Create a mock stream
    mockStream = Object.assign(new Readable({
      read () {
        // Empty implementation
      },
    }), {
      pipe: sinon.stub().returns(mockParser),
    }) as Readable & { pipe: sinon.SinonStub }

    ParseStub.returns(mockParser)
    createReadStreamStub.returns(mockStream)

    extractAtomic = (proxyquire('../lib/cloud/extract_atomic', {
      fs: {
        createReadStream: createReadStreamStub,
      },
      tar: {
        Parse: ParseStub,
      },
      'fs-extra': {
        ensureDir: ensureDirStub,
      },
      'write-file-atomic': writeFileAtomicStub,
    })).extractAtomic
  })

  it('should extract a single file from tar archive', async () => {
    const archivePath = '/path/to/archive.tar'
    const destinationPath = '/path/to/destination'
    const fileContent = Buffer.from('file content')
    const fileMode = 0o755

    // Create a mock entry
    const mockEntry = Object.assign(new Readable({
      read () {
        this.push(fileContent)
        this.push(null) // End stream
      },
    }), {
      type: 'File',
      path: 'file.txt',
      mode: fileMode,
      resume: sinon.stub(),
    })

    const extractPromise = extractAtomic(archivePath, destinationPath)

    // Simulate entry event
    setImmediate(() => {
      mockParser.emit('entry', mockEntry)
    })

    // Simulate parser end
    setImmediate(() => {
      mockParser.emit('end')
    })

    await extractPromise

    expect(createReadStreamStub).to.be.calledWith(archivePath)
    expect(ParseStub).to.be.calledOnce
    expect((mockStream as any).pipe).to.be.calledWith(mockParser)
    expect(ensureDirStub).to.be.calledWith(destinationPath)
    expect(writeFileAtomicStub).to.be.calledWith(
      path.join(destinationPath, 'file.txt'),
      fileContent,
      { mode: fileMode },
    )
  })

  it('should extract multiple files from tar archive', async () => {
    const archivePath = '/path/to/archive.tar'
    const destinationPath = '/path/to/destination'
    const file1Content = Buffer.from('file 1 content')
    const file2Content = Buffer.from('file 2 content')

    const mockEntry1 = Object.assign(new Readable({
      read () {
        this.push(file1Content)
        this.push(null)
      },
    }), {
      type: 'File',
      path: 'file1.txt',
      mode: 0o644,
      resume: sinon.stub(),
    })

    const mockEntry2 = Object.assign(new Readable({
      read () {
        this.push(file2Content)
        this.push(null)
      },
    }), {
      type: 'File',
      path: 'file2.txt',
      mode: 0o644,
      resume: sinon.stub(),
    })

    const extractPromise = extractAtomic(archivePath, destinationPath)

    setImmediate(() => {
      mockParser.emit('entry', mockEntry1)
      mockParser.emit('entry', mockEntry2)
      mockParser.emit('end')
    })

    await extractPromise

    expect(writeFileAtomicStub).to.be.calledTwice
    expect(writeFileAtomicStub).to.be.calledWith(
      path.join(destinationPath, 'file1.txt'),
      file1Content,
      { mode: 0o644 },
    )

    expect(writeFileAtomicStub).to.be.calledWith(
      path.join(destinationPath, 'file2.txt'),
      file2Content,
      { mode: 0o644 },
    )
  })

  it('should skip non-file entries', async () => {
    const archivePath = '/path/to/archive.tar'
    const destinationPath = '/path/to/destination'

    const mockDirectoryEntry = {
      type: 'Directory',
      path: 'directory',
      resume: sinon.stub(),
    }

    const mockSymlinkEntry = {
      type: 'SymbolicLink',
      path: 'symlink',
      resume: sinon.stub(),
    }

    const mockFileEntry = Object.assign(new Readable({
      read () {
        this.push(Buffer.from('content'))
        this.push(null)
      },
    }), {
      type: 'File',
      path: 'file.txt',
      mode: 0o644,
      resume: sinon.stub(),
    })

    const extractPromise = extractAtomic(archivePath, destinationPath)

    setImmediate(() => {
      mockParser.emit('entry', mockDirectoryEntry)
      mockParser.emit('entry', mockSymlinkEntry)
      mockParser.emit('entry', mockFileEntry)
      mockParser.emit('end')
    })

    await extractPromise

    expect(mockDirectoryEntry.resume).to.be.called
    expect(mockSymlinkEntry.resume).to.be.called
    expect(mockFileEntry.resume).not.to.be.called
    expect(writeFileAtomicStub).to.be.calledOnce
    expect(writeFileAtomicStub).to.be.calledWith(
      path.join(destinationPath, 'file.txt'),
      Buffer.from('content'),
      { mode: 0o644 },
    )
  })

  it('should create nested directories for files in subdirectories', async () => {
    const archivePath = '/path/to/archive.tar'
    const destinationPath = '/path/to/destination'
    const fileContent = Buffer.from('content')

    const mockEntry = Object.assign(new Readable({
      read () {
        this.push(fileContent)
        this.push(null)
      },
    }), {
      type: 'File',
      path: 'nested/path/to/file.txt',
      mode: 0o644,
      resume: sinon.stub(),
    })

    const extractPromise = extractAtomic(archivePath, destinationPath)

    setImmediate(() => {
      mockParser.emit('entry', mockEntry)
      mockParser.emit('end')
    })

    await extractPromise

    expect(ensureDirStub).to.be.calledWith(
      path.join(destinationPath, 'nested/path/to'),
    )

    expect(writeFileAtomicStub).to.be.calledWith(
      path.join(destinationPath, 'nested/path/to/file.txt'),
      fileContent,
      { mode: 0o644 },
    )
  })

  it('should use default mode 0o644 when entry mode is not provided', async () => {
    const archivePath = '/path/to/archive.tar'
    const destinationPath = '/path/to/destination'
    const fileContent = Buffer.from('content')

    const mockEntry = Object.assign(new Readable({
      read () {
        this.push(fileContent)
        this.push(null)
      },
    }), {
      type: 'File',
      path: 'file.txt',
      mode: undefined,
      resume: sinon.stub(),
    })

    const extractPromise = extractAtomic(archivePath, destinationPath)

    setImmediate(() => {
      mockParser.emit('entry', mockEntry)
      mockParser.emit('end')
    })

    await extractPromise

    expect(writeFileAtomicStub).to.be.calledWith(
      path.join(destinationPath, 'file.txt'),
      fileContent,
      { mode: 0o644 },
    )
  })

  it('should handle files with multiple chunks', async () => {
    const archivePath = '/path/to/archive.tar'
    const destinationPath = '/path/to/destination'
    const chunk1 = Buffer.from('chunk 1')
    const chunk2 = Buffer.from('chunk 2')
    const chunk3 = Buffer.from('chunk 3')
    const expectedContent = Buffer.concat([chunk1, chunk2, chunk3])

    let chunkIndex = 0
    const mockEntry = Object.assign(new Readable({
      read () {
        if (chunkIndex === 0) {
          this.push(chunk1)
          chunkIndex++
        } else if (chunkIndex === 1) {
          this.push(chunk2)
          chunkIndex++
        } else if (chunkIndex === 2) {
          this.push(chunk3)
          chunkIndex++
        } else {
          this.push(null)
        }
      },
    }), {
      type: 'File',
      path: 'file.txt',
      mode: 0o644,
      resume: sinon.stub(),
    })

    const extractPromise = extractAtomic(archivePath, destinationPath)

    setImmediate(() => {
      mockParser.emit('entry', mockEntry)
      mockParser.emit('end')
    })

    await extractPromise

    expect(writeFileAtomicStub).to.be.calledWith(
      path.join(destinationPath, 'file.txt'),
      expectedContent,
      { mode: 0o644 },
    )
  })

  it('should handle stream errors', async () => {
    const archivePath = '/path/to/archive.tar'
    const destinationPath = '/path/to/destination'
    const streamError = new Error('Stream error')

    const extractPromise = extractAtomic(archivePath, destinationPath)

    setImmediate(() => {
      mockStream.emit('error', streamError)
    })

    await expect(extractPromise).to.be.rejectedWith('Stream error')
  })

  it('should handle parser errors', async () => {
    const archivePath = '/path/to/archive.tar'
    const destinationPath = '/path/to/destination'
    const parserError = new Error('Parser error')

    const extractPromise = extractAtomic(archivePath, destinationPath)

    setImmediate(() => {
      mockParser.emit('error', parserError)
    })

    await expect(extractPromise).to.be.rejectedWith('Parser error')
  })

  it('should handle write errors', async () => {
    const archivePath = '/path/to/archive.tar'
    const destinationPath = '/path/to/destination'
    const writeError = new Error('Write error')
    const fileContent = Buffer.from('content')

    writeFileAtomicStub.rejects(writeError)

    const mockEntry = Object.assign(new Readable({
      read () {
        this.push(fileContent)
        this.push(null)
      },
    }), {
      type: 'File',
      path: 'file.txt',
      mode: 0o644,
      resume: sinon.stub(),
    })

    const extractPromise = extractAtomic(archivePath, destinationPath)

    setImmediate(() => {
      mockParser.emit('entry', mockEntry)
      mockParser.emit('end')
    })

    await expect(extractPromise).to.be.rejectedWith('Write error')
  })

  it('should retry on EPERM and succeed when write succeeds on retry', async () => {
    const archivePath = '/path/to/archive.tar'
    const destinationPath = '/path/to/destination'
    const fileContent = Buffer.from('content')
    const epermError = Object.assign(new Error('EPERM: operation not permitted, rename \'file.txt.123\' -> \'file.txt\''), { code: 'EPERM' })

    writeFileAtomicStub.onFirstCall().rejects(epermError)
    writeFileAtomicStub.onSecondCall().resolves()

    const mockEntry = Object.assign(new Readable({
      read () {
        this.push(fileContent)
        this.push(null)
      },
    }), {
      type: 'File',
      path: 'file.txt',
      mode: 0o644,
      resume: sinon.stub(),
    })

    const extractPromise = extractAtomic(archivePath, destinationPath)

    setImmediate(() => {
      mockParser.emit('entry', mockEntry)
      mockParser.emit('end')
    })

    await extractPromise

    expect(writeFileAtomicStub).to.be.calledTwice
    expect(writeFileAtomicStub).to.be.calledWith(
      path.join(destinationPath, 'file.txt'),
      fileContent,
      { mode: 0o644 },
    )
  })

  it('should retry on EACCES and succeed when write succeeds on retry', async () => {
    const archivePath = '/path/to/archive.tar'
    const destinationPath = '/path/to/destination'
    const fileContent = Buffer.from('content')
    const eaccesError = Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' })

    writeFileAtomicStub.onFirstCall().rejects(eaccesError)
    writeFileAtomicStub.onSecondCall().resolves()

    const mockEntry = Object.assign(new Readable({
      read () {
        this.push(fileContent)
        this.push(null)
      },
    }), {
      type: 'File',
      path: 'file.txt',
      mode: 0o644,
      resume: sinon.stub(),
    })

    const extractPromise = extractAtomic(archivePath, destinationPath)

    setImmediate(() => {
      mockParser.emit('entry', mockEntry)
      mockParser.emit('end')
    })

    await extractPromise

    expect(writeFileAtomicStub).to.be.calledTwice
  })

  it('should throw when EPERM persists after all retries', async () => {
    const archivePath = '/path/to/archive.tar'
    const destinationPath = '/path/to/destination'
    const fileContent = Buffer.from('content')
    const epermError = Object.assign(new Error('EPERM: operation not permitted'), { code: 'EPERM' })

    writeFileAtomicStub.rejects(epermError)

    const mockEntry = Object.assign(new Readable({
      read () {
        this.push(fileContent)
        this.push(null)
      },
    }), {
      type: 'File',
      path: 'file.txt',
      mode: 0o644,
      resume: sinon.stub(),
    })

    const extractPromise = extractAtomic(archivePath, destinationPath)

    setImmediate(() => {
      mockParser.emit('entry', mockEntry)
      mockParser.emit('end')
    })

    await expect(extractPromise).to.be.rejectedWith(epermError)
    expect(writeFileAtomicStub.callCount).to.equal(4) // initial + 3 retries
  })

  it('should not retry on non-retryable errors', async () => {
    const archivePath = '/path/to/archive.tar'
    const destinationPath = '/path/to/destination'
    const fileContent = Buffer.from('content')
    const enospcError = Object.assign(new Error('ENOSPC: no space left'), { code: 'ENOSPC' })

    writeFileAtomicStub.rejects(enospcError)

    const mockEntry = Object.assign(new Readable({
      read () {
        this.push(fileContent)
        this.push(null)
      },
    }), {
      type: 'File',
      path: 'file.txt',
      mode: 0o644,
      resume: sinon.stub(),
    })

    const extractPromise = extractAtomic(archivePath, destinationPath)

    setImmediate(() => {
      mockParser.emit('entry', mockEntry)
      mockParser.emit('end')
    })

    await expect(extractPromise).to.be.rejectedWith(enospcError)
    expect(writeFileAtomicStub).to.be.calledOnce
  })

  it('should wait for all file writes to complete before resolving', async () => {
    const archivePath = '/path/to/archive.tar'
    const destinationPath = '/path/to/destination'
    const file1Content = Buffer.from('file 1')
    const file2Content = Buffer.from('file 2')

    let resolveWrite1: () => void
    let resolveWrite2: () => void
    const write1Promise = new Promise<void>((resolve) => {
      resolveWrite1 = resolve
    })
    const write2Promise = new Promise<void>((resolve) => {
      resolveWrite2 = resolve
    })

    writeFileAtomicStub.onFirstCall().returns(write1Promise)
    writeFileAtomicStub.onSecondCall().returns(write2Promise)

    const mockEntry1 = Object.assign(new Readable({
      read () {
        this.push(file1Content)
        this.push(null)
      },
    }), {
      type: 'File',
      path: 'file1.txt',
      mode: 0o644,
      resume: sinon.stub(),
    })

    const mockEntry2 = Object.assign(new Readable({
      read () {
        this.push(file2Content)
        this.push(null)
      },
    }), {
      type: 'File',
      path: 'file2.txt',
      mode: 0o644,
      resume: sinon.stub(),
    })

    const extractPromise = extractAtomic(archivePath, destinationPath)

    setImmediate(() => {
      mockParser.emit('entry', mockEntry1)
      mockParser.emit('entry', mockEntry2)
      mockParser.emit('end')
    })

    // Wait a bit to ensure parser has finished but writes haven't
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Extract should not have resolved yet
    let resolved = false

    extractPromise.then(() => {
      resolved = true
    })

    expect(resolved).to.be.false

    // Resolve writes
    resolveWrite1!()
    resolveWrite2!()

    await extractPromise

    expect(resolved).to.be.true
  })
})
