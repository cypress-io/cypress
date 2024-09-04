/* global Marionette */
(function (module, ns) {
  'use strict'

  /**
   * Actions is used to denote a set of actions that
   * have to be executed in particular order.
   *
   * @class Marionette.Actions
   * @param {Marionette.Client} context of a client.
   */
  function Actions (client) {
    this.client = client
    this.actionChain = []
    this.currentId = null
  }

  Actions.prototype = {

    /**
     * Click an element.
     *
     * @param {Marionette.Element} element The element to click.
     * @param {Number} button The button that's clicked (defaults to 0, which is
     *                 the 'left' or primary mouse button).
     * @param {Number} count The number of times the element is clicked.
     * @return {Object} self.
     */
    click: function click (element, button, count) {
      button = button ||
      this.actionChain.push(['click', element.id, button, count])

      return this
    },

    /**
     * Context click an element as to show it's context menu.
     *
     * @param {Marionette.Element} element The element to context click.
     * @return {Object} self.
     */
    contextClick: function contextClick (element) {
      this.actionChain.push(['click', element.id, 2, 1])

      return this
    },

    /**
     * Send a 'touchstart' event to this element. If no coordinates are given,
     * it will be targeted at the center of the element.
     * If given, it will be targeted at the (x,y) coordinates
     * relative to the top-left corner of the element.
     *
     * @method press
     * @param {Object} element {{#crossLink "Marionette.Element"}}{{/crossLink}}
     *                         to press on.
     * @param {Number} x optional, x-coordinate to tap,
     *                   relative to the top-left corner of the element.
     * @param {Number} y optional, y-coordinate to tap,
     *                   relative to the top-left corner of the element.
     * @return {Object} self.
     */
    press: function press (element, x, y) {
      this.actionChain.push(['press', element.id, x, y])

      return this
    },

    /**
     * release() can only be called
     * if press() has already be called on this element.
     * Send 'touchend' event to whenever the finger is.
     *
     * @method release
     *
     * @return {Object} self.
     */
    release: function release () {
      this.actionChain.push(['release'])

      return this
    },

    /**
     * move() can only be called
     * if press() has already be called on this element.
     * move() send 'touchmove' event which moves the finger to target element.
     *
     * @method move
     * @param {Object} element {{#crossLink "Marionette.Element"}}{{/crossLink}}
     *                         of the move gesture.
     *
     * @return {Object} self.
     */
    move: function move (element) {
      this.actionChain.push(['move', element.id])

      return this
    },

    /**
     * moveByOffset() can only be called
     * if press() has already be called on this element.
     * moveByOffset() send 'touchmove' event.
     *
     * @method moveByOffset
     *
     * @param {Number} x x-coordinate relative to the top-left corner of
     *                   the target element of the last touch.
     *
     * @param {Number} y y-coordinate relative to the top-left corner of
     *                   the target element of the last touch.
     *
     * @return {Object} self.
     */
    moveByOffset: function moveByOffset (x, y) {
      this.actionChain.push(['moveByOffset', x, y])

      return this
    },

    /**
     * wait() waits for specified time period.
     *
     * @method wait
     * @param {Number} time wait for "time" seconds.
     *
     * @return {Object} self.
     */
    wait: function wait (time) {
      this.actionChain.push(['wait', time])

      return this
    },

    /**
     * cancel() can only be called
     * if press() has already be called on this element.
     * cancel() send 'touchcancel' event to whenever the finger is.
     *
     * @method cancel
     *
     * @return {Object} self.
     */
    cancel: function cancel () {
      this.actionChain.push(['cancel'])

      return this
    },

    /**
     * tap() performs a quick tap on the target.
     * action.tap() is essentially action.press().release().
     *
     * @method tap
     * @param {Object} element {{#crossLink "Marionette.Element"}}{{/crossLink}}
     *                         to press/release on.
     *
     * @param {Number} x optional, x-coordinate relative to the top-left corner
     *                   of the element of the last touch.
     *
     * @param {Number} y optional, y-coordinate relative to the top-left corner
     *                   of the element of the last touch.
     *
     * @return {Object} self.
     */
    tap: function tap (element, x, y) {
      this.actionChain.push(['press', element.id, x, y])
      this.actionChain.push(['release'])

      return this
    },

    /**
     * doubleTap() performs a double
     * {{#crossLink "Marionette.Actions/tap"}}{{/crossLink}} on the element.
     *
     * @method doubleTap
     * @param {Object} element {{#crossLink "Marionette.Element"}}{{/crossLink}}
     *                         to double tap on.
     *
     * @param {Number} x optional, x-coordinate relative to
     * the top-left corner of the element of the last touch.
     *
     * @param {Number} y optional, y-coordinate relative to
     * the top-left corner of the element of the last touch.
     *
     * @return {Object} self.
     */
    doubleTap: function doubleTap (element, x, y) {
      this.actionChain.push(['press', element.id, x, y])
      this.actionChain.push(['release'])
      this.actionChain.push(['press', element.id, x, y])
      this.actionChain.push(['release'])

      return this
    },

    /**
     * flick() sends a sequence of touch events:
     * touchstart, touchmove, touchend.
     * It scrolls the page in any direction
     * within period of time provided(duration).
     *
     * @method flick
     * @param {Object} element {{#crossLink "Marionette.Element"}}{{/crossLink}}
     *                         to double tap on.
     *
     * @param {Number} x1 starting x-coordinates of
     *                    the finger relative to the element.
     *
     * @param {Number} y1 starting y-coordinates of
     *                    the finger relative to the element.
     *
     * @param {Number} x2 ending x-coordinates of
     *                    the finger relative to the element.
     *
     * @param {Number} y2 ending y-coordinates of
     *                    the finger relative to the element.
     *
     * @param {Number} duration optional,
     *                          time needed for the flick gesture for complete.
     *
     * @return {Object} self.
     */
    flick: function flick (element, x1, y1, x2, y2, duration) {
      let time = 0
      let timeIncrement = 10.0

      if (duration === undefined) {
        duration = 200
      }

      if (timeIncrement >= duration) {
        timeIncrement = duration
      }

      let moveX = timeIncrement / duration * (x2 - x1)
      let moveY = timeIncrement / duration * (y2 - y1)

      this.actionChain.push(['press', element.id, x1, y1])
      while (time < duration) {
        time += timeIncrement
        this.actionChain.push(['moveByOffset', moveX, moveY])
        this.actionChain.push(['wait', timeIncrement / 1000])
      }

      this.actionChain.push(['release'])

      return this
    },

    /**
     * Sends 'touchstart',
     * then wait for 'time' seconds, and send 'touchend' eventually.
     * longPress() cannot follow any active touch,
     * i.e. the finger must leave the screen before longPress() gets called.
     *
     * @method longPress
     * @param {Object} element {{#crossLink "Marionette.Element"}}{{/crossLink}}
     *                         of the long press.
     *
     * @param {Number} time the waiting time between touchstart and touchend.
     *
     * @return {Object} self.
     */
    longPress: function longPress (element, time) {
      this.actionChain.push(['press', element.id])
      this.actionChain.push(['wait', time])
      this.actionChain.push(['release'])

      return this
    },

    /**
     * perform() will send the whole action chain built
     * so far to the server side for execution.
     *
     * @method perform
     * @param {Function} callback callback when the perform completes.
     *
     * @return {Object} self.
     */
    perform: function perform (callback) {
      let cmd = {
        name: 'actionChain',
        parameters: {
          chain: this.actionChain,
          nextId: this.currentId,
        },
      }

      this.currentId = this.client._sendCommand(cmd, callback, 'value')
      this.actionChain = []

      return this
    },
  }

  module.exports = Actions
}.apply(
  this,
  (this.Marionette) ?
    [Marionette('actions'), Marionette] :
    [module, require('../../lib/marionette/marionette')],
))
