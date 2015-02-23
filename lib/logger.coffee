class Logger extends require('events').EventEmitter
  constructor: ->
    # if ~process.argv.indexOf('verbose')
    @on 'verbose', (args...) ->
      console.log ':VERBOSE:', args.join(' ')
    super

module.exports = Logger
