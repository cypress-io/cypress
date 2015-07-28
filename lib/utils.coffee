os = require("os")

module.exports = {
  getDefaultAppFolder: ->
    switch p = os.platform()
      when "darwin"  then "/Applications"
      when "linux64" then "/usr/local"
      # when "win64"   then "i/dont/know/yet"
      else
        throw new Error("Platform: '#{p}' is not supported.")
}