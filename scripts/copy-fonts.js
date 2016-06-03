var vfs = require('vinyl-fs');

module.exports = function copyFonts (dir) {
  return function () {
    vfs.src('bower_components/font-awesome/fonts/**').pipe(vfs.dest(dir + '/fonts'));
  }
}
