/* global Marionette */
(function(module, ns) {
  'use strict';

  var debug = require('debug')('marionette:command-stream');
  var Responder = ns.require('responder');
  var wire = require('json-wire-protocol');

  /**
   * Command stream accepts a socket or any event
   * emitter that will emit data events
   *
   * @class Marionette.CommandStream
   * @param {EventEmitter} socket socket instance.
   * @constructor
   */
  function CommandStream(socket) {
    this.socket = socket;
    this._handler = new wire.Stream();

    this._handler.on('data', this.emit.bind(this, this.commandEvent));

    Responder.apply(this);

    socket.on('data', this._handler.write.bind(this._handler));
    socket.on('error', function(err) {
      this.emit('error', err);
    }.bind(this));
  }

  var proto = CommandStream.prototype = Object.create(
    Responder.prototype
  );

  /**
   * name of the event this class
   * will emit when a response to a
   * command is received.
   *
   * @property commandEvent
   * @type String
   */
  proto.commandEvent = 'command';

  /**
   * Parses command into a string to
   * be sent over a tcp socket to marionette.
   *
   *
   * @method stringify
   * @param {Object} command marionette command.
   * @return {String} command as a string.
   */
  proto.stringify = function stringify(command) {
    return wire.stringify(command);
  };

  /**
   * Writes a command to the socket.
   * Handles conversion and formatting of object.
   *
   * @method send
   * @param {Object} data marionette command.
   */
  proto.send = function send(data) {
    debug('writing ', data, 'to socket');
    if (this.socket.write) {
      //nodejs socket
      this.socket.write(this.stringify(data), 'utf8');
    } else {
      //moztcp socket
      this.socket.send(this.stringify(data));
    }
  };

  /**
   * Adds a chunk (string or buffer) to the
   * total buffer of this instance.
   *
   * @this
   * @param {String|Buffer} buffer buffer or string to add.
   */
  proto.add = function add(buffer) {
    this._handler.write(buffer);
  };

  module.exports = exports = CommandStream;

}.apply(
  this,
  (this.Marionette) ?
    [Marionette('command-stream'), Marionette] :
    [module, require('./marionette')]
));
