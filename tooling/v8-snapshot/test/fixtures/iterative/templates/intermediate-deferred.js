require('./norewrite')

var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined
var stuff = process.env.TZ

module.exports = 2