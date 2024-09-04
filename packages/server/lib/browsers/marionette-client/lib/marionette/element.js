/* global Marionette */
/**
@namespace
*/
(function (module, ns) {
  'use strict'

  /**
   * Creates an element reference
   * based on an id and a client instance.
   * You should never need to manually create
   * an instance of element.
   *
   * Use {{#crossLink "Marionette.Client/findElement"}}{{/crossLink}} or
   * {{#crossLink "Marionette.Client/findElements"}}{{/crossLink}} to create
   * instance(s) of this class.
   *
   * @class Marionette.Element
   * @param {String} id id of element.
   * @param {Marionette.Client} client client instance.
   */
  function Element (id, client) {
    this.id = id
    this.client = client
  }

  Element.prototype = {
    /**
     * Sends remote command processes the result.
     * Appends element id to each command.
     *
     * @method _sendCommand
     * @chainable
     * @private
     * @param {Object} command marionette request.
     * @param {Function} callback callback function receives the result of
     *                            response[key] as its first argument.
     * @param {String} key key in the response to pass to callback.
     *
     * @return {Object} self.
     */
    _sendCommand (command, callback, key) {
      if (!command.parameters) {
        command.parameters = {}
      }

      if (typeof command.parameters.id === 'undefined') {
        command.parameters.id = this.id
      }

      let isSync = this.client.isSync
      let result = this.client._sendCommand(command, callback, key)

      if (isSync) {
        return result
      }

      return this
    },

    /**
     * Finds a single child of this element.
     *
     * @method findElement
     * @param {String} query search string.
     * @param {String} method search method.
     * @param {Function} callback element callback.
     * @return {Object} self.
     */
    findElement: function findElement (query, method, callback) {
      let result = this.client.findElement(query, method, this.id, callback)

      if (this.client.isSync) {
        return result
      }

      return this
    },

    /**
     * Finds a all children of this element that match a pattern.
     *
     * @method findElements
     * @param {String} query search string.
     * @param {String} method search method.
     * @param {Function} callback element callback.
     * @return {Array} elements matched the query string.
     */
    findElements: function findElement (query, method, callback) {
      let result = this.client.findElements(query, method, this.id, callback)

      if (this.client.isSync) {
        return result
      }

      return this
    },

    /**
     * Shortcut method to execute
     * a function with this element as first argument.
     * @method scriptWith
     * @param {Function|String} script remote script.
     * @param {Array} [args] optional arguments for script.
     * @param {Function} callback callback when script completes.
     * @return {String|Number} return value of the script.
     */
    scriptWith: function scriptWith (script, args, callback) {
      if (!Array.isArray(args)) {
        callback = args
        args = []
      }

      return this.client.executeScript(script, [this].concat(args), callback)
    },

    /**
     * Checks to see if two elements are equal
     *
     * @method equals
     * @param {Marionette.Element} element element to test.
     * @return {Boolean} true when equal.
     */
    equals: function equals (element) {
      if (!(element instanceof Element)) {
        throw new Error('must pass an element')
      }

      return this.id === element.id
    },

    /**
     * Gets attribute value for element.
     *
     * @method getAttribute
     * @param {String} attr attribtue name.
     * @param {Function} callback gets called with attribute's value.
     * @return {String} the value of the Attribute.
     */
    getAttribute: function getAttribute (attr, callback) {
      let body = {
        name: 'getElementAttribute',
        parameters: {
          name: attr,
        },
      }

      return this._sendCommand(body, callback, 'value')
    },

    /**
     * Sends typing event keys to element.
     *
     *
     * @method sendKeys
     * @param {String|Array} input message to type.
     * @param {Function} callback boolean success.
     * @return {Object} self.
     */
    sendKeys: function sendKeys (input, callback) {
      if (!Array.isArray(input)) {
        input = [input]
      }

      let body = {
        name: 'sendKeysToElement',
        parameters: {
          value: input,
        },
      }

      return this._sendCommand(body, callback)
    },

    /**
     * Clicks element.
     *
     * @method click
     * @param {Function} callback boolean result.
     * @return {Object} self.
     */
    click: function click (callback) {
      let body = { name: 'clickElement' }

      return this._sendCommand(body, callback)
    },

    /**
     * Gets text of element
     *
     * @method text
     * @param {Function} callback text of element.
     * @return {String} text of element.
     */
    text: function text (callback) {
      let body = { name: 'getElementText' }

      return this._sendCommand(body, callback, 'value')
    },

    /**
     * Returns tag name of element.
     *
     * @method tagName
     * @param {Function} callback node style [err, tagName].
     * @return {String} tag name of element.
     */
    tagName: function tagName (callback) {
      let body = { name: 'getElementTagName' }

      return this._sendCommand(body, callback, 'value')
    },

    /**
     * Taps an element at given x and y coordinates.
     * If no offsets are given, it will be tapped at the center of the element.
     *
     * @method tap
     * @param {Number} [x] offset for the tap.
     * @param {Number} [y] offset for the tap.
     * @param {Function} [callback] [Error err]
     * @return {object} self
     */
    tap (x, y, callback) {
      let body = {
        name: 'singleTap',
        parameters: {},
      }

      if (typeof x === 'number') {
        body.parameters.x = x
      }

      if (typeof y === 'number') {
        body.parameters.y = y
      }

      return this._sendCommand(body, callback, 'value')
    },

    /**
     * Clears element.
     *
     * @method clear
     * @param {Function} callback value of element.
     * @return {Object} self.
     */
    clear: function clear (callback) {
      let body = { name: 'clearElement' }

      return this._sendCommand(body, callback)
    },

    /**
     * Checks if element is selected.
     *
     * @method selected
     * @param {Function} callback boolean argument.
     * @return {Object} self.
     */
    selected: function selected (callback) {
      let body = { name: 'isElementSelected' }

      return this._sendCommand(body, callback, 'value')
    },

    /**
     * Checks if element is enabled.
     *
     * @method enabled
     * @param {Function} callback boolean argument.
     * @return {Object} self.
     */
    enabled: function enabled (callback) {
      let body = { name: 'isElementEnabled' }

      return this._sendCommand(body, callback, 'value')
    },

    /**
     * Checks if element is displayed.
     *
     * @method displayed
     * @param {Function} callback boolean argument.
     * @return {Object} self.
     */
    displayed: function displayed (callback) {
      let body = { name: 'isElementDisplayed' }

      return this._sendCommand(body, callback, 'value')
    },

    /**
     * Returns the size of a given element.
     *
     * The returned size will be in the following format:
     *
     *    // returned in callback or result of this call in the sync driver.
     *    {
     *      width: Number,
     *      height: Number
     *    }
     *
     * @method size
     * @param {Function} callback [Error err, Object size].
     * @return {Object} self.
     */
    size: function size (callback) {
      let body = { name: 'getElementRect' }

      return this._sendCommand(
        body, callback, this.client.protocol == 1 ? 'value' : undefined,
      )
    },

    /**
     * Returns the dictionary with x and y location of an element.
     *
     * The returned location will be in the following format:
     *
     *    // returned in callback or result of this call in the sync driver.
     *    {
     *      x: Number,
     *      y: Number
     *    }
     *
     * @method location
     * @param {Function} callback [Error err, Object location].
     * @return {Object} self.
     */
    location: function location (callback) {
      let body = { name: 'getElementRect' }

      return this._sendCommand(
        body, callback, this.client.protocol == 1 ? 'value' : undefined,
      )
    },

    /**
     * Returns the object with:
     *   x and y location of the element
     *   height and width of the element
     *
     * @method rect
     * @param  {Function} callback [Error err, Object rect]
     * @return {Object} self.
     */
    rect: function rect (callback) {
      let body = { name: 'getElementRect' }

      return this._sendCommand(
        body, callback, this.client.protocol == 1 ? 'value' : undefined,
      )
    },

    /**
     * Returns the value of the specified CSS property name.
     *
     * @method cssProperty
     * @param {String} property css property.
     * @param {Function} callback [Error err, String value].
     * @return {Object} self.
     */
    cssProperty: function cssProperty (property, callback) {
      let body = {
        name: 'getElementValueOfCssProperty',
        parameters: {
          propertyName: property,
        },
      }

      return this._sendCommand(body, callback, 'value')
    },
  }

  module.exports = Element
}.apply(
  this,
  (this.Marionette) ?
    [Marionette('element'), Marionette] :
    [module, require('../../lib/marionette/marionette')],
))
