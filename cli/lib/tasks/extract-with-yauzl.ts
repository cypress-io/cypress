import _ from 'lodash'
import path from 'path'
import yauzl from 'yauzl'
import fs from 'fs'
import { promisify } from 'util'
import stream from 'stream'

const fsp = fs.promises

const pipelineAsync = promisify(stream.pipeline)

// Unix file mode masks for entries stored in zip's externalFileAttributes
// (the high 16 bits when the file was zipped on a Unix host).
const S_IFMT = 0o170000
const S_IFLNK = 0o120000

// PATH_MAX on Linux/macOS is 4096; symlink targets larger than this are not
// legal filesystem paths and almost certainly indicate a malformed or
// malicious archive. The cap also prevents reading an arbitrarily large
// "symlink" entry into memory.
const MAX_SYMLINK_TARGET_BYTES = 4096

/**
 * Extracts the contents of a zip archive into the given destination directory.
 * Recreates directories, regular files, and symlinks while preserving Unix
 * file modes encoded in each entry's external attributes. Calls `onEntry` once
 * per archive entry processed. Refuses entries whose resolved path would
 * escape the destination directory.
 */
const extractWithYauzl = async (
  zipFilePath: string,
  destDir: string,
  onEntry: () => void,
): Promise<void> => {
  const resolvedDest = path.resolve(destDir)

  await new Promise<void>((resolve, reject) => {
    // autoClose: false — `finish` below owns closing the zipfile, so we don't
    // want yauzl's internal end-listener closing it first and tripping a
    // double-close (EBADF) when we do.
    yauzl.open(zipFilePath, { lazyEntries: true, autoClose: false }, (err: any, zipFile: any) => {
      if (err) {
        return reject(err)
      }

      const finish = _.once((err?: Error) => {
        zipFile.close?.()
        if (err) {
          return reject(err)
        }

        return resolve()
      })

      zipFile.on('error', finish)
      zipFile.on('end', () => finish())
      zipFile.on('entry', (entry: any) => {
        handleEntry(zipFile, entry, resolvedDest)
        .then(() => {
          onEntry()
          zipFile.readEntry()
        })
        .catch(finish)
      })

      zipFile.readEntry()
    })
  })
}

const handleEntry = async (zipFile: any, entry: any, resolvedDest: string): Promise<void> => {
  const fileDest = path.resolve(resolvedDest, entry.fileName)

  // refuse anything that would write outside the install dir
  if (
    fileDest !== resolvedDest &&
    !fileDest.startsWith(resolvedDest + path.sep)
  ) {
    throw new Error(`Refusing to extract entry outside of destination: ${entry.fileName}`)
  }

  const unixMode = (entry.externalFileAttributes >>> 16) & 0xffff
  const isDir = /\/$/.test(entry.fileName)
  const isSymlink = (unixMode & S_IFMT) === S_IFLNK

  if (isDir) {
    await fsp.mkdir(fileDest, { recursive: true })

    return
  }

  await fsp.mkdir(path.dirname(fileDest), { recursive: true })

  if (isSymlink) {
    if (entry.uncompressedSize > MAX_SYMLINK_TARGET_BYTES) {
      throw new Error(`Refusing to extract symlink with target larger than ${MAX_SYMLINK_TARGET_BYTES} bytes: ${entry.fileName}`)
    }

    const linkTarget = await readEntryAsString(zipFile, entry)
    const resolvedTarget = path.resolve(path.dirname(fileDest), linkTarget)

    if (
      resolvedTarget !== resolvedDest &&
      !resolvedTarget.startsWith(resolvedDest + path.sep)
    ) {
      throw new Error(`Refusing to extract symlink pointing outside of destination: ${entry.fileName} -> ${linkTarget}`)
    }

    await fsp.rm(fileDest, { recursive: true, force: true })
    await fsp.symlink(linkTarget, fileDest)

    return
  }

  const readStream: NodeJS.ReadableStream = await new Promise((res, rej) => {
    zipFile.openReadStream(entry, (err: any, rs: NodeJS.ReadableStream) => {
      if (err) {
        return rej(err)
      }

      return res(rs)
    })
  })

  // Preserve the Unix mode bits when present; otherwise fall back to a sane default.
  const fileMode = (unixMode & 0o7777) || 0o644
  const writeStream = fs.createWriteStream(fileDest, { mode: fileMode })

  await pipelineAsync(readStream, writeStream)
}

const readEntryAsString = (zipFile: any, entry: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (err: any, rs: NodeJS.ReadableStream) => {
      if (err) {
        return reject(err)
      }

      const chunks: Buffer[] = []

      rs.on('data', (chunk: Buffer) => chunks.push(chunk))
      rs.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      rs.on('error', reject)
    })
  })
}

export default extractWithYauzl
