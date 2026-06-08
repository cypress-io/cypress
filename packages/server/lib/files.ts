import buffer from 'buffer'
import path from 'path'
import { fs } from './util/fs'

// When file contents are sent to the browser they are serialized as a base64
// string (e.g. over the CDP socket used for Chromium/Electron or the engine.io
// polling transport). V8 caps string length at buffer.constants.MAX_STRING_LENGTH
// (0x1fffffe8 characters) and base64 inflates byte length by 4/3, so a file
// whose encoded contents would exceed that cap crashes the browser — a fatal
// SIGSEGV in Electron — instead of failing gracefully. We reject oversized files
// up front with a clear error. The headroom below the cap leaves room for the
// engine.io packet framing and JSON.stringify quoting that wrap the contents.
// https://github.com/cypress-io/cypress/issues/24583
const SERIALIZATION_HEADROOM = 1024 * 1024

export const MAX_FILE_SIZE = Math.floor((buffer.constants.MAX_STRING_LENGTH - SERIALIZATION_HEADROOM) / 4) * 3

type FileTooLargeError = NodeJS.ErrnoException & {
  originalFilePath: string
  filePath: string
  fileSize: number
  maxFileSize: number
}

async function assertFileWithinSizeLimit (filePath: string, originalFilePath: string) {
  let stats

  try {
    stats = await fs.statAsync(filePath)
  } catch (err) {
    err.originalFilePath = originalFilePath
    err.filePath = filePath
    throw err
  }

  if (stats.size > MAX_FILE_SIZE) {
    const err = new Error(`The file at \`${filePath}\` is ${stats.size} bytes, which exceeds the maximum size of ${MAX_FILE_SIZE} bytes that can be sent to the browser.`) as FileTooLargeError

    err.code = 'CYPRESS_FILE_TOO_LARGE'
    err.originalFilePath = originalFilePath
    err.filePath = filePath
    err.fileSize = stats.size
    err.maxFileSize = MAX_FILE_SIZE

    throw err
  }
}

export async function readFile (projectRoot: string, options: { file: string, encoding?: BufferEncoding } = { file: '', encoding: 'utf8' }) {
  const filePath = path.resolve(projectRoot, options.file)

  // https://github.com/cypress-io/cypress/issues/1558
  // If no encoding is specified, then Cypress has historically defaulted
  // to `utf8`, because of it's focus on text files. This is in contrast to
  // NodeJs, which defaults to binary. We allow users to pass in `null`
  // to restore the default node behavior.
  try {
    let contents

    if (path.extname(filePath) === '.json' && options.encoding !== null) {
      contents = await fs.readJsonAsync(filePath, options.encoding === undefined ? 'utf8' : options.encoding)
    } else {
      contents = await fs.readFileAsync(filePath, {
        encoding: options.encoding === undefined ? 'utf8' : options.encoding,
      })
    }

    return {
      contents,
      filePath,
    }
  } catch (err) {
    err.originalFilePath = options.file
    err.filePath = filePath
    throw err
  }
}

export async function readFiles (projectRoot: string, options: { files: { path: string, encoding?: BufferEncoding }[] } = { files: [] }) {
  const files = await Promise.all(options.files.map(async (file) => {
    // Guard against files too large to serialize to the browser before reading
    // them, so we surface a clear error instead of crashing the browser.
    await assertFileWithinSizeLimit(path.resolve(projectRoot, file.path), file.path)

    const { contents, filePath } = await readFile(projectRoot, {
      file: file.path,
      encoding: file.encoding,
    })

    return {
      ...file,
      filePath,
      contents,
    }
  }))

  return files
}

export async function writeFile (projectRoot: string, options: { fileName: string, contents: string, encoding?: BufferEncoding, flag?: string } = { fileName: '', contents: '', encoding: 'utf8', flag: 'w' }) {
  const filePath = path.resolve(projectRoot, options.fileName)
  const writeOptions = {
    encoding: options.encoding === undefined ? 'utf8' : options.encoding,
    flag: options.flag || 'w',
  }

  try {
    await fs.outputFile(filePath, options.contents, writeOptions)

    return {
      contents: options.contents,
      filePath,
    }
  } catch (err) {
    err.filePath = filePath
    throw err
  }
}
