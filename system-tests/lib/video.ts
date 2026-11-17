import ffmpeg from 'fluent-ffmpeg'
import { PassThrough } from 'stream'
// sets fluent-ffmpeg's path to the ffmpeg bundled with Cypress
import '@packages/server/lib/video_capture'

export type Chapter = {
  timeBase: string
  start: number
  end: number
  title: string
}

const unescape = (value: string) => value.replace(/\\(.)/g, '$1')

export function parseFfmetadataChapters (metadata: string): Chapter[] {
  return metadata.split(/^\[CHAPTER\]$/m).slice(1).map((section) => {
    const fields: Record<string, string> = {}

    for (const line of section.split('\n')) {
      const match = /^([^=]+)=(.*)$/.exec(line)

      if (match) {
        fields[match[1]] = unescape(match[2])
      }
    }

    return {
      timeBase: fields.TIMEBASE,
      start: Number(fields.START),
      end: Number(fields.END),
      title: fields.title,
    }
  })
}

export function getChapters (fileName: string): Promise<Chapter[]> {
  return new Promise((resolve, reject) => {
    const output = new PassThrough()
    let metadata = ''

    output.on('data', (chunk) => {
      metadata += chunk
    })

    ffmpeg(fileName)
    .format('ffmetadata')
    .on('error', reject)
    .on('end', () => resolve(parseFfmetadataChapters(metadata)))
    .pipe(output, { end: true })
  })
}
