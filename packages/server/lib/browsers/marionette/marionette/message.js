/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

function Command(body) {
  this.id = null;
  this.name = body.name;
  this.params = body.parameters || {};
}

Command.prototype.toString = function() {
  return 'Command ' + JSON.stringify({
    id: this.id,
    name: this.name,
    params: this.params
  });
};

Command.prototype.toMsg = function() {
  if (!this.id) {
    throw new RangeError('Command ID must be specified');
  }
  return [Command.TYPE, this.id, this.name, this.params];
};

Command.fromMsg = function(msg) {
  return new Command(msg[1], msg[2], msg[3]);
};

Command.TYPE = 0;

function Response(msgId, obj) {
  this.id = msgId;
  this.error = null;
  this.result = null;

  if (obj instanceof Error) {
    this.error = obj;
  } else {
    this.result = obj;
  }
}

Response.prototype.toString = function() {
  return 'Response ' + JSON.stringify({
    id: this.id,
    error: this.error,
    result: this.result
  });
};

Response.prototype.toMsg = function() {
  return [Response.TYPE, this.id, this.error, this.result];
};

Response.fromMsg = function(msg) {
  return new Response(msg[1], msg[2] || msg[3]);
};

Response.TYPE = 1;

module.exports = {
  Command: Command,
  Response: Response,
};
