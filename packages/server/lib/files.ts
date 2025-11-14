import path from 'path'
import { fs } from './util/fs'

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
