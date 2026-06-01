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
function outputFinalFrameAsJpg (inputFile, outputFile) {
  return new Promise((resolve, reject) => {
    return ffmpeg(inputFile)
    .inputOption('-sseof -3')
    .outputOptions(['-vsync 2', '-update 1'])
    .on('end', resolve)
    .on('error', reject)
    .save(outputFile)
  })
}

// Firefox 93+ requires a recent user gesture (transient activation) before display
// capture via getUserMedia is permitted. Cypress records Firefox video through that
// API, so without a synthesized gesture no frames are ever captured and video
// processing fails. This test guards that Firefox video recording produces a real,
// seekable video again.
// @see https://github.com/cypress-io/cypress/issues/18415
describe('e2e firefox video', () => {
  systemTests.setup()

  systemTests.it('records a non-corrupt, seekable video in firefox', {
    browser: 'firefox',
    spec: 'video_compression.cy.js',
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
      // video processing failed instead of producing a video.
      expect(stdout).not.to.include('We failed processing this video')
      expect(stdout).not.to.include('Insufficient frames captured')

      const videosPath = Fixtures.projectPath('e2e/cypress/videos/*')
      const files = await glob(videosPath)

      expect(files).to.have.length(1, `globbed for videos and found: ${files.length}. Expected to find 1 video. Search in videosPath: ${videosPath}.`)

      const lastFrameFile = path.join(path.dirname(files[0]), 'lastFrame.jpg')

      await outputFinalFrameAsJpg(files[0], lastFrameFile)
      // https://github.com/cypress-io/cypress/issues/9265
      // if video is seekable and not just one frozen frame, this file should exist
      await fs.stat(lastFrameFile).catch(() => {
        throw new Error(`Expected video to have a seekable ending frame, but it did not. The video may be corrupted or empty.`)
      })

      const { duration } = await videoCapture.getCodecData(files[0])
      const durationMs = videoCapture.getMsFromDuration(duration)

      // a real recording has a positive duration; an empty/corrupt one does not
      expect(durationMs, 'recorded video should have a positive duration').to.be.a('number').and.to.be.greaterThan(0)
    },
  })
})
