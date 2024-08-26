'use strict';
var Tcp = require('./tcp');

Promises.Socket = Tcp.Socket;

function Promises(options) {
  if (!options) {
    options = {};
  }
  Tcp.call(this, options);

  this.tcp = new Tcp(options);
  this.tcp._handshaking = false;
  this.tcp._driver = this;
  this.isSync = true;

  this.marionetteProtocol = function(){
    return this.tcp.marionetteProtocol;
  };

  this.applicationType = function(){
    return this.tcp.applicationType;
  };

  this.traits = function(){
    return this.tcp.traits;
  };

  this.tcp.cbhandshake = function (data){
    // if we don't set the marionetteProtocol on the driver,
    // the session fail to open and the client stucks at [msg: 0]
    this._driver.marionetteProtocol = data.marionetteProtocol || 1;
    this._driver.traits = data.traits;
    this._driver.applicationType = data.applicationType;
  };

  // receiving command from the server
  this.tcp._onClientCommand = function(data) {
    var _response;

    if (this.callbackpromises){
      this.callbackpromises();
    }

    if (this._handshaking){
      this.cbhandshake(data);
      this._handshaking = false;
    }

    _response = data;

    this._onDeviceResponse({
      id: this.connectionId,
      response: _response
    });

  };
}

Promises.prototype = Object.create(Tcp.prototype);

Promises.prototype.connect = function() {
  var tcp = this.tcp;
  this.tcp._handshaking = true;

  return new Promise(function(resolve, reject) {
    tcp.connect(function(){}, function(err) {
      err ? reject(err) : resolve();
    });
  });
};

Promises.prototype.send = function(obj) {
  var tcp = this.tcp;
  return new Promise(function(resolve) {
    tcp.send(obj, function(res) {
      resolve(res);
    });
  });
};

Promises.prototype.close = function() {
  this.tcp.close();
};

module.exports = Promises;
