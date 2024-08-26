/* global Marionette */
(function(module, ns) {
  'use strict';

  var Element = ns.require('element');
  var Exception = ns.require('error');
  var message = ns.require('./message');

  var DEFAULT_SCRIPT_TIMEOUT = 60000;
  var DEFAULT_SEARCH_TIMEOUT = 60000;

  var DEFAULT_WAIT_FOR_INTERVAL = 100;
  var DEFAULT_WAIT_FOR_TIMEOUT = 60000;

  var SCOPE_TO_METHOD = Object.freeze({
    scriptTimeout: 'setScriptTimeout',
    searchTimeout: 'setSearchTimeout',
    context: 'setContext'
  });

  var assert = require('assert');

  var key;
  var searchMethods = {
    CLASS: 'class name',
    SELECTOR: 'css selector',
    ID: 'id',
    NAME: 'name',
    LINK_TEXT: 'link text',
    PARTIAL_LINK_TEXT: 'partial link text',
    TAG: 'tag name',
    XPATH: 'xpath'
  };

  function isFunction(value) {
    return typeof(value) === 'function';
  }

  /**
   * Helper to set scope and state on a given client.
   *
   * @private
   * @param {Marionette.Client} context of a client.
   * @param {String} type property of client.
   * @param {Object|String|Number|Null} value of type.
   */
  function setState(context, type, value) {
    context._scope[type] = value;
    context._state[type] = value;
  }

  /**
   * Helper to get state of given client.
   *
   * @private
   * @param {Marionette.Client} context of a client.
   * @param {String} type property of client.
   * @return {Object|String|Number|Null} value of type.
   */
  function getState(context, type) {
    return context._state[type];
  }

  /**
   * Initializes client.You must create and initialize
   * a driver and pass it into the client before using the client itself.
   *
   * Marionette JS Client supports both async and sync modes... The
   * documentation reflects the sync modes but you can also pass a callback into
   * most calls for the sync version. If you attempt to use callbacks with a
   * sync driver they will be called but run synchronously.
   *
   *     // all drivers conform to this api
   *
   *     // var Marionette = require('marionette-client');
   *     var driver = new Marionette.Drivers.Tcp({});
   *     var client;
   *
   *     driver.connect(function(err) {
   *       if (err) {
   *         // handle error case...
   *       }
   *
   *       client = new Marionette.Client(driver, {
   *           // optional default callback can be used to implement
   *           // a generator interface or other non-callback based api.
   *          defaultCallback: function(err, result) {
   *            console.log('CALLBACK GOT:', err, result);
   *          }
   *       });
   *
   *       // by default commands run in a queue.
   *       // assuming there is not a fatal error each command
   *       // will execute sequentially.
   *       client.startSession(function () {
   *         client.goUrl('http://google.com')
   *           .executeScript(function() {
   *             alert(document.title);
   *           })
   *           .deleteSession();
   *       });
   *     });
   *
   *    // alternatively there is a lazy api which test runners can use.
   *
   *    var client = new Client(null, { lazy: true });
   *
   *    // accepts same arguments as normal constructor calls.
   *    client.resetWithDriver(driver, {});
   *
   *
   * @class Marionette.Client
   * @constructor
   * @param {Marionette.Drivers.Abstract} driver fully initialized client.
   * @param {Object} options options for driver.
   */
  function Client(driver, options) {
    // when the driver is lazily added skip
    if (!driver && options && options.lazy)
      return;

    this.resetWithDriver(driver, options);
  }

  Client.prototype = {

    Element: Element,

    /**
     * Constant for chrome context.
     *
     * @type {String}
     * @property CHROME
     */
    CHROME: 'chrome',

    /**
     * Constant for content context.
     *
     * @type {String}
     * @property CONTENT
     */
    CONTENT: 'content',

    /**
     * Object of hooks.
     *
     *    {
     *      hookName: [hook1, hook2]
     *    }
     *
     * @type {Object}
     * @property _hooks
     * @private
     */
    _hooks: {},

    /**
     * The current scope of this client instance. Used with _state.
     *
     *   // Example
     *   {
     *      scriptTimeout: 500,
     *      searchTimeout: 6000,
     *      context: 'content',
     *      window: 'window_id',
     *      frame: 'frameId'
     *   }
     *
     * @type {Object}
     */
    _scope: null,

    /**
     * The current state of the client.
     *
     *    // Example
     *    {
     *      scriptTimeout: 500,
     *      searchTimeout: 6000,
     *      context: 'content',
     *      window: 'window_id',
     *      frame: 'frameId'
     *    }
     *
     * @private
     * @type {Object}
     */
    _state: null,

    /**
     * The current Marionette protocol level.
     *
     * When a new connection is established, the client will assume
     * the protocol version that the passed driver connection got upon
     * establishing a connection with the remote end.
     *
     * Defaults to protocol version 1.
     *
     * @property protocol
     * @type Number
     */
    protocol: 1,

    /**
     * Actor ID for instance.
     *
     * @deprecated
     * @property actor
     * @type String
     */
    actor: null,

    /**
     * Session id for instance.
     *
     * @property sessionId
     * @type String
     */
    sessionId: null,

    // _state getters

    /**
     * @return {String} the current context.
     */
    get context() {
      return getState(this, 'context');
    },

    /**
     * @return {String|Marionette.Element} frame currently focused.
     */
    get frame() {
      return getState(this, 'frame');
    },

    /**
     * @return {String|Marionette.Element}
     */
    get window() {
      return getState(this, 'window');
    },

    /**
     * @return {Number} current scriptTimeout.
     */
    get scriptTimeout() {
      return getState(this, 'scriptTimeout');
    },

    /**
     * @return {Number} current search timeout.
     */
    get searchTimeout() {
      return getState(this, 'searchTimeout');
    },

    /**
     * Resets the internal state of the client.
     *
     * This is only safe to do when the client has no session.
     *
     * @param {Marionette.Drivers.Abstract} driver fully initialized driver.
     * @param {Object} options options for driver.
     */
    resetWithDriver: function(driver, options) {
      if (typeof(options) === 'undefined') {
        options = {};
      }
      this.driver = driver;
      this.defaultCallback =
        options.defaultCallback || driver.defaultCallback || function() {};

      if (driver.isSync) {
        this.isSync = driver.isSync;
      }

      // create hooks
      this._hooks = {};

      // create the initial state for this client
      this._state = {
        context: 'content',
        scriptTimeout: options.scriptTimeout || DEFAULT_SCRIPT_TIMEOUT,
        searchTimeout: options.searchTimeout || DEFAULT_SEARCH_TIMEOUT
      };

      // give the root client a scope.
      this._scope = {};
      for (var key in this._state) {
        this._scope[key] = this._state[key];
      }

      // assume protocol level from driver, if set
      this.protocol = this.driver.marionetteProtocol || this.protocol;
    },

    /**
     * Adds a plugin to the client instance.
     *
     *     // add imaginary forms plugin
     *     client.plugin('forms', moduleForForms, { options: true });
     *     client.forms.fill();
     *
     *     // tie into common plugin interface without exposing a new api.
     *     client.plugin(null, module, {});
     *
     *     // chaining
     *     client
     *       .plugin('forms', require('form-module'))
     *       .plguin('apps', require('apps-module'))
     *       .plugin('other', require('...'));
     *
     *     client.forms.fill(...);
     *     client.apps.launch(...);
     *
     *
     * @method plugin
     * @param {String|Null} name to expose plugin on in the client.
     * @param {Function|Object} plugin function/module.
     * @param {Object} [optional] options to pass to plugin.
     */
    plugin: function(name, plugin, options) {
      var invokedMethod;

      // don't allow overriding existing names
      if (this[name])
        throw new Error(name + ' - is already reserved on client');

      // allow both plugin.setup and plugin to be the invoked method.
      invokedMethod =
        typeof plugin.setup === 'function' ? plugin.setup : plugin;

      if (typeof invokedMethod !== 'function')
        throw new Error('plugin must be a method or have a .setup method');

      var result = invokedMethod(this, options);

      // assign the plugin to a property if there is a result of invoking the
      // plugin.
      if (name && result)
        this[name] = result;


      return this;
    },

    /**
     * Run all hooks of a given type. Hooks may be added as the result of
     * running other hooks which could potentially result in an infinite loop
     * without stack overflow...
     *
     *
     *     this.runHook('startSession', function(err) {
     *       // do something with error if there is one.
     *     });
     *
     *
     * @protected
     * @method runHook
     * @param {String} type of hook to run.
     * @param {Function} callback to run once hooks are done.
     */
    runHook: function(type, callback) {
      // call into execute hook to prevent stack overflow
      function handleHookResponse(err) {
        if (err) return callback(err);

        // next hook
        process.nextTick(executeHook);
      }

      var executeHook = function executeHook() {
        // find the next hook
        var hooks = this._hooks[type];

        // no hooks of this type- continue
        if (!hooks) {
          // breaks sync driver without this invocation
          if (this.isSync) {
            return callback();
          }
          return process.nextTick(callback);
        }

        var hook = hooks.shift();

        // last hook of this type fire callback sync so we can better test
        // interactions after (more deterministic).
        if (!hook)
          return callback();

        // pass handleHookResponse which the hook must call to continue the hook
        // chain.
        hook.call(this, handleHookResponse);
      }.bind(this);

      // start going through all hooks
      executeHook();
    },

    /**
     * Adds a hook to the stack. Hooks run in serial order until all hooks
     * complete. Execution of hooks halts on first error.
     *
     *
     *    client.addHook('sessionStart', function(done) {
     *      // this is the client
     *      this.executeScript(function() {}, done);
     *    });
     *
     *
     * @method addHook
     * @chainable
     * @param {String} type name of hook.
     * @param {Function} handler for hook must take a single argument
     *  (see above).
     */
    addHook: function(type, handler) {
      if (!this._hooks[type])
        this._hooks[type] = [];

      this._hooks[type].push(handler);

      return this;
    },

    /**
     * This function will be invoked whenever the remote throws a
     * ScriptTimeout error. The motivation is that client consumers
     * can use this opportunity to log some useful state for debugging.
     * By default this function logs screenshot image data.
     *
     * @type {Function}
     */
    onScriptTimeout: function() {
      this.switchToFrame();
      console.log('Screenshot: ' +
                  'data:image/png;base64,' +
                  this.screenshot());
    },

    /**
     * Send given command to the server with optional callback fired
     * on completion.
     *
     * Adds additional information like actor and session ID to command
     * if not present and using the deprecated version 1 of the Marionette
     * protocol.
     *
     * @method send
     * @chainable
     * @param {Object} body to be sent over the wire.
     * @param {Function} cb executed when response is sent.
     */
    send: function send(body, cb) {
      // first do scoping updates
      if (this._scope && this._bypassScopeChecks !== true) {
        // calling the methods may cause an infinite loop so make sure
        // we don't hit this code path again inside of the loop.
        this._bypassScopeChecks = true;
        for (var key in this._scope) {
          // !important otherwise throws infinite loop
          if (this._state[key] !== this._scope[key]) {
            this[SCOPE_TO_METHOD[key]](this._scope[key]);
          }
        }
        // undo really dirty hack
        this._bypassScopeChecks = false;
      }

      var data;
      if (this.protocol == 1) {
        body.to = body.to || this.actor || 'root';
        if (this.sessionId) {
          body.session = body.session || this.sessionId;
        }
        data = body;
      } else if (this.protocol >= 3) {
        data = new message.Command(body);
      } else {
        data = body;
      }

      if (!cb && this.defaultCallback) {
        cb = this.defaultCallback();
      }

      var driverSent;
      try {
        driverSent = this.driver.send(data, cb);
        if (driverSent instanceof Promise){
          driverSent.then(
            function onFulfill(res){
              cb(res);
            }
          );
        }
      } catch (e) {
        // !!! HACK HACK HACK !!!
        // single retry when not connected. this should never happen, but
        // currently it does. so here it is.
        if (e && e.message && e.message.indexOf('not connected') !== -1) {
          console.info('Will attempt re-connect and re-send *ONCE*');
          this.driver.connect(function() {
            this.driver.send(data, cb);
          }.bind(this));
        } else {
          // Unhandled.
          throw e;
        }
      }

      if (this.isSync) {
        return driverSent;
      }

      return this;
    },

    _handleCallback: function() {
      var args = Array.prototype.slice.call(arguments),
          callback = args.shift();

      if (!callback) {
        callback = this.defaultCallback;
      }

      assert(typeof callback == 'function',
          'expected function, got ' + callback);

      // Convert first argument to an error it is possible for this to already
      // be an exception so skip conversion if that is the case...
      if (args[0] && !(args[0] instanceof Exception)) {
        var err = new Exception(this, args[0]);
        if (err.type === 'ScriptTimeout') {
          this.onScriptTimeout && this.onScriptTimeout(err);
        }

        args[0] = err;
      }

      return callback.apply(this, args);
    },

    /**
     * Sends request and formats response.
     *
     * @private
     * @method _sendCommand
     * @chainable
     * @param {Object} body The body of the Marionette command
     * @param {Object} cb wrapped callback
     * @param {String} key optional key in the response to pass
     *     unto the callback, will return the full object if undefined
     */
    _sendCommand: function(body, cb, key) {
      assert(!!this.driver, body.name + ' called on client w/o driver!');
      try {
        return this.send(body, function(data) {
          var res, err;

          if ('error' in data) {
            if (this.protocol == 1) {
              err = data.error;
            } else {
              err = data;
            }
          } else if (key) {
            res = data[key];
          } else {
            res = data;
          }

          if (res) {
            res = this._unmarshalWebElement(res);
          }

          return this._handleCallback(cb, err, res);
        }.bind(this));
      } catch (e) {
        // Attach current client to any host related errors too...
        e.client = this;
        throw e;
      }
    },

    /**
     * Finds the actor for this instance.
     *
     * @deprecated
     * @private
     * @method _getActorId
     * @param {Function} callback executed when response is sent
     */
    _getActorId: function(cb) {
      var body = {name: 'getMarionetteID'};
      return this._sendCommand(body, function(err, actor) {
        this.actor = actor;
        if (cb) {
          cb(err, actor);
        }
      }.bind(this), 'id');
    },

    /**
     * Starts a new remote session with the old Marionette protocol.
     *
     * @deprecated
     * @private
     * @method _newSession
     * @param {Function} optional callback
     * @param {Object} desired capabilities
     */
    _newSession: function(callback, desiredCapabilities) {
      var newSession = function(data) {
        this.sessionId = data.value;
        var err;
        if ('error' in data) {
          if (typeof data.error == 'object') {
            err = data.error;
          } else {
            err = data;
          }
        }
        return this._handleCallback(callback, err, data);
      }.bind(this);
      var body = {
        name: 'newSession',
        parameters: {capabilities: desiredCapabilities},
      };
      return this.send(body, newSession);
    },

    /**
     * Creates a client which has a fixed window, frame, scriptTimeout and
     * searchTimeout.
     *
     *     client.setSearchTimeout(1000).setContext('content');
     *
     *     var timeout = client.scope({ searchTimeout: 250 });
     *     var chrome = client.scope({ context: 'chrome' });
     *
     *     // executed with 250 timeout
     *     timeout.findElement('...');
     *
     *     // executes in chrome context.
     *     chrome.executeScript();
     *
     *     // executed in content with search timeout of 1000
     *     client.findElement('...');
     *
     *
     * @method scope
     * @param {Object} options for scopped client.
     * @return {Marionette.Client} scoped client instance.
     */
    scope: function(options) {
      var scopeOptions = {};
      for (var key in this._scope) {
        scopeOptions[key] = this._scope[key];
      }

      // copy the given options
      for (key in options) {
        var value = options[key];
        scopeOptions[key] = value;
      }

      // create child
      var scope = Object.create(this);

      // assign the new scoping
      scope._scope = scopeOptions;

      return scope;
    },

    /**
     * Utility for waiting for a success condition to be met.
     *
     *     // sync style
     *     client.waitFor(function() {
     *       return element.displayed();
     *     });
     *
     *     // async style
     *     client.waitFor(function(done) {
     *       element.displayed(done);
     *     });
     *
     *
     *    Options:
     *      * (Number) interval: time between running test
     *      * (Number) timeout: maximum wallclock time before failing test.
     *
     * @method waitFor
     * @param {Function} test to execute.
     * @param {Object} [options] for timeout see above.
     * @param {Number} [options.interval] time between running test.
     * @param {Number} [options.timeout]
     *  maximum wallclock time before failing test.
     * @param {Function} [callback] optional callback.
     */
    waitFor: function(test, options, callback) {
      if (typeof(options) === 'function') {
        callback = options;
        options = null;
      }

      // setup options
      options = options || {};

      var sync = this.isSync;

      // must handle default callback case for sync code
      callback = callback || this.defaultCallback;

      // wallclock timer
      var timeout = Date.now() + (options.timeout || DEFAULT_WAIT_FOR_TIMEOUT);

      // interval between test being fired.
      var interval = options.interval || DEFAULT_WAIT_FOR_INTERVAL;

      var modifiedTest = test;
      if (test.length === 0) {
        // Give me a callback!
        modifiedTest = function(done) {
          done(null, test());
        };
      }

      return (sync ? this.waitForSync : this.waitForAsync).call(
        this, modifiedTest, callback, interval, timeout);
    },

    /**
     * Poll some boolean function until it returns true synchronously.
     *
     * @param {Function} test some function that returns a boolean.
     * @param {Function} callback function to call once our test passes or
     *     we time out.
     * @param {number} interval how often to poll in ms.
     * @param {number} timeout time at which we fail in ms.
     */
    waitForSync: function(test, callback, interval, timeout) {
      var err, result;
      var testFunc = function(_err, _result) {
        err = _err;
        result = _result;
      };
      var wait = function(ms) {
        setTimeout(marionetteScriptFinished, ms);
      };

      while (Date.now() < timeout) {
        if (err || result) {
          return callback(err);
        }

        test(testFunc);

        this.executeAsyncScript(wait, [interval]);
      }

      this.onScriptTimeout && this.onScriptTimeout();
      callback(new Error('timeout exceeded!'));
    },

    /**
     * Poll some boolean function until it returns true asynchronously.
     *
     * @param {Function} test some function that returns a boolean.
     * @param {Function} callback function to call once our test passes or
     *     we time out.
     * @param {number} interval how often to poll in ms.
     * @param {number} timeout time at which we fail in ms.
     */
    waitForAsync: function(test, callback, interval, timeout) {
      if (Date.now() >= timeout) {
        this.onScriptTimeout && this.onScriptTimeout();
        return callback(new Error('timeout exceeded'));
      }

      test(function(err, result) {
        if (err || result) {
          return callback(err, result);
        }

        var next = this.waitForAsync.bind(
          this,
          test,
          callback,
          interval,
          timeout
        );

        setTimeout(next, interval);
      }.bind(this));
    },

    /**
     * Starts a new session with Marionette.
     *
     * @method startSession
     * @param {Function} callback executed when session is started.
     * @param {Object} desired capabilities
     */
    startSession: function startSession(callback, desiredCapabilities) {
      callback = callback || this.defaultCallback;
      desiredCapabilities = desiredCapabilities || {};

      if (this.protocol == 1) {
        var runHook = function(err) {
          if (err) {
            return callback(err);
          }
          this.runHook('startSession', callback);
        };

        return this._getActorId(function() {
          // actor will not be set if we send the command then
          this._newSession(runHook, desiredCapabilities);
        }.bind(this));
      } else {
        var newSession = function(err, res) {
          if (err) {
            callback(err);
          } else {
            this.sessionId = res.sessionId;
            this.capabilities = res.capabilities;
            this.runHook('startSession', function() { callback(err, res); });
          }
        }.bind(this);

        var body = {
          name: 'newSession',
          parameters: {capabilities: desiredCapabilities},
        };
        return this._sendCommand(body, newSession);
      }
    },

    /**
     * Destroys current session.
     *
     * @chainable
     * @method deleteSession
     * @param {Function} callback executed when session is destroyed.
     */
    deleteSession: function destroySession(callback) {
      var cmd = { name: 'deleteSession' };

      var closeDriver = function closeDriver() {
        this._sendCommand(cmd, function(err) {
          // clear state of the past session
          this.sessionId = null;
          this.capabilities = null;
          this.actor = null;

          this.driver.close();
          this._handleCallback(callback, err);
        }.bind(this));
      }.bind(this);

      this.runHook('deleteSession', closeDriver);

      return this;
    },

    /**
     *  Returns the capabilities of the current session.
     *
     * @method sessionCapabilities
     * @param {Function} [callback]
     *  executed with capabilities of current session.
     * @return {Object} A JSON representing capabilities.
     */
     sessionCapabilities: function sessionCapabilities(callback) {
       var cmd = {name: 'getSessionCapabilities'};
       return this._sendCommand(
           cmd, callback, this.protocol == 1 ? 'value' : 'capabilities');
     },

    /**
     * Callback will receive the id of the current window.
     *
     * @chainable
     * @method getWindow
     * @param {Function} [callback] executed with id of current window.
     * @return {Object} self.
     */
    getWindow: function getWindow(callback) {
      var cmd = {name: 'getWindow'};
      return this._sendCommand(cmd, callback, 'value');
    },

    /**
     * Callback will receive an array of window ids.
     *
     * @method getWindows
     * @chainable
     * @param {Function} [callback] executes with an array of ids.
     */
    getWindows: function getWindows(callback) {
      var cmd = {name: 'getWindows'};
      return this._sendCommand(
          cmd, callback, this.protocol == 1 ? 'value' : undefined);
    },

    /**
     * Switches context of marionette to specific window.
     *
     *
     * @method switchToWindow
     * @chainable
     * @param {String} id window id you can find these with getWindow(s).
     * @param {Function} callback called with boolean.
     */
    switchToWindow: function switchToWindow(id, callback) {
      var cmd = {name: 'switchToWindow', parameters: {value: id}};
      return this._sendCommand(cmd, callback);
    },

    /**
     * Returns the type of current window.
     *
     * @method getWindowType
     * @param {Function} [callback] executes with window type.
     * @return {Object} self.
     */
     getWindowType: function getWindowType(callback) {
       var cmd = {name: 'getWindowType'};
       return this._sendCommand(cmd, callback, 'value');
     },

    /**
     * Imports a script into the marionette
     * context for the duration of the session.
     *
     * Good for prototyping new marionette commands.
     *
     * @method importScript
     * @chainable
     * @param {String} script javascript string blob.
     * @param {Function} callback called with boolean.
     */
    importScript: function(script, callback) {
      var cmd = {name: 'importScript', parameters: {script: script}};
      return this._sendCommand(cmd, callback);
    },

    /**
     * Switches context of marionette to specific iframe.
     *
     *
     * @method switchToFrame
     * @chainable
     * @param {String|Marionette.Element} [id] iframe id or element.
     *     If you call this function without an argument,
     *     it will switch to the top-level frame.
     * @param {Object} [options] options to be mixed in the command parameters.
     * @param {Boolean} [options.focus] Should switch the focus to the frame.
     * @param {Function} callback called with boolean.
     *
     */
    switchToFrame: function switchToFrame(id, options, callback) {
      if (typeof(id) === 'function') {
        callback = id;
        id = null;
        options = null;
      } else if (typeof(options) === 'function') {
        callback = options;
        options = null;
      }

      var cmd = { name: 'switchToFrame', parameters: {} };

      if (id instanceof this.Element) {
        cmd.parameters.element = id.id;
      } else if (
        id !== null &&
        typeof(id) === 'object' &&
        id.ELEMENT
      ) {
        cmd.parameters.element = id.ELEMENT;
      } else if (id) {
        cmd.parameters.id = id;
      }

      if (options) {
        for (var key in options) {
          cmd.parameters[key] = options[key];
        }
      }

      return this._sendCommand(cmd, callback);
    },

    /**
     * Switch the current context to the specified host's Shadow DOM.
     * Subsequent commands will operate in the context of the specified Shadow
     * DOM, if applicable.
     *
     * @param {Marionette.Element} [host] A reference to the host element
     * containing Shadow DOM. This can be an Marionette.Element. If you call
     * switchToShadowRoot without an argument, it will switch to the
     * parent Shadow DOM or the top-level frame.
     * @param {Function} callback called with boolean.
     */
    switchToShadowRoot: function switchToShadowRoot(host, callback) {
      if (typeof(host) === 'function') {
        callback = host;
        host = null;
      }

      var cmd = { name: 'switchToShadowRoot', parameters: {} };

      if (host instanceof this.Element) {
        cmd.parameters.id = host.id;
      }

      return this._sendCommand(cmd, callback);
    },

    /**
     * Switches context of window. The current context can be found with
     * .context.
     *
     *    // default context
     *    client.context === 'content';
     *
     *    client.setContext('chrome', function() {
     *      // .. wait for switch
     *    });
     *
     *    client.context === 'chrome';
     *
     *
     * @method setContext
     * @chainable
     * @param {String} context either: 'chrome' or 'content'.
     * @param {Function} callback receives boolean.
     */
    setContext: function setContext(context, callback) {
      if (context !== this.CHROME && context !== this.CONTENT) {
        throw new Error('content type must be "chrome" or "content"');
      }

      setState(this, 'context', context);
      var cmd = {name: 'setContext', parameters: {value: context}};
      return this._sendCommand(cmd, callback);
    },

    /**
     * Sets the script timeout
     *
     * @method setScriptTimeout
     * @chainable
     * @param {Numeric} timeout max time in ms.
     * @param {Function} callback executed with boolean status.
     * @return {Object} self.
     */
    setScriptTimeout: function setScriptTimeout(timeout, callback) {
      var cmd = {name: 'setScriptTimeout', parameters: {ms: timeout}};
      setState(this, 'scriptTimeout', timeout);
      this.driver.setScriptTimeout(timeout);
      return this._sendCommand(cmd, callback);
    },

    /**
     * Sets a timeout for the find methods.
     *
     * When searching for an element using either Marionette.findElement or
     * Marionette.findElements, the method will continue trying to locate the
     * element for up to timeout ms.
     *
     * This can be useful if, for example, the element you’re looking for might
     * not exist immediately, because it belongs to a page which is currently
     * being loaded.
     *
     * @method setSearchTimeout
     * @chainable
     * @param {Numeric} timeout max time in ms.
     * @param {Function} callback executed with boolean status.
     * @return {Object} self.
     */
    setSearchTimeout: function setSearchTimeout(timeout, callback) {
      var cmd = { name: 'setSearchTimeout', parameters:{ ms: timeout }};
      setState(this, 'searchTimeout', timeout);
      return this._sendCommand(cmd, callback);
    },

    /**
     * Returns the title of current window.
     *
     * @method title
     * @param {Function} [callback] optional receives title.
     * @return {Object} self.
     */
     title: function title(callback) {
       var cmd = {name: 'getTitle'};
       return this._sendCommand(cmd, callback, 'value');
     },

    /**
     * Gets url location for device.
     *
     * @method getUrl
     * @chainable
     * @param {Function} callback receives url.
     */
    getUrl: function getUrl(callback) {
      var cmd = {name: 'getUrl'};
      return this._sendCommand(cmd, callback, 'value');
    },

    /**
     * Refreshes current window on device.
     *
     * @method refresh
     * @param {Function} callback boolean success.
     * @return {Object} self.
     */
    refresh: function refresh(callback) {
      var cmd = {name: 'refresh'};
      return this._sendCommand(cmd, callback);
    },

    /**
     * Drives browser to a url.
     *
     * @method goUrl
     * @chainable
     * @param {String} url location.
     * @param {Function} callback executes when finished driving browser to url.
     */
    goUrl: function goUrl(url, callback) {
      var cmd = {name: 'goUrl', parameters: {url: url}};
      return this._sendCommand(cmd, callback);
    },

    /**
     * Drives window forward.
     *
     *
     * @method goForward
     * @chainable
     * @param {Function} callback receives boolean.
     */
    goForward: function goForward(callback) {
      var cmd = {name: 'goForward'};
      return this._sendCommand(cmd, callback);
    },

    /**
     * Drives window back.
     *
     * @method goBack
     * @chainable
     * @param {Function} callback receives boolean.
     */
    goBack: function goBack(callback) {
      var cmd = {name: 'goBack'};
      return this._sendCommand(cmd, callback);
    },

    /**
     * Logs a message on marionette server.
     *
     *
     * @method log
     * @chainable
     * @param {String} message log message.
     * @param {String} level arbitrary log level.
     * @param {Function} callback receives boolean.
     * @return {Object} self.
     */
    log: function log(msg, level, callback) {
      var cmd = {name: 'log', parameters: {level: level, value: msg}};
      return this._sendCommand(cmd, callback);
    },

    /**
     * Retrieves all logs on the marionette server.
     * The response from marionette is an array of arrays.
     *
     *     device.getLogs(function(err, logs){
     *       //logs => [
     *         [
     *           'msg',
     *           'level',
     *           'Fri Apr 27 2012 11:00:32 GMT-0700 (PDT)'
     *         ]
     *       ]
     *     });
     *
     *
     * @method getLogs
     * @chainable
     * @param {Function} callback receive an array of logs.
     */
    getLogs: function getLogs(callback) {
      var cmd = {name: 'getLogs'};
      return this._sendCommand(
          cmd, callback, this.protocol == 1 ? 'value' : undefined);
    },

    /**
     * Returns a string representation of the DOM in current page.
     *
     * @method pageSource
     * @param {Function} [callback] optional receives the page source.
     * @return {Object} self.
     */
     pageSource: function pageSource(callback) {
       var cmd = {name: 'getPageSource'};
       return this._sendCommand(cmd, callback, 'value');
     },

    /**
     * Creates a base64-encoded screenshot of the element, or the current frame
     * if no element is specified.
     *
     *     client.screenshot({
     *       element: elementToScreenshot
     *     });
     *
     *    Options:
     *      * (Element) element: The element to take a screenshot of. If
     *        unspecified, will take a screenshot of the current frame
     *      * (Array) highlights: A list of element objects to draw a red box
     *        around in the returned screenshot.
     *
     * @method screenshot
     * @param {Object} [options] (see above)
     * @chainable
     * @param {Function} callback
     */
    screenshot: function screenshot(options, callback) {
      var cmd = { name: 'screenShot', parameters: {}};

      if (typeof options === 'function') {
        callback = options;
        options = null;
      }

      if (options) {
        if (options.element) {
          cmd.parameters.id = options.element.id;
        }
        if (options.highlights) {
          cmd.parameters.highlights = options.highlights.map(function(elem) {
            return elem.id;
          });
        }
      }

      return this._sendCommand(cmd, callback, 'value');
    },

    /**
     * Executes a remote script will block.
     * Script is *not* wrapped in a function.
     *
     * @method executeJsScript
     * @chainable
     * @param {String} script script to run.
     * @param {Array} [args] optional args for script.
     * @param {Array} [timeout] optional args for timeout.
     * @param {Function} callback will receive result of the return \
     *                            call in the script if there is one.
     * @return {Object} self.
     */
    executeJsScript: function executeJsScript(script, args, timeout, callback) {
      if (typeof timeout === 'function') {
        callback = timeout;
        timeout = null;
      }
      if (typeof args === 'function') {
        callback = args;
        args = null;
      }

      timeout = (typeof(timeout) === 'boolean') ? timeout : true;

      // the simpletest sandbox exposes
      // necessary assertion functions in the global scope
      return this._executeScript({
        name: 'executeJSScript',
        parameters: {
          script: script,
          timeout: timeout,
          args: args,
          sandbox: 'simpletest',
        }
      }, callback || this.defaultCallback);
    },

    /**
     * Executes a remote script will block. Script is wrapped in a function.
     *
     *     // its is very important to remember that the contents of this
     *     // method are "stringified" (Function#toString) and sent over the
     *     // wire to execute on the device. So things like scope will not be
     *     // the same. If you need to pass other information in arguments
     *     // option should be used.
     *
     *     // assume that this element is the result of findElement
     *     var element;
     *     var config = {
     *        event: 'magicCustomEvent',
     *        detail: { foo: true  }
     *     };
     *
     *     var remoteArgs = [element, details];
     *
     *     // unlike other callbacks this one will execute _on device_
     *     function remoteFn(element, details) {
     *        // element in this context is a real dom element now.
     *        var event = document.createEvent('CustomEvent');
     *        event.initCustomEvent(config.event, true, true, event.detail);
     *        element.dispatchEvent(event);
     *
     *        return { success: true };
     *     }
     *
     *     client.executeJsScript(remoteFn, remoteArgs, function(err, value) {
     *       // value => { success: true }
     *     });
     *
     *
     * @method executeScript
     * @chainable

     * @param {string} script
     *     The script to evaluate.
     * @param {Array.<?>} args
     *     Optional args for script that will  be available as
     *     {@code arguments} in the scope the script runs in.
     * @param {function} callback
     *     The callback will receive result of the return call in the
     *     script if there is one.
     * @param {string} sandbox
     *     Name of the sandbox to evaluate the script in.  If undefined,
     *     the default sandbox will be used.  If you specify "system",
     *     the sandbox will have the system principal which gives
     *     elevated privileges.
     *
     * @return {Marionette}
     *     Reference to self.
     */
    executeScript: function executeScript(script, args, callback, sandbox) {
      if (typeof args === 'function') {
        callback = args;
        args = null;
      }
      if (typeof sandbox === 'undefined') {
        sandbox = 'default';
      }

      return this._executeScript({
        name: 'executeScript',
        parameters: {
          script: script,
          args: args,
          sandbox: sandbox,
        }
      }, callback || this.defaultCallback);
    },

    /**
     * Script is wrapped in a function and will be executed asynchronously.
     *
     * NOTE: that setScriptTimeout _must_ be set prior to using this method
     *       as the timeout defaults to zero.
     *
     *
     *     function remote () {
     *       window.addEventListener('someevent', function() {
     *         // special method to notify that async script is complete.
     *         marionetteScriptFinished({ fromRemote: true })
     *       });
     *     }
     *
     *     client.executeAsyncScript(remote, function(err, value) {
     *       // value === { fromRemote: true }
     *     });
     *
     *
     * @method executeAsyncScript
     * @chainable
     *
     * @param {string} script
     *     The script to evaluate.
     * @param {Array.<?>} args
     *     Optional args for script that will  be available as
     *     {@code arguments} in the scope the script runs in.
     * @param {function} callback
     *     The callback will receive result of the return call in the
     *     script if there is one.
     * @param {string} sandbox
     *     Name of the sandbox to evaluate the script in.  If undefined,
     *     the default sandbox will be used.  If you specify "system",
     *     the sandbox will have the system principal which gives
     *     elevated privileges.
     *
     * @return {Marionette}
     *     Reference to self.
     */
    executeAsyncScript: function(script, args, callback, sandbox) {
      if (typeof args === 'function') {
        callback = args;
        args = null;
      }
      if (typeof sandbox === 'undefined') {
        sandbox = 'default';
      }

      return this._executeScript({
        name: 'executeAsyncScript',
        parameters: {
          script: script,
          args: args,
          sandbox: sandbox,
        }
      }, callback || this.defaultCallback);
    },

    /**
     * Finds element.
     *
     * @method _findElement
     * @private
     * @param {String} type type of command to send like 'findElement'.
     * @param {String} query search query.
     * @param {String} method search method.
     * @param {String} elementId id of element to search within.
     * @param {Function} callback executes with element uuid(s).
     */
    _findElement: function _findElement(type, query, method, id, callback) {
      if (isFunction(id)) {
        callback = id;
        id = undefined;
      }

      if (isFunction(method)) {
        callback = method;
        method = undefined;
      }

      callback = callback || this.defaultCallback;

      var cmd = {
        name: type || 'findElement',
        parameters: {
          value: query,
          using: method || 'css selector'
        }
      };

      // only pass element when id is given
      if (id) {
        cmd.parameters.element = id;
      }

      if (this.searchMethods.indexOf(cmd.parameters.using) < 0) {
        throw new Error(
          'invalid option for using: \'' + cmd.parameters.using + '\' ' +
          'use one of : ' + this.searchMethods.join(', ')
        );
      }

      var processElements = function(err, res) {
        var rv;
        if (res instanceof Array) {
           rv = [];
           res.forEach(function(el) {
             rv.push(this._unmarshalWebElement(el));
           }, this);
         } else {
           rv = this._unmarshalWebElement(res);
         }
         return this._handleCallback(callback, err, rv);
      }.bind(this);

      // always look for "value" key for protocol 1,
      // but only for single element searches under protocol 2
      var extract;
      if (this.protocol == 1 || type == 'findElement') {
        extract = 'value';
      }

      return this._sendCommand(cmd, processElements, extract);
    },

    /**
     * Attempts to find a dom element (via css selector, xpath, etc...)
     * "elements" returned are instances of
     * {{#crossLink "Marionette.Element"}}{{/crossLink}}
     *
     *
     *     // with default options
     *     client.findElement('#css-selector', function(err, element) {
     *        if (err) {
     *          // handle case where element was not found
     *        }
     *
     *        // see element interface for all methods, etc..
     *        element.click(function() {
     *
     *        });
     *     });
     *
     * @method findElement
     * @chainable
     * @param {String} query search query.
     * @param {String} method search method.
     * @param {String} elementId id of element to search within.
     * @param {Function} callback executes with element uuid.
     */
    findElement: function findElement() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('findElement');
      return this._findElement.apply(this, args);
    },

    /**
     * Finds multiple elements in the dom. This method has the same
     * api signature as {{#crossLink "findElement"}}{{/crossLink}} the
     * only difference is where findElement returns a single element
     * this method will return an array of elements in the callback.
     *
     *
     *     // find all links in the document
     *     client.findElements('a[href]', function(err, element) {
     *     });
     *
     *
     * @method findElements
     * @chainable
     * @param {String} query search query.
     * @param {String} method search method.
     * @param {String} elementId id of element to search within.
     * @param {Function} callback executes with an array of element uuids.
     */
    findElements: function findElements() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('findElements');
      return this._findElement.apply(this, args);
    },

    /**
     * Converts an function into a string
     * that can be sent to marionette.
     *
     * @private
     * @method _convertFunction
     * @param {Function|String} fn function to call on the server.
     * @return {String} function string.
     */
    _convertFunction: function _convertFunction(fn) {
      if (typeof(fn) === 'function') {
        var str = fn.toString();
        return 'return (' + str + '.apply(this, arguments));';
      }
      return fn;
    },

    /**
     * Unmarshals a web element object if provided input holds a web
     * element reference and returns a Marionette.Element object, or the
     * original input if not.
     *
     * A web element represents a DOM element through a
     * {"ELEMENT": <UUID>} JSON object.
     *
     * @private
     * @method _unmarshalWebElement
     * @param {Object} value result body from server.
     * @return {Object|Marionette.Element} unmarshaled element, or the
     *     original input.
     */
    _unmarshalWebElement: function(value) {
      if (typeof value == 'object' && 'ELEMENT' in value) {
        return new this.Element(value.ELEMENT, this);
      }
      return value;
    },

    /**
     * Prepares arguments for script commands.
     * Formats Marionette.Element's sod
     * marionette can use them in script commands.
     *
     *
     * @private
     * @method _prepareArguments
     * @param {Array} arguments list of args for wrapped function.
     * @return {Array} processed arguments.
     */
    _prepareArguments: function _prepareArguments(args) {
      if (args.map) {
        return args.map(function(item) {
          if (item instanceof this.Element) {
            return {'ELEMENT': item.id };
          }
          return item;
        }, this);
      } else {
        return args;
      }
    },

    /**
     * Executes a remote string of javascript.
     * the javascript string will be wrapped in a function
     * by marionette.
     *
     *
     * @method _executeScript
     * @private
     * @param {Object} options objects of execute script.
     * @param {String} options.type command type like 'executeScript'.
     * @param {String} options.value javascript string.
     * @param {String} options.args arguments for script.
     * @param {String} options.sandbox sandbox you wish to use
     * @param {Boolean} options.timeout timeout only used in 'executeJSScript'.
     * @param {Function} callback executes when script finishes.
     * @return {Object} self.
     */
    _executeScript: function _executeScript(options, callback) {
      return this._sendCommand({
        name: options.name,
        parameters: {
          script: this._convertFunction(options.parameters.script),
          args: this._prepareArguments(options.parameters.args || []),
          sandbox: options.parameters.sandbox
        }
      }, callback, 'value');
    }
  };

  //gjslint: ignore
  var proto = Client.prototype;
  proto.searchMethods = [];

  for (key in searchMethods) {
    if (searchMethods.hasOwnProperty(key)) {
      Client.prototype[key] = searchMethods[key];
      Client.prototype.searchMethods.push(searchMethods[key]);
    }
  }

  module.exports = Client;

}.apply(
  this,
  (this.Marionette) ?
    [Marionette('client'), Marionette] :
    [module, require('./marionette')]
));
