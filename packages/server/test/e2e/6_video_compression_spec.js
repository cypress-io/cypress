const humanInterval = require('human-interval')
const e2e = require('../support/helpers/e2e').default
const glob = require('../../lib/util/glob')
const videoCapture = require('../../lib/video_capture')
const Fixtures = require('../support/helpers/fixtures')

const NUM_TESTS = 40
const MS_PER_TEST = 500
const EXPECTED_DURATION_MS = NUM_TESTS * MS_PER_TEST

describe('e2e video compression', () => {
  e2e.setup()

  return [
    true,
    false,
  ].forEach((headed) => {
    e2e.it(`passes (head${headed ? 'ed' : 'less'})`, {
      spec: 'video_compression_spec.coffee',
      snapshot: false,
      headed,
      config: {
        env: {
          NUM_TESTS,
          MS_PER_TEST,
        },
      },
      onRun (exec) {
        process.env.VIDEO_COMPRESSION_THROTTLE = 10

        return exec()
        .tap(() => {
          const videosPath = Fixtures.projectPath('e2e/cypress/videos/*')

          return glob(videosPath)
          .then((files) => {
            expect(files).to.have.length(1, `globbed for videos and found: ${files.length}. Expected to find 1 video. Search in videosPath: ${videosPath}.`)

            return videoCapture.getCodecData(files[0])
            .then(({ duration }) => {
              const durationMs = videoCapture.getMsFromDuration(duration)

              expect(durationMs).to.be.ok

              expect(durationMs).to.be.closeTo(EXPECTED_DURATION_MS, humanInterval('15 seconds'))
            })
          })
        }).get('stdout')
        .then((stdout) => {
          expect(stdout).to.match(/Compression progress:\s+\d{1,3}%/)
        })
      },
    })
  })
})
