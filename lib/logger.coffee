class Logger extends require('events').EventEmitter
  constructor: ->
    if ~process.argv.indexOf('verbose')
      @on 'verbose', ->
        console.log ':VERBOSE:', Array::slice.apply(arguments).join(' ')
    super

module.exports = Logger
