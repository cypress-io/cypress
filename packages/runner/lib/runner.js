var path = require('path')

function dist () {
  var args = [].slice.call(arguments)
  var paths = [__dirname, '..', 'dist'].concat(args)
  return path.join.apply(path, paths)
}

module.exports = {
  getPathToDist: function(){
    return dist.apply(null, arguments)
  },

  getPathToIndex: function(){
    return dist('index.html')
  },
}
