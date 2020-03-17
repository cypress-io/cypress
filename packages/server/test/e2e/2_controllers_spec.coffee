fs = require("fs-extra")
path = require("path")

e2e = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

nonExistentSpec = Fixtures.projectPath("non-existent-spec")
e2eProject = Fixtures.projectPath("e2e")

describe "e2e plugins", ->
  e2e.setup()

  it "fails when spec does not exist", ->
    e2e.exec(@, {
      spec: "spec.js"
      project: nonExistentSpec
      sanitizeScreenshotDimensions: true
      snapshot: true
      expectedExitCode: 1
    })

  it "handles specs with $, &, ? in file name", ->
    relativeSpecPath = path.join("d?ir&1%", "%di?r2&", "s%pec&?.js")
    ## windows doesn't support ? in file names
    if process.platform is "win32"
      relativeSpecPath = specPath.replace(/\?/, "")
    specPath = path.join(e2eProject, "cypress", "integration", relativeSpecPath)

    fs.outputFile(specPath, "it('passes', () => {})")
    .then =>
      e2e.exec(@, {
        spec: specPath
        sanitizeScreenshotDimensions: true
      })
    .then ({ stdout }) ->
      expect(stdout).to.include("1 found (#{relativeSpecPath})")
      expect(stdout).to.include("Running:  #{relativeSpecPath}")
      expect(stdout).to.include("Finished processing: /XXX/XXX/XXX/cypress/videos/#{relativeSpecPath}.mp4")
