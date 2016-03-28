path = require("path")

isIntegrationTestRe = /^integration/
isUnitTestRe        = /^unit/

module.exports = {
  getAbsolutePathToSpec: (spec, config) ->
    switch
      ## if our file is an integration test
      ## then figure out the absolute path
      ## to it
      when isIntegrationTestRe.test(spec)
        ## strip off the integration part
        spec = path.relative("integration", spec)

        ## now simply join this with our integrationFolder
        ## which makes it an absolute path
        spec = path.join(config.integrationFolder, spec)

      # ## commented out until we implement unit testing
      # when isUnitTestRe.test(spec)

        ## strip off the unit part
        # spec = path.relative("unit", spec)

        # ## now simply resolve this with our unitFolder
        # ## which makes it an absolute path
        # spec = path.resolve(config.unitFolder, spec)

      else
        spec
}