/* global Marionette */
(function(module, ns) {
  'use strict';

  var exports = module.exports;

  exports.Element = ns.require('element');
  exports.Error = ns.require('error');
  exports.Client = ns.require('client');
  exports.Drivers = ns.require('drivers');
  exports.CommandStream = ns.require('command-stream');
  exports.Actions = ns.require('actions');
  exports.MultiActions = ns.require('multi-actions');

}.apply(
  this,
  (this.Marionette) ?
    [Marionette, Marionette] :
    [module, require('./marionette')]
));