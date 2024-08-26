/* global Marionette */
(function(module, ns) {
  'use strict';

  var Command = require('../message').Command;
  var Response = require('../message').Response;

  /**
   *
   * Abstract driver that will handle
   * all common tasks between implementations.
   * Such as error handling, request/response queuing
   * and timeouts.
   *
   * @constructor
   * @class Marionette.Drivers.Abstract
   * @param {Object} options set options on prototype.
   */
  function Abstract(options) {
    this._sendQueue = [];
    this._responseQueue = [];
    this._lastId = 0;
  }

  Abstract.prototype = {

    /**
     * Duration in milliseconds to wait before timing out a command
     * request.
     *
     * @property timeout
     * @type Number
     */
    timeout: 10000,

    /**
     * Waiting for a command to finish?
     *
     * @private
     * @property _waiting
     * @type Boolean
     */
    _waiting: true,

    /**
     * Is system ready for commands?
     *
     * @property ready
     * @type Boolean
     */
    ready: false,

    /**
     * A unique identifier for the current connection.
     *
     * @property connectionId
     * @type Number
     */
    connectionId: null,

    /**
     * Duration in milliseconds defining when to abort an attempt to
     * execute script in the remote end.
     *
     * @method setScriptTiemout
     * @param {Number} the timeout value.
     */
    setScriptTimeout: function setScriptTimeout(timeout) {
    },

    /**
     * Sends a JSON data structure across the wire to the remote end.
     *
     * Each command is queued whilst waiting for any pending commands.
     * This ensures order of response is correct, but also means the client
     * implements a synchronous interface for Marionette.
     *
     * @method send
     *
     * @param {(Object|Command|Response)} obj
     *     An object that can be dumped into a JSON data structure,
     *     or a message that can be marshaled.
     * @param {Function} callback
     *     Callback to be invoked when a response for the request is
     *     received.
     */
    send: function send(obj, callback) {
      if (!this.ready) {
        throw new Error('Connection is not ready');
      }

      if (typeof callback == 'undefined') {
        throw new Error('Callback is required');
      }

      if (obj instanceof Command || obj instanceof Response) {
        this.sendMessage(obj, callback);
      } else {
        this.sendRaw(obj, callback);
      }

      return this;
    },

    /**
     * Sends a message across the wire to the remote end.
     *
     * @param {(Command|Response)} message
     *     The message to send.
     * @param {Function} callback
     *     Callback to be invoked when a response for the request is
     *     received.
     */
    sendMessage: function(message, callback) {
      message.id = ++this._lastId;
      this.sendRaw(message.toMsg(), callback);
    },

    /**
     * Sends a JSON data structure across the wire to the remote end.
     *
     * @param {Object} packet
     *     An object that can be marshaled into a JSON data structure.
     * @param {Function} callback
     *     Callback to be invoked when a response for the request is
     *     received.
     */
    sendRaw: function(packet, callback) {
      this._responseQueue.push(callback);
      this._sendQueue.push(packet);
      this._nextCommand();
    },

    /**
     * Connects to the remote end.
     *
     * Requires the _connect function to be defined in the concrete class.
     *
     *     MyConcreteClass.prototype._connect = function _connect(){
     *       // open a socket to marrionete accept response
     *       // you *must* call _onDeviceResponse with the first
     *       // response from Marionette it looks like this:
     *       // {applicationType: "gecko", marionetteProtocol: 2}
     *       this.connectionId = result.id;
     *     }
     *
     * @method connect
     * @param {Function} callback executes
     *   after successfully connecting to the server.
     */
    connect: function connect(callback, callbackpromises) {
      this.ready = true;
      this._responseQueue.push(function(data) {
        this.marionetteProtocol = data.marionetteProtocol || 1;
        this.traits = data.traits;
        this.applicationType = data.applicationType;
        callback();
      }.bind(this));
      this._connect(callbackpromises);
    },

    /**
     * Destroys connection to server
     *
     * Will immediately close connection to server
     * closing any pending responses.
     *
     * @method close
     */
    close: function() {
      this.ready = false;
      this._responseQueue.length = 0;
      if (this._close) {
        this._close();
      }
    },

    /**
     * Checks queue if not waiting for a response
     * Sends command to websocket server
     *
     * @private
     * @method _nextCommand
     */
    _nextCommand: function _nextCommand() {
      if (!this._waiting && this._sendQueue.length) {
        this._waiting = true;
        var next = this._sendQueue.shift();
        this._sendCommand(next);
      }
    },

    /**
     * Handles responses from devices.
     * Will only respond to the event if the connectionId
     * is equal to the event id and the client is ready.
     *
     * @param {Object} data response from server.
     * @private
     * @method _onDeviceResponse
     */
    _onDeviceResponse: function _onDeviceResponse(data) {
      if (this.ready && data.id === this.connectionId) {
        this._waiting = false;

        var resp;
        if (this.marionetteProtocol >= 3) {
          var msg = Response.fromMsg(data.response);
          resp = msg.result;
        } else {
          resp = data.response;
        }

        var cb = this._responseQueue.shift();

        if (this.callbackpromises){
          this.callbackpromises();
        }

        cb(resp);

        this._nextCommand();
      }
    }

  };

  module.exports = Abstract;

}.apply(
  this,
  (this.Marionette) ?
    [Marionette('drivers/abstract'), Marionette] :
    [module, require('../marionette')]
));
