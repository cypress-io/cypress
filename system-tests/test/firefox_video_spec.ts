import systemTests from '../lib/system-tests'
import { globAsync as glob } from '@packages/server/lib/util/glob'
import * as videoCapture from '@packages/server/lib/video_capture'
import { expectSeekableEndingFrame } from '../lib/video'
import Fixtures from '../lib/fixtures'

const NUM_TESTS = 4
const MS_PER_TEST = 500

async function expectValidVideo (videoFile: string) {
  await expectSeekableEndingFrame(videoFile)

  const { duration } = await videoCapture.getCodecData(videoFile)
  const durationMs = videoCapture.getMsFromDuration(duration)

  expect(durationMs, `${videoFile} should have a positive duration`).to.be.a('number').and.to.be.greaterThan(0)
}

// Firefox 93+ requires a recent user gesture (transient activation) before display
// capture via getUserMedia is permitted. Cypress records Firefox video through that
// API, so without a synthesized gesture no frames are ever captured and video
// processing fails. The browser is reused across specs in run mode, so the gesture
// has to be re-synthesized for every spec, not just the first.
// @see https://github.com/cypress-io/cypress/issues/18415
describe('e2e firefox video', () => {
  systemTests.setup()

  systemTests.it('records a non-corrupt, seekable video for every spec in firefox', {
    browser: 'firefox',
    // run two specs to verify video recording is re-established for specs after the first
    spec: 'video_compression.cy.js,simple_passing.cy.js',
    snapshot: false,
    config: {
      video: true,
      videoCompression: false,
      env: {
        MS_PER_TEST,
      },
      expose: {
        NUM_TESTS,
      },
    },
    async onRun (exec) {
      const { stdout } = await exec()

      // a rejected getUserMedia surfaces as a video processing warning rather than a
      // failed run, and leaves later specs compressing with no video controller
      expect(stdout).not.to.include('We failed processing this video')
      expect(stdout).not.to.include('We failed compressing this video')
      expect(stdout).not.to.include('Insufficient frames captured')
      expect(stdout).not.to.include('postProcessFfmpegOptions')

      const videosPath = Fixtures.projectPath('e2e/cypress/videos/*.mp4')
      const files = (await glob(videosPath)).filter((file) => !file.endsWith('-compressed.mp4'))

      expect(files).to.have.length(2, `globbed for videos and found: ${files.length}. Expected to find 2 videos (one per spec). Search in videosPath: ${videosPath}.`)

      expect(files.some((f) => f.includes('video_compression')), 'expected a video for video_compression.cy.js').to.be.true
      expect(files.some((f) => f.includes('simple_passing')), 'expected a video for simple_passing.cy.js').to.be.true

      for (const file of files) {
        await expectValidVideo(file)
      }
    },
  })
})
