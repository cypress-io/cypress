import path from 'path'
import type { ReadStream } from 'fs'
import { fs } from './util/fs'

type FileStreamError = Error & {
  filePath?: string
  originalFilePath?: string
}

export async function createReadFileStreamFromPath ({
  filePath,
  originalFilePath,
}: {
  filePath: string
  originalFilePath?: string
}) {
  const stream = fs.createReadStream(filePath)

  try {
    // Wait for the stream to emit `open` so missing file errors are normalized
    // before the response starts streaming.
    await new Promise<void>((resolve, reject) => {
      const handleError = (error: FileStreamError) => {
        error.originalFilePath = originalFilePath
        error.filePath = filePath

        reject(error)
      }

      stream.once('error', handleError)
      stream.once('open', () => {
        stream.off('error', handleError)
        resolve()
      })
    })

    return {
      filePath,
      stream,
    }
  } catch (error) {
    stream.destroy()

    throw error
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

export async function createReadFileStream (
  projectRoot: string,
  options: { file: string } = { file: '' },
): Promise<{ filePath: string, stream: ReadStream }> {
  const filePath = path.resolve(projectRoot, options.file)

  return createReadFileStreamFromPath({
    filePath,
    originalFilePath: options.file,
  })
}

export async function readFiles (projectRoot: string, options: { files: { path: string, encoding?: BufferEncoding }[] } = { files: [] }) {
  const files = await Promise.all(options.files.map(async (file) => {
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
