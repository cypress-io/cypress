path = require("path")
humanInterval = require("human-interval")
e2e = require("../support/helpers/e2e")
glob = require("../../lib/util/glob")
videoCapture = require("../../lib/video_capture")
Fixtures = require("../support/helpers/fixtures")

NUM_TESTS = 40
MS_PER_TEST = 500
EXPECTED_DURATION_MS = NUM_TESTS * MS_PER_TEST

describe "e2e video compression", ->
  e2e.setup()

  e2e.it "passes", {
    spec: "video_compression_spec.coffee"
    snapshot: false
    config: {
      env: {
        NUM_TESTS
        MS_PER_TEST
      }
    }
    expectedExitCode: 0
    onRun: (exec) ->
      process.env.VIDEO_COMPRESSION_THROTTLE = 10

      exec()
      .tap ->
        videosPath = Fixtures.projectPath("e2e/cypress/videos/*")

        glob(videosPath)
        .then (files) ->
          expect(files).to.have.length(1, "globbed for videos and found: #{files.length}. Expected to find 1 video. Search in videosPath: #{videosPath}.")

          videoCapture.getCodecData(files[0])
          .then ({ duration }) ->
            durationMs = videoCapture.getMsFromDuration(duration)
            expect(durationMs).to.be.ok
            expect(durationMs).to.be.closeTo(EXPECTED_DURATION_MS, humanInterval('10 seconds'))

      .get("stdout")
      .then (stdout) ->
        expect(stdout).to.match(/Compression progress:\s+\d{1,3}%/)

  },
