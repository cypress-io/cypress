var path = require("path")

module.exports = {
  getPathToDist: function(){
    var args = [].slice.call(arguments)

    var paths = [__dirname, "..", "dist"].concat(args)

    return path.join.apply(path, paths)
  },

}