import { createReadStream } from 'fs'
import tar from 'tar'
import { ensureDir } from 'fs-extra'
import path from 'path'
import writeFileAtomic from 'write-file-atomic'

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

      await writeFileAtomic(targetPath, content, {
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
    // Parser extends NodeJS.ReadWriteStream (EventEmitter), so it supports 'error' events
    // even though the types don't explicitly declare it

    ;(parser as NodeJS.ReadWriteStream).on('error', reject)
    stream.on('error', reject)
  })

  await Promise.all(entryPromises)
}
