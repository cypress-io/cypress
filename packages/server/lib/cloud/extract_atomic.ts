import { createReadStream } from 'fs'
import tar from 'tar'
import { ensureDir } from 'fs-extra'
import path from 'path'
import writeFileAtomic from 'write-file-atomic'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 100

function isRetryableError (err: unknown): err is NodeJS.ErrnoException {
  const code = typeof err === 'object' && err !== null && 'code' in err
    ? (err as NodeJS.ErrnoException).code
    : undefined

  return code === 'EPERM' || code === 'EACCES'
}

function delay (ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function writeFileAtomicWithRetry (
  filePath: string,
  content: Buffer,
  options: { mode?: number },
): Promise<void> {
  let lastError: unknown

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await writeFileAtomic(filePath, content, {
        mode: options.mode || 0o644,
      })

      return
    } catch (err) {
      lastError = err
      if (attempt < MAX_RETRIES && isRetryableError(err)) {
        await delay(RETRY_DELAY_MS)
      } else {
        throw err
      }
    }
  }

  throw lastError
}

export const extractAtomic = async (archivePath: string, destinationPath: string) => {
  const entryPromises: Promise<void>[] = []

  const parser = new tar.Parse()

  parser.on('entry', (entry) => {
    if (entry.type !== 'File') {
      entry.resume() // skip non-files

      return
    }

    const targetPath = path.join(destinationPath, entry.path)

    const p = (async () => {
      await ensureDir(path.dirname(targetPath))

      const chunks: Buffer[] = []

      for await (const chunk of entry) {
        chunks.push(chunk)
      }

      const content = Buffer.concat(chunks)

      await writeFileAtomicWithRetry(targetPath, content, {
        mode: entry.mode || 0o644,
      })
    })()

    entryPromises.push(p)
  })

  // Pipe archive into parser
  const stream = createReadStream(archivePath)

  stream.pipe(parser)

  // Wait for parser to finish and all entry writes to complete
  await new Promise<void>((resolve, reject) => {
    parser.on('end', resolve)
    // @ts-expect-error Parser extends NodeJS.ReadWriteStream (EventEmitter), so it supports 'error' events
    // even though the types don't explicitly declare it
    parser.on('error', reject)
    stream.on('error', reject)
  })

  await Promise.all(entryPromises)
}
