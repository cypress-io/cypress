/* jshint -W069 */
/* global Marionette */
(function(module, ns) {
  'use strict';

  var ERRORS = Object.freeze({
    'element not accessible': 'ElementNotAccessibleError',
    'element not selectable': 'ElementIsNotSelectable',
    'element not visible': 'ElementNotVisible',
    'invalid cookie domain': 'InvalidCookieDomain',
    'invalid element coordinates': 'InvalidElementCoordinates',
    'invalid element state': 'InvalidElementState',
    'invalid selector': 'InvalidSelector',
    'invalid xpath selector': 'XPathLookupError',
    'javascript error': 'JavaScriptError',
    'no such alert': 'NoAlertOpenError',
    'no such element': 'NoSuchElement',
    'no such frame': 'NoSuchFrame',
    'no such window': 'NoSuchWindow',
    'script timeout': 'ScriptTimeout',
    'stale element reference': 'StaleElementReference',
    'timeout': 'Timeout',
    'unable to set cookie': 'UnableToSetCookie',
    'unexpected alert open': 'UnexpectedAlertOpen',
    'unknown command': 'UnknownCommand',
    'unknown error': 'UnknownError',
    'webdriver error': 'GenericError',
  });

  var CODES = Object.freeze({
    7: ERRORS['no such element'],
    8: ERRORS['no such frame'],
    9: ERRORS['unknown command'],
    10: ERRORS['stale element reference'],
    11: ERRORS['element not visible'],
    12: ERRORS['invalid element state'],
    13: ERRORS['unknown error'],
    15: ERRORS['element not selectable'],
    17: ERRORS['javascript error'],
    19: ERRORS['invalid xpath selector'],
    21: ERRORS['timeout'],
    23: ERRORS['no such window'],
    24: ERRORS['invalid cookie domain'],
    25: ERRORS['unable to set cookie'],
    26: ERRORS['unexpected alert open'],
    27: ERRORS['no such alert'],
    28: ERRORS['script timeout'],
    29: ERRORS['invalid element coordinates'],
    32: ERRORS['invalid selector'],
    56: ERRORS['element not accessible'],
    500: ERRORS['webdriver error']
  });

  var DEFAULT_ERROR = ERRORS['webdriver error'];

  /**
   * Returns an error object given an error object from the Marionette client.
   *
   * Codes are from:
   * http://code.google.com/p/selenium/wiki/JsonWireProtocol#Response_Status_Codes
   *
   * Status strings are from:
   * https://w3c.github.io/webdriver/webdriver-spec.html#handling-errors
   *
   * The expected input for protocol version 2 and higher:
   *
   *     {
   *       error: "javascript error",
   *       message: "Something",
   *       stacktrace: "wentwrong@line",
   *     }
   *
   * The expected input for protocol version 1:
   *
   *     {
   *       message: "Something",
   *       stacktrace: "wentwrong@line",
   *       status: "javascript error",
   *     }
   *
   * @param {Client} client which the error originates from.
   * @param {Object} options for error (see above).
   */
  function MarionetteError(client, options) {
    var error = DEFAULT_ERROR;
    if (options.status in CODES) {
      error = CODES[options.status];
    } else if (options.status in ERRORS) {
      error = ERRORS[options.status];
    } else if (options.error in ERRORS) {
      error = ERRORS[options.error];
    }

    this.client = client;
    this.type = error;
    this.name = this.type;

    this.message = this.name;
    if (options.message)
      this.message += ': ' + options.message;
    this.message += '\nRemote Stack:\n';
    this.message += options.stacktrace || '<none>';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this);
    } else {
      // elsewhere we do horrible try/catch
      try {
        throw new Error();
      } catch (e) {
        this.stack = e.stack;
      }
    }
  }

  MarionetteError.prototype = Object.create(Error.prototype, {
    constructor: {
      value: Error
    }
  });

  MarionetteError.ERRORS = ERRORS;
  MarionetteError.CODES = CODES;
  module.exports = MarionetteError;

}.apply(
  this,
  (this.Marionette) ?
    [Marionette('error'), Marionette] :
    [module, require('./marionette')]
));
