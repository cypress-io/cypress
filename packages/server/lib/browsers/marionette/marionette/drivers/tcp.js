'use strict';
var Abstract = require('./abstract');
var CommandStream = require('../command-stream');
var debug = require('debug')('marionette:tcp');
var net = require('net');
var retrySocket = require('socket-retry-connect');

/** TCP **/
Tcp.Socket = net.Socket;

/**
 * NodeJS only tcp socket driver for marionette.
 * See {{#crossLink "Marionette.Drivers.MozTcp"}}{{/crossLink}}
 * for the gecko/xpcom vesion of this driver.
 *
 * @class Marionette.Drivers.Tcp
 * @extends Marionette.Drivers.Abstract
 * @constructor
 * @param {Options} options connection options.
 *   @param {String} [options.host="localhost"] host.
 *   @param {Numeric} [options.port="2828"] port.
 */
function Tcp(options) {
  if (!options) {
    options = {};
  }

  Abstract.call(this, options);

  /**
   * The unique identifier of the current connection.
   *
   * @property connectionId
   * @type Number
   */
  this.connectionId = 0;

  /**
   * The remote hostname.
   *
   * @property host
   * @type String
   */
  this.host = options.host || 'localhost';

  /**
   * The remote port number.
   *
   * @property port
   * @type Number
   */
  this.port = options.port || 2828;
}

Tcp.prototype = Object.create(Abstract.prototype);

/**
 * Sends a command to the server.
 *
 * @param {Object} cmd remote marionette command.
 */
Tcp.prototype._sendCommand = function _sendCommand(cmd) {
  this.client.send(cmd);
};

/**
 * Opens TCP socket for marionette client.
 */
Tcp.prototype._connect = function connect(callbackpromises) {
  var options = {
    port: this.port,
    host: this.host,
    tries: this.tries
  };
  retrySocket.waitForSocket(options, function(err, socket) {
    debug('got socket starting command stream %o', { err: err });

    if (callbackpromises){
      if (err) {
        return callbackpromises(err)
      }

      this.callbackpromises = callbackpromises;
    }
    this.socket = socket;
    this.client = new CommandStream(this.socket);
    this.client.on('command', this._onClientCommand.bind(this));
  }.bind(this));
};

/**
 * Receives command from server.
 *
 * @param {Object} data response from marionette server.
 */
Tcp.prototype._onClientCommand = function(data) {
  this._onDeviceResponse({
    id: this.connectionId,
    response: data
  });
};

/**
 * Closes connection to marionette.
 */
Tcp.prototype._close = function close() {
  if (this.socket && this.socket.destroy) {
    this.socket.destroy();
  }
};

/** export */
module.exports = exports = Tcp;
