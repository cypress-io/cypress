e2e = require("../support/helpers/e2e")

describe "e2e video compression", ->
  e2e.setup()

  it "passes", ->
    process.env.VIDEO_COMPRESSION_THROTTLE = 10

    e2e.exec(@, {
      spec: "video_compression_spec.coffee"
      snapshot: false
      expectedExitCode: 0
    })
    .get("stdout")
    .then (stdout) ->
      expect(stdout).to.match(/Compression progress:\s+\d{1,3}%/)
