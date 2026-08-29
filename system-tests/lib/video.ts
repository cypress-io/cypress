import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs-extra'
import path from 'path'
// imported for the side effect of pointing fluent-ffmpeg at the bundled binaries
import '@packages/server/lib/video_capture'
import type { FfprobeData } from 'fluent-ffmpeg'

const SEEK_FROM_END_SECONDS = 3

function probe (inputFile: string): Promise<FfprobeData> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputFile, (err, metadata) => {
      return err ? reject(err) : resolve(metadata)
    })
  })
}

// The container duration spans every stream, and a compressed video also carries
// a chapter track built from the run's wall clock. That clock starts before the
// browser delivers its first frame, so the chapter track can outlast the video by
// seconds — seeking relative to the container would land past the final frame,
// where ffmpeg decodes nothing and still exits successfully.
async function videoStreamDuration (inputFile: string): Promise<number> {
  const metadata = await probe(inputFile)
  const videoStream = metadata.streams.find((stream) => stream.codec_type === 'video')
  const reported = [videoStream?.duration, metadata.format.duration]
  const duration = reported.map(Number).find((value) => Number.isFinite(value) && value > 0)

  if (!duration) {
    throw new Error(`Expected ${inputFile} to contain a video stream with a duration, but ffprobe reported: ${JSON.stringify(reported)}`)
  }

  return duration
}

function extractFrameAsJpg (inputFile: string, seekTo: string, outputFile: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputFile)
    .inputOption(`-ss ${seekTo}`)
    .outputOptions(['-vsync 2', '-update 1'])
    .on('end', () => resolve())
    .on('error', reject)
    .save(outputFile)
  })
}

// asserts that the given video file is a real, seekable recording and not a
// corrupt file or a single frozen frame
// @see https://github.com/cypress-io/cypress/issues/9265
export async function expectSeekableEndingFrame (videoFile: string) {
  const duration = await videoStreamDuration(videoFile)
  const seekTo = Math.max(duration - SEEK_FROM_END_SECONDS, 0).toFixed(3)
  const lastFrameFile = path.join(path.dirname(videoFile), `${path.basename(videoFile)}-lastFrame.jpg`)

  // a leftover frame from an earlier attempt would make this check pass for free
  await fs.remove(lastFrameFile)

  await extractFrameAsJpg(videoFile, seekTo, lastFrameFile)

  // ffmpeg exits successfully when a seek decodes no frames, leaving no file behind
  const { size } = await fs.stat(lastFrameFile).catch(() => ({ size: 0 }))

  expect(size, `expected ${videoFile} to have a seekable frame at ${seekTo}s of its ${duration}s video stream, but ffmpeg decoded none — the video may be corrupted`).to.be.greaterThan(0)
}
