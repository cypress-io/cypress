// ffprobe is necessary to extract chapters data from mp4 files.
// ffprobe is usually installed with ffmpeg.
// But in our CI, it doesn't. That's why we're installing ffprobe here.
const ffprobePath = require('@ffprobe-installer/ffprobe').path
const ffmpeg = require('fluent-ffmpeg')

ffmpeg.setFfprobePath(ffprobePath)

const path = require('path')
const fs = require('fs-extra')
const humanInterval = require('human-interval')
const systemTests = require('../lib/system-tests').default
const glob = require('@packages/server/lib/util/glob')
const videoCapture = require('@packages/server/lib/video_capture')
const Fixtures = require('../lib/fixtures')
const {
  createRoutes,
  setupStubbedServer,
  getRequests,
  postRunInstanceResponse,
} = require('../lib/serverStub')

const NUM_TESTS = 40
const MS_PER_TEST = 500
const EXPECTED_DURATION_MS = NUM_TESTS * MS_PER_TEST

// ffmpeg command that extracts the final frame as a jpg
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

describe('e2e video compression', () => {
  systemTests.setup()

  beforeEach(() => {
    // uploads happen too fast to be captured by these tests without tuning these values
    process.env.CYPRESS_UPLOAD_ACTIVITY_INTERVAL = 1000
  })

  return [
    true,
    false,
  ].forEach((headed) => {
    systemTests.it(`passes (head${headed ? 'ed' : 'less'})`, {
      // videos are corrupted in firefox due to known issues
      browser: '!firefox',
      spec: 'video_compression.cy.js',
      snapshot: false,
      headed,
      config: {
        video: true,
        videoCompression: 32,
        env: {
          NUM_TESTS,
          MS_PER_TEST,
        },
      },
      async onRun (exec, browserName) {
        if (browserName === 'webkit') {
          // TODO(webkit): fix video recording flake in webkit
          this.retries(15)
        }

        process.env.VIDEO_COMPRESSION_THROTTLE = 10

        const { stdout } = await exec()
        const videosPath = Fixtures.projectPath('e2e/cypress/videos/*')
        const files = await glob(videosPath)

        expect(files).to.have.length(1, `globbed for videos and found: ${files.length}. Expected to find 1 video. Search in videosPath: ${videosPath}.`)

        const lastFrameFile = path.join(path.dirname(files[0]), 'lastFrame.jpg')

        await outputFinalFrameAsJpg(files[0], lastFrameFile)
        // https://github.com/cypress-io/cypress/issues/9265
        // if video is seekable and not just one frozen frame, this file should exist
        await fs.stat(lastFrameFile).catch((err) => {
          throw new Error(`Expected video to have seekable ending frame, but it did not. The video may be corrupted.`)
        })

        const { duration } = await videoCapture.getCodecData(files[0])
        const durationMs = videoCapture.getMsFromDuration(duration)

        expect(durationMs).to.be.ok
        // TODO(origin): this was taking longer and failing in webkit
        expect(durationMs).to.be.closeTo(EXPECTED_DURATION_MS, humanInterval('20 seconds'))

        const { chapters } = await videoCapture.getChapters(files[0])

        // There are 40 chapters but we test only the first one
        // because what we want to check is if chapters are added properly.
        // In a chapter object, there are properties like 'end' and 'end_time'.
        // We don't check them here because they return the test time in milliseconds.
        // They cannot be guessed correctly and they can cause flakiness.
        expect(chapters[0].id).to.eq(0)
        expect(chapters[0].start).to.eq(0)
        expect(chapters[0].start_time).to.eq(0)
        expect(chapters[0]['TAG:title']).to.eq('num: 1 makes some long tests')
        expect(chapters[0].time_base).to.eq('1/1000')
        expect(chapters[0].end).to.be.a('number')
        expect(Number.isNaN(chapters[0].end)).to.be.false
        expect(chapters[0].end_time).to.be.a('number')
        expect(Number.isNaN(chapters[0].end_time)).to.be.false

        expect(stdout).to.match(/Compression progress:\s+\d{1,3}%/)
      },
    })
  })
})

describe('video compression 0', () => {
  systemTests.setup()
  systemTests.it('does not compress', {
    browser: 'chrome',
    spec: 'video_compression.cy.js',
    config: {
      video: true,
      videoCompression: 0,
    },
    snapshot: true,
  })
})

const { instanceId } = postRunInstanceResponse

describe('video compression true', () => {
  // @see ./record_spec.js for additional references
  setupStubbedServer(createRoutes())

  systemTests.it('coerces true to 32 CRF', {
    key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
    configFile: 'cypress-with-project-id-uploading-assets.config.js',
    browser: 'chrome',
    spec: 'video_compression.cy.js',
    record: true,
    config: {
      // override the value in the config to set videoCompression to true
      videoCompression: true,
      video: true,
    },
    snapshot: true,
    onStdout: (stdout) => {
      // expect setting videoCompression=true to coerce to 32 CRF
      expect(stdout).to.include('Compressing to 32 CRF')

      const { body } = getRequests().find((reqObj) => reqObj.url === `POST /instances/${instanceId}/tests`)

      // make sure we are capturing the correct config value in the cloud and not coercing it to 32 CRF to determine proper usage
      expect(body.config.videoCompression).to.be.true
    },
  })
})
