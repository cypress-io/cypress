import path from 'path'
import fs from 'fs-extra'
import ffmpeg from 'fluent-ffmpeg'
import systemTests from '../lib/system-tests'
import { globAsync as glob } from '@packages/server/lib/util/glob'
import * as videoCapture from '@packages/server/lib/video_capture'
import Fixtures from '../lib/fixtures'

const NUM_TESTS = 4
const MS_PER_TEST = 500

// ffmpeg command that extracts the final frame as a jpg. If the video only
// contains a single frozen frame (or no frames at all) this cannot produce a
// seekable ending frame.
function outputFinalFrameAsJpg (inputFile: string, outputFile: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    return ffmpeg(inputFile)
    .inputOption('-sseof -3')
    .outputOptions(['-vsync 2', '-update 1'])
    .on('end', resolve)
    .on('error', reject)
    .save(outputFile)
  })
}

// asserts that the given video file is a real, seekable, non-empty recording
async function expectValidVideo (videoFile: string) {
  const lastFrameFile = path.join(path.dirname(videoFile), `${path.basename(videoFile)}-lastFrame.jpg`)

  await outputFinalFrameAsJpg(videoFile, lastFrameFile)
  // https://github.com/cypress-io/cypress/issues/9265
  // if video is seekable and not just one frozen frame, this file should exist
  await fs.stat(lastFrameFile).catch(() => {
    throw new Error(`Expected ${videoFile} to have a seekable ending frame, but it did not. The video may be corrupted or empty.`)
  })

  const { duration } = await videoCapture.getCodecData(videoFile)
  const durationMs = videoCapture.getMsFromDuration(duration)

  // a real recording has a positive duration; an empty/corrupt one does not
  expect(durationMs, `${videoFile} should have a positive duration`).to.be.a('number').and.to.be.greaterThan(0)
}

// Firefox 93+ requires a recent user gesture (transient activation) before display
// capture via getUserMedia is permitted. Cypress records Firefox video through that
// API, so without a synthesized gesture no frames are ever captured and video
// processing fails. This test guards that Firefox video recording produces a real,
// seekable video again — and continues to do so for subsequent specs, since the
// browser is reused across specs in run mode.
// @see https://github.com/cypress-io/cypress/issues/18415
describe('e2e firefox video', () => {
  systemTests.setup()

  systemTests.it('records a non-corrupt, seekable video for every spec in firefox', {
    browser: 'firefox',
    // run two specs to verify video recording is re-established for specs after the first
    spec: 'video_compression.cy.js,simple_passing.cy.js',
    snapshot: false,
    config: {
      allowCypressEnv: true,
      video: true,
      videoCompression: false,
      env: {
        NUM_TESTS,
        MS_PER_TEST,
      },
    },
    async onRun (exec) {
      const { stdout } = await exec()

      // before the fix, getUserMedia rejected and the run ended with a warning that
      // video processing failed instead of producing a video. Subsequent specs additionally
      // failed compression with a missing video controller.
      expect(stdout).not.to.include('We failed processing this video')
      expect(stdout).not.to.include('We failed compressing this video')
      expect(stdout).not.to.include('Insufficient frames captured')
      expect(stdout).not.to.include('postProcessFfmpegOptions')

      const videosPath = Fixtures.projectPath('e2e/cypress/videos/*.mp4')
      const files = (await glob(videosPath)).filter((file) => !file.endsWith('-compressed.mp4'))

      // one video per spec
      expect(files).to.have.length(2, `globbed for videos and found: ${files.length}. Expected to find 2 videos (one per spec). Search in videosPath: ${videosPath}.`)

      // ensure both specs produced a real video, not just the first
      expect(files.some((f) => f.includes('video_compression')), 'expected a video for video_compression.cy.js').to.be.true
      expect(files.some((f) => f.includes('simple_passing')), 'expected a video for simple_passing.cy.js').to.be.true

      for (const file of files) {
        await expectValidVideo(file)
      }
    },
  })
})
