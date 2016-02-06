user       = require("./user")
errors     = require("./errors")
Renderer   = require("./renderer")

module.exports = {
  run: (app, options = {}) ->
    ## make sure we have a current session
    user.ensureSession()

    ## then go ahead and run the project
    .then ->
      Renderer.create({
        width:  1280
        height: 720
        show:   false
        frame:  false
        type:   "PROJECT"
      })

    ## catch any errors and exit with them
    .catch(errors.exitWith)
}