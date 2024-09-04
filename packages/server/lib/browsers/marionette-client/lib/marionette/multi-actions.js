/* global Marionette */
(function (module, ns) {
  'use strict'

  /**
   * For a multifinger gesture, we can use MultiActions.
   * For example, one finger to hold down
   * while the other finger moves from one element to another.
   *
   * @class Marionette.MultiActions
   * @param {Marionette.Client} context of a client.
   */
  function MultiActions (client) {
    this.client = client
    this.multiActions = []
    this.maxLength = 0
  }

  MultiActions.prototype = {

    /**
     * Adds a action chain for execution.
     *
     * @method add
     * @param {Object} action {{#crossLink "Marionette.Actions"}}{{/crossLink}}.
     *
     * @return {Object} self.
     */
    add: function add (action) {
      this.multiActions.push(action.actionChain)
      if (action.actionChain.length > this.maxLength) {
        this.maxLength = action.actionChain.length
      }

      return this
    },

    /**
     * Send multiple action chains that have been added
     * to the server side for execution.
     *
     * @method perform
     * @param {Function} callback callback when the perform completes.
     */
    perform: function perform (callback) {
      let cmd = {
        type: 'multiAction',
        value: this.multiActions,
        max_length: this.maxLength,
      }

      this.client._sendCommand(cmd, callback)
      this.multiActions = []

      return this
    },
  }

  module.exports = MultiActions
}.apply(
  this,
  (this.Marionette) ?
    [Marionette('multi-actions'), Marionette] :
    [module, require('../../lib/marionette/marionette')],
))
