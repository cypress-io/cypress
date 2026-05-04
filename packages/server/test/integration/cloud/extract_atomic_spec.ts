import path from 'path'
import os from 'os'
import fs from 'fs-extra'
import tar from 'tar'
import { extractAtomic } from '../../../lib/cloud/extract_atomic'
import { expect } from '../../spec_helper'

describe('extractAtomic integration', () => {
  let tempDir: string
  let archivePath: string
  let destinationPath: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cypress-extract-atomic-'))
    archivePath = path.join(tempDir, 'archive.tar')
    destinationPath = path.join(tempDir, 'extracted')
  })

  afterEach(async () => {
    if (tempDir) {
      await fs.remove(tempDir).catch(() => {
        // Ignore cleanup errors
      })
    }
  })

  it('should extract a single file from tar archive', async () => {
    const sourceDir = path.join(tempDir, 'source')
    const testFile = path.join(sourceDir, 'test.txt')
    const fileContent = 'Hello, World!'

    await fs.ensureDir(sourceDir)
    await fs.writeFile(testFile, fileContent)

    // Create tar archive
    await tar.create(
      {
        file: archivePath,
        cwd: sourceDir,
      },
      ['test.txt'],
    )

    // Extract archive
    await extractAtomic(archivePath, destinationPath)

    // Verify extracted file
    const extractedFile = path.join(destinationPath, 'test.txt')

    expect(await fs.pathExists(extractedFile)).to.be.true

    const content = await fs.readFile(extractedFile, 'utf8')

    expect(content).to.equal(fileContent)
  })

  it('should extract multiple files from tar archive', async () => {
    const sourceDir = path.join(tempDir, 'source')
    const file1 = path.join(sourceDir, 'file1.txt')
    const file2 = path.join(sourceDir, 'file2.txt')
    const file3 = path.join(sourceDir, 'file3.txt')

    await fs.ensureDir(sourceDir)
    await fs.writeFile(file1, 'Content 1')
    await fs.writeFile(file2, 'Content 2')
    await fs.writeFile(file3, 'Content 3')

    // Create tar archive
    await tar.create(
      {
        file: archivePath,
        cwd: sourceDir,
      },
      ['file1.txt', 'file2.txt', 'file3.txt'],
    )

    // Extract archive
    await extractAtomic(archivePath, destinationPath)

    // Verify all files extracted
    expect(await fs.readFile(path.join(destinationPath, 'file1.txt'), 'utf8')).to.equal('Content 1')
    expect(await fs.readFile(path.join(destinationPath, 'file2.txt'), 'utf8')).to.equal('Content 2')
    expect(await fs.readFile(path.join(destinationPath, 'file3.txt'), 'utf8')).to.equal('Content 3')
  })

  it('should extract files with nested directory structure', async () => {
    const sourceDir = path.join(tempDir, 'source')
    const nestedFile = path.join(sourceDir, 'nested', 'path', 'to', 'file.txt')

    await fs.ensureDir(path.dirname(nestedFile))
    await fs.writeFile(nestedFile, 'Nested content')

    // Create tar archive
    await tar.create(
      {
        file: archivePath,
        cwd: sourceDir,
      },
      ['nested'],
    )

    // Extract archive
    await extractAtomic(archivePath, destinationPath)

    // Verify nested file extracted
    const extractedFile = path.join(destinationPath, 'nested', 'path', 'to', 'file.txt')

    expect(await fs.pathExists(extractedFile)).to.be.true
    expect(await fs.readFile(extractedFile, 'utf8')).to.equal('Nested content')
  })

  it('should skip non-file entries (directories, symlinks)', async () => {
    const sourceDir = path.join(tempDir, 'source')
    const testFile = path.join(sourceDir, 'test.txt')
    const subDir = path.join(sourceDir, 'subdir')

    await fs.ensureDir(subDir)
    await fs.writeFile(testFile, 'File content')
    await fs.writeFile(path.join(subDir, 'subfile.txt'), 'Sub file')

    // Create tar archive
    await tar.create(
      {
        file: archivePath,
        cwd: sourceDir,
      },
      ['.'],
    )

    // Extract archive
    await extractAtomic(archivePath, destinationPath)

    // Verify file was extracted
    expect(await fs.pathExists(path.join(destinationPath, 'test.txt'))).to.be.true
    expect(await fs.pathExists(path.join(destinationPath, 'subdir', 'subfile.txt'))).to.be.true

    // Verify directories are not extracted as files (they should be created as directories)
    const subdirPath = path.join(destinationPath, 'subdir')
    const stats = await fs.stat(subdirPath)

    expect(stats.isDirectory()).to.be.true
  })

  it('should preserve file permissions', async () => {
    const sourceDir = path.join(tempDir, 'source')
    const executableFile = path.join(sourceDir, 'script.sh')
    const normalFile = path.join(sourceDir, 'normal.txt')

    await fs.ensureDir(sourceDir)
    await fs.writeFile(executableFile, '#!/bin/bash\necho "hello"')
    await fs.writeFile(normalFile, 'Normal content')
    await fs.chmod(executableFile, 0o755)
    await fs.chmod(normalFile, 0o644)

    // Create tar archive with preserve mode
    await tar.create(
      {
        file: archivePath,
        cwd: sourceDir,
        preservePaths: true,
      },
      ['script.sh', 'normal.txt'],
    )

    // Extract archive
    await extractAtomic(archivePath, destinationPath)

    // Verify file permissions (on Unix-like systems)
    if (process.platform !== 'win32') {
      const executableStats = await fs.stat(path.join(destinationPath, 'script.sh'))
      const normalStats = await fs.stat(path.join(destinationPath, 'normal.txt'))

      // Check that executable file has execute permission
      expect(executableStats.mode & 0o111).to.not.equal(0)
      // Check that normal file doesn't have execute permission
      expect(normalStats.mode & 0o111).to.equal(0)
    }
  })

  it('should handle binary files correctly', async () => {
    const sourceDir = path.join(tempDir, 'source')
    const binaryFile = path.join(sourceDir, 'binary.bin')

    // Create a binary file with various byte values
    const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0xFF, 0xFE, 0xFD, 0x7F, 0x80])

    await fs.ensureDir(sourceDir)
    await fs.writeFile(binaryFile, binaryContent)

    // Create tar archive
    await tar.create(
      {
        file: archivePath,
        cwd: sourceDir,
      },
      ['binary.bin'],
    )

    // Extract archive
    await extractAtomic(archivePath, destinationPath)

    // Verify binary file extracted correctly
    const extractedFile = path.join(destinationPath, 'binary.bin')
    const extractedContent = await fs.readFile(extractedFile)

    expect(extractedContent).to.deep.equal(binaryContent)
  })

  it('should handle large files', async () => {
    const sourceDir = path.join(tempDir, 'source')
    const largeFile = path.join(sourceDir, 'large.txt')

    // Create a file with 1MB of data
    const largeContent = 'A'.repeat(1024 * 1024)

    await fs.ensureDir(sourceDir)
    await fs.writeFile(largeFile, largeContent)

    // Create tar archive
    await tar.create(
      {
        file: archivePath,
        cwd: sourceDir,
      },
      ['large.txt'],
    )

    // Extract archive
    await extractAtomic(archivePath, destinationPath)

    // Verify large file extracted correctly
    const extractedFile = path.join(destinationPath, 'large.txt')
    const extractedContent = await fs.readFile(extractedFile, 'utf8')

    expect(extractedContent.length).to.equal(1024 * 1024)
    expect(extractedContent).to.equal(largeContent)
  })
})
