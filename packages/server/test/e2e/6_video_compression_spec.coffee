path = require("path")
e2e = require("../support/helpers/e2e")
glob = require("../../lib/util/glob")
videoCapture = require("../../lib/video_capture")
Fixtures = require("../support/helpers/fixtures")

describe "e2e video compression", ->
  e2e.setup()

  it "passes", ->
    process.env.VIDEO_COMPRESSION_THROTTLE = 10

    e2e.exec(@, {
      spec: "video_compression_spec.coffee"
      snapshot: false
      expectedExitCode: 0
    })
    .tap ->
      videosPath = Fixtures.projectPath("e2e/cypress/videos/*")
    
      glob(videosPath)
      .then (files) ->
        expect(files).to.have.length(1, "globbed for videos and found: #{files.length}. Expected to find 1 video. Search in videosPath: #{videosPath}.")

        videoCapture.getCodecData(files[0])
        .then (props) ->
          console.log(props)

    .get("stdout")
    .then (stdout) ->
      expect(stdout).to.match(/Compression progress:\s+\d{1,3}%/)
