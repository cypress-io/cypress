(function() {
  window.$Cypress = (function($, _, Backbone, Promise) {
    var $Cypress;
    $Cypress = (function() {
      function $Cypress() {
        this.cy = null;
        this.chai = null;
        this.mocha = null;
        this.runner = null;
      }

      $Cypress.prototype.start = function() {
        return window.Cypress = this;
      };

      $Cypress.prototype.setConfig = function(config) {
        var environmentVariables;
        if (config == null) {
          config = {};
        }
        environmentVariables = config.environmentVariables;
        config = _.omit(config, "environmentVariables");
        $Cypress.EnvironmentVariables.create(this, environmentVariables);
        $Cypress.Config.create(this, config);
        return this.trigger("config", config);
      };

      $Cypress.prototype.initialize = function(specWindow, $remoteIframe) {
        this.mocha.options(this.runner);
        this.trigger("initialize", {
          specWindow: specWindow,
          $remoteIframe: $remoteIframe
        });
        this.trigger("initialized", {
          cy: this.cy,
          runner: this.runner,
          mocha: this.mocha,
          chai: this.chai
        });
        return this;
      };

      $Cypress.prototype.run = function(fn) {
        if (!this.runner) {
          this.Utils.throwErrByPath("miscellaneous.no_runner");
        }
        return this.runner.run(fn);
      };

      $Cypress.prototype.after = function(err) {
        if (this._on) {
          this.on = this._on;
        }
        return this;
      };

      $Cypress.prototype.set = function(runnable, hookName) {
        return $Cypress.Cy.set(this, runnable, hookName);
      };

      $Cypress.prototype.window = function(specWindow) {
        var chai, cy, log, mocha, runner;
        cy = $Cypress.Cy.create(this, specWindow);
        chai = $Cypress.Chai.create(this, specWindow);
        mocha = $Cypress.Mocha.create(this, specWindow);
        runner = $Cypress.Runner.create(this, specWindow, mocha);
        log = $Cypress.Log.create(this, cy);
        this.prepareForSpecEvents();
        return this.prepareForCustomCommands();
      };

      $Cypress.prototype.onBeforeLoad = function(contentWindow) {
        if (!this.cy) {
          return;
        }
        if ($Cypress.isHeadless) {
          this.cy.silenceConsole(contentWindow);
        }
        this.cy.bindWindowListeners(contentWindow);
        return this.trigger("before:window:load", contentWindow);
      };

      $Cypress.prototype.prepareForSpecEvents = function() {
        var _this;
        if (this._specEvents == null) {
          this._specEvents = _.extend({}, Backbone.Events);
        }
        this._specEvents.stopListening();
        this._on = this.on;
        _this = this;
        return this.on = _.wrap(this.on, function(orig, name, callback, context) {
          if (context) {
            orig.call(this, name, callback, context);
          } else {
            _this._specEvents.listenTo(_this, name, callback);
          }
          return this;
        });
      };

      $Cypress.prototype.stop = function() {
        delete window.Cypress;
        return this.abort().then((function(_this) {
          return function() {
            _this.trigger("stop");
            _this.removeCustomCommands();
            return _this.off();
          };
        })(this));
      };

      $Cypress.prototype.abort = function() {
        var aborts;
        aborts = [].concat(this.invoke("abort"));
        aborts = _.reject(aborts, function(r) {
          return r === this.cy;
        });
        return Promise.all(aborts).then((function(_this) {
          return function() {
            return _this.restore();
          };
        })(this));
      };

      $Cypress.prototype.restore = function() {
        var restores;
        restores = [].concat(this.invoke("restore"));
        restores = _.reject(restores, function(r) {
          return r === this.cy;
        });
        return Promise.all(restores)["return"](null);
      };

      $Cypress.prototype.$ = function() {
        if (!this.cy) {
          $Cypress.Utils.throwErrByPath("miscellaneous.no_cy");
        }
        return this.cy.$$.apply(this.cy, arguments);
      };

      $Cypress.prototype._ = _;

      $Cypress.prototype.moment = window.moment;

      $Cypress.prototype.Blob = window.blobUtil;

      $Cypress.prototype.Promise = Promise;

      _.extend($Cypress.prototype.$, _($).pick("Event", "Deferred", "ajax", "get", "getJSON", "getScript", "post", "when"));

      _.extend($Cypress.prototype, Backbone.Events);

      $Cypress.create = function(options) {
        var Cypress, i, klass, len, ref;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          loadModules: false
        });
        Cypress = new $Cypress;
        ref = "Cy Log Utils Chai Mocha Runner Agents Server Chainer Location LocalStorage Cookies Keyboard Mouse Command Commands EnvironmentVariables Dom ErrorMessages".split(" ");
        for (i = 0, len = ref.length; i < len; i++) {
          klass = ref[i];
          Cypress[klass] = $Cypress[klass];
        }
        Cypress.modules = $Cypress.modules;
        if (options.loadModules) {
          Cypress.loadModules();
        }
        return Cypress;
      };

      $Cypress.extend = function(obj) {
        return _.extend(this.prototype, obj);
      };

      $Cypress.register = function(name, fn) {
        if (this.modules == null) {
          this.modules = {};
        }
        this.modules[name] = fn;
        return this;
      };

      $Cypress.remove = function(name) {
        if (this.modules == null) {
          this.modules = {};
        }
        delete this.modules[name];
        return this;
      };

      $Cypress.reset = function() {
        return this.modules = {};
      };

      return $Cypress;

    })();
    return $Cypress;
  })($, _, Backbone, Promise);

}).call(this);
;
(function() {
  $Cypress.Agents = (function($Cypress, _) {
    var $Agents;
    $Agents = (function() {
      function $Agents(sandbox1, options1) {
        this.sandbox = sandbox1;
        this.options = options1;
        this.count = 0;
      }

      $Agents.prototype._getMessage = function(method, args) {
        var getArgs;
        if (method == null) {
          method = "function";
        }
        getArgs = function() {
          var calls;
          calls = _.map(args, function(arg, i) {
            return "arg" + (i + 1);
          });
          return calls.join(", ");
        };
        return method + "(" + getArgs() + ")";
      };

      $Agents.prototype._wrap = function(type, agent, obj, method, log) {
        var _this;
        _this = this;
        agent._cy = _this.count;
        return agent.invoke = _.wrap(agent.invoke, function(orig, func, thisValue, args) {
          var e, error, error1, props, returned;
          error = null;
          returned = null;
          try {
            returned = orig.call(this, func, thisValue, args);
          } catch (error1) {
            e = error1;
            error = e;
          }
          props = {
            count: agent._cy,
            name: type,
            message: _this._getMessage(method, args),
            obj: obj,
            agent: agent,
            call: agent.lastCall,
            callCount: agent.callCount,
            error: error,
            log: log
          };
          _this.options.onInvoke(props);
          if (error) {
            _this.options.onError(error);
          }
          return returned;
        });
      };

      $Agents.prototype.spy = function(obj, method) {
        var log, spy;
        spy = this.sandbox.spy(obj, method);
        log = this.options.onCreate({
          type: "spy",
          functionName: method,
          count: this.count += 1
        });
        this._wrap("spy", spy, obj, method, log);
        return spy;
      };

      $Agents.prototype.stub = function(obj, method) {
        var log, stub;
        stub = this.sandbox.stub(obj, method);
        log = this.options.onCreate({
          type: "stub",
          functionName: method,
          count: this.count += 1
        });
        this._wrap("stub", stub, obj, method, log);
        return stub;
      };

      $Agents.prototype.mock = function() {
        return $Cypress.Utils.throwErrByPath("miscellaneous.method_not_implemented", {
          args: {
            method: "$Agents#mock"
          }
        });
      };

      $Agents.prototype.useFakeTimers = function() {};

      $Agents.create = function(sandbox, options) {
        return new $Agents(sandbox, options);
      };

      return $Agents;

    })();
    return $Agents;
  })($Cypress, _);

}).call(this);
;
(function() {
  var slice = [].slice;

  (function($Cypress, _, $, chai) {
    var allPropertyWordsBetweenSingleQuotes, allWordsBetweenCurlyBraces, allWordsBetweenSingleQuotes;
    allPropertyWordsBetweenSingleQuotes = /('.*?')$/g;
    allWordsBetweenSingleQuotes = /('.*?')(.+)/g;
    allWordsBetweenCurlyBraces = /(#{.+?})/g;
    return chai.use(function(chai, utils) {
      var $Chai, assert, assertProto, containProto, existProto, expect, getMessage, lengthProto, matchProto;
      expect = chai.expect;
      assert = chai.assert;
      assertProto = chai.Assertion.prototype.assert;
      matchProto = chai.Assertion.prototype.match;
      lengthProto = chai.Assertion.prototype.__methods.length.method;
      containProto = chai.Assertion.prototype.__methods.contain.method;
      existProto = Object.getOwnPropertyDescriptor(chai.Assertion.prototype, "exist").get;
      getMessage = utils.getMessage;
      $Chai = (function() {
        function $Chai(Cypress1, specWindow) {
          this.Cypress = Cypress1;
          this.override();
          this.listeners();
          $Chai.setGlobals(specWindow);
          this.addCustomProperties();
        }

        $Chai.prototype.addCustomProperties = function() {
          var _this, fn1, fn2, normalizeNumber;
          _this = this;
          normalizeNumber = function(num) {
            var parsed;
            parsed = Number(num);
            if (_.isNaN(parsed)) {
              return num;
            } else {
              return parsed;
            }
          };
          utils.getMessage = _.wrap(getMessage, function(orig, assert, args) {
            var msg, obj;
            obj = assert._obj;
            if ($Cypress.Utils.hasElement(obj) || $Cypress.Utils.hasWindow(obj) || $Cypress.Utils.hasDocument(obj)) {
              assert._obj = $Cypress.Utils.stringifyElement(obj, "short");
            }
            msg = orig.call(this, assert, args);
            if (obj !== assert._obj) {
              assert._obj = obj;
            }
            return msg;
          });
          chai.Assertion.overwriteMethod("match", function(_super) {
            return function(regExp) {
              var err;
              if (_.isRegExp(regExp) || $Cypress.Utils.hasElement(this._obj)) {
                return _super.apply(this, arguments);
              } else {
                err = $Cypress.Utils.cypressErr($Cypress.Utils.errMessageByPath("chai.match_invalid_argument", {
                  regExp: regExp
                }));
                err.retry = false;
                throw err;
              }
            };
          });
          chai.Assertion.overwriteChainableMethod("contain", fn1 = function(_super) {
            return function(text) {
              var cy, escText, obj, selector;
              cy = _this.Cypress.cy;
              obj = this._obj;
              if (!cy || !($Cypress.Utils.isInstanceOf(obj, $) || $Cypress.Utils.hasElement(obj))) {
                return _super.apply(this, arguments);
              }
              escText = $Cypress.Utils.escapeQuotes(text);
              selector = ":contains('" + escText + "'), [type='submit'][value~='" + escText + "']";
              return this.assert(obj.is(selector) || !!obj.find(selector).length, "expected \#{this} to contain \#{exp}", "expected \#{this} not to contain \#{exp}", text);
            };
          }, fn2 = function(_super) {
            return function() {
              return _super.apply(this, arguments);
            };
          });
          chai.Assertion.overwriteChainableMethod("length", fn1 = function(_super) {
            return function(length) {
              var cy, e1, e2, error1, getLongLengthMessage, node, obj;
              cy = _this.Cypress.cy;
              obj = this._obj;
              if (!cy || !($Cypress.Utils.isInstanceOf(obj, $) || $Cypress.Utils.hasElement(obj))) {
                return _super.apply(this, arguments);
              }
              length = normalizeNumber(length);
              if (!cy._contains(obj)) {
                obj = this._obj = obj.filter(function(index, el) {
                  return cy._contains(el);
                });
              }
              node = obj && obj.length ? $Cypress.Utils.stringifyElement(obj, "short") : obj.selector;
              try {
                return this.assert(obj.length === length, "expected '" + node + "' to have a length of \#{exp} but got \#{act}", "expected '" + node + "' to not have a length of \#{act}", length, obj.length);
              } catch (error1) {
                e1 = error1;
                e1.node = node;
                e1.negated = utils.flag(this, "negate");
                e1.type = "length";
                if (_.isFinite(length)) {
                  getLongLengthMessage = function(len1, len2) {
                    if (len1 > len2) {
                      return "Too many elements found. Found '" + len1 + "', expected '" + len2 + "'.";
                    } else {
                      return "Not enough elements found. Found '" + len1 + "', expected '" + len2 + "'.";
                    }
                  };
                  e1.longMessage = getLongLengthMessage(obj.length, length);
                  throw e1;
                }
                e2 = $Cypress.Utils.cypressErr($Cypress.Utils.errMessageByPath("chai.length_invalid_argument", {
                  length: length
                }));
                e2.retry = false;
                throw e2;
              }
            };
          }, fn2 = function(_super) {
            return function() {
              return _super.apply(this, arguments);
            };
          });
          return chai.Assertion.overwriteProperty("exist", function(_super) {
            return function() {
              var cy, e1, error1, getLongExistsMessage, isContained, node, obj;
              cy = _this.Cypress.cy;
              obj = this._obj;
              if (!cy || !($Cypress.Utils.isInstanceOf(obj, $) || $Cypress.Utils.hasElement(obj))) {
                return _super.apply(this, arguments);
              } else {
                if (!obj.length) {
                  this._obj = null;
                }
                node = obj && obj.length ? $Cypress.Utils.stringifyElement(obj, "short") : obj.selector;
                try {
                  return this.assert(isContained = cy._contains(obj), "expected \#{act} to exist in the DOM", "expected \#{act} not to exist in the DOM", node, node);
                } catch (error1) {
                  e1 = error1;
                  e1.node = node;
                  e1.negated = utils.flag(this, "negate");
                  e1.type = "existence";
                  getLongExistsMessage = function(obj) {
                    if (isContained) {
                      return "Expected " + node + " not to exist in the DOM, but it was continuously found.";
                    } else {
                      return "Expected to find element: '" + obj.selector + "', but never found it.";
                    }
                  };
                  e1.longMessage = getLongExistsMessage(obj);
                  throw e1;
                }
              }
            };
          });
        };

        $Chai.prototype.listeners = function() {
          this.listenTo(this.Cypress, "stop", (function(_this) {
            return function() {
              return _this.stop();
            };
          })(this));
          return this;
        };

        $Chai.prototype.stop = function() {
          this.stopListening();
          this.restore();
          this.Cypress.chai = null;
          return this;
        };

        $Chai.prototype.restore = function() {
          chai.expect = expect;
          chai.assert = assert;
          this.restoreAsserts();
          return this;
        };

        $Chai.prototype.override = function() {
          var originals;
          originals = {
            expect: expect,
            assert: assert
          };
          _.each(originals, this.patchMethod);
          this.patchAssert();
          return this;
        };

        $Chai.prototype.restoreAsserts = function() {
          utils.getMessage = getMessage;
          chai.Assertion.prototype.assert = assertProto;
          chai.Assertion.prototype.match = matchProto;
          chai.Assertion.prototype.__methods.length.method = lengthProto;
          chai.Assertion.prototype.__methods.contain.method = containProto;
          return Object.defineProperty(chai.Assertion.prototype, "exist", {
            get: existProto
          });
        };

        $Chai.prototype.patchAssert = function() {
          var _this;
          _this = this;
          chai.Assertion.prototype.assert = _.wrap(assertProto, function() {
            var actual, args, customArgs, e, error, error1, expected, message, orig, passed, value;
            orig = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
            passed = utils.test(this, args);
            value = utils.flag(this, "object");
            expected = args[3];
            customArgs = _this.replaceArgMessages(args, this._obj);
            message = utils.getMessage(this, customArgs);
            actual = utils.getActual(this, customArgs);
            message = message.replace(/\[b\].*\[\\b\]/, function(match) {
              return match.replace(/'/g, "");
            });
            try {
              orig.apply(this, args);
            } catch (error1) {
              e = error1;
              error = e;
            }
            _this.Cypress.trigger("assert", passed, message, value, actual, expected, error);
            if (error) {
              throw error;
            }
          });
          return this;
        };

        $Chai.prototype.replaceArgMessages = function(args, str) {
          return _.reduce(args, (function(_this) {
            return function(memo, value, index) {
              if (_.isString(value)) {
                value = value.replace(allWordsBetweenCurlyBraces, "[b]$1[\\b]").replace(allWordsBetweenSingleQuotes, "[b]$1[\\b]$2").replace(allPropertyWordsBetweenSingleQuotes, "[b]$1[\\b]");
                memo.push(value);
              } else {
                memo.push(value);
              }
              return memo;
            };
          })(this), []);
        };

        $Chai.prototype.patchMethod = function(value, key) {
          chai[key] = _.wrap(value, function() {
            var args, orig;
            orig = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
            args = _.map(args, function(arg) {
              var obj;
              if (obj = $Cypress.Utils.getCypressNamespace(arg)) {
                return obj;
              }
              return arg;
            });
            return orig.apply(this, args);
          });
          return this;
        };

        _.extend($Chai.prototype, Backbone.Events);

        $Chai.expect = function() {
          return chai.expect.apply(chai, arguments);
        };

        $Chai.setGlobals = function(contentWindow) {
          contentWindow.chai = chai;
          contentWindow.expect = chai.expect;
          contentWindow.expectOriginal = expect;
          contentWindow.assert = chai.assert;
          return contentWindow.assertOriginal = assert;
        };

        $Chai.create = function(Cypress, specWindow) {
          var existing;
          if (existing = Cypress.chai) {
            existing.stopListening();
          }
          return Cypress.chai = new $Chai(Cypress, specWindow);
        };

        return $Chai;

      })();
      return $Cypress.Chai = $Chai;
    });
  })($Cypress, _, $, chai);

}).call(this);
;
(function() {
  var slice = [].slice;

  $Cypress.Chainer = (function($Cypress, _) {
    var $Chainer;
    $Chainer = (function() {
      function $Chainer(cy1) {
        this.cy = cy1;
        this.id = _.uniqueId("chainer");
      }

      $Chainer.extend = function(obj) {
        return _.extend(this.prototype, obj);
      };

      $Chainer.remove = function(key) {
        return delete $Chainer.prototype[key];
      };

      $Chainer.inject = function(key, fn) {
        return $Chainer.prototype[key] = function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          if (_.any(Cypress.invoke.apply(Cypress, ["on:inject:command", key].concat(slice.call(args))), function(ret) {
            return ret === false;
          })) {
            return;
          }
          fn.call(this.cy, this.id, args);
          return this;
        };
      };

      $Chainer.create = function(cy, key, args) {
        var chainer;
        chainer = new $Chainer(cy);
        return chainer[key].apply(chainer, args);
      };

      return $Chainer;

    })();
    return $Chainer;
  })($Cypress, _);

}).call(this);
;
(function() {
  var slice = [].slice;

  (function($Cypress, _) {
    var $Command, $Commands;
    $Command = (function() {
      function $Command(obj) {
        if (obj == null) {
          obj = {};
        }
        this.reset();
        this.set(obj);
      }

      $Command.prototype.set = function(key, val) {
        var obj;
        if (_.isString(key)) {
          obj = {};
          obj[key] = val;
        } else {
          obj = key;
        }
        _.extend(this.attributes, obj);
        return this;
      };

      $Command.prototype.finishLogs = function() {
        return _.invoke(this.get("logs"), "finish");
      };

      $Command.prototype.log = function(log) {
        log.set("chainerId", this.get("chainerId"));
        this.get("logs").push(log);
        return this;
      };

      $Command.prototype.getLastLog = function() {
        var j, log, logs;
        logs = this.get("logs");
        if (logs.length) {
          for (j = logs.length - 1; j >= 0; j += -1) {
            log = logs[j];
            if (log.get("event") === false) {
              return log;
            }
          }
        } else {
          return void 0;
        }
      };

      $Command.prototype.hasPreviouslyLinkedCommand = function() {
        var prev;
        prev = this.get("prev");
        return !!(prev && prev.get("chainerId") === this.get("chainerId"));
      };

      $Command.prototype.is = function(str) {
        return this.get("type") === str;
      };

      $Command.prototype.get = function(attr) {
        return this.attributes[attr];
      };

      $Command.prototype.toJSON = function() {
        return this.attributes;
      };

      $Command.prototype._removeNonPrimitives = function(args) {
        var arg, i, j, opts;
        for (i = j = args.length - 1; j >= 0; i = j += -1) {
          arg = args[i];
          if (_.isObject(arg)) {
            opts = _(arg).omit(_.isObject);
            opts.log = true;
            args[i] = opts;
            return;
          }
        }
      };

      $Command.prototype.skip = function() {
        return this.set("skip", true);
      };

      $Command.prototype.stringify = function() {
        var args, name, ref;
        ref = this.attributes, name = ref.name, args = ref.args;
        args = _.reduce(args, function(memo, arg) {
          arg = _.isString(arg) ? _.truncate(arg, 20) : "...";
          memo.push(arg);
          return memo;
        }, []);
        args = args.join(", ");
        return "cy." + name + "('" + args + "')";
      };

      $Command.prototype.clone = function() {
        this._removeNonPrimitives(this.get("args"));
        return $Command.create(_.clone(this.attributes));
      };

      $Command.prototype.reset = function() {
        this.attributes = {};
        this.attributes.logs = [];
        return this;
      };

      $Command.create = function(obj) {
        return new $Command(obj);
      };

      return $Command;

    })();
    $Commands = (function() {
      function $Commands(cmds) {
        if (cmds == null) {
          cmds = [];
        }
        this.commands = cmds;
      }

      $Commands.prototype.logs = function(filters) {
        var logs, matchesFilters;
        logs = _.flatten(this.invoke("get", "logs"));
        if (filters) {
          matchesFilters = _.matches(filters);
          logs = _(logs).filter(function(log) {
            return matchesFilters(log.attributes);
          });
        }
        return logs;
      };

      $Commands.prototype.add = function(obj) {
        if ($Cypress.Utils.isInstanceOf(obj, $Command)) {
          return obj;
        } else {
          return $Command.create(obj);
        }
      };

      $Commands.prototype.get = function() {
        return this.commands;
      };

      $Commands.prototype.names = function() {
        return this.invoke("get", "name");
      };

      $Commands.prototype.splice = function(start, end, obj) {
        var cmd;
        cmd = this.add(obj);
        this.commands.splice(start, end, cmd);
        return cmd;
      };

      $Commands.prototype.slice = function() {
        var cmds;
        cmds = this.commands.slice.apply(this.commands, arguments);
        return $Commands.create(cmds);
      };

      $Commands.prototype.at = function(index) {
        return this.commands[index];
      };

      $Commands.prototype._filterByAttrs = function(attrs, method) {
        var matchesAttrs;
        matchesAttrs = _.matches(attrs);
        return this[method](function(command) {
          return matchesAttrs(command.attributes);
        });
      };

      $Commands.prototype.where = function(attrs) {
        return this._filterByAttrs(attrs, "filter");
      };

      $Commands.prototype.findWhere = function(attrs) {
        return this._filterByAttrs(attrs, "find");
      };

      $Commands.prototype.toJSON = function() {
        return this.invoke("toJSON");
      };

      $Commands.prototype.reset = function() {
        this.commands.splice(0, this.commands.length);
        return this;
      };

      $Commands.create = function(cmds) {
        return new $Commands(cmds);
      };

      return $Commands;

    })();
    Object.defineProperty($Commands.prototype, "length", {
      get: function() {
        return this.commands.length;
      }
    });
    _.each(["pick"], function(method) {
      return $Command.prototype[method] = function() {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        args.unshift(this.attributes);
        return _[method].apply(_, args);
      };
    });
    _.each(["invoke", "map", "pluck", "first", "reduce", "find", "filter", "reject", "last", "indexOf", "each"], function(method) {
      return $Commands.prototype[method] = function() {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        args.unshift(this.commands);
        return _[method].apply(_, args);
      };
    });
    $Cypress.Command = $Command;
    $Cypress.Commands = $Commands;
    return $Cypress.extend({
      addChildCommand: function(key, fn) {
        return this.add(key, fn, "child");
      },
      addParentCommand: function(key, fn) {
        return this.add(key, fn, "parent");
      },
      addDualCommand: function(key, fn) {
        return this.add(key, fn, "dual");
      },
      addAssertionCommand: function(key, fn) {
        return this.add(key, fn, "assertion");
      },
      addUtilityCommand: function(key, fn) {
        return this.add(key, fn, "utility");
      },
      prepareForCustomCommands: function() {
        var _this;
        this.removeCustomCommands();
        this._inject = this.inject;
        _this = this;
        this._customCommands = [];
        return this.inject = _.wrap(this.inject, function(orig, key, fn, type) {
          _this._customCommands.push(key);
          return orig.call(this, key, fn, type);
        });
      },
      removeCustomCommands: function() {
        var ref;
        if (this._inject) {
          this.inject = this._inject;
        }
        return _.each((ref = this._customCommands) != null ? ref : [], function(key) {
          delete $Cypress.Cy.prototype[key];
          delete $Cypress.Cy.prototype.sync[key];
          return $Cypress.Chainer.remove(key);
        });
      },
      add: function(key, fn, type) {
        if (!type) {
          $Cypress.Utils.throwErrByPath("add.type_missing");
        }
        if (_.isObject(key)) {
          _.each(key, (function(_this) {
            return function(fn, name) {
              return _this.add(name, fn, type);
            };
          })(this));
          return this;
        }
        this.inject(key, fn, type);
        return this;
      },
      inject: function(key, fn, type) {
        var _this, prepareSubject, wrap, wrapByType;
        _this = this;
        prepareSubject = function(subject, args) {
          if (args.hasSubject) {
            args.splice(0, 1, subject);
          } else {
            args.unshift(subject);
          }
          args.hasSubject || (args.hasSubject = true);
          return args;
        };
        wrap = function(fn) {
          var wrapped;
          wrapped = wrapByType(fn);
          wrapped.originalFn = fn;
          return wrapped;
        };
        wrapByType = function(fn) {
          switch (type) {
            case "parent":
              return fn;
            case "dual":
            case "utility":
              return _.wrap(fn, function() {
                var args, orig, subject;
                orig = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
                subject = this.prop("subject");
                args = prepareSubject(subject, args);
                return orig.apply(this, args);
              });
            case "child":
            case "assertion":
              return _.wrap(fn, function() {
                var args, orig, ret, subject;
                orig = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
                this.ensureParent();
                subject = this.prop("subject");
                args = prepareSubject(subject, args);
                ret = orig.apply(this, args);
                return ret != null ? ret : subject;
              });
          }
        };
        $Cypress.Cy.prototype[key] = function() {
          var args, chain;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          if (!this["private"]("runnable")) {
            $Cypress.Utils.throwErrByPath("miscellaneous.outside_test");
          }
          chain = $Cypress.Chainer.create(this, key, args);
          this.prop("chain", chain);
          return chain;
        };
        $Cypress.Cy.prototype.sync[key] = function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return wrap(fn).apply(_this.cy, args);
        };
        return $Cypress.Chainer.inject(key, function(chainerId, args) {
          return this.enqueue(key, wrap.call(this, fn), args, type, chainerId);
        });
      }
    });
  })($Cypress, _);

}).call(this);
;
(function() {
  $Cypress.Config = (function($Cypress, _) {
    return {
      create: function(Cypress, config) {
        var get, set;
        get = function(key) {
          if (key) {
            return config[key];
          } else {
            return config;
          }
        };
        set = function(key, value) {
          var obj;
          if (_.isObject(key)) {
            obj = key;
          } else {
            obj = {};
            obj[key] = value;
          }
          return _.extend(config, obj);
        };
        return Cypress.config = function(key, value) {
          switch (arguments.length) {
            case 0:
              return get();
            case 1:
              if (_.isString(key)) {
                return get(key);
              } else {
                return set(key);
              }
              break;
            default:
              return set(key, value);
          }
        };
      }
    };
  })($Cypress, _);

}).call(this);
;
(function() {
  var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice;

  $Cypress.Cookies = (function($Cypress, _) {
    var API, defaults, isDebugging, isNamespaced, isWhitelisted, namespace, preserved, reHttp, removePreserved;
    reHttp = /^http/;
    isDebugging = false;
    namespace = "__cypress";
    preserved = {};
    defaults = {
      whitelist: null
    };
    isNamespaced = function(name) {
      return _(name).startsWith(namespace);
    };
    isWhitelisted = function(cookie) {
      var ref, w;
      if (w = defaults.whitelist) {
        switch (false) {
          case !_.isString(w):
            return cookie.name === w;
          case !_.isArray(w):
            return ref = cookie.name, indexOf.call(w, ref) >= 0;
          case !_.isFunction(w):
            return w(cookie);
          case !_.isRegExp(w):
            return w.test(cookie.name);
          default:
            return false;
        }
      }
    };
    removePreserved = function(name) {
      if (preserved[name]) {
        return delete preserved[name];
      }
    };
    API = {
      debug: function(bool) {
        if (bool == null) {
          bool = true;
        }
        $Cypress.Utils.warning("Cypress.Cookies.debug() is temporarily disabled. This will be re-enabled sometime in 0.16.x");
        return isDebugging = bool;
      },
      log: function(cookie, type) {
        var m;
        if (!isDebugging) {
          return;
        }
        m = (function() {
          switch (type) {
            case "added":
              return "info";
            case "changed":
              return "log";
            case "cleared":
              return "warn";
            default:
              return "log";
          }
        })();
        return console[m]("Cookie " + type + ":", cookie);
      },
      getClearableCookies: function(cookies) {
        if (cookies == null) {
          cookies = [];
        }
        return _.filter(cookies, function(cookie) {
          return !isWhitelisted(cookie) && !removePreserved(cookie.name);
        });
      },
      _set: function(name, value) {
        if (this.getCy("unload") === "true") {
          return;
        }
        return Cookies.set(name, value, {
          path: "/"
        });
      },
      _get: function(name) {
        return Cookies.get(name);
      },
      setCy: function(name, value) {
        return this._set(namespace + "." + name, value);
      },
      getCy: function(name) {
        return this._get(namespace + "." + name);
      },
      preserveOnce: function() {
        var keys;
        keys = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return _.each(keys, function(key) {
          return preserved[key] = true;
        });
      },
      setInitial: function() {
        return this.setCy("initial", true);
      },
      setInitialRequest: function(remoteHost) {
        this.setCy("remoteHost", remoteHost);
        this.setInitial();
        return this;
      },
      getRemoteHost: function() {
        return this.getCy("remoteHost");
      },
      defaults: function(obj) {
        if (obj == null) {
          obj = {};
        }
        return _.extend(defaults, obj);
      }
    };
    _.each(["get", "set", "remove", "getAllCookies", "clearCookies"], function(method) {
      return API[method] = function() {
        return $Cypress.Utils.throwErrByPath("cookies.removed_method", {
          args: {
            method: method
          }
        });
      };
    });
    return API;
  })($Cypress, _);

}).call(this);
;
(function() {
  var slice = [].slice;

  $Cypress.Cy = (function($Cypress, _, Backbone, Promise) {
    var $Cy;
    $Cy = (function() {
      $Cy.prototype.sync = {};

      function $Cy(Cypress1, specWindow) {
        this.Cypress = Cypress1;
        this.defaults();
        this.listeners();
        this.commands = $Cypress.Commands.create();
        this.privates = {};
        specWindow.cy = this;
      }

      $Cy.prototype.initialize = function(obj) {
        var $remoteIframe;
        this.defaults();
        $remoteIframe = obj.$remoteIframe;
        this["private"]("$remoteIframe", $remoteIframe);
        this._setRemoteIframeProps($remoteIframe);
        $remoteIframe.on("load", (function(_this) {
          return function() {
            _this._setRemoteIframeProps($remoteIframe);
            _this.urlChanged(null, {
              log: false
            });
            _this.pageLoading(false);
            _this.bindWindowListeners(_this["private"]("window"));
            _this.isReady(true, "load");
            return _this.Cypress.trigger("load");
          };
        })(this));
        return this.isReady(true, "initialize");
      };

      $Cy.prototype.defaults = function() {
        this.props = {};
        return this;
      };

      $Cy.prototype.silenceConsole = function(contentWindow) {
        var c;
        if (c = contentWindow.console) {
          c.log = function() {};
          c.warn = function() {};
          return c.info = function() {};
        }
      };

      $Cy.prototype.listeners = function() {
        this.listenTo(this.Cypress, "initialize", (function(_this) {
          return function(obj) {
            return _this.initialize(obj);
          };
        })(this));
        this.listenTo(this.Cypress, "stop", (function(_this) {
          return function() {
            return _this.stop();
          };
        })(this));
        this.listenTo(this.Cypress, "restore", (function(_this) {
          return function() {
            return _this.restore();
          };
        })(this));
        this.listenTo(this.Cypress, "abort", (function(_this) {
          return function() {
            return _this.abort();
          };
        })(this));
        return this.listenTo(this.Cypress, "test:after:hooks", (function(_this) {
          return function(test) {
            return _this.checkTestErr(test);
          };
        })(this));
      };

      $Cy.prototype.abort = function() {
        var promise, ready, readyPromise, ref;
        this.offWindowListeners();
        this.offIframeListeners(this["private"]("$remoteIframe"));
        this.isReady(false, "abort");
        if ((ref = this["private"]("runnable")) != null) {
          ref.clearTimeout();
        }
        promise = this.prop("promise");
        if (promise != null) {
          promise.cancel();
        }
        ready = this.prop("ready");
        if (ready && (readyPromise = ready.promise)) {
          if (readyPromise.isCancellable()) {
            readyPromise.cancel();
          }
        }
        return Promise.resolve(promise);
      };

      $Cy.prototype.stop = function() {
        delete window.cy;
        this.stopListening();
        this.offWindowListeners();
        this.offIframeListeners(this["private"]("$remoteIframe"));
        this.privates = {};
        return this.Cypress.cy = null;
      };

      $Cy.prototype.restore = function() {
        var index;
        index = this.prop("index");
        if (index > 0 && index < this.commands.length) {
          this.endedEarlyErr(index);
        }
        this.clearTimeout(this.prop("runId"));
        this.clearTimeout(this.prop("timerId"));
        this.commands.reset();
        this.off();
        this.defaults();
        return this;
      };

      $Cy.prototype.options = function(options) {
        if (options == null) {
          options = {};
        }
      };

      $Cy.prototype.nullSubject = function() {
        this.prop("subject", null);
        return this;
      };

      $Cy.prototype._eventHasReturnValue = function(e) {
        var val;
        val = e.originalEvent.returnValue;
        if (val === "" || _.isUndefined(val)) {
          return false;
        }
        return true;
      };

      $Cy.prototype.isReady = function(bool, event) {
        var ready;
        if (bool == null) {
          bool = true;
        }
        if (bool) {
          this.prop("recentlyReady", true);
          if (ready = this.prop("ready")) {
            if (ready.promise.isPending()) {
              ready.promise.then((function(_this) {
                return function() {
                  _this.trigger("ready", true);
                  return null;
                };
              })(this));
            }
          }
          return ready != null ? ready.resolve() : void 0;
        }
        if (this.prop("ready") && this.prop("ready").promise.isPending()) {
          return;
        }
        this.trigger("ready", false);
        return this.prop("ready", Promise.pending());
      };

      $Cy.prototype.run = function() {
        var command, index, next, prevTimeout, ref, run, runnable;
        index = (ref = this.prop("index")) != null ? ref : this.prop("index", 0);
        command = this.commands.at(index);
        if (command && command.get("skip")) {
          command.set({
            prev: this.commands.at(index - 1),
            next: this.commands.at(index + 1)
          });
          this.prop("index", index + 1);
          this.prop("subject", command.get("subject"));
          return this.run();
        }
        runnable = this["private"]("runnable");
        if (!command) {
          this.trigger("end");
          if (next = this.prop("next")) {
            next();
            this.prop("next", null);
          }
          return this;
        }
        prevTimeout = this._timeout();
        this._timeout(30000);
        run = (function(_this) {
          return function() {
            var promise;
            if (_this["private"]("runnable") !== runnable) {
              return;
            }
            _this._timeout(prevTimeout);
            _this.trigger("command:start", command);
            promise = _this.set(command, _this.commands.at(index - 1), _this.commands.at(index + 1)).then(function() {
              var fn;
              if (!runnable.state) {
                _this._timeout(prevTimeout);
              }
              _this.prop("index", index += 1);
              _this.trigger("command:end", command);
              if (fn = _this.prop("onPaused")) {
                fn.call(_this, _this.run);
              } else {
                _this.defer(_this.run);
              }
              return null;
            })["catch"](Promise.CancellationError, function(err) {
              _this.cancel(err);
              return err;
            })["catch"](function(err) {
              _this.fail(err);
              _this.prop("nestedIndex", null);
              _this.prop("recentlyReady", null);
              return err;
            });
            _this.prop("promise", promise);
            return _this.trigger("set", command);
          };
        })(this);
        return this.defer(run);
      };

      $Cy.prototype.clearTimeout = function(id) {
        if (id) {
          clearImmediate(id);
        }
        return this;
      };

      $Cy.prototype.set = function(command, prev, next) {
        command.set({
          prev: prev,
          next: next
        });
        this.prop("current", command);
        return this.invoke2(command);
      };

      $Cy.prototype.invoke2 = function() {
        var args, command, promise;
        command = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        promise = this.prop("ready") ? Promise.resolve(this.prop("ready").promise) : Promise.resolve();
        return promise.cancellable().then((function(_this) {
          return function() {
            _this.trigger("invoke:start", command);
            _this.prop("nestedIndex", _this.prop("index"));
            if (args.length) {
              return args;
            } else {
              return command.get("args");
            }
          };
        })(this)).all(args).then((function(_this) {
          return function(args) {
            var ret;
            if (_.isFunction(args[0]) && args[0]._invokeImmediately) {
              args[0] = args[0].call(_this);
            }
            _this._checkForNewChain(command.get("chainerId"));
            ret = command.get("fn").apply(command.get("ctx"), args);
            _this.trigger("command:returned:value", command, ret);
            if (ret === _this || ret === _this.chain()) {
              return null;
            } else {
              return ret;
            }
          };
        })(this)).then((function(_this) {
          return function(subject) {
            var ready;
            if (subject && Cypress.Utils.hasElement(subject) && !Cypress.Utils.isInstanceOf(subject, $)) {
              subject = _this.$$(subject);
            }
            command.set({
              subject: subject
            });
            command.finishLogs();
            _this.trigger("invoke:subject", subject, command);
            _this.prop("nestedIndex", null);
            _this.prop("recentlyReady", null);
            _this.prop("subject", subject);
            _this.trigger("invoke:end", command);
            if (ready = _this.prop("ready")) {
              if (ready.promise.isPending()) {
                return ready.promise.then(function() {
                  if (_this.prop("pageChangeEvent")) {
                    _this.prop("pageChangeEvent", false);
                    if ($Cypress.Utils.hasElement(subject) && !_this._contains(subject)) {
                      _this.nullSubject();
                    }
                    return _this.prop("subject");
                  }
                })["catch"](function(err) {});
              }
            }
            return _this.prop("subject");
          };
        })(this));
      };

      $Cy.prototype.cancel = function(err) {
        return this.trigger("cancel", this.prop("current"));
      };

      $Cy.prototype.enqueue = function(key, fn, args, type, chainerId) {
        var obj;
        this.clearTimeout(this.prop("runId"));
        obj = {
          name: key,
          ctx: this,
          fn: fn,
          args: args,
          type: type,
          chainerId: chainerId
        };
        this.trigger("enqueue", obj);
        this.Cypress.trigger("enqueue", obj);
        return this.insertCommand(obj);
      };

      $Cy.prototype.insertCommand = function(obj) {
        var index, nestedIndex;
        nestedIndex = this.prop("nestedIndex");
        if (_.isNumber(nestedIndex)) {
          this.commands.at(nestedIndex).set("next", obj);
          this.prop("nestedIndex", nestedIndex += 1);
        }
        index = _.isNumber(nestedIndex) ? nestedIndex : this.commands.length;
        this.commands.splice(index, 0, obj);
        if (!nestedIndex) {
          this.prop("runId", this.defer(this.run));
        }
        return this;
      };

      $Cy.prototype._contains = function($el) {
        var contains, doc;
        doc = this["private"]("document");
        contains = function(el) {
          return $.contains(doc, el);
        };
        if (_.isElement($el)) {
          return contains($el);
        } else {
          if ($el.length === 0) {
            return false;
          }
          return _.all($el.toArray(), contains);
        }
      };

      $Cy.prototype._checkForNewChain = function(chainerId) {
        var id;
        if (_.isUndefined(chainerId)) {
          return;
        }
        if (!(id = this.prop("chainerId"))) {
          return this.prop("chainerId", chainerId);
        } else {
          if (id !== chainerId) {
            this.prop("chainerId", chainerId);
            return this.nullSubject();
          }
        }
      };

      $Cy.prototype.execute = function() {
        var args, name;
        name = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        return Promise.resolve(this.sync[name].apply(this, args)).cancellable();
      };

      $Cy.prototype.defer = function(fn) {
        this.clearTimeout(this.prop("timerId"));
        return this.prop("timerId", setImmediate(_.bind(fn, this)));
      };

      $Cy.prototype.hook = function(name) {
        return this["private"]("hookName", name);
      };

      $Cy.prototype.chain = function() {
        return this.prop("chain");
      };

      $Cy.prototype._setRemoteIframeProps = function($iframe) {
        this["private"]("$remoteIframe", $iframe);
        this["private"]("window", $iframe.prop("contentWindow"));
        this["private"]("document", $iframe.prop("contentDocument"));
        return this;
      };

      $Cy.prototype._setRunnable = function(runnable, hookName) {
        var timeout;
        runnable.startedAt = new Date;
        if (_.isFinite(timeout = this.Cypress.config("commandTimeout"))) {
          runnable.timeout(timeout);
        }
        this.hook(hookName);
        this["private"]("runnable", runnable);
        return this;
      };

      $Cy.prototype.$$ = function(selector, context) {
        if (context == null) {
          context = this["private"]("document");
        }
        return new $.fn.init(selector, context);
      };

      _.extend($Cy.prototype, Backbone.Events);

      ["_", "$", "Promise", "Blob", "moment"].forEach(function(lib) {
        return Object.defineProperty($Cy.prototype, lib, {
          get: function() {
            var Cypress, ref;
            $Cypress.Utils.warning("cy." + lib + " is now deprecated.\n\nThis object is now attached to 'Cypress' and not 'cy'.\n\nPlease update and use: Cypress." + lib);
            Cypress = (ref = this.Cypress) != null ? ref : $Cypress.prototype;
            if (lib === "$") {
              return _.bind(Cypress[lib], Cypress);
            } else {
              return Cypress[lib];
            }
          }
        });
      });

      $Cy.extend = function(obj) {
        return _.extend(this.prototype, obj);
      };

      $Cy.set = function(Cypress, runnable, hookName) {
        var cy;
        if (!(cy = Cypress.cy)) {
          return;
        }
        return cy._setRunnable(runnable, hookName);
      };

      $Cy.create = function(Cypress, specWindow) {
        var existing;
        if (existing = Cypress.cy) {
          existing.stopListening();
        }
        return Cypress.cy = window.cy = new $Cy(Cypress, specWindow);
      };

      return $Cy;

    })();
    return $Cy;
  })($Cypress, _, Backbone, Promise);

}).call(this);
;
(function() {
  $Cypress.Dom = (function($Cypress, _, $) {
    var fixedOrAbsoluteRe, obj;
    fixedOrAbsoluteRe = /(fixed|absolute)/;
    return obj = {
      isHidden: $.expr.filters.hidden = function(el) {
        var $el;
        if (!$Cypress.Utils.hasElement(el)) {
          $Cypress.Utils.throwErrByPath("dom.non_dom_is_hidden", {
            args: {
              el: el
            }
          });
        }
        $el = $(el);
        return obj.elHasNoOffsetWidthOrHeight($el) || obj.elHasVisibilityHidden($el) || obj.elIsHiddenByAncestors($el);
      },
      elHasNoOffsetWidthOrHeight: function($el) {
        return this.elOffsetWidth($el) <= 0 || this.elOffsetHeight($el) <= 0;
      },
      elOffsetWidth: function($el) {
        return $el[0].offsetWidth;
      },
      elOffsetHeight: function($el) {
        return $el[0].offsetHeight;
      },
      elHasVisibilityHidden: function($el) {
        return $el.css("visibility") === "hidden";
      },
      elHasDisplayNone: function($el) {
        return $el.css("display") === "none";
      },
      elHasOverflowHidden: function($el) {
        return $el.css("overflow") === "hidden";
      },
      elDescendentsHavePositionFixedOrAbsolute: function($parent, $child) {
        var $els;
        $els = $child.parentsUntil($parent).add($child);
        return _.any($els.get(), function(el) {
          return fixedOrAbsoluteRe.test($(el).css("position"));
        });
      },
      elIsHiddenByAncestors: function($el, $origEl) {
        var $parent;
        if ($origEl == null) {
          $origEl = $el;
        }
        $parent = $el.parent();
        if ($parent.is("body,html") || $Cypress.Utils.hasDocument($parent)) {
          return false;
        }
        if (this.elHasOverflowHidden($parent) && this.elHasNoOffsetWidthOrHeight($parent)) {
          if (this.elDescendentsHavePositionFixedOrAbsolute($parent, $origEl)) {
            return false;
          } else {
            return true;
          }
        }
        return this.elIsHiddenByAncestors($parent, $origEl);
      },
      parentHasNoOffsetWidthOrHeightAndOverflowHidden: function($el) {
        if (!$el.length || $el.is("body,html")) {
          return false;
        }
        if (this.elHasOverflowHidden($el) && this.elHasNoOffsetWidthOrHeight($el)) {
          return $el;
        } else {
          return this.parentHasNoOffsetWidthOrHeightAndOverflowHidden($el.parent());
        }
      },
      parentHasDisplayNone: function($el) {
        if (!$el.length || $Cypress.Utils.hasDocument($el)) {
          return false;
        }
        if (this.elHasDisplayNone($el)) {
          return $el;
        } else {
          return this.parentHasDisplayNone($el.parent());
        }
      },
      parentHasVisibilityNone: function($el) {
        if (!$el.length || $Cypress.Utils.hasDocument($el)) {
          return false;
        }
        if (this.elHasVisibilityHidden($el)) {
          return $el;
        } else {
          return this.parentHasVisibilityNone($el.parent());
        }
      },
      getReasonElIsHidden: function($el) {
        var $parent, height, node, width;
        switch (false) {
          case !this.elHasDisplayNone($el):
            return "This element is not visible because it has CSS property: 'display: none'";
          case !($parent = this.parentHasDisplayNone($el.parent())):
            node = $Cypress.Utils.stringifyElement($parent, "short");
            return "This element is not visible because it's parent: " + node + " has CSS property: 'display: none'";
          case !($parent = this.parentHasVisibilityNone($el.parent())):
            node = $Cypress.Utils.stringifyElement($parent, "short");
            return "This element is not visible because it's parent: " + node + " has CSS property: 'visibility: hidden'";
          case !this.elHasVisibilityHidden($el):
            return "This element is not visible because it has CSS property: 'visibility: hidden'";
          case !this.elHasNoOffsetWidthOrHeight($el):
            width = this.elOffsetWidth($el);
            height = this.elOffsetHeight($el);
            return "This element is not visible because it has an effective width and height of: '" + width + " x " + height + "' pixels.";
          case !($parent = this.parentHasNoOffsetWidthOrHeightAndOverflowHidden($el.parent())):
            node = $Cypress.Utils.stringifyElement($parent, "short");
            width = this.elOffsetWidth($parent);
            height = this.elOffsetHeight($parent);
            return "This element is not visible because it's parent: " + node + " has CSS property: 'overflow: hidden' and an effective width and height of: '" + width + " x " + height + "' pixels.";
          default:
            return "Cypress could not determine why this element is not visible.";
        }
      }
    };
  })($Cypress, _, $);

}).call(this);
;
(function() {
  $Cypress.EnvironmentVariables = (function($Cypress, _) {
    var $EnvironmentVariables;
    $Cypress.extend({
      env: function(key, value) {
        var env;
        env = this.environmentVariables;
        if (!env) {
          $Cypress.Utils.throwErrByPath("env.variables_missing");
        }
        return env.getOrSet.apply(env, arguments);
      }
    });
    $EnvironmentVariables = (function() {
      function $EnvironmentVariables(obj) {
        if (obj == null) {
          obj = {};
        }
        this.env = {};
        this.set(obj);
      }

      $EnvironmentVariables.prototype.getOrSet = function(key, value) {
        switch (false) {
          case arguments.length !== 0:
            return this.get();
          case arguments.length !== 1:
            if (_.isString(key)) {
              return this.get(key);
            } else {
              return this.set(key);
            }
            break;
          default:
            return this.set(key, value);
        }
      };

      $EnvironmentVariables.prototype.get = function(key) {
        if (key) {
          return this.env[key];
        } else {
          return this.env;
        }
      };

      $EnvironmentVariables.prototype.set = function(key, value) {
        var obj;
        if (_.isObject(key)) {
          obj = key;
        } else {
          obj = {};
          obj[key] = value;
        }
        return _.extend(this.env, obj);
      };

      $EnvironmentVariables.create = function(Cypress, obj) {
        return Cypress.environmentVariables = new $EnvironmentVariables(obj);
      };

      return $EnvironmentVariables;

    })();
    return $EnvironmentVariables;
  })($Cypress, _);

}).call(this);
;
(function() {
  $Cypress.ErrorMessages = (function($Cypress) {
    var cmd;
    cmd = function(command, args) {
      if (args == null) {
        args = "";
      }
      return "cy." + command + "(" + args + ")";
    };
    return {
      add: {
        type_missing: "Cypress.add(key, fn, type) must include a type!"
      },
      alias: {
        invalid: "Invalid alias: '{{name}}'.\nYou forgot the '@'. It should be written as: '@{{displayName}}'.",
        not_registered_with_available: (cmd('{{cmd}}')) + " could not find a registered alias for: '@{{displayName}}'.\nAvailable aliases are: '{{availableAliases}}'.",
        not_registered_without_available: (cmd('{{cmd}}')) + " could not find a registered alias for: '@{{displayName}}'.\nYou have not aliased anything yet."
      },
      as: {
        empty_string: (cmd('as')) + " cannot be passed an empty string.",
        invalid_type: (cmd('as')) + " can only accept a string.",
        reserved_word: (cmd('as')) + " cannot be aliased as: '{{str}}'. This word is reserved."
      },
      blur: {
        multiple_elements: (cmd('blur')) + " can only be called on a single element. Your subject contained {{num}} elements.",
        no_focused_element: (cmd('blur')) + " can only be called when there is a currently focused element.",
        timed_out: (cmd('blur')) + " timed out because your browser did not receive any blur events. This is a known bug in Chrome when it is not the currently focused window.",
        wrong_focused_element: (cmd('blur')) + " can only be called on the focused element. Currently the focused element is a: {{node}}"
      },
      chai: {
        length_invalid_argument: "You must provide a valid number to a length assertion. You passed: '{{length}}'",
        match_invalid_argument: "'chai#match' requires its argument be a 'RegExp'. You passed: '{{regExp}}'"
      },
      check_uncheck: {
        invalid_element: (cmd('{{cmd}}')) + " can only be called on :checkbox{{phrase}}. Your subject {{word}} a: {{node}}"
      },
      clear: {
        invalid_element: (cmd('clear')) + " can only be called on textarea or :text. Your subject {{word}} a: {{node}}"
      },
      clearCookie: {
        invalid_argument: (cmd('clearCookie')) + " must be passed a string argument for name."
      },
      clearLocalStorage: {
        invalid_argument: (cmd('clearLocalStorage')) + " must be called with either a string or regular expression."
      },
      click: {
        multiple_elements: (cmd('click')) + " can only be called on a single element. Your subject contained {{num}} elements. Pass {multiple: true} if you want to serially click each element.",
        on_select_element: (cmd('click')) + " cannot be called on a <select> element. Use " + (cmd('select')) + " command instead to change the value."
      },
      contains: {
        empty_string: (cmd('contains')) + " cannot be passed an empty string.",
        invalid_argument: (cmd('contains')) + " can only accept a string or number.",
        length_option: (cmd('contains')) + " cannot be passed a length option because it will only ever return 1 element."
      },
      cookies: {
        removed_method: "The Cypress.Cookies.{{method}}() method has been removed.\n\nSetting, getting, and clearing cookies is now an asynchronous operation.\n\nReplace this call with the appropriate command such as:\n  - cy.getCookie()\n  - cy.getCookies()\n  - cy.setCookie()\n  - cy.clearCookie()\n  - cy.clearCookies()",
        timed_out: (cmd('{{cmd}}')) + " timed out waiting '{{timeout}}ms' to complete."
      },
      dom: {
        animating: (cmd('{{cmd}}')) + " could not be issued because this element is currently animating:\n\n{{node}}\n\nYou can fix this problem by:\n  - Passing {force: true} which disables all error checking\n  - Passing {waitForAnimations: false} which disables waiting on animations\n  - Passing {animationDistanceThreshold: 20} which decreases the sensitivity\n\nhttps://on.cypress.io/element-is-animating",
        animation_check_failed: "Not enough coord points provided to calculate distance.",
        covered: (cmd('{{cmd}}')) + " failed because this element is being covered by another element:\n\n{{node}}\n\nFix this problem, or use {force: true} to disable error checking.\n\nhttps://on.cypress.io/element-cannot-be-interacted-with",
        detached: (cmd('{{cmd}}')) + " failed because this element you are chaining off of has become detached or removed from the DOM:\n\n{{node}}\n\nhttps://on.cypress.io/element-has-detached-from-dom",
        disabled: (cmd('{{cmd}}')) + " failed because this element is disabled:\n\n{{node}}\n\nFix this problem, or use {force: true} to disable error checking.\n\nhttps://on.cypress.io/element-cannot-be-interacted-with",
        hidden: (cmd('{{cmd}}')) + " failed because the center of this element is hidden from view:\n\n{{node}}\n\nFix this problem, or use {force: true} to disable error checking.\n\nhttps://on.cypress.io/element-cannot-be-interacted-with",
        invalid_position_argument: "Invalid position argument: '{{position}}'. Position may only be center, topLeft, topRight, bottomLeft, or bottomRight.",
        non_dom: "Cannot call " + (cmd('{{cmd}}')) + " on a non-DOM subject.",
        non_dom_is_hidden: "$Cypress.Dom.isHidden() must be passed a basic DOM element. You passed: '{{el}}'",
        not_visible: (cmd('{{cmd}}')) + " failed because this element is not visible:\n\n{{node}}\n\n{{reason}}\n\nFix this problem, or use {force: true} to disable error checking.\n\nhttps://on.cypress.io/element-cannot-be-interacted-with"
      },
      env: {
        variables_missing: "Cypress.environmentVariables is not defined. Open an issue if you see this message."
      },
      exec: {
        failed: (cmd('exec', '\'{{cmd}}\'')) + " failed with the following error: {{error}}",
        invalid_argument: (cmd('exec')) + " must be passed a non-empty string as its 1st argument. You passed: '{{cmd}}'.",
        non_zero_exit: (cmd('exec', '\'{{cmd}}\'')) + " failed because the command exited with a non-zero code. Pass {failOnNonZeroExit: false} for non-zero exits to not be treated as failures.\n\nInformation about the failure:\nCode: {{code}}\n{{output}}",
        timed_out: (cmd('exec', '\'{{cmd}}\'')) + " timed out after waiting {{timeout}}ms."
      },
      fill: {
        invalid_1st_arg: (cmd('fill')) + " must be passed an object literal as its 1st argument"
      },
      fixture: {
        timed_out: (cmd('fixture')) + " timed out waiting '{{timeout}}ms' to receive a fixture. No fixture was ever sent by the server."
      },
      focus: {
        invalid_element: (cmd('focus')) + " can only be called on a valid focusable element. Your subject is a: {{node}}",
        multiple_elements: (cmd('focus')) + " can only be called on a single element. Your subject contained {{num}} elements.",
        timed_out: (cmd('focus')) + " timed out because your browser did not receive any focus events. This is a known bug in Chrome when it is not the currently focused window."
      },
      get: {
        alias_invalid: "'{{prop}}' is not a valid alias property. Only 'numbers' or 'all' is permitted.",
        alias_zero: "'0' is not a valid alias property. Are you trying to ask for the first response? If so write @{{alias}}.1"
      },
      getCookie: {
        invalid_argument: (cmd('getCookie')) + " must be passed a string argument for name."
      },
      go: {
        invalid_argument: (cmd('go')) + " accepts only a string or number argument",
        invalid_direction: (cmd('go')) + " accepts either 'forward' or 'back'. You passed: '{{str}}'",
        invalid_number: (cmd('go')) + " cannot accept '0'. The number must be greater or less than '0'."
      },
      hover: {
        not_implemented: (cmd('hover')) + " is not currently implemented.\n\nHowever it is usually easy to workaround.\n\nRead the following document for a detailed explanation.\n\nhttps://on.cypress.io/api/hover"
      },
      invoke: {
        invalid_type: "Cannot call " + (cmd('invoke')) + " because '{{prop}}' is not a function. You probably want to use " + (cmd('its', '\'{{prop}}\'')) + "."
      },
      invoke_its: {
        current_prop_nonexistent: (cmd('{{cmd}}')) + " errored because your subject is currently: '{{value}}'. You cannot call any properties such as '{{prop}}' on a '{{value}}' value.",
        invalid_1st_arg: (cmd('{{cmd}}')) + " only accepts a string as the first argument.",
        invalid_property: (cmd('{{cmd}}')) + " errored because the property: '{{prop}}' does not exist on your subject.",
        previous_prop_nonexistent: (cmd('{{cmd}}')) + " errored because the property: '{{previousProp}}' returned a '{{value}}' value. You cannot access any properties such as '{{currentProp}}' on a '{{value}}' value.",
        timed_out: (cmd('{{cmd}}')) + " timed out after waiting '{{timeout}}ms'.\n\nYour callback function returned a promise which never resolved.\n\nThe callback function was:\n\n{{func}}"
      },
      location: {
        invalid_key: "Location object does not have key: {{key}}"
      },
      miscellaneous: {
        dangling_commands: "Oops, Cypress detected something wrong with your test code.\n\nThe test has finished but Cypress still has commands in its queue.\nThe {{numCommands}} queued commands that have not yet run are:\n\n{{commands}}\n\nIn every situation we've seen, this has been caused by programmer error.\nMost often this indicates a race condition due to a forgotten 'return' or from commands in a previously run test bleeding into the current test.\n\nFor a much more thorough explanation including examples please review this error here:\n\nhttps://on.cypress.io/command-queue-ended-early",
        deprecated: "Command Options such as: '{{{opt}}: {{value}}}' have been deprecated. Instead write this as an assertion: " + (cmd('should', '\'{{assertion}}\'')) + ".",
        invalid_command: "Could not find a command for: '{{name}}'.\n\nAvailable commands are: {{cmds}}.\n",
        method_not_implemented: "The method {{method}} is not yet implemented",
        module_not_registered: "$Cypress.Module: {{name}} not registered.",
        no_cy: "Cypress.cy is undefined. You may be trying to query outside of a running test. Cannot call Cypress.$()",
        no_sandbox: "Could not access the Server, Routes, Stub, Spies, or Mocks. Check to see if your application is loaded and is visible. Please open an issue if you see this message.",
        no_runner: "Cannot call Cypress#run without a runner instance.",
        no_subject: "Subject is {{subject}}. You cannot call " + (cmd('{{cmd}}')) + " without a subject.",
        orphan: (cmd('{{cmd}}')) + " is a child command which operates on an existing subject.  Child commands must be called after a parent command.",
        outside_test: "Cypress cannot execute commands outside a running test.\nThis usually happens when you accidentally write commands outside an it(...) test.\nIf that is the case, just move these commands inside an 'it(...)' test.\nCheck your test file for errors.\n\nhttps://on.cypress.io/cannot-execute-commands-outside-test",
        outside_test_with_cmd: "Cannot call \"" + (cmd('{{cmd}}')) + " outside a running test.\nThis usually happens when you accidentally write commands outside an it(...) test.\nIf that is the case, just move these commands inside an 'it(...)' test.\nCheck your test file for errors.\n\nhttps://on.cypress.io/cannot-execute-commands-outside-test",
        retry_timed_out: "Timed out retrying: {{error}}"
      },
      mocha: {
        async_timed_out: "Timed out after '{{ms}}ms'. The done() callback was never invoked!",
        invalid_interface: "Invalid mocha interface '{{name}}'",
        timed_out: "Cypress command timeout of '{{ms}}ms' exceeded."
      },
      navigation: {
        loading_failed: "Loading the new page failed.",
        timed_out: "Timed out after waiting '{{ms}}ms' for your remote page to load."
      },
      ng: {
        no_global: "Angular global (window.angular) was not found in your window. You cannot use " + (cmd('ng')) + " methods without angular."
      },
      reload: {
        invalid_arguments: (cmd('reload')) + " can only accept a boolean or options as its arguments."
      },
      request: {
        auth_invalid: (cmd('request')) + " must be passed an object literal for the 'auth' option.",
        cookies_invalid: (cmd('request')) + " requires cookies to be true, or an object literal.",
        gzip_invalid: (cmd('request')) + " requires gzip to be a boolean.",
        headers_invalid: (cmd('request')) + " requires headers to be an object literal.",
        invalid_method: (cmd('request')) + " was called with an invalid method: '{{method}}'.  Method can only be: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS",
        loading_failed: (cmd('request')) + " failed:\n\nThe response from the remote server was:\n\n  > \"{{error}}\"\n\nThe request parameters were:\n  Method: {{method}}\n  URL: {{url}}\n  {{body}}\n  {{headers}}",
        status_invalid: (cmd('request')) + " failed because the response had the status code: {{status}}",
        timed_out: (cmd('request')) + " timed out waiting {{timeout}}ms for a response. No response ever occured.",
        url_missing: (cmd('request')) + " requires a url. You did not provide a url.",
        url_invalid: (cmd('request')) + " must be provided a fully qualified url - one that begins with 'http'. By default " + (cmd('request')) + " will use either the current window's origin or the 'baseUrl' in cypress.json. Neither of those values were present.",
        url_wrong_type: (cmd('request')) + " requires the url to be a string."
      },
      route: {
        failed_prerequisites: (cmd('route')) + " cannot be invoked before starting the " + (cmd('server')),
        invalid_arguments: (cmd('route')) + " was not provided any arguments. You must provide valid arguments.",
        method_invalid: (cmd('route')) + " was called with an invalid method: '{{method}}'.  Method can only be: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS",
        response_invalid: (cmd('route')) + " cannot accept an undefined or null response. It must be set to something, even an empty string will work.",
        url_invalid: (cmd('route')) + " was called with a invalid url. Url must be either a string or regular expression.",
        url_missing: (cmd('route')) + " must be called with a url. It can be a string or regular expression."
      },
      select: {
        disabled: (cmd('select')) + " failed because this element is currently disabled:\n\n{{node}}",
        invalid_element: (cmd('select')) + " can only be called on a <select>. Your subject is a: {{node}}",
        invalid_multiple: (cmd('select')) + " was called with an array of arguments but does not have a 'multiple' attribute set.",
        multiple_elements: (cmd('select')) + " can only be called on a single <select>. Your subject contained {{num}} elements.",
        multiple_matches: (cmd('select')) + " matched more than one option by value or text: {{value}}",
        no_matches: (cmd('select')) + " failed because it could not find a single <option> with value or text matching: '{{value}}'",
        option_disabled: (cmd('select')) + " failed because this <option> you are trying to select is currently disabled:\n\n{{node}}"
      },
      server: {
        invalid_argument: (cmd('server')) + " accepts only an object literal as its argument.",
        unavailable: "The XHR server is unavailable or missing. This should never happen and likely is a bug. Open an issue if you see this message."
      },
      setCookie: {
        invalid_arguments: (cmd('setCookie')) + " must be passed two string arguments for name and value."
      },
      spread: {
        invalid_type: (cmd('spread')) + " requires the existing subject be an array."
      },
      submit: {
        multiple_forms: (cmd('submit')) + " can only be called on a single form. Your subject contained {{num}} form elements.",
        not_on_form: (cmd('submit')) + " can only be called on a <form>. Your subject {{word}} a: {{node}}"
      },
      type: {
        empty_string: (cmd('type')) + " cannot accept an empty String. You need to actually type something.",
        invalid: "Special character sequence: '{{chars}}' is not recognized. Available sequences are: {{allChars}}",
        multiple_elements: (cmd('type')) + " can only be called on a single textarea or :text. Your subject contained {{num}} elements.",
        not_on_text_field: (cmd('type')) + " can only be called on textarea or :text. Your subject is a: {{node}}",
        tab: "{tab} isn't a supported character sequence. You'll want to use the command " + (cmd('tab')) + ", which is not ready yet, but when it is done that's what you'll use.",
        wrong_type: (cmd('type')) + " can only accept a String or Number. You passed in: '{{chars}}'"
      },
      viewport: {
        bad_args: (cmd('viewport')) + " can only accept a string preset or a width and height as numbers.",
        dimensions_out_of_range: (cmd('viewport')) + " width and height must be between 200px and 3000px.",
        empty_string: (cmd('viewport')) + " cannot be passed an empty string.",
        invalid_orientation: (cmd('viewport')) + " can only accept '{{all}}' as valid orientations. Your orientation was: '{{orientation}}'",
        missing_preset: (cmd('viewport')) + " could not find a preset for: '{{preset}}'. Available presets are: {{presets}}"
      },
      visit: {
        invalid_1st_arg: (cmd('visit')) + " must be called with a string as its 1st argument",
        loading_failed: (cmd('visit')) + " failed to load the remote page: {{url}}"
      },
      wait: {
        alias_invalid: "'{{prop}}' is not a valid alias property. Are you trying to ask for the first request? If so write @{{str}}.request",
        fn_deprecated: (cmd('wait', 'fn')) + " has been deprecated. Instead just change this command to be " + (cmd('should', 'fn')) + ".",
        invalid_1st_arg: (cmd('wait')) + " must be invoked with either a number or an alias for a route.",
        invalid_alias: (cmd('wait')) + " can only accept aliases for routes.\nThe alias: '{{alias}}' did not match a route.",
        invalid_arguments: (cmd('wait')) + " was passed invalid arguments. You cannot pass multiple strings. If you're trying to wait for multiple routes, use an array.",
        timed_out: (cmd('wait')) + " timed out waiting {{timeout}}ms for the {{num}} {{type}} to the route: '{{alias}}'. No {{type}} ever occured."
      },
      window: {
        iframe_doc_undefined: "The remote iframe's document is undefined",
        iframe_undefined: "The remote iframe is undefined"
      },
      within: {
        invalid_argument: (cmd('within')) + " must be called with a function."
      },
      xhr: {
        aborted: "This XHR was aborted by your code -- check this stack trace below.",
        missing: "XMLHttpRequest#xhr is missing.",
        network_error: "The network request for this XHR could not be made. Check your console for the reason."
      }
    };
  })($Cypress);

}).call(this);
;
(function() {
  var slice = [].slice;

  (function($Cypress, _) {
    var splice;
    splice = function(index) {
      return this._events.splice(index, 1);
    };
    return $Cypress.extend({
      event: function(name) {
        if (!this._events) {
          return;
        }
        return _.pluck(this._events[name], "callback");
      },
      invoke: function() {
        var args, events, name;
        name = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        if (!(events = this.event(name))) {
          return;
        }
        return _.map(events, (function(_this) {
          return function(event) {
            return event.apply(_this.cy, args);
          };
        })(this));
      },
      trigger: function(name) {
        var event, events, i, len;
        if (!(events = this._events && this._events[name])) {
          return;
        }
        for (i = 0, len = events.length; i < len; i++) {
          event = events[i];
          event.ctx = this.cy;
        }
        return Backbone.Events.trigger.apply(this, arguments);
      }
    });
  })($Cypress, _);

}).call(this);
;
(function() {
  $Cypress.Keyboard = (function($Cypress, _, Promise, bililiteRange) {
    var charsBetweenCurlyBraces;
    charsBetweenCurlyBraces = /({.+?})/;
    return {
      charCodeMap: {
        33: 49,
        64: 50,
        35: 51,
        36: 52,
        37: 53,
        94: 54,
        38: 55,
        42: 56,
        40: 57,
        41: 48,
        59: 186,
        58: 186,
        61: 187,
        43: 187,
        44: 188,
        60: 188,
        45: 189,
        95: 189,
        46: 190,
        62: 190,
        47: 191,
        63: 191,
        96: 192,
        126: 192,
        91: 219,
        123: 219,
        92: 220,
        124: 220,
        93: 221,
        125: 221,
        39: 222,
        34: 222
      },
      specialChars: {
        "{selectall}": function(el, options) {
          return options.rng.bounds('all').select();
        },
        "{del}": function(el, options) {
          var bounds, rng;
          rng = options.rng;
          bounds = rng.bounds();
          if (this.boundsAreEqual(bounds)) {
            rng.bounds([bounds[0], bounds[0] + 1]);
          }
          options.charCode = 46;
          options.keypress = false;
          options.textInput = false;
          return this.ensureKey(el, null, options, function() {
            var prev;
            prev = rng.all();
            rng.text("", "end");
            if (prev === rng.all()) {
              return options.input = false;
            }
          });
        },
        "{backspace}": function(el, options) {
          var bounds, rng;
          rng = options.rng;
          bounds = rng.bounds();
          if (this.boundsAreEqual(bounds)) {
            rng.bounds([bounds[0] - 1, bounds[0]]);
          }
          options.charCode = 8;
          options.keypress = false;
          options.textInput = false;
          return this.ensureKey(el, null, options, function() {
            var prev;
            prev = rng.all();
            rng.text("", "end");
            if (prev === rng.all()) {
              return options.input = false;
            }
          });
        },
        "{esc}": function(el, options) {
          options.charCode = 27;
          options.keypress = false;
          options.textInput = false;
          options.input = false;
          return this.ensureKey(el, null, options);
        },
        "{{}": function(el, options) {
          options.key = "{";
          return this.typeKey(el, options.key, options);
        },
        "{enter}": function(el, options) {
          var rng;
          rng = options.rng;
          options.charCode = 13;
          options.textInput = false;
          options.input = false;
          return this.ensureKey(el, "\n", options, function() {
            var changed;
            rng.insertEOL();
            changed = options.prev !== rng.all();
            return options.onEnterPressed(changed, options.id);
          });
        },
        "{leftarrow}": function(el, options) {
          var bounds, rng;
          rng = options.rng;
          bounds = rng.bounds();
          options.charCode = 37;
          options.keypress = false;
          options.textInput = false;
          options.input = false;
          return this.ensureKey(el, null, options, function() {
            var left, right;
            switch (false) {
              case !this.boundsAreEqual(bounds):
                left = bounds[0] - 1;
                right = left;
                break;
              case !(bounds[0] > 0):
                left = bounds[0];
                right = left;
                break;
              default:
                left = 0;
                right = 0;
            }
            return rng.bounds([left, right]);
          });
        },
        "{rightarrow}": function(el, options) {
          var bounds, rng;
          rng = options.rng;
          bounds = rng.bounds();
          options.charCode = 39;
          options.keypress = false;
          options.textInput = false;
          options.input = false;
          return this.ensureKey(el, null, options, function() {
            var left, right;
            switch (false) {
              case !this.boundsAreEqual(bounds):
                left = bounds[0] + 1;
                right = left;
                break;
              default:
                right = bounds[1];
                left = right;
            }
            return rng.bounds([left, right]);
          });
        }
      },
      boundsAreEqual: function(bounds) {
        return bounds[0] === bounds[1];
      },
      type: function(options) {
        var bililiteRangeSelection, el, error, error1, index, keys, promises, resetBounds, rng, selection;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          delay: 10,
          onEvent: function() {},
          onBeforeType: function() {},
          onTypeChange: function() {},
          onEnterPressed: function() {},
          onNoMatchingSpecialChars: function() {}
        });
        el = options.$el.get(0);
        bililiteRangeSelection = el.bililiteRangeSelection;
        rng = bililiteRange(el).bounds("selection");
        options.prev = rng.all();
        resetBounds = function(start, end) {
          var bounds, len;
          if ((start != null) && (end != null)) {
            bounds = [start, end];
          } else {
            len = rng.length();
            bounds = [len, len];
          }
          if (!_.isEqual(rng._bounds, bounds)) {
            el.bililiteRangeSelection = bounds;
            return rng.bounds(bounds);
          }
        };
        if (bililiteRangeSelection) {
          rng.bounds(bililiteRangeSelection);
        } else {
          try {
            if ("selectionStart" in el) {
              el.selectionStart;
            } else {
              resetBounds();
            }
          } catch (error) {
            try {
              selection = el.ownerDocument.getSelection().toString();
              index = options.$el.val().indexOf(selection);
              if (selection.length && index > -1) {
                resetBounds(index, selection.length);
              } else {
                resetBounds();
              }
            } catch (error1) {
              resetBounds();
            }
          }
        }
        keys = options.chars.split(charsBetweenCurlyBraces);
        options.onBeforeType(this.countNumIndividualKeyStrokes(keys));
        promises = [];
        return Promise.each(keys, (function(_this) {
          return function(key) {
            return _this.typeChars(el, rng, key, promises, options);
          };
        })(this)).cancellable().then((function(_this) {
          return function() {
            var sel;
            if (_this.expectedValueDoesNotMatchCurrentValue(options.prev, rng)) {
              options.onTypeChange();
            }
            if (sel = options.window.getSelection()) {
              return sel.removeAllRanges();
            }
          };
        })(this))["catch"](Promise.CancellationError, function(err) {
          _(promises).invoke("cancel");
          throw err;
        });
      },
      countNumIndividualKeyStrokes: function(keys) {
        return _.reduce(keys, function(memo, chars) {
          if (charsBetweenCurlyBraces.test(chars)) {
            return memo + 1;
          } else {
            return memo + chars.length;
          }
        }, 0);
      },
      typeChars: function(el, rng, chars, promises, options) {
        var p;
        options = _.clone(options);
        options.rng = rng;
        if (charsBetweenCurlyBraces.test(chars)) {
          p = Promise.resolve(this.handleSpecialChars(el, chars, options)).delay(options.delay).cancellable();
          promises.push(p);
          return p;
        } else {
          return Promise.each(chars.split(""), (function(_this) {
            return function(char) {
              p = Promise.resolve(_this.typeKey(el, char, options)).delay(options.delay).cancellable();
              promises.push(p);
              return p;
            };
          })(this));
        }
      },
      getCharCode: function(key) {
        var code, ref;
        code = key.charCodeAt(0);
        return (ref = this.charCodeMap[code]) != null ? ref : code;
      },
      expectedValueDoesNotMatchCurrentValue: function(expected, rng) {
        return expected !== rng.all();
      },
      moveCaretToEnd: function(rng) {
        var len;
        len = rng.length();
        return rng.bounds([len, len]);
      },
      simulateKey: function(el, eventType, key, options) {
        var args, charCode, charCodeAt, dispatched, event, keyCode, keys, otherKeys, ref, ref1, ref2, which;
        if (options[eventType] === false) {
          return true;
        }
        key = (ref = options.key) != null ? ref : key;
        keys = true;
        otherKeys = true;
        event = new Event(eventType, {
          bubbles: true,
          cancelable: eventType !== "input"
        });
        switch (eventType) {
          case "keydown":
          case "keyup":
            charCodeAt = (ref1 = options.charCode) != null ? ref1 : this.getCharCode(key.toUpperCase());
            charCode = 0;
            keyCode = charCodeAt;
            which = charCodeAt;
            break;
          case "keypress":
            charCodeAt = (ref2 = options.charCode) != null ? ref2 : this.getCharCode(key);
            charCode = charCodeAt;
            keyCode = charCodeAt;
            which = charCodeAt;
            break;
          case "textInput":
            charCode = 0;
            keyCode = 0;
            which = 0;
            otherKeys = false;
            _.extend(event, {
              data: key
            });
            break;
          case "input":
            keys = false;
            otherKeys = false;
        }
        if (otherKeys) {
          _.extend(event, {
            altKey: false,
            ctrlKey: false,
            location: 0,
            metaKey: false,
            repeat: false,
            shiftKey: false
          });
        }
        if (keys) {
          _.extend(event, {
            charCode: charCode,
            detail: 0,
            keyCode: keyCode,
            layerX: 0,
            layerY: 0,
            pageX: 0,
            pageY: 0,
            view: options.window,
            which: which
          });
        }
        dispatched = el.dispatchEvent(event);
        args = [options.id, key, eventType, dispatched];
        if (charCodeAt) {
          args.push(charCodeAt);
        }
        options.onEvent.apply(this, args);
        return dispatched;
      },
      updateValue: function(rng, key) {
        return rng.text(key, "end");
      },
      typeKey: function(el, key, options) {
        var after;
        if (after = options.afterKey) {
          if (this.expectedValueDoesNotMatchCurrentValue(after, options.rng)) {
            this.moveCaretToEnd(options.rng);
          }
        }
        return this.ensureKey(el, key, options, function() {
          return this.updateValue(options.rng, key);
        });
      },
      ensureKey: function(el, key, options, fn) {
        options.id = _.uniqueId("char");
        options.beforeKey = options.rng.all();
        if (this.simulateKey(el, "keydown", key, options)) {
          if (this.simulateKey(el, "keypress", key, options)) {
            if (this.simulateKey(el, "textInput", key, options)) {
              if (fn) {
                fn.call(this);
              }
              this.simulateKey(el, "input", key, options);
              options.afterKey = options.rng.all();
            }
          }
        }
        return this.simulateKey(el, "keyup", key, options);
      },
      handleSpecialChars: function(el, chars, options) {
        var allChars, fn;
        if (fn = this.specialChars[chars]) {
          options.key = chars;
          return fn.call(this, el, options);
        } else {
          allChars = _.keys(this.specialChars).join(", ");
          return options.onNoMatchingSpecialChars(chars, allChars);
        }
      }
    };
  })($Cypress, _, Promise, bililiteRange);

}).call(this);
;
(function() {
  $Cypress.LocalStorage = (function($Cypress, _) {
    var eclRegExp, specialKeywords;
    eclRegExp = /^ecl-/;
    specialKeywords = /(debug)/;
    return {
      localStorage: null,
      remoteStorage: null,
      clear: function(keys, local, remote) {
        var storages;
        keys = _.compact([].concat(keys));
        if (local == null) {
          local = this.localStorage;
        }
        if (remote == null) {
          remote = this.remoteStorage;
        }
        storages = _.compact([local, remote]);
        return _.each(storages, (function(_this) {
          return function(storage) {
            return _.chain(storage).keys().reject(_this._isSpecialKeyword).reject(_this._isEclectusItem).each(function(item) {
              if (keys.length) {
                return _this._ifItemMatchesAnyKey(item, keys, function(key) {
                  return _this._removeItem(storage, key);
                });
              } else {
                return _this._removeItem(storage, item);
              }
            });
          };
        })(this));
      },
      setStorages: function(local, remote) {
        this.localStorage = local;
        this.remoteStorage = remote;
        return this;
      },
      unsetStorages: function() {
        this.localStorage = this.remoteStorage = null;
        return this;
      },
      _removeItem: function(storage, item) {
        return storage.removeItem(item);
      },
      _isSpecialKeyword: function(item) {
        return specialKeywords.test(item);
      },
      _isEclectusItem: function(item) {
        return eclRegExp.test(item);
      },
      _normalizeRegExpOrString: function(key) {
        switch (false) {
          case !_.isRegExp(key):
            return key;
          case !_.isString(key):
            return new RegExp("^" + key + "$");
        }
      },
      _ifItemMatchesAnyKey: function(item, keys, fn) {
        var i, key, len, re;
        for (i = 0, len = keys.length; i < len; i++) {
          key = keys[i];
          re = this._normalizeRegExpOrString(key);
          if (re.test(item)) {
            return fn(item);
          }
        }
      }
    };
  })($Cypress, _);

}).call(this);
;
(function() {
  var slice = [].slice;

  $Cypress.Location = (function($Cypress, _, Uri) {
    var $Location, reHttp, reLocalHost, reWww;
    reHttp = /^https?:\/\//;
    reWww = /^www/;
    reLocalHost = /^(localhost|0\.0\.0\.0|127\.0\.0\.1)/;
    $Location = (function() {
      function $Location(remote) {
        var fqdn, remoteHost;
        remote = new Uri(remote);
        if (fqdn = this.getFqdn(remote)) {
          remote = new Uri(fqdn);
        } else {
          remoteHost = $Cypress.Cookies.getRemoteHost();
          if (remoteHost === "<root>") {
            remoteHost = new Uri("");
          } else {
            remoteHost = new Uri(remoteHost);
          }
          remote.setProtocol(remoteHost.protocol());
          remote.setHost(remoteHost.host());
          remote.setPort(remoteHost.port());
        }
        this.remote = remote;
      }

      $Location.prototype.getFqdn = function(url) {
        var path;
        url = new Uri(url);
        path = url.path().slice(1);
        if (reHttp.test(path)) {
          return path;
        }
      };

      $Location.prototype.getHash = function() {
        var hash;
        if (hash = this.remote.anchor()) {
          return "#" + hash;
        } else {
          return "";
        }
      };

      $Location.prototype.getHref = function() {
        return this.getToString();
      };

      $Location.prototype.getHost = function() {
        return _([this.remote.host(), this.remote.port()]).compact().join(":");
      };

      $Location.prototype.getHostName = function() {
        return this.remote.host();
      };

      $Location.prototype.getOrigin = function() {
        return this.remote.origin();
      };

      $Location.prototype.getProtocol = function() {
        return this.remote.protocol() + ":";
      };

      $Location.prototype.getPathName = function() {
        return this.remote.path() || "/";
      };

      $Location.prototype.getPort = function() {
        return this.remote.port();
      };

      $Location.prototype.getSearch = function() {
        return this.remote.query();
      };

      $Location.prototype.getToString = function() {
        var anchor, path, query, s;
        s = this.remote.origin();
        if (path = this.remote.path()) {
          s += path;
        }
        if (query = this.remote.query()) {
          if (!_.str.include(query, "?")) {
            s += "?";
          }
          s += query;
        }
        if (anchor = this.remote.anchor()) {
          if (!_.str.include(anchor, "#")) {
            s += "#";
          }
          s += anchor;
        }
        return s;
      };

      $Location.prototype.getObject = function() {
        return {
          hash: this.getHash(),
          href: this.getHref(),
          host: this.getHost(),
          hostname: this.getHostName(),
          origin: this.getOrigin(),
          pathname: this.getPathName(),
          port: this.getPort(),
          protocol: this.getProtocol(),
          search: this.getSearch(),
          toString: _.bind(this.getToString, this)
        };
      };

      $Location.override = function(Cypress, win, navigated) {
        return _.each(["back", "forward", "go", "pushState", "replaceState"], function(attr) {
          var orig, ref;
          if (!(orig = (ref = win.history) != null ? ref[attr] : void 0)) {
            return;
          }
          return win.history[attr] = function() {
            orig.apply(this, arguments);
            return navigated(attr, arguments);
          };
        });
      };

      $Location.createInitialRemoteSrc = function(url) {
        var remoteHost;
        if (!reHttp.test(url)) {
          remoteHost = "<root>";
        } else {
          url = new Uri(url);
          remoteHost = url.origin();
          url = url.toString().replace(remoteHost, "");
        }
        $Cypress.Cookies.setInitialRequest(remoteHost);
        return "/" + _.ltrim(url, "/");
      };

      $Location.isFullyQualifiedUrl = function(url) {
        return reHttp.test(url);
      };

      $Location.missingProtocolAndHostIsLocalOrWww = function(url) {
        var str;
        str = url.toString();
        if (!(reLocalHost.test(str) || reWww.test(str) || this.isUrlLike(str))) {
          return false;
        }
        switch (url.protocol()) {
          case "":
            return true;
          case "localhost":
            url.setPort(url.host());
            url.setHost(url.protocol());
            return true;
          default:
            return false;
        }
      };

      $Location.isUrlLike = function(url) {
        url = url.split("/")[0].split(".");
        return url.length === 3 || url.length === 4;
      };

      $Location.handleRelativeUrl = function(url) {
        var p;
        url = new Uri(url);
        p = url.path();
        p = p !== "/" ? p : "";
        url.setPath(url.host() + p);
        url.setHost("");
        return url;
      };

      $Location.normalizeUrl = function(url) {
        url = _.ltrim(url, "/");
        if (reHttp.test(url) || reWww.test(url) || reLocalHost.test(url) || this.isUrlLike(url)) {
          url = new Uri(url);
        } else {
          url = this.handleRelativeUrl(url);
        }
        if (this.missingProtocolAndHostIsLocalOrWww(url)) {
          url.setProtocol("http");
        }
        if (url.protocol() && !url.path()) {
          url.addTrailingSlash();
        }
        return _.ltrim(url.toString(), "/");
      };

      $Location.getRemoteUrl = function(url, baseUrl) {
        if (baseUrl && !this.isFullyQualifiedUrl(url)) {
          url = this.prependBaseUrl(url, baseUrl);
        }
        return this.normalizeUrl(url);
      };

      $Location.prependBaseUrl = function(url, baseUrl) {
        return [_.trim(baseUrl, "/"), _.trim(url, "/")].join("/");
      };

      $Location.isAbsoluteRelative = function(segment) {
        return segment && segment[0] === "/";
      };

      $Location.join = function() {
        var from, last, paths, rest;
        from = arguments[0], rest = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        last = _.last(rest);
        paths = _.reduce(rest, function(memo, segment) {
          if (segment === last) {
            memo.push(_.ltrim(segment, "/"));
          } else {
            memo.push(_.trim(segment, "/"));
          }
          return memo;
        }, [_.rtrim(from, "/")]);
        return paths.join("/");
      };

      $Location.resolve = function(from, to) {
        var origin;
        if (this.isFullyQualifiedUrl(to)) {
          return to;
        }
        if (this.isAbsoluteRelative(to)) {
          origin = this.parse(from).origin;
          return this.join(origin, to);
        } else {
          return this.join(from, to);
        }
      };

      $Location.create = function(remote) {
        var location;
        location = new $Location(remote);
        return location.getObject();
      };

      $Location.parse = function(url) {
        var location;
        location = new $Location(url);
        location.remote = new Uri(url);
        return location.getObject();
      };

      return $Location;

    })();
    return $Location;
  })($Cypress, _, Uri);

}).call(this);
;
(function() {
  var slice = [].slice;

  $Cypress.Log = (function($Cypress, _, Backbone) {
    var $Log, CypressErrorRe, klassMethods, parentOrChildRe;
    CypressErrorRe = /(AssertionError|CypressError)/;
    parentOrChildRe = /parent|child/;
    klassMethods = {
      agent: function(Cypress, cy, obj) {
        if (obj == null) {
          obj = {};
        }
        _.defaults(obj, {
          name: "agent"
        });
        return this.log("agent", obj);
      },
      route: function(Cypress, cy, obj) {
        if (obj == null) {
          obj = {};
        }
        _.defaults(obj, {
          name: "route"
        });
        return this.log("route", obj);
      },
      command: function(Cypress, cy, obj) {
        var current, ref;
        if (obj == null) {
          obj = {};
        }
        current = cy.prop("current");
        _.defaults(obj, current != null ? current.pick("name", "type") : void 0);
        if (!parentOrChildRe.test(obj.type)) {
          obj.type = current.hasPreviouslyLinkedCommand() ? "child" : "parent";
        }
        _.defaults(obj, {
          event: false,
          onRender: function() {},
          onConsole: function() {
            var ret;
            ret = $Cypress.Utils.hasElement(current.get("subject")) ? $Cypress.Utils.getDomElements(current.get("subject")) : current.get("subject");
            return {
              "Returned": ret
            };
          }
        });
        obj.message = $Cypress.Utils.stringify((ref = obj.message) != null ? ref : current.get("args"));
        if (_.isFunction(obj.type)) {
          obj.type = obj.type.call(cy, current, cy.prop("subject"));
        }
        return this.log("command", obj);
      },
      log: function(Cypress, cy, instrument, obj) {
        var log, ref;
        _.defaults(obj, {
          url: cy["private"]("url"),
          hookName: cy["private"]("hookName"),
          testId: cy["private"]("runnable").id,
          viewportWidth: Cypress.config("viewportWidth"),
          viewportHeight: Cypress.config("viewportHeight"),
          referencesAlias: void 0,
          alias: void 0,
          aliasType: void 0,
          message: void 0,
          onRender: function() {},
          onConsole: function() {}
        });
        obj.instrument = instrument;
        log = new $Log(Cypress, obj);
        log.wrapOnConsole();
        if (_.any(Cypress.invoke("before:log", log), function(ret) {
          return ret === false;
        })) {
          return;
        }
        if ((ref = cy.prop("current")) != null) {
          ref.log(log);
        }
        Cypress.trigger("log", log);
        return log;
      }
    };
    $Log = (function() {
      function $Log(Cypress1, obj) {
        var err;
        this.Cypress = Cypress1;
        if (obj == null) {
          obj = {};
        }
        _.defaults(obj, {
          state: "pending"
        });
        this.set(obj);
        if (this.get("snapshot")) {
          this.snapshot();
        }
        if (this.get("end")) {
          this.end();
        }
        if (err = this.get("error")) {
          this.error(err);
        }
      }

      $Log.prototype.get = function(attr) {
        return this.attributes[attr];
      };

      $Log.prototype.unset = function(key) {
        return this.set(key, void 0);
      };

      $Log.prototype.set = function(key, val) {
        var obj;
        if (_.isString(key)) {
          obj = {};
          obj[key] = val;
        } else {
          obj = key;
        }
        if (obj.alias) {
          _.defaults(obj, {
            aliasType: obj.$el ? "dom" : "primitive"
          });
        }
        if (this.attributes == null) {
          this.attributes = {};
        }
        _.extend(this.attributes, obj);
        if (obj && _.isFunction(obj.onConsole)) {
          this.wrapOnConsole();
        }
        if (obj && obj.$el) {
          this.setElAttrs();
        }
        this.trigger("attrs:changed", this.attributes);
        return this;
      };

      $Log.prototype.pick = function() {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        args.unshift(this.attributes);
        return _.pick.apply(_, args);
      };

      $Log.prototype.publicInterface = function() {
        return {
          get: _.bind(this.get, this),
          on: _.bind(this.on, this),
          off: _.bind(this.off, this),
          pick: _.bind(this.pick, this),
          attributes: this.attributes
        };
      };

      $Log.prototype.snapshot = function(name, options) {
        var fn, next, obj, ref, snapshots;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          at: null,
          next: null
        });
        obj = {
          name: name,
          state: this.Cypress.createSnapshot(this.get("$el"))
        };
        snapshots = (ref = this.get("snapshots")) != null ? ref : [];
        snapshots[options.at || snapshots.length] = obj;
        this.set("snapshots", snapshots);
        if (next = options.next) {
          fn = this.snapshot;
          this.snapshot = function() {
            delete this.snapshot;
            return fn.call(this, next);
          };
        }
        return this;
      };

      $Log.prototype.error = function(err) {
        this.set({
          error: err,
          state: "failed"
        });
        return this;
      };

      $Log.prototype.end = function() {
        this.set({
          end: true,
          state: "passed"
        });
        return this;
      };

      $Log.prototype.getError = function(err) {
        if (CypressErrorRe.test(err.name)) {
          return err.toString();
        } else {
          return err.stack;
        }
      };

      $Log.prototype.setElAttrs = function() {
        var $el, obj;
        $el = this.get("$el");
        if (!$el) {
          return;
        }
        obj = {
          highlightAttr: this.Cypress.highlightAttr,
          numElements: $el.length,
          visible: $el.length === $el.filter(":visible").length
        };
        return this.set(obj);
      };

      $Log.prototype.merge = function(log) {
        var ref, unsets;
        unsets = (ref = _.chain(this.attributes).keys()).without.apply(ref, _(log.attributes).keys()).value();
        _.each(unsets, (function(_this) {
          return function(unset) {
            return _this.unset(unset);
          };
        })(this));
        return this.set(log.attributes);
      };

      $Log.prototype.reduceMemory = function() {
        this.off();
        return this.attributes = _.omit(this.attributes, _.isObject);
      };

      $Log.prototype._shouldAutoEnd = function() {
        return this.get("autoEnd") !== false && this.get("end") !== true && this.get("event") === false && this.get("instrument") === "command";
      };

      $Log.prototype.finish = function() {
        if (this._shouldAutoEnd()) {
          return this.snapshot().end();
        }
      };

      $Log.prototype.wrapOnConsole = function() {
        var _this;
        _this = this;
        return this.attributes.onConsole = _.wrap(this.attributes.onConsole, function() {
          var args, consoleObj, err, key, orig;
          orig = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
          key = _this.get("event") ? "Event" : "Command";
          consoleObj = {};
          consoleObj[key] = _this.get("name");
          _.extend(consoleObj, orig.apply(this, args));
          if (err = _this.get("error")) {
            _.defaults(consoleObj, {
              Error: _this.getError(err)
            });
          }
          if (_this.get("instrument") === "command" && !this.snapshots) {
            consoleObj.Snapshot = "The snapshot is missing. Displaying current state of the DOM.";
          } else {
            delete consoleObj.Snapshot;
          }
          return consoleObj;
        });
      };

      $Log.create = function(Cypress, cy) {
        return _.each(klassMethods, function(fn, key) {
          return $Log[key] = _.partial(fn, Cypress, cy);
        });
      };

      return $Log;

    })();
    _.extend($Log.prototype, Backbone.Events);
    $Cypress.extend({
      command: function(obj) {
        if (obj == null) {
          obj = {};
        }
        $Cypress.Utils.warning("Cypress.command() is deprecated. Please update and use: Cypress.Log.command()");
        return $Log.command(obj);
      }
    });
    return $Log;
  })($Cypress, _, Backbone);

}).call(this);
;
(function() {
  var slice = [].slice;

  $Cypress.Mocha = (function($Cypress, _, Mocha) {
    var $Mocha, runnableResetTimeout, runnableRun, runnerFail, runnerRun;
    runnerRun = Mocha.Runner.prototype.run;
    runnerFail = Mocha.Runner.prototype.fail;
    runnableRun = Mocha.Runnable.prototype.run;
    runnableResetTimeout = Mocha.Runnable.prototype.resetTimeout;
    $Mocha = (function() {
      function $Mocha(Cypress1, specWindow) {
        var ref, reporter;
        this.Cypress = Cypress1;
        reporter = (ref = $Cypress.reporter) != null ? ref : function() {};
        this.mocha = new Mocha({
          reporter: reporter,
          enableTimeouts: false
        });
        this.override();
        this.listeners();
        this.specWindow = specWindow;
        this.set(specWindow);
      }

      $Mocha.prototype.override = function() {
        this.patchRunnerFail();
        this.patchRunnableRun();
        this.patchRunnableResetTimeout();
        return this;
      };

      $Mocha.prototype.listeners = function() {
        this.listenTo(this.Cypress, "abort", (function(_this) {
          return function() {
            return _this.grep(/.*/);
          };
        })(this));
        this.listenTo(this.Cypress, "stop", (function(_this) {
          return function() {
            return _this.stop();
          };
        })(this));
        return this;
      };

      $Mocha.prototype.options = function(runner) {
        return runner.options(this.mocha.options);
      };

      $Mocha.prototype.grep = function(re) {
        return this.mocha.grep(re);
      };

      $Mocha.prototype.getRunner = function() {
        var _this;
        _this = this;
        Mocha.Runner.prototype.run = function() {
          _this.restoreRunnerRun();
          return this;
        };
        return this.mocha.run();
      };

      $Mocha.prototype.patchRunnerFail = function() {
        return Mocha.Runner.prototype.fail = _.wrap(runnerFail, function(orig, test, err) {
          if (Object.prototype.toString.call(err) !== "[object Error]") {
            return orig.call(this, test, err);
          }
          ++this.failures;
          test.state = "failed";
          return this.emit("fail", test, err);
        });
      };

      $Mocha.prototype.patchRunnableRun = function() {
        var Cypress, _this;
        _this = this;
        Cypress = this.Cypress;
        return Mocha.Runnable.prototype.run = _.wrap(runnableRun, function() {
          var args, invokedCy, orig, runnable;
          orig = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
          runnable = this;
          invokedCy = _.once(function() {
            return runnable._invokedCy = true;
          });
          this.fn = _.wrap(this.fn, function() {
            var args, e, error, orig, result, unbind;
            orig = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
            _this.listenTo(Cypress, "enqueue", invokedCy);
            unbind = function() {
              _this.stopListening(Cypress, "enqueue", invokedCy);
              return runnable.fn = orig;
            };
            try {
              result = orig.apply(this, args);
              unbind();
              if (runnable._invokedCy) {
                return Cypress.cy.prop("chain");
              }
              return result;
            } catch (error) {
              e = error;
              unbind();
              throw e;
            }
          });
          return orig.apply(this, args);
        });
      };

      $Mocha.prototype.patchRunnableResetTimeout = function() {
        return Mocha.Runnable.prototype.resetTimeout = _.wrap(runnableResetTimeout, function(orig) {
          var getErrPath, ms, runnable;
          runnable = this;
          ms = this.timeout() || 1e9;
          this.clearTimeout();
          getErrPath = function() {
            if (runnable.async) {
              return "mocha.async_timed_out";
            } else {
              return "mocha.timed_out";
            }
          };
          return this.timer = setTimeout(function() {
            var errMessage;
            errMessage = $Cypress.Utils.errMessageByPath(getErrPath(), {
              ms: ms
            });
            runnable.callback(new Error(errMessage));
            return runnable.timedOut = true;
          }, ms);
        });
      };

      $Mocha.prototype.set = function(contentWindow) {
        if (contentWindow.Mocha == null) {
          contentWindow.Mocha = Mocha;
        }
        if (contentWindow.mocha == null) {
          contentWindow.mocha = this.mocha;
        }
        this.clone(contentWindow);
        return this.ui(contentWindow, "bdd");
      };

      $Mocha.prototype.clone = function(contentWindow) {
        var mocha;
        mocha = contentWindow.mocha;
        this.mocha.suite.removeAllListeners();
        return this.mocha.suite = mocha.suite.clone();
      };

      $Mocha.prototype.ui = function(contentWindow, name) {
        var mocha;
        mocha = contentWindow.mocha;
        mocha.ui = function(name) {
          this._ui = Mocha.interfaces[name];
          if (!this._ui) {
            $Cypress.Utils.throwErrByPath("mocha.invalid_interface", {
              args: {
                name: name
              }
            });
          }
          this._ui = this._ui(this.suite);
          this.suite.emit('pre-require', contentWindow, null, this);
          return this;
        };
        return mocha.ui(name);
      };

      $Mocha.prototype.stop = function() {
        this.stopListening();
        this.restore();
        this.mocha.suite.removeAllListeners();
        this.mocha.suite.suites = [];
        this.mocha.suite.tests = [];
        this.mocha.suite = null;
        this.Cypress.mocha = null;
        delete this.specWindow.mocha;
        delete this.specWindow;
        delete this.mocha;
        return this;
      };

      $Mocha.prototype.restore = function() {
        this.restoreRunnerRun();
        this.restoreRunnerFail();
        this.restoreRunnableRun();
        this.restoreRunnableResetTimeout();
        return this;
      };

      $Mocha.prototype.restoreRunnableResetTimeout = function() {
        return Mocha.Runnable.prototype.resetTimeout = runnableResetTimeout;
      };

      $Mocha.prototype.restoreRunnerRun = function() {
        return Mocha.Runner.prototype.run = runnerRun;
      };

      $Mocha.prototype.restoreRunnerFail = function() {
        return Mocha.Runner.prototype.fail = runnerFail;
      };

      $Mocha.prototype.restoreRunnableRun = function() {
        return Mocha.Runnable.prototype.run = runnableRun;
      };

      _.extend($Mocha.prototype, Backbone.Events);

      $Mocha.create = function(Cypress, specWindow) {
        var existing;
        if (existing = Cypress.mocha) {
          existing.stopListening();
        }
        delete window.mocha;
        return Cypress.mocha = new $Mocha(Cypress, specWindow);
      };

      return $Mocha;

    })();
    return $Mocha;
  })($Cypress, _, Mocha);

}).call(this);
;
(function() {
  (function($Cypress, _, $, Promise, moment) {
    return $Cypress.extend({
      loadModule: function(name) {
        var module;
        module = this.modules[name];
        if (!module) {
          $Cypress.Utils.throwErrByPath("miscellaneous.module_not_registered", {
            args: {
              name: name
            }
          });
        }
        return module.call(this, this, _, $, Promise, moment);
      },
      loadModules: function(names) {
        if (names == null) {
          names = [];
        }
        if (names.length) {
          return _.each(names, (function(_this) {
            return function(name) {
              return _this.loadModule(name);
            };
          })(this));
        } else {
          return _.each(this.modules, (function(_this) {
            return function(value, key) {
              return _this.loadModule(key);
            };
          })(this));
        }
      }
    });
  })($Cypress, _, $, Promise, moment);

}).call(this);
;
(function() {
  $Cypress.Mouse = (function($Cypress, _, Promise) {
    var getClientX, getClientY, stopPropagation;
    stopPropagation = MouseEvent.prototype.stopPropagation;
    getClientX = function(coords, win) {
      return coords.x - win.pageXOffset;
    };
    getClientY = function(coords, win) {
      return coords.y - win.pageYOffset;
    };
    return {
      mouseDown: function($elToClick, coords, win) {
        var cancelled, mdownEvt;
        mdownEvt = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          view: win,
          clientX: getClientX(coords, win),
          clientY: getClientY(coords, win),
          buttons: 1,
          detail: 1
        });
        if (mdownEvt.buttons == null) {
          mdownEvt.buttons = 1;
        }
        mdownEvt.stopPropagation = function() {
          this._hasStoppedPropagation = true;
          return stopPropagation.apply(this, arguments);
        };
        cancelled = !$elToClick.get(0).dispatchEvent(mdownEvt);
        return {
          preventedDefault: cancelled,
          stoppedPropagation: !!mdownEvt._hasStoppedPropagation
        };
      },
      mouseUp: function($elToClick, coords, win) {
        var cancelled, mupEvt;
        mupEvt = new MouseEvent("mouseup", {
          bubbles: true,
          cancelable: true,
          view: win,
          clientX: getClientX(coords, win),
          clientY: getClientY(coords, win),
          buttons: 0,
          detail: 1
        });
        if (mupEvt.buttons == null) {
          mupEvt.buttons = 0;
        }
        mupEvt.stopPropagation = function() {
          this._hasStoppedPropagation = true;
          return stopPropagation.apply(this, arguments);
        };
        cancelled = !$elToClick.get(0).dispatchEvent(mupEvt);
        return {
          preventedDefault: cancelled,
          stoppedPropagation: !!mupEvt._hasStoppedPropagation
        };
      },
      click: function($elToClick, coords, win) {
        var cancelled, clickEvt;
        clickEvt = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: win,
          clientX: getClientX(coords, win),
          clientY: getClientY(coords, win),
          buttons: 0,
          detail: 1
        });
        if (clickEvt.buttons == null) {
          clickEvt.buttons = 0;
        }
        clickEvt.stopPropagation = function() {
          this._hasStoppedPropagation = true;
          return stopPropagation.apply(this, arguments);
        };
        cancelled = !$elToClick.get(0).dispatchEvent(clickEvt);
        return {
          preventedDefault: cancelled,
          stoppedPropagation: !!clickEvt._hasStoppedPropagation
        };
      }
    };
  })($Cypress, _, Promise);

}).call(this);
;
(function() {
  (function($Cypress, _) {
    return $Cypress.extend({
      options: function(obj) {
        if (this._options == null) {
          this._options = {};
        }
        return _.extend(this._options, obj);
      },
      option: function(key, val) {
        if (this._options == null) {
          this._options = {};
        }
        if (!val) {
          return this._options[key];
        } else {
          return this._options[key] = val;
        }
      }
    });
  })($Cypress, _);

}).call(this);
;
(function() {
  var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice;

  $Cypress.Runner = (function($Cypress, _) {
    var $Runner;
    $Runner = (function() {
      function $Runner(Cypress1, runner1) {
        this.Cypress = Cypress1;
        this.runner = runner1;
        this.initialize();
        this.listeners();
        this.override();
        if (this.runner.suite) {
          this.getRunnables();
        }
      }

      $Runner.prototype.fail = function(err, runnable) {
        if (runnable.state === "passed") {
          this.afterEachFailed(runnable, err);
        }
        return runnable.callback(err);
      };

      $Runner.prototype.initialize = function() {
        return this.runnables = [];
      };

      $Runner.prototype.listeners = function() {
        if (this.setListeners) {
          return;
        }
        this.setListeners = true;
        this.listenTo(this.Cypress, "fail", (function(_this) {
          return function(err, runnable) {
            return _this.fail(err, runnable);
          };
        })(this));
        this.listenTo(this.Cypress, "abort", (function(_this) {
          return function() {
            return _this.abort();
          };
        })(this));
        this.listenTo(this.Cypress, "stop", (function(_this) {
          return function() {
            return _this.stop();
          };
        })(this));
        return this;
      };

      $Runner.prototype.runnerListeners = function() {
        var Cypress, _this;
        if (this.setRunnerListeners) {
          return;
        }
        this.setRunnerListeners = true;
        Cypress = this.Cypress;
        _this = this;
        this.runner.on("start", function() {
          return Cypress.trigger("run:start");
        });
        this.runner.on("end", (function(_this) {
          return function() {
            Cypress.trigger("run:end");
            return _this.restore();
          };
        })(this));
        this.runner.on("suite", (function(_this) {
          return function(suite) {
            return Cypress.trigger("suite:start", _this.wrap(suite));
          };
        })(this));
        this.runner.on("suite end", (function(_this) {
          return function(suite) {
            Cypress.trigger("suite:end", _this.wrap(suite));
            return _.each(suite.ctx, function(value, key) {
              return delete suite.ctx[key];
            });
          };
        })(this));
        this.runner.on("hook", (function(_this) {
          return function(hook) {
            var hookName, test;
            hookName = _this.getHookName(hook);
            if (hookName === "before all" && hook.ctx.currentTest) {
              delete hook.ctx.currentTest;
            }
            test = _this.getTestFromHook(hook, hook.parent);
            hook.id = test.id;
            hook.ctx.currentTest = test;
            Cypress.set(hook, hookName);
            return Cypress.trigger("hook:start", _this.wrap(hook));
          };
        })(this));
        this.runner.on("hook end", (function(_this) {
          return function(hook) {
            var hookName, test;
            hookName = _this.getHookName(hook);
            if (hookName === "before each" && (test = hook.ctx.currentTest)) {
              Cypress.set(test, "test");
            }
            return Cypress.trigger("hook:end", _this.wrap(hook));
          };
        })(this));
        this.runner.on("test", (function(_this) {
          return function(test) {
            _this.test = test;
            Cypress.set(test, "test");
            return Cypress.trigger("test:start", _this.wrap(test));
          };
        })(this));
        this.runner.on("test end", (function(_this) {
          return function(test) {
            return Cypress.trigger("test:end", _this.wrap(test));
          };
        })(this));
        this.runner.on("pass", (function(_this) {
          return function(test) {
            return Cypress.trigger("mocha:pass", _this.wrap(test));
          };
        })(this));
        this.runner.on("pending", function(test) {
          if ($Cypress.isHeadless) {
            return Cypress.trigger("mocha:pending", _this.wrap(test));
          } else {
            test.state = "pending";
            return this.emit("test", test);
          }
        });
        return this.runner.on("fail", (function(_this) {
          return function(runnable, err) {
            if ($Cypress.isHeadless) {
              return Cypress.trigger("mocha:fail", _this.wrap(runnable), _this.wrapErr(err));
            } else {
              runnable.err = err;
              if (runnable.type === "hook") {
                return _this.hookFailed(runnable, err);
              }
            }
          };
        })(this));
      };

      $Runner.prototype.wrapErr = function(err) {
        return _.pick(err, "message", "type", "name", "stack", "fileName", "lineNumber", "columnNumber", "host", "uncaught", "actual", "expected", "showDiff");
      };

      $Runner.prototype.wrap = function(runnable) {
        var parent, r;
        r = _(runnable).pick("id", "title", "originalTitle", "root", "hookName", "err", "duration", "state", "failedFromHook", "timedOut", "async", "sync");
        if (parent = runnable.parent) {
          r.parent = this.wrap(parent);
        }
        return r;
      };

      $Runner.prototype.restore = function() {
        _.each([this.runnables, this.runner], (function(_this) {
          return function(obj) {
            return _this.removeAllListeners(obj);
          };
        })(this));
        return this.initialize();
      };

      $Runner.prototype.stop = function() {
        this.stopListening();
        this.restore();
        delete this.runner.hook;
        this.runner = this.tests = this.Cypress.runner = null;
        return this;
      };

      $Runner.prototype.removeAllListeners = function(obj) {
        var array;
        array = [].concat(obj);
        return _.invoke(array, "removeAllListeners");
      };

      $Runner.prototype.abort = function() {
        this.runner.abort();
        return this.runner.emit("end");
      };

      $Runner.prototype.options = function(options) {
        var re;
        if (options == null) {
          options = {};
        }
        if (re = options.grep) {
          return this.grep(re);
        }
      };

      $Runner.prototype.run = function(fn) {
        this.runnerListeners();
        return this.runner.run((function(_this) {
          return function(err) {
            if (fn) {
              return fn(err, _this.getTestResults());
            }
          };
        })(this));
      };

      $Runner.prototype.getTestResults = function() {
        return _(this.tests).map(function(test) {
          var obj;
          obj = _(test).pick("id", "duration", "state");
          obj.title = test.originalTitle;
          if (!obj.state) {
            obj.state = "skipped";
          }
          return obj;
        });
      };

      $Runner.prototype.getHookName = function(hook) {
        var name;
        name = hook.title.match(/\"(.+)\"/);
        return name && name[1];
      };

      $Runner.prototype.afterEachFailed = function(test, err) {
        test.state = "failed";
        test.err = err;
        return this.Cypress.trigger("test:end", this.wrap(test));
      };

      $Runner.prototype.hookFailed = function(hook, err) {
        var test;
        test = this.getTestFromHook(hook, hook.parent);
        test.err = err;
        test.state = "failed";
        test.duration = hook.duration;
        test.hookName = this.getHookName(hook);
        test.failedFromHook = true;
        return this.Cypress.trigger("test:end", this.wrap(test));
      };

      $Runner.prototype.getRunnables = function(options) {
        var i, len, ref, runnable;
        if (options == null) {
          options = {};
        }
        this.tests = [];
        _.defaults(options, {
          grep: this.grep(),
          iterate: true,
          pushRunnables: true,
          onRunnable: function() {}
        });
        if (this.runnables.length) {
          _.extend(options, {
            iterate: false,
            pushRunnables: false
          });
          ref = this.runnables;
          for (i = 0, len = ref.length; i < len; i++) {
            runnable = ref[i];
            this.process(runnable, options);
          }
          return null;
        } else {
          return this.iterateThroughRunnables(this.runner.suite, options);
        }
      };

      $Runner.prototype.iterateThroughRunnables = function(runnable, options) {
        return _.each([runnable.tests, runnable.suites], (function(_this) {
          return function(array) {
            return _.each(array, function(runnable) {
              return _this.process(runnable, options);
            });
          };
        })(this));
      };

      $Runner.prototype.process = function(runnable, options) {
        var any, matchesGrep;
        if (runnable.root) {
          return;
        }
        if (runnable.type == null) {
          runnable.type = "suite";
        }
        if (options.pushRunnables) {
          this.runnables.push(runnable);
        }
        matchesGrep = function(runnable, grep) {
          if ((runnable.matchesGrep == null) || (!_.isEqual(runnable.grepRe, grep))) {
            runnable.grepRe = grep;
            runnable.matchesGrep = grep.test(runnable.fullTitle());
          }
          return runnable.matchesGrep;
        };
        switch (runnable.type) {
          case "suite":
            any = this.anyTest(runnable, function(test) {
              return matchesGrep(test, options.grep);
            });
            if (any) {
              options.onRunnable(runnable);
            }
            break;
          case "test":
            if (matchesGrep(runnable, options.grep)) {
              options.onRunnable(runnable);
              this.tests.push(runnable);
            }
        }
        if (options.iterate) {
          return this.iterateThroughRunnables(runnable, options);
        }
      };

      $Runner.prototype.getTestByTitle = function(title) {
        return this.firstTest(this.runner.suite, function(test) {
          return test.title === title;
        });
      };

      $Runner.prototype.firstTest = function(suite, fn) {
        var i, j, len, len1, ref, ref1, test;
        ref = suite.tests;
        for (i = 0, len = ref.length; i < len; i++) {
          test = ref[i];
          if (fn(test)) {
            return test;
          }
        }
        ref1 = suite.suites;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          suite = ref1[j];
          if (test = this.firstTest(suite, fn)) {
            return test;
          }
        }
      };

      $Runner.prototype.anyTest = function(suite, fn) {
        var i, j, len, len1, ref, ref1, test;
        ref = suite.tests;
        for (i = 0, len = ref.length; i < len; i++) {
          test = ref[i];
          if (fn(test) === true) {
            return true;
          }
        }
        ref1 = suite.suites;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          suite = ref1[j];
          if (this.anyTest(suite, fn) === true) {
            return true;
          }
        }
        return false;
      };

      $Runner.prototype.grep = function(re) {
        var base;
        if (arguments.length) {
          return this.runner._grep = re;
        } else {
          return (base = this.runner)._grep != null ? base._grep : base._grep = /.*/;
        }
      };

      $Runner.prototype.ignore = function(runnable) {
        return runnable.pending = true;
      };

      $Runner.prototype.getTestFromHook = function(hook, suite) {
        var found, test;
        if (test = hook != null ? hook.ctx.currentTest : void 0) {
          return test;
        }
        if (hook != null ? hook.id : void 0) {
          found = this.firstTest(suite, (function(_this) {
            return function(test) {
              return hook.id === test.id;
            };
          })(this));
          if (found) {
            return found;
          }
        }
        found = this.firstTest(suite, (function(_this) {
          return function(test) {
            return _this.testInTests(test);
          };
        })(this));
        if (found) {
          return found;
        }
        return this.firstTest(suite, function(test) {
          return true;
        });
      };

      $Runner.prototype.testInTests = function(test) {
        return indexOf.call(this.tests, test) >= 0;
      };

      $Runner.prototype.override = function() {
        var Cypress, _this;
        if (!this.runner.hook) {
          return;
        }
        Cypress = this.Cypress;
        _this = this;
        return this.runner.hook = _.wrap(this.runner.hook, function(orig, name, fn) {
          var getAllSiblingTests, hooks, isLastSuite, ref, testAfterHooks, testBeforeHooks, tests;
          hooks = this.suite["_" + name];
          getAllSiblingTests = function(suite) {
            var tests;
            tests = [];
            suite.eachTest(function(test) {
              if (_this.testInTests(test)) {
                return tests.push(test);
              }
            });
            return tests;
          };
          isLastSuite = function(suite) {
            var suites;
            if (suite.root) {
              return false;
            }
            suites = _.reduce(_this.tests, function(memo, test) {
              var parent;
              while (parent = test.parent) {
                memo.push(parent);
                test = parent;
              }
              return memo;
            }, []);
            return _.chain(suites).uniq().intersection(suite.parent.suites).last().value() === suite;
          };
          testBeforeHooks = function(hook, suite) {
            var beforeHooks, ref;
            if (!_this.test) {
              _this.test = _this.getTestFromHook(hook, suite);
            }
            if (!_this.test.hasFiredTestBeforeHooks) {
              _this.test.hasFiredTestBeforeHooks = true;
              beforeHooks = [].concat(Cypress.invoke("test:before:hooks", _this.wrap((ref = _this.test) != null ? ref : {})));
              beforeHooks = _.filter(beforeHooks, function(r) {
                return Cypress.Utils.isInstanceOf(r, Promise);
              });
              return fn = _.wrap(fn, function() {
                var args, orig;
                orig = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
                return Promise.all(beforeHooks)["catch"](function(err) {
                  return _this.test.fn = function() {
                    throw err;
                  };
                }).then(function() {
                  return orig.apply(null, args);
                });
              });
            }
          };
          testAfterHooks = function() {
            var test;
            test = _this.test;
            _this.test = null;
            Cypress.trigger("test:after:hooks", _this.wrap(test));
            return Cypress.restore();
          };
          switch (name) {
            case "beforeAll":
              testBeforeHooks(hooks[0], this.suite);
              break;
            case "beforeEach":
              if (this.suite.root) {
                testBeforeHooks(hooks[0], this.suite);
              }
              break;
            case "afterEach":
              tests = getAllSiblingTests(_this.test.parent);
              if (this.suite.root && (_this.test !== _(_this.tests).last()) && (_this.test !== _(tests).last())) {
                fn = _.wrap(fn, function() {
                  var args, orig;
                  orig = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
                  return testAfterHooks().then(function() {
                    return orig.apply(null, args);
                  });
                });
              }
              break;
            case "afterAll":
              if (_this.test) {
                tests = getAllSiblingTests(_this.test.parent);
                if ((this.suite.root && _this.test === _(_this.tests).last()) || (((ref = this.suite.parent) != null ? ref.root : void 0) && _this.test === _(tests).last()) || (!isLastSuite(this.suite) && _this.test === _(tests).last())) {
                  fn = _.wrap(fn, function() {
                    var args, orig;
                    orig = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
                    testAfterHooks();
                    return orig.apply(null, args);
                  });
                }
              }
          }
          return orig.call(this, name, fn);
        });
      };

      _.extend($Runner.prototype, Backbone.Events);

      $Runner.runner = function(Cypress, runner) {
        var existing;
        if (existing = Cypress.runner) {
          existing.stopListening();
        }
        return Cypress.runner = new $Runner(Cypress, runner);
      };

      $Runner.create = function(Cypress, specWindow, mocha) {
        var runner;
        runner = mocha.getRunner();
        runner.suite = specWindow.mocha.suite;
        return this.runner(Cypress, runner);
      };

      return $Runner;

    })();
    return $Runner;
  })($Cypress, _);

}).call(this);
;
(function() {
  $Cypress.Server = (function($Cypress, _) {
    var $Server, XMLHttpRequest, defaults, isCypressHeaderRe, needsDashRe, nope, normalize, parseJSON, regularResourcesRe, setHeader, warnOnForce404Default, warnOnStubDeprecation, whitelist;
    regularResourcesRe = /\.(jsx?|coffee|html|less|s?css|svg)(\?.*)?$/;
    isCypressHeaderRe = /^X-Cypress-/i;
    needsDashRe = /([a-z][A-Z])/g;
    setHeader = function(xhr, key, val, transformer) {
      if (val != null) {
        if (transformer) {
          val = transformer(val);
        }
        key = "X-Cypress-" + _.capitalize(key);
        return xhr.setRequestHeader(key, val);
      }
    };
    normalize = function(val) {
      val = val.replace(needsDashRe, function(match) {
        return match[0] + "-" + match[1];
      });
      return val.toLowerCase();
    };
    nope = function() {
      return null;
    };
    parseJSON = function(text) {
      var error;
      try {
        return JSON.parse(text);
      } catch (error) {
        return text;
      }
    };
    warnOnStubDeprecation = function(obj, type) {
      if (_.has(obj, "stub")) {
        return $Cypress.Utils.warning("Passing cy." + type + "({stub: false}) is now deprecated. You can safely remove: {stub: false}.\n\nhttps://on.cypress.io/deprecated-stub-false-on-" + type);
      }
    };
    warnOnForce404Default = function(obj) {
      if (obj.force404 === false) {
        return $Cypress.Utils.warning("Passing cy.server({force404: false}) is now the default behavior of cy.server(). You can safely remove this option.");
      }
    };
    whitelist = function(xhr) {
      return xhr.method === "GET" && regularResourcesRe.test(xhr.url);
    };
    defaults = {
      testId: "",
      xhrUrl: "",
      method: "GET",
      delay: 0,
      status: 200,
      headers: null,
      response: null,
      enable: true,
      autoRespond: true,
      waitOnResponses: Infinity,
      force404: false,
      onAnyAbort: void 0,
      onAnyRequest: void 0,
      onAnyResponse: void 0,
      stripOrigin: _.identity,
      getUrlOptions: _.identity,
      whitelist: whitelist,
      onSend: function() {},
      onXhrAbort: function() {},
      onError: function() {},
      onLoad: function() {},
      onFixtureError: function() {},
      onNetworkError: function() {}
    };
    XMLHttpRequest = (function() {
      function XMLHttpRequest(xhr1) {
        this.xhr = xhr1;
        this.id = this.xhr.id;
        this.url = this.xhr.url;
        this.method = this.xhr.method;
        this.status = null;
        this.statusMessage = null;
        this.request = {};
        this.response = null;
      }

      XMLHttpRequest.prototype._getXhr = function() {
        var ref;
        return (ref = this.xhr) != null ? ref : $Cypress.Utils.throwErrByPath("xhr.missing");
      };

      XMLHttpRequest.prototype._setDuration = function(timeStart) {
        return this.duration = (new Date) - timeStart;
      };

      XMLHttpRequest.prototype._setStatus = function() {
        this.status = this.xhr.status;
        return this.statusMessage = this.xhr.status + " (" + this.xhr.statusText + ")";
      };

      XMLHttpRequest.prototype._setRequestBody = function(requestBody) {
        if (requestBody == null) {
          requestBody = null;
        }
        return this.request.body = parseJSON(requestBody);
      };

      XMLHttpRequest.prototype._setResponseBody = function() {
        var e;
        if (this.response == null) {
          this.response = {};
        }
        return this.response.body = (function() {
          var error;
          try {
            return parseJSON(this.xhr.responseText);
          } catch (error) {
            e = error;
            return this.xhr.response;
          }
        }).call(this);
      };

      XMLHttpRequest.prototype._setResponseHeaders = function() {
        var headerPair, headerPairs, headerStr, headers, i, index, key, len, set, val;
        headerStr = this.xhr.getAllResponseHeaders();
        set = (function(_this) {
          return function(resp) {
            if (_this.response == null) {
              _this.response = {};
            }
            return _this.response.headers = resp;
          };
        })(this);
        headers = {};
        if (!headerStr) {
          return set(headers);
        }
        headerPairs = headerStr.split('\u000d\u000a');
        for (i = 0, len = headerPairs.length; i < len; i++) {
          headerPair = headerPairs[i];
          index = headerPair.indexOf('\u003a\u0020');
          if (index > 0) {
            key = headerPair.substring(0, index);
            val = headerPair.substring(index + 2);
            headers[key] = val;
          }
        }
        return set(headers);
      };

      XMLHttpRequest.prototype._getFixtureError = function() {
        var body, err;
        body = this.response && this.response.body;
        if (body && (err = body.__error)) {
          return err;
        }
      };

      XMLHttpRequest.prototype._setRequestHeader = function(key, val) {
        var base, current;
        if (isCypressHeaderRe.test(key)) {
          return;
        }
        if ((base = this.request).headers == null) {
          base.headers = {};
        }
        current = this.request.headers[key];
        if (current) {
          val = current + ", " + val;
        }
        return this.request.headers[key] = val;
      };

      XMLHttpRequest.prototype.setRequestHeader = function() {
        return this.xhr.setRequestHeader.apply(this.xhr, arguments);
      };

      XMLHttpRequest.prototype.getResponseHeader = function() {
        return this.xhr.getResponseHeader.apply(this.xhr, arguments);
      };

      XMLHttpRequest.prototype.getAllResponseHeaders = function() {
        return this.xhr.getAllResponseHeaders.apply(this.xhr, arguments);
      };

      XMLHttpRequest.add = function(xhr) {
        return new XMLHttpRequest(xhr);
      };

      return XMLHttpRequest;

    })();
    Object.defineProperties(XMLHttpRequest.prototype, {
      requestHeaders: {
        get: function() {
          var ref;
          return (ref = this.request) != null ? ref.headers : void 0;
        }
      },
      requestBody: {
        get: function() {
          var ref;
          return (ref = this.request) != null ? ref.body : void 0;
        }
      },
      responseHeaders: {
        get: function() {
          var ref;
          return (ref = this.response) != null ? ref.headers : void 0;
        }
      },
      responseBody: {
        get: function() {
          var ref;
          return (ref = this.response) != null ? ref.body : void 0;
        }
      },
      requestJSON: {
        get: function() {
          $Cypress.Utils.warning("requestJSON is now deprecated and will be removed in the next version. Update this to 'requestBody' or 'request.body'.");
          return this.requestBody;
        }
      },
      responseJSON: {
        get: function() {
          $Cypress.Utils.warning("responseJSON is now deprecated and will be removed in the next version. Update this to 'responseBody' or 'response.body'.");
          return this.responseBody;
        }
      }
    });
    $Server = (function() {
      function $Server(options1) {
        this.options = options1 != null ? options1 : {};
        _.defaults(this.options, defaults);
        this.xhrs = {};
        this.proxies = {};
        this.routes = [];
        this.enableStubs(false);
      }

      $Server.prototype.getOptions = function() {
        return _.clone(this.options);
      };

      $Server.prototype.isWhitelisted = function(xhr) {
        return this.options.whitelist.call(this, xhr);
      };

      $Server.prototype.getFullyQualifiedUrl = function(contentWindow, url) {
        var a;
        a = contentWindow.document.createElement("a");
        a.href = url;
        return a.href;
      };

      $Server.prototype.getStack = function() {
        var err;
        err = new Error;
        return err.stack.split("\n").slice(3).join("\n");
      };

      $Server.prototype.shouldApplyStub = function(route) {
        return this.isEnabled && route && (route.response != null);
      };

      $Server.prototype.transformHeaders = function(headers) {
        headers = _.reduce(headers, function(memo, value, key) {
          memo[normalize(key)] = value;
          return memo;
        }, {});
        return JSON.stringify(headers);
      };

      $Server.prototype.applyStubProperties = function(xhr, route) {
        var responser;
        responser = _.isObject(route.response) ? JSON.stringify : null;
        setHeader(xhr, "status", route.status);
        setHeader(xhr, "response", route.response, responser);
        setHeader(xhr, "matched", route.url + "");
        setHeader(xhr, "delay", route.delay);
        return setHeader(xhr, "headers", route.headers, this.transformHeaders);
      };

      $Server.prototype.normalizeStubUrl = function(xhrUrl, url) {
        if (!xhrUrl) {
          $Cypress.Utils.warning("'Server.options.xhrUrl' has not been set");
        }
        xhrUrl = _.compact(xhrUrl.split("/")).join("/");
        url = _.ltrim(url, "/");
        return ["/" + xhrUrl, url].join("/");
      };

      $Server.prototype.route = function(attrs) {
        var route;
        if (attrs == null) {
          attrs = {};
        }
        warnOnStubDeprecation(attrs, "route");
        route = _.defaults({}, attrs, _(this.options).pick("delay", "method", "status", "autoRespond", "waitOnResponses", "onRequest", "onResponse"));
        this.routes.push(route);
        return route;
      };

      $Server.prototype.getRouteForXhr = function(xhr) {
        var i, ref, route;
        if (!this.routes.length && this.isEnabled && this.options.force404 !== false && !this.isWhitelisted(xhr)) {
          return this.get404Route();
        }
        if (!this.routes.length) {
          return nope();
        }
        if (this.isWhitelisted(xhr)) {
          return nope();
        }
        ref = this.routes;
        for (i = ref.length - 1; i >= 0; i += -1) {
          route = ref[i];
          if (this.xhrMatchesRoute(xhr, route)) {
            return route;
          }
        }
        if (this.options.force404) {
          return this.get404Route();
        } else {
          return nope();
        }
      };

      $Server.prototype.get404Route = function() {
        return {
          status: 404,
          response: "",
          delay: 0,
          headers: null,
          is404: true
        };
      };

      $Server.prototype.xhrMatchesRoute = function(xhr, route) {
        var testRe, testStr;
        testRe = function(url1, url2) {
          return route.url.test(url1) || route.url.test(url2);
        };
        testStr = function(url1, url2) {
          return route.url === url1 || route.url === url2;
        };
        return xhr.method === route.method && (_.isRegExp(route.url) ? testRe(xhr.url, this.options.stripOrigin(xhr.url)) : testStr(xhr.url, this.options.stripOrigin(xhr.url)));
      };

      $Server.prototype.add = function(xhr, attrs) {
        var id;
        if (attrs == null) {
          attrs = {};
        }
        _.extend(xhr, attrs);
        xhr.id = id = _.uniqueId("xhr");
        this.xhrs[id] = xhr;
        return this.proxies[id] = XMLHttpRequest.add(xhr);
      };

      $Server.prototype.getProxyFor = function(xhr) {
        return this.proxies[xhr.id];
      };

      $Server.prototype.abort = function() {
        _(this.xhrs).chain().filter(function(xhr) {
          return xhr.aborted !== true && xhr.readyState !== 4;
        }).invoke("abort");
        return this;
      };

      $Server.prototype.enableStubs = function(bool) {
        if (bool == null) {
          bool = true;
        }
        return this.isEnabled = bool;
      };

      $Server.prototype.set = function(obj) {
        warnOnStubDeprecation(obj, "server");
        warnOnForce404Default(obj);
        if (obj.enable != null) {
          this.enableStubs(obj.enable);
        }
        return _.extend(this.options, obj);
      };

      $Server.prototype.restore = function() {};

      $Server.prototype.bindTo = function(contentWindow) {
        return $Server.bindTo(contentWindow, (function(_this) {
          return function() {
            return _this;
          };
        })(this));
      };

      $Server.bindTo = function(contentWindow, getServer) {
        var XHR, abort, open, send, srh;
        XHR = contentWindow.XMLHttpRequest;
        send = XHR.prototype.send;
        open = XHR.prototype.open;
        abort = XHR.prototype.abort;
        srh = XHR.prototype.setRequestHeader;
        getServer().restore = function() {
          contentWindow.XMLHttpRequest = XHR;
          _.each({
            send: send,
            open: open,
            abort: abort,
            setRequestHeader: srh
          }, function(value, key) {
            return XHR.prototype[key] = value;
          });
          return {
            contentWindow: contentWindow,
            XMLHttpRequest: XHR
          };
        };
        XHR.prototype.setRequestHeader = function() {
          var proxy;
          proxy = getServer().getProxyFor(this);
          proxy._setRequestHeader.apply(proxy, arguments);
          return srh.apply(this, arguments);
        };
        XHR.prototype.abort = function() {
          var abortStack, proxy, route;
          this.aborted = true;
          abortStack = getServer().getStack();
          proxy = getServer().getProxyFor(this);
          proxy.aborted = true;
          getServer().options.onXhrAbort(proxy, abortStack);
          if (_.isFunction(getServer().options.onAnyAbort)) {
            route = getServer().getRouteForXhr(this);
            getServer().options.onAnyAbort(route, proxy);
          }
          return abort.apply(this, arguments);
        };
        XHR.prototype.open = function(method, url, async, username, password) {
          var originalUrl, proxy, route;
          if (async == null) {
            async = true;
          }
          originalUrl = getServer().getFullyQualifiedUrl(contentWindow, url);
          url = getServer().options.getUrlOptions(originalUrl);
          proxy = getServer().add(this, {
            method: method,
            url: decodeURIComponent(url.display)
          });
          route = getServer().getRouteForXhr(this);
          if (getServer().shouldApplyStub(route)) {
            url.actual = getServer().normalizeStubUrl(getServer().options.xhrUrl, url.actual);
          }
          return open.call(this, method, url.actual, async, username, password);
        };
        return XHR.prototype.send = function(requestBody) {
          var checkFns, onErrorFn, onLoadFn, onReadyStateFn, onerror, onload, onreadystatechange, proxy, route, sendStack, timeStart, xhr;
          setHeader(this, "id", this.id);
          setHeader(this, "testId", getServer().options.testId);
          route = getServer().getRouteForXhr(this);
          if (getServer().shouldApplyStub(route)) {
            getServer().applyStubProperties(this, route);
          }
          sendStack = getServer().getStack();
          proxy = getServer().getProxyFor(this);
          proxy._setRequestBody(requestBody);
          if (!getServer().isWhitelisted(this)) {
            getServer().options.onSend(proxy, sendStack, route);
          }
          if (_.isFunction(getServer().options.onAnyRequest)) {
            getServer().options.onAnyRequest(route, proxy);
          }
          timeStart = new Date;
          xhr = this;
          onload = null;
          onerror = null;
          onreadystatechange = null;
          onLoadFn = function() {
            var err, error;
            proxy._setDuration(timeStart);
            proxy._setStatus();
            proxy._setResponseHeaders();
            proxy._setResponseBody();
            if (err = proxy._getFixtureError()) {
              return getServer().options.onFixtureError(proxy, err);
            }
            try {
              if (_.isFunction(onload)) {
                onload.apply(xhr, arguments);
              }
              getServer().options.onLoad(proxy, route);
            } catch (error) {
              err = error;
              getServer().options.onError(proxy, err);
            }
            if (_.isFunction(getServer().options.onAnyResponse)) {
              return getServer().options.onAnyResponse(route, proxy);
            }
          };
          onErrorFn = function() {
            var err, error;
            try {
              if (_.isFunction(onerror)) {
                onerror.apply(xhr, arguments);
              }
              return getServer().options.onNetworkError(proxy);
            } catch (error) {
              err = error;
              return getServer().options.onError(proxy, err);
            }
          };
          onReadyStateFn = function() {
            var err, error;
            checkFns();
            try {
              if (_.isFunction(onreadystatechange)) {
                return onreadystatechange.apply(xhr, arguments);
              }
            } catch (error) {
              err = error;
              xhr.onreadystatechange = null;
              return getServer().options.onError(proxy, err);
            }
          };
          checkFns = function() {
            if (xhr.onload !== onLoadFn) {
              onload = xhr.onload;
              xhr.onload = onLoadFn;
            }
            if (xhr.onerror !== onErrorFn) {
              onerror = xhr.onerror;
              xhr.onerror = onErrorFn;
            }
            if (xhr.onreadystatechange !== onReadyStateFn) {
              onreadystatechange = xhr.onreadystatechange;
              return xhr.onreadystatechange = onReadyStateFn;
            }
          };
          onload = this.onload;
          this.onload = onLoadFn;
          onreadystatechange = this.onreadystatechange;
          this.onreadystatechange = onReadyStateFn;
          onerror = this.onerror;
          this.onerror = onErrorFn;
          setImmediate(checkFns);
          return send.apply(this, arguments);
        };
      };

      $Server.defaults = function(obj) {
        if (obj == null) {
          obj = {};
        }
        return _.extend(defaults, obj);
      };

      $Server.XMLHttpRequest = XMLHttpRequest;

      $Server.create = function(options) {
        return new $Server(options);
      };

      return $Server;

    })();
    return $Server;
  })($Cypress, _);

}).call(this);
;
(function() {
  (function($Cypress, _) {
    return $Cypress.extend({
      highlightAttr: "data-cypress-el",
      createSnapshot: function($el) {
        var body;
        if ($el != null ? $el.attr : void 0) {
          $el.attr(this.highlightAttr, true);
        }
        body = this.cy.$$("body").clone();
        body.find("script,iframe,link[rel='stylesheet']").remove();
        if ($el != null ? $el.removeAttr : void 0) {
          $el.removeAttr(this.highlightAttr);
        }
        return body;
      }
    });
  })($Cypress, _);

}).call(this);
;
(function() {
  $Cypress.Utils = (function($Cypress, _) {
    var CYPRESS_OBJECT_NAMESPACE, defaultOptions, quotesRe, tagClosed, tagOpen;
    tagOpen = /\[([a-z\s='"-]+)\]/g;
    tagClosed = /\[\/([a-z]+)\]/g;
    quotesRe = /('|")/g;
    CYPRESS_OBJECT_NAMESPACE = "_cypressObj";
    defaultOptions = {
      delay: 10,
      force: false,
      timeout: null,
      interval: null,
      multiple: false,
      waitOnAnimations: null,
      animationDistanceThreshold: null
    };
    return {
      warning: function(msg) {
        return console.warn("Cypress Warning: " + msg);
      },
      throwErr: function(err, options) {
        var command, onFail;
        if (options == null) {
          options = {};
        }
        if (_.isString(err)) {
          err = this.cypressErr(err);
        }
        onFail = options.onFail;
        if (onFail && !_.isFunction(onFail)) {
          command = onFail;
          onFail = function(err) {
            return command.error(err);
          };
        }
        if (onFail) {
          err.onFail = onFail;
        }
        throw err;
      },
      throwErrByPath: function(errPath, options) {
        var e, err;
        if (options == null) {
          options = {};
        }
        err = (function() {
          var error;
          try {
            return this.errMessageByPath(errPath, options.args);
          } catch (error) {
            e = error;
            return err = this.internalErr(e);
          }
        }).call(this);
        return this.throwErr(err, options);
      },
      internalErr: function(err) {
        err = new Error(err);
        err.name = "InternalError";
        return err;
      },
      cypressErr: function(err) {
        err = new Error(err);
        err.name = "CypressError";
        return err;
      },
      errMessageByPath: function(errPath, args) {
        var errMessage;
        errMessage = this.getObjValueByPath($Cypress.ErrorMessages, errPath);
        if (!errMessage) {
          throw new Error("Error message path '" + errPath + "' does not exist");
        }
        return _.reduce(args, function(message, argValue, argKey) {
          return message.replace(new RegExp("\{\{" + argKey + "\}\}", "g"), argValue);
        }, errMessage);
      },
      normalizeObjWithLength: function(obj) {
        if (_(obj).has("length")) {
          obj.Length = obj.length;
          delete obj.length;
        }
        return obj;
      },
      filterOutOptions: function(obj, filter) {
        var whereFilterHasSameKeyButDifferentValue;
        if (filter == null) {
          filter = {};
        }
        _.defaults(filter, defaultOptions);
        this.normalizeObjWithLength(filter);
        whereFilterHasSameKeyButDifferentValue = function(value, key) {
          var upperKey;
          upperKey = _.capitalize(key);
          return (_(filter).has(key) || _(filter).has(upperKey)) && filter[key] !== value;
        };
        obj = _.pick(obj, whereFilterHasSameKeyButDifferentValue);
        if (_.isEmpty(obj)) {
          return void 0;
        } else {
          return obj;
        }
      },
      _stringifyObj: function(obj) {
        var str;
        obj = this.normalizeObjWithLength(obj);
        str = _.reduce(obj, (function(_this) {
          return function(memo, value, key) {
            memo.push(key.toLowerCase() + ": " + _this._stringify(value));
            return memo;
          };
        })(this), []);
        return "{" + str.join(", ") + "}";
      },
      _stringify: function(value) {
        var len;
        switch (false) {
          case !this.hasElement(value):
            return this.stringifyElement(value, "short");
          case !_.isFunction(value):
            return "function(){}";
          case !_.isArray(value):
            len = value.length;
            if (len > 3) {
              return "Array[" + len + "]";
            } else {
              return "[" + _.map(value, _.bind(this._stringify, this)).join(", ") + "]";
            }
            break;
          case !_.isRegExp(value):
            return value.toString();
          case !_.isObject(value):
            len = _.keys(value).length;
            if (len > 2) {
              return "Object{" + len + "}";
            } else {
              return this._stringifyObj(value);
            }
            break;
          case !_.isUndefined(value):
            return void 0;
          default:
            return "" + value;
        }
      },
      stringify: function(values) {
        values = [].concat(values);
        return _.chain(values).map(_.bind(this._stringify, this)).without(void 0).value().join(", ");
      },
      hasWindow: function(obj) {
        var error;
        try {
          return !!(obj && $.isWindow(obj[0])) || $.isWindow(obj);
        } catch (error) {
          return false;
        }
      },
      hasElement: function(obj) {
        var error;
        try {
          return !!(obj && obj[0] && _.isElement(obj[0])) || _.isElement(obj);
        } catch (error) {
          return false;
        }
      },
      hasDocument: function(obj) {
        var error;
        try {
          return !!((obj && obj.nodeType === 9) || (obj && obj[0] && obj[0].nodeType === 9));
        } catch (error) {
          return false;
        }
      },
      isDescendent: function($el1, $el2) {
        if (!$el2) {
          return false;
        }
        return !!(($el1.get(0) === $el2.get(0)) || $el1.has($el2).length);
      },
      getDomElements: function($el) {
        if (!($el != null ? $el.length : void 0)) {
          return;
        }
        if ($el.length === 1) {
          return $el.get(0);
        } else {
          return _.reduce($el, function(memo, el) {
            memo.push(el);
            return memo;
          }, []);
        }
      },
      stringifyElement: function(el, form) {
        var $el, children, id, klass, str, text;
        if (form == null) {
          form = "long";
        }
        if (this.hasWindow(el)) {
          return "<window>";
        }
        if (this.hasDocument(el)) {
          return "<document>";
        }
        $el = _.isElement(el) ? $(el) : el;
        switch (form) {
          case "long":
            text = _.chain($el.text()).clean().truncate(10).value();
            children = $el.children().length;
            str = $el.clone().empty().prop("outerHTML");
            switch (false) {
              case !children:
                return str.replace("></", ">...</");
              case !text:
                return str.replace("></", ">" + text + "</");
              default:
                return str;
            }
            break;
          case "short":
            str = $el.prop("tagName").toLowerCase();
            if (id = $el.prop("id")) {
              str += "#" + id;
            }
            if (klass = $el.attr("class")) {
              str += "." + klass.split(/\s+/).join(".");
            }
            if ($el.length > 1) {
              return "[ <" + str + ">, " + ($el.length - 1) + " more... ]";
            } else {
              return "<" + str + ">";
            }
        }
      },
      plural: function(obj, plural, singular) {
        obj = _.isNumber(obj) ? obj : obj.length;
        if (obj > 1) {
          return plural;
        } else {
          return singular;
        }
      },
      convertHtmlTags: function(html) {
        return html.replace(tagOpen, "<$1>").replace(tagClosed, "</$1>");
      },
      isInstanceOf: function(instance, constructor) {
        var e, error;
        try {
          return instance instanceof constructor;
        } catch (error) {
          e = error;
          return false;
        }
      },
      escapeQuotes: function(text) {
        return ("" + text).replace(quotesRe, "\\$1");
      },
      getCypressNamespace: function(obj) {
        return obj && obj[CYPRESS_OBJECT_NAMESPACE];
      },
      setCypressNamespace: function(obj, original) {
        return obj[CYPRESS_OBJECT_NAMESPACE] = original;
      },
      getObjValueByPath: function(obj, keyPath) {
        var i, key, keys, len1, val;
        if (!_.isObject(obj)) {
          throw new Error("The first parameter to $Cypress.Utils.getObjValueByPath() must be an object");
        }
        if (!_.isString(keyPath)) {
          throw new Error("The second parameter to $Cypress.Utils.getObjValueByPath() must be a string");
        }
        keys = keyPath.split('.');
        val = obj;
        for (i = 0, len1 = keys.length; i < len1; i++) {
          key = keys[i];
          val = val[key];
          if (!val) {
            break;
          }
        }
        return val;
      }
    };
  })($Cypress, _);

}).call(this);
;
(function() {
  var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  (function($Cypress, _) {
    var aliasDisplayRe, aliasRe;
    aliasRe = /^@.+/;
    aliasDisplayRe = /^([@]+)/;
    return $Cypress.Cy.extend({
      assign: function(str, obj) {
        return this["private"]("runnable").ctx[str] = obj;
      },
      getNextAlias: function() {
        var next;
        next = this.prop("current").get("next");
        if (next && next.get("name") === "as") {
          return next.get("args")[0];
        }
      },
      getAlias: function(name, cmd, log) {
        var alias, aliases, ref;
        aliases = (ref = this.prop("aliases")) != null ? ref : {};
        if (!aliasRe.test(name)) {
          return;
        }
        if (!(alias = aliases[name.slice(1)])) {
          this.aliasNotFoundFor(name, cmd, log);
        }
        return alias;
      },
      _aliasDisplayName: function(name) {
        return name.replace(aliasDisplayRe, "");
      },
      getAvailableAliases: function() {
        var aliases;
        if (!(aliases = this.prop("aliases"))) {
          return [];
        }
        return _(aliases).keys();
      },
      aliasNotFoundFor: function(name, cmd, log) {
        var availableAliases, displayName, errPath;
        availableAliases = this.getAvailableAliases();
        if ((!aliasRe.test(name)) && (indexOf.call(availableAliases, name) >= 0)) {
          displayName = this._aliasDisplayName(name);
          $Cypress.Utils.throwErrByPath("alias.invalid", {
            onFail: log,
            args: {
              name: name,
              displayName: displayName
            }
          });
        }
        if (cmd == null) {
          cmd = log && log.get("name") || this.prop("current").get("name");
        }
        displayName = this._aliasDisplayName(name);
        errPath = availableAliases.length ? "alias.not_registered_with_available" : "alias.not_registered_without_available";
        return $Cypress.Utils.throwErrByPath(errPath, {
          onFail: log,
          args: {
            cmd: cmd,
            displayName: displayName,
            availableAliases: availableAliases.join(", ")
          }
        });
      },
      _getCommandsUntilFirstParentOrValidSubject: function(command, memo) {
        if (memo == null) {
          memo = [];
        }
        if (!command) {
          return null;
        }
        memo.unshift(command);
        if (command.get("type") === "parent" || this._contains(command.get("subject"))) {
          return memo;
        }
        return this._getCommandsUntilFirstParentOrValidSubject(command.get("prev"), memo);
      },
      _replayFrom: function(current) {
        var chainerId, commands, initialCommand, insert;
        chainerId = this.prop("chainerId");
        insert = (function(_this) {
          return function(commands) {
            return _.each(commands, function(cmd) {
              cmd.set("chainerId", chainerId);
              return _this.insertCommand(cmd.clone());
            });
          };
        })(this);
        commands = this._getCommandsUntilFirstParentOrValidSubject(current);
        if (commands) {
          initialCommand = commands.shift();
          return insert(_.reduce(commands, function(memo, command, index) {
            var push, ref;
            push = function() {
              return memo.push(command);
            };
            switch (false) {
              case command.get("type") !== "assertion":
                if (ref = command.get("prev"), indexOf.call(memo, ref) >= 0) {
                  push();
                }
                break;
              case command.get("subject") === initialCommand.get("subject"):
                initialCommand = command;
                push();
            }
            return memo;
          }, [initialCommand]));
        }
      }
    });
  })($Cypress, _);

}).call(this);
;
(function() {
  (function($Cypress, _) {
    return $Cypress.Cy.extend({
      normalizeCoords: function(x, y, xPosition, yPosition) {
        var coords;
        if (xPosition == null) {
          xPosition = "center";
        }
        if (yPosition == null) {
          yPosition = "center";
        }
        coords = {};
        switch (xPosition) {
          case "center":
            coords.x = Math.floor(x);
            break;
          case "left":
            coords.x = Math.ceil(x);
            break;
          case "right":
            coords.x = Math.floor(x) - 1;
        }
        switch (yPosition) {
          case "center":
            coords.y = Math.floor(y);
            break;
          case "top":
            coords.y = Math.ceil(y);
            break;
          case "bottom":
            coords.y = Math.floor(y) - 1;
        }
        return coords;
      },
      getElementAtCoordinates: function(x, y) {
        var el, scrollX, scrollY, win;
        win = this["private"]("window");
        scrollX = x - win.pageXOffset;
        scrollY = y - win.pageYOffset;
        el = this["private"]("document").elementFromPoint(scrollX, scrollY);
        if (el) {
          el = $(el);
        }
        return el;
      },
      getBoundingClientRect: function($el) {
        var height, offset, width, win;
        if (Element.prototype.getBoundingClientRect) {
          win = this["private"]("window");
          offset = $el.get(0).getBoundingClientRect();
          offset = _(offset).pick("top", "left", "width", "height");
          offset.top += win.pageYOffset;
          offset.left += win.pageXOffset;
          return width = offset.width, height = offset.height, offset;
        } else {
          offset = $el.offset();
          width = $el.outerWidth();
          return height = $el.outerHeight();
        }
      },
      getCenterCoordinates: function(rect) {
        var x, y;
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
        return this.normalizeCoords(x, y, "center", "center");
      },
      getTopLeftCoordinates: function(rect) {
        var x, y;
        x = rect.left;
        y = rect.top;
        return this.normalizeCoords(x, y, "left", "top");
      },
      getTopRightCoordinates: function(rect) {
        var x, y;
        x = rect.left + rect.width;
        y = rect.top;
        return this.normalizeCoords(x, y, "right", "top");
      },
      getBottomLeftCoordinates: function(rect) {
        var x, y;
        x = rect.left;
        y = rect.top + rect.height;
        return this.normalizeCoords(x, y, "left", "bottom");
      },
      getBottomRightCoordinates: function(rect) {
        var x, y;
        x = rect.left + rect.width;
        y = rect.top + rect.height;
        return this.normalizeCoords(x, y, "right", "bottom");
      },
      getRelativeCoordinates: function($el, x, y) {
        var rect;
        rect = this.getBoundingClientRect($el);
        x = rect.left + x;
        y = rect.top + y;
        return this.normalizeCoords(x, y);
      },
      getCoordinates: function($el, position) {
        var rect;
        if (position == null) {
          position = "center";
        }
        rect = this.getBoundingClientRect($el);
        switch (position) {
          case "center":
            return this.getCenterCoordinates(rect);
          case "topLeft":
            return this.getTopLeftCoordinates(rect);
          case "topRight":
            return this.getTopRightCoordinates(rect);
          case "bottomLeft":
            return this.getBottomLeftCoordinates(rect);
          case "bottomRight":
            return this.getBottomRightCoordinates(rect);
          default:
            return $Cypress.Utils.throwErrByPath("dom.invalid_position_argument", {
              args: {
                position: position
              }
            });
        }
      }
    });
  })($Cypress, _);

}).call(this);
;
(function() {
  (function($Cypress, _, $) {
    var commandOptions, returnFalse;
    commandOptions = ["exist", "exists", "visible", "length"];
    returnFalse = function() {
      return false;
    };
    return $Cypress.Cy.extend({
      ensureSubject: function() {
        var cmd, subject;
        subject = this.prop("subject");
        if (subject == null) {
          cmd = this.prop("current").get("name");
          $Cypress.Utils.throwErrByPath("miscellaneous.no_subject", {
            args: {
              subject: subject,
              cmd: cmd
            }
          });
        }
        return subject;
      },
      ensureParent: function() {
        var current;
        current = this.prop("current");
        if (!current.get("prev")) {
          return $Cypress.Utils.throwErrByPath("miscellaneous.orphan", {
            args: {
              cmd: current.get("name")
            }
          });
        }
      },
      ensureElementIsNotAnimating: function($el, coords, threshold) {
        var cmd, distance, lastTwo, node, point1, point2, waitForAnimations;
        if (coords == null) {
          coords = [];
        }
        waitForAnimations = this.Cypress.config("waitForAnimations");
        if (waitForAnimations === false) {
          return;
        }
        if (threshold == null) {
          threshold = this.Cypress.config("animationDistanceThreshold");
        }
        lastTwo = coords.slice(-2);
        if (lastTwo.length !== 2) {
          $Cypress.Utils.throwErrByPath("dom.animation_check_failed");
        }
        point1 = lastTwo[0], point2 = lastTwo[1];
        distance = function() {
          var deltaX, deltaY;
          deltaX = point1.x - point2.x;
          deltaY = point1.y - point2.y;
          return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        };
        if (distance() > threshold) {
          cmd = this.prop("current").get("name");
          node = $Cypress.Utils.stringifyElement($el);
          return $Cypress.Utils.throwErrByPath("dom.animating", {
            args: {
              cmd: cmd,
              node: node
            }
          });
        }
      },
      ensureActionability: function(subject, onFail) {
        var cmd, node;
        if (subject == null) {
          subject = this.ensureSubject();
        }
        cmd = this.prop("current").get("name");
        if (subject.prop("disabled")) {
          node = $Cypress.Utils.stringifyElement(subject);
          return $Cypress.Utils.throwErrByPath("dom.disabled", {
            onFail: onFail,
            args: {
              cmd: cmd,
              node: node
            }
          });
        }
      },
      ensureVisibility: function(subject, onFail) {
        var cmd, node, reason;
        if (subject == null) {
          subject = this.ensureSubject();
        }
        cmd = this.prop("current").get("name");
        if (!(subject.length === subject.filter(":visible").length)) {
          reason = $Cypress.Dom.getReasonElIsHidden(subject);
          node = $Cypress.Utils.stringifyElement(subject);
          return $Cypress.Utils.throwErrByPath("dom.not_visible", {
            onFail: onFail,
            args: {
              cmd: cmd,
              node: node,
              reason: reason
            }
          });
        }
      },
      ensureDom: function(subject, cmd, log) {
        var isWindow, node;
        if (subject == null) {
          subject = this.ensureSubject();
        }
        if (cmd == null) {
          cmd = this.prop("current").get("name");
        }
        isWindow = $Cypress.Utils.hasWindow(subject);
        if (!(isWindow || $Cypress.Utils.hasElement(subject))) {
          console.warn("Subject is currently: ", subject);
          $Cypress.Utils.throwErrByPath("dom.non_dom", {
            onFail: log,
            args: {
              cmd: cmd
            }
          });
        }
        if (!(isWindow || this._contains(subject))) {
          node = $Cypress.Utils.stringifyElement(subject);
          $Cypress.Utils.throwErrByPath("dom.detached", {
            onFail: log,
            args: {
              cmd: cmd,
              node: node
            }
          });
        }
        return subject;
      },
      ensureElExistance: function($el) {
        if (!$Cypress.Utils.isInstanceOf($el, $)) {
          return;
        }
        if ($el && $el.length) {
          return;
        }
        returnFalse = (function(_this) {
          return function() {
            _this.stopListening(_this.Cypress, "before:log", returnFalse);
            return false;
          };
        })(this);
        this.listenTo(this.Cypress, "before:log", returnFalse);
        return $Cypress.Chai.expect($el).to.exist;
      },
      ensureNoCommandOptions: function(options) {
        return _.each(commandOptions, (function(_this) {
          return function(opt) {
            var assertion;
            if (_.has(options, opt)) {
              assertion = (function() {
                switch (opt) {
                  case "exist":
                  case "exists":
                    if (options[opt]) {
                      return "exist";
                    } else {
                      return "not.exist";
                    }
                    break;
                  case "visible":
                    if (options[opt]) {
                      return "be.visible";
                    } else {
                      return "not.be.visible";
                    }
                    break;
                  case "length":
                    return "have.length', '" + options[opt];
                }
              })();
              return $Cypress.Utils.throwErrByPath("miscellaneous.deprecated", {
                args: {
                  assertion: assertion,
                  opt: opt,
                  value: options[opt]
                }
              });
            }
          };
        })(this));
      },
      ensureDescendents: function($el1, $el2, onFail) {
        var cmd, node;
        cmd = this.prop("current").get("name");
        if (!$Cypress.Utils.isDescendent($el1, $el2)) {
          if ($el2) {
            node = $Cypress.Utils.stringifyElement($el2);
            return $Cypress.Utils.throwErrByPath("dom.covered", {
              onFail: onFail,
              args: {
                cmd: cmd,
                node: node
              }
            });
          } else {
            node = $Cypress.Utils.stringifyElement($el1);
            return $Cypress.Utils.throwErrByPath("dom.hidden", {
              onFail: onFail,
              args: {
                cmd: cmd,
                node: node
              }
            });
          }
        }
      }
    });
  })($Cypress, _, $);

}).call(this);
;
(function() {
  (function($Cypress, _) {
    return $Cypress.Cy.extend({
      commandErr: function(err) {
        var current;
        current = this.prop("current");
        return this.Cypress.Log.command({
          end: true,
          snapshot: true,
          error: err,
          onConsole: function() {
            var obj, prev, ret;
            obj = {};
            if (current.get("type") !== "parent" && (prev = current.get("prev"))) {
              ret = $Cypress.Utils.hasElement(prev.get("subject")) ? $Cypress.Utils.getDomElements(prev.get("subject")) : prev.get("subject");
              obj["Applied To"] = ret;
              return obj;
            }
          }
        });
      },
      checkTestErr: function(test) {
        var err;
        if (err = test.err && !this.prop("err")) {
          this.prop("err", err);
        }
        return this;
      },
      endedEarlyErr: function(index) {
        var commands, err;
        if (this.prop("err")) {
          return;
        }
        commands = this.commands.slice(index).reduce((function(_this) {
          return function(memo, cmd) {
            if (_this.isCommandFromThenable(cmd) || _this.isCommandFromMocha(cmd)) {
              return memo;
            } else {
              memo.push("- " + cmd.stringify());
              return memo;
            }
          };
        })(this), []);
        err = $Cypress.Utils.cypressErr($Cypress.Utils.errMessageByPath("miscellaneous.dangling_commands", {
          numCommands: commands.length,
          commands: commands.join('\n')
        }));
        err.onFail = function() {};
        return this.fail(err);
      },
      fail: function(err) {
        var current, ref, runnable;
        if ((ref = this.prop("promise")) != null) {
          ref.cancel();
        }
        current = this.prop("current");
        if (err.onFail) {
          err.onFail.call(this, err);
          delete err.onFail;
        } else {
          this.commandErr(err);
        }
        runnable = this["private"]("runnable");
        this.prop("err", err);
        this.Cypress.trigger("fail", err, runnable);
        return this.trigger("fail", err, runnable);
      }
    });
  })($Cypress, _);

}).call(this);
;
(function() {
  (function($Cypress, $) {
    var remoteJQueryisNotSameAsGlobal;
    remoteJQueryisNotSameAsGlobal = function(remoteJQuery) {
      return remoteJQuery && (remoteJQuery !== $);
    };
    return $Cypress.Cy.extend({
      getRemotejQueryInstance: function(subject) {
        var remoteJQuery, remoteSubject;
        remoteJQuery = this._getRemoteJQuery();
        if ($Cypress.Utils.hasElement(subject) && remoteJQueryisNotSameAsGlobal(remoteJQuery)) {
          remoteSubject = remoteJQuery(subject);
          $Cypress.Utils.setCypressNamespace(remoteSubject, subject);
          return remoteSubject;
        }
      },
      _getRemoteJQuery: function() {
        var opt;
        if (opt = this.Cypress.option("jQuery")) {
          return opt;
        } else {
          return this["private"]("window").$;
        }
      }
    });
  })($Cypress, $);

}).call(this);
;
(function() {
  (function($Cypress, _, Uri) {
    var previousWin;
    previousWin = null;
    return $Cypress.Cy.extend({
      offWindowListeners: function() {
        if (previousWin) {
          previousWin.off();
          return previousWin = null;
        }
      },
      offIframeListeners: function($remoteIframe) {
        return $remoteIframe != null ? $remoteIframe.off() : void 0;
      },
      bindWindowListeners: function(contentWindow) {
        var filter, filterMutation, isIframe, modifySrc, normalizeSrc, numMutations, observer, onMutation, srcNeedsModification, win;
        this.offWindowListeners();
        if (contentWindow.location.href === "about:blank") {
          return;
        }
        win = $(contentWindow);
        previousWin = win;
        win.on("submit", (function(_this) {
          return function(e) {
            if (e.isDefaultPrevented()) {
              return;
            }
            _this.submitting(e);
            return _this.isReady(false, "submit");
          };
        })(this));
        win.on("beforeunload", (function(_this) {
          return function(e) {
            if (e.isDefaultPrevented() || _this._eventHasReturnValue(e)) {
              return;
            }
            _this.isReady(false, "beforeunload");
            _this.loading();
            _this.Cypress.Cookies.setInitial();
            _this.pageLoading();
            _this.offWindowListeners();
            _this.Cypress.trigger("before:unload");
            return void 0;
          };
        })(this));
        win.on("hashchange", (function(_this) {
          return function() {
            return _this.urlChanged(null, {
              by: "hashchange"
            });
          };
        })(this));
        win.get(0).alert = function(str) {
          return console.info("Automatically resolving alert: ", str);
        };
        win.get(0).confirm = function(message) {
          console.info("Confirming 'true' to: ", message);
          return true;
        };
        isIframe = function(node) {
          return node.nodeName === 'IFRAME';
        };
        normalizeSrc = function(src) {
          return src.replace(/\/$/, '');
        };
        modifySrc = function(src) {
          return "/" + src;
        };
        srcNeedsModification = function(src) {
          var uri;
          uri = new Uri(src);
          !window.location.hostname;
          return !/^http\:\/\/localhost\:2020/.test(src);
        };
        filter = [].filter;
        filterMutation = function(arg) {
          var addedNodes, attributeName, oldValue, target;
          addedNodes = arg.addedNodes, attributeName = arg.attributeName, oldValue = arg.oldValue, target = arg.target;
          if (attributeName === 'src' && isIframe(target) && normalizeSrc(oldValue) !== normalizeSrc(target.src)) {
            console.log(target.src);
            console.log(srcNeedsModification(target.src));
          }
          return (attributeName === 'src' && isIframe(target) && normalizeSrc(oldValue) !== normalizeSrc(target.src) && srcNeedsModification(target.src)) || (addedNodes.length && !!filter.call(addedNodes, isIframe).length);
        };
        numMutations = 0;
        onMutation = function(iframes) {
          if (numMutations > 20) {
            return;
          }
          return iframes.forEach(function(iframe) {
            iframe.src = "";
            numMutations++;
            console.log(modifySrc(iframe.src));
            console.log('needs:', srcNeedsModification(modifySrc(iframe.src)));
            return iframe.src = modifySrc(iframe.src);
          });
        };
        observer = new MutationObserver(function(mutations) {
          return mutations.filter(filterMutation).forEach(function(mutation) {
            var iframes;
            iframes = isIframe(mutation.target) ? [mutation.target] : filter.call(mutation.addedNodes, isIframe);
            return onMutation(iframes);
          });
        });
        return observer.observe(this["private"]("document"), {
          attributeFilter: ['src'],
          attributeOldValue: true,
          attributes: true,
          childList: true,
          subtree: true
        });
      }
    });
  })($Cypress, _, Uri);

}).call(this);
;
(function() {
  (function($Cypress, _) {
    return $Cypress.Cy.extend({
      prop: function(key, val) {
        if (arguments.length === 1) {
          return this.props[key];
        } else {
          return this.props[key] = val;
        }
      },
      "private": function(key, val) {
        if (arguments.length === 1) {
          return this.privates[key];
        } else {
          return this.privates[key] = val;
        }
      }
    });
  })($Cypress, _);

}).call(this);
;
(function() {
  (function($Cypress, _, Promise) {
    return $Cypress.Cy.extend({
      _retry: function(fn, options, log) {
        var assertions, current, getErrMessage, interval, ref, ref1, ref2, runnableTimeout, total;
        if (!options._runnableTimeout) {
          runnableTimeout = (ref = options.timeout) != null ? ref : this._timeout();
          this._clearTimeout();
        }
        current = this.prop("current");
        if (log == null) {
          log = (ref1 = options._log) != null ? ref1 : current != null ? current.getLastLog() : void 0;
        }
        _.defaults(options, {
          _runnableTimeout: runnableTimeout,
          _interval: 16,
          _retries: 0,
          _start: new Date,
          _name: current != null ? current.get("name") : void 0
        });
        interval = (ref2 = options.interval) != null ? ref2 : options._interval;
        options.total = total = new Date - options._start;
        options._retries += 1;
        if (total + interval >= options._runnableTimeout) {
          if (log) {
            log.snapshot();
          }
          if (assertions = options.assertions) {
            this.finishAssertions(assertions);
          }
          getErrMessage = function(err) {
            switch (false) {
              case !(err && err.longMessage):
                return err.longMessage;
              case !(err && err.message):
                return err.message;
              default:
                return err;
            }
          };
          $Cypress.Utils.throwErrByPath("miscellaneous.retry_timed_out", {
            onFail: options.onFail || log,
            args: {
              error: getErrMessage(options.error)
            }
          });
        }
        return Promise.delay(interval).cancellable().then((function(_this) {
          return function() {
            if (options.silent !== true) {
              _this.trigger("retry", options);
            }
            return fn.call(_this);
          };
        })(this));
      }
    });
  })($Cypress, _, Promise);

}).call(this);
;
(function() {
  (function($Cypress, _) {
    return $Cypress.Cy.extend({
      _timeout: function(ms, delta) {
        var runnable;
        if (delta == null) {
          delta = false;
        }
        runnable = this["private"]("runnable");
        if (!runnable) {
          $Cypress.Utils.throwErrByPath("outside_test_with_cmd", {
            args: {
              cmd: "timeout"
            }
          });
        }
        if (ms) {
          ms = delta ? runnable.timeout() + ms : ms;
          runnable.timeout(ms);
          return this;
        } else {
          return runnable.timeout();
        }
      },
      _clearTimeout: function() {
        var runnable;
        runnable = this["private"]("runnable");
        if (!runnable) {
          $Cypress.Utils.throwErrByPath("outside_test_with_cmd", {
            args: {
              cmd: "clearTimeout"
            }
          });
        }
        runnable.clearTimeout();
        return this;
      }
    });
  })($Cypress, _);

}).call(this);
;
(function() {
  (function($Cypress, _) {
    return $Cypress.Cy.extend({
      urlChanged: function(url, options) {
        var previousUrl, ref, urls;
        if (options == null) {
          options = {};
        }
        if (url == null) {
          url = this._getLocation("href");
        }
        if (_.isEmpty(url)) {
          return;
        }
        urls = (ref = this.prop("urls")) != null ? ref : [];
        previousUrl = _.last(urls);
        urls.push(url);
        this.prop("urls", urls);
        this["private"]("url", url);
        _.defaults(options, {
          log: true,
          by: null,
          args: null
        });
        if (options.log && (url !== previousUrl)) {
          Cypress.Log.command({
            name: "new url",
            message: url,
            event: true,
            type: "parent",
            end: true,
            snapshot: true,
            onConsole: function() {
              var obj;
              obj = {
                Event: "url updated",
                "New Url": url
              };
              if (options.by) {
                obj["Url Updated By"] = options.by;
              }
              obj.args = options.args;
              return obj;
            }
          });
        }
        return this.Cypress.trigger("url:changed", url);
      },
      pageLoading: function(bool) {
        if (bool == null) {
          bool = true;
        }
        return this.Cypress.trigger("page:loading", bool);
      }
    });
  })($Cypress, _);

}).call(this);
;
(function() {
  var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $Cypress.register("Actions", function(Cypress, _, $, Promise) {
    var delay, dispatchPrimedChangeEvents, focusable, getFirstCommandOrNull, textLike;
    textLike = "textarea,:text,[contenteditable],[type=password],[type=email],[type=number],[type=date],[type=week],[type=month],[type=time],[type=datetime],[type=datetime-local],[type=search],[type=url],[type=tel]";
    focusable = "a[href],link[href],button,input,select,textarea,[tabindex],[contenteditable]";
    delay = 50;
    dispatchPrimedChangeEvents = function() {
      var changeEvent;
      if (changeEvent = this.prop("changeEvent")) {
        return changeEvent.call(this);
      }
    };
    getFirstCommandOrNull = (function(_this) {
      return function(commands) {
        if (commands.length !== 1) {
          return null;
        }
        return commands[0];
      };
    })(this);
    Cypress.addChildCommand({
      submit: function(subject, options) {
        var dispatched, form, node, num, submit, word;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true,
          $el: subject
        });
        this.ensureDom(options.$el);
        form = options.$el.get(0);
        if (options.log) {
          options._log = Cypress.Log.command({
            $el: options.$el,
            onConsole: function() {
              return {
                "Applied To": $Cypress.Utils.getDomElements(options.$el),
                Elements: options.$el.length
              };
            }
          });
          options._log.snapshot("before", {
            next: "after"
          });
        }
        if (!options.$el.is("form")) {
          node = Cypress.Utils.stringifyElement(options.$el);
          word = Cypress.Utils.plural(options.$el, "contains", "is");
          $Cypress.Utils.throwErrByPath("submit.not_on_form", {
            onFail: options._log,
            args: {
              node: node,
              word: word
            }
          });
        }
        if ((num = options.$el.length) && num > 1) {
          $Cypress.Utils.throwErrByPath("submit.multiple_forms", {
            onFail: options._log,
            args: {
              num: num
            }
          });
        }
        submit = new Event("submit", {
          bubbles: true,
          cancelable: true
        });
        !!(dispatched = form.dispatchEvent(submit));
        if (dispatched) {
          form.submit();
        }
        this._timeout(delay, true);
        return Promise.delay(delay).then((function(_this) {
          return function() {
            var verifyAssertions;
            return (verifyAssertions = function() {
              return _this.verifyUpcomingAssertions(options.$el, options, {
                onRetry: verifyAssertions
              });
            })();
          };
        })(this));
      },
      fill: function(subject, obj, options) {
        if (options == null) {
          options = {};
        }
        if (!_.isObject(obj)) {
          return $Cypress.Utils.throwErrByPath("fill.invalid_1st_arg");
        }
      },
      check: function(subject, values, options) {
        return this._check_or_uncheck("check", subject, values, options);
      },
      uncheck: function(subject, values, options) {
        return this._check_or_uncheck("uncheck", subject, values, options);
      },
      focus: function(subject, options) {
        var cleanup, hasFocused, node, num, promise, timeout;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          $el: subject,
          error: true,
          log: true,
          verify: true
        });
        this.ensureDom(options.$el, "focus");
        if (options.log) {
          options._log = Cypress.Log.command({
            $el: options.$el,
            onConsole: function() {
              return {
                "Applied To": $Cypress.Utils.getDomElements(options.$el)
              };
            }
          });
        }
        if (!(options.$el.is(focusable) || $Cypress.Utils.hasWindow(options.$el))) {
          if (options.error === false) {
            return;
          }
          node = Cypress.Utils.stringifyElement(options.$el);
          $Cypress.Utils.throwErrByPath("focus.invalid_element", {
            onFail: options._log,
            args: {
              node: node
            }
          });
        }
        if ((num = options.$el.length) && num > 1) {
          if (options.error === false) {
            return;
          }
          $Cypress.Utils.throwErrByPath("focus.multiple_elements", {
            onFail: options._log,
            args: {
              num: num
            }
          });
        }
        timeout = this._timeout() * .90;
        cleanup = null;
        hasFocused = false;
        promise = new Promise((function(_this) {
          return function(resolve, reject) {
            var focused;
            cleanup = function() {
              return options.$el.off("focus", focused);
            };
            focused = function() {
              var forceFocusedEl;
              hasFocused = true;
              forceFocusedEl = _this.prop("forceFocusedEl");
              if (forceFocusedEl !== options.$el.get(0)) {
                _this.prop("forceFocusedEl", null);
              }
              cleanup();
              _this._timeout(delay, true);
              return Promise.delay(delay).then(resolve);
            };
            options.$el.on("focus", focused);
            options.$el.get(0).focus();
            return _this.defer(function() {
              var simulate;
              if (hasFocused) {
                return;
              }
              simulate = function() {
                var focusEvt, focusinEvt;
                _this.prop("forceFocusedEl", options.$el.get(0));
                focusinEvt = new FocusEvent("focusin", {
                  bubbles: true,
                  view: _this["private"]("window"),
                  relatedTarget: null
                });
                focusEvt = new FocusEvent("focus", {
                  view: _this["private"]("window"),
                  relatedTarget: null
                });
                options.$el.get(0).dispatchEvent(focusEvt);
                return options.$el.get(0).dispatchEvent(focusinEvt);
              };
              return _this.execute("focused", {
                log: false,
                verify: false
              }).then(function($focused) {
                if ($focused && $focused.get(0) !== options.$el.get(0)) {
                  return _this.execute("blur", {
                    $el: $focused,
                    error: false,
                    verify: false,
                    log: false
                  }).then(function() {
                    return simulate();
                  });
                } else {
                  return simulate();
                }
              })["catch"](function(err) {
                return reject(err);
              });
            });
          };
        })(this));
        return promise.timeout(timeout)["catch"](Promise.TimeoutError, (function(_this) {
          return function(err) {
            cleanup();
            if (options.error === false) {
              return;
            }
            return $Cypress.Utils.throwErrByPath("focus.timed_out", {
              onFail: options._log
            });
          };
        })(this)).then((function(_this) {
          return function() {
            var verifyAssertions;
            if (options.verify === false) {
              return options.$el;
            }
            return (verifyAssertions = function() {
              return _this.verifyUpcomingAssertions(options.$el, options, {
                onRetry: verifyAssertions
              });
            })();
          };
        })(this));
      },
      blur: function(subject, options) {
        var deltaOptions, num;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          $el: subject,
          error: true,
          log: true,
          verify: true,
          force: false
        });
        if (options.log) {
          deltaOptions = Cypress.Utils.filterOutOptions(options);
          options._log = Cypress.Log.command({
            $el: options.$el,
            message: deltaOptions,
            onConsole: function() {
              return {
                "Applied To": $Cypress.Utils.getDomElements(options.$el)
              };
            }
          });
        }
        this.ensureDom(options.$el, "blur", options._log);
        if ((num = options.$el.length) && num > 1) {
          if (options.error === false) {
            return;
          }
          $Cypress.Utils.throwErrByPath("blur.multiple_elements", {
            onFail: options._log,
            args: {
              num: num
            }
          });
        }
        return this.execute("focused", {
          log: false,
          verify: false
        }).then((function(_this) {
          return function($focused) {
            var cleanup, hasBlurred, node, promise, timeout;
            if (options.force !== true && !$focused) {
              if (options.error === false) {
                return;
              }
              $Cypress.Utils.throwErrByPath("blur.no_focused_element", {
                onFail: options._log
              });
            }
            if (options.force !== true && options.$el.get(0) !== $focused.get(0)) {
              if (options.error === false) {
                return;
              }
              node = Cypress.Utils.stringifyElement($focused);
              $Cypress.Utils.throwErrByPath("blur.wrong_focused_element", {
                onFail: options._log,
                args: {
                  node: node
                }
              });
            }
            timeout = _this._timeout() * .90;
            cleanup = null;
            hasBlurred = false;
            promise = new Promise(function(resolve) {
              var blurred;
              cleanup = function() {
                return options.$el.off("blur", blurred);
              };
              blurred = function() {
                var blacklistFocusedEl;
                hasBlurred = true;
                blacklistFocusedEl = _this.prop("blacklistFocusedEl");
                if (blacklistFocusedEl !== options.$el.get(0)) {
                  _this.prop("blacklistFocusedEl", null);
                }
                cleanup();
                _this._timeout(delay, true);
                return Promise.delay(delay).then(resolve);
              };
              options.$el.on("blur", blurred);
              dispatchPrimedChangeEvents.call(_this);
              options.$el.get(0).blur();
              return _this.defer(function() {
                var blurEvt, focusoutEvt;
                if (hasBlurred) {
                  return;
                }
                _this.prop("blacklistFocusedEl", options.$el.get(0));
                focusoutEvt = new FocusEvent("focusout", {
                  bubbles: true,
                  cancelable: false,
                  view: _this["private"]("window"),
                  relatedTarget: null
                });
                blurEvt = new FocusEvent("blur", {
                  bubble: false,
                  cancelable: false,
                  view: _this["private"]("window"),
                  relatedTarget: null
                });
                options.$el.get(0).dispatchEvent(blurEvt);
                return options.$el.get(0).dispatchEvent(focusoutEvt);
              });
            });
            return promise.timeout(timeout)["catch"](Promise.TimeoutError, function(err) {
              cleanup();
              if (options.error === false) {
                return;
              }
              return $Cypress.Utils.throwErrByPath("blur.timed_out", {
                onFail: command
              });
            }).then(function() {
              var verifyAssertions;
              if (options.verify === false) {
                return options.$el;
              }
              return (verifyAssertions = function() {
                return _this.verifyUpcomingAssertions(options.$el, options, {
                  onRetry: verifyAssertions
                });
              })();
            });
          };
        })(this));
      },
      dblclick: function(subject, options) {
        var dblclick, dblclicks;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true
        });
        this.ensureDom(subject);
        dblclicks = [];
        dblclick = (function(_this) {
          return function(el, index) {
            var $el, log, p;
            $el = $(el);
            _this._timeout(delay, true);
            if (options.log) {
              log = Cypress.Log.command({
                $el: $el,
                onConsole: function() {
                  return {
                    "Applied To": $Cypress.Utils.getDomElements($el),
                    "Elements": $el.length
                  };
                }
              });
            }
            _this.ensureVisibility($el, log);
            p = _this.execute("focus", {
              $el: $el,
              error: false,
              verify: false,
              log: false
            }).then(function() {
              var event;
              event = new MouseEvent("dblclick", {
                bubbles: true,
                cancelable: true
              });
              el.dispatchEvent(event);
              return null;
            }).delay(delay).cancellable();
            dblclicks.push(p);
            return p;
          };
        })(this);
        return Promise.resolve(subject.toArray()).each(dblclick).cancellable()["return"](subject)["catch"](Promise.CancellationError, function(err) {
          _(dblclicks).invoke("cancel");
          throw err;
        });
      },
      hover: function(args) {
        return $Cypress.Utils.throwErrByPath("hover.not_implemented");
      },
      click: function(subject, positionOrX, y, options) {
        var click, clicks, position, win, x;
        if (options == null) {
          options = {};
        }
        switch (false) {
          case !_.isObject(positionOrX):
            options = positionOrX;
            position = null;
            break;
          case !_.isObject(y):
            options = y;
            position = positionOrX;
            y = null;
            x = null;
            break;
          case !_.all([positionOrX, y], _.isFinite):
            position = null;
            x = positionOrX;
            break;
          case !_.isString(positionOrX):
            position = positionOrX;
        }
        _.defaults(options, {
          $el: subject,
          log: true,
          verify: true,
          force: false,
          multiple: false,
          position: position,
          x: x,
          y: y,
          errorOnSelect: true
        });
        this.ensureDom(options.$el);
        if (options.multiple === false && options.$el.length > 1) {
          $Cypress.Utils.throwErrByPath("click.multiple_elements", {
            args: {
              num: options.$el.length
            }
          });
        }
        win = this["private"]("window");
        clicks = [];
        click = (function(_this) {
          return function(el, index) {
            var $el, $previouslyFocusedEl, afterMouseDown, deltaOptions, domEvents, findElByCoordinates, getFirstFocusableEl, isAttached, p, shouldFireFocusEvent;
            $el = $(el);
            domEvents = {};
            $previouslyFocusedEl = null;
            if (options.log) {
              deltaOptions = Cypress.Utils.filterOutOptions(options);
              options._log = Cypress.Log.command({
                message: deltaOptions,
                $el: $el
              });
              options._log.snapshot("before", {
                next: "after"
              });
            }
            if (options.errorOnSelect && $el.is("select")) {
              $Cypress.Utils.throwErrByPath("click.on_select_element", {
                onFail: options._log
              });
            }
            isAttached = function($elToClick) {
              return _this._contains($elToClick);
            };
            getFirstFocusableEl = function($el) {
              var parent;
              if ($el.is(focusable)) {
                return $el;
              }
              parent = $el.parent();
              if (!parent.length) {
                return $(win);
              }
              return getFirstFocusableEl($el.parent());
            };
            afterMouseDown = function($elToClick, coords) {
              var consoleObj, onConsole;
              if (isAttached($elToClick)) {
                domEvents.mouseUp = _this.Cypress.Mouse.mouseUp($elToClick, coords, win);
              }
              if (isAttached($elToClick)) {
                domEvents.click = _this.Cypress.Mouse.click($elToClick, coords, win);
              }
              if (options._log) {
                consoleObj = options._log.attributes.onConsole();
              }
              onConsole = function() {
                consoleObj = _.defaults(consoleObj != null ? consoleObj : {}, {
                  "Applied To": $Cypress.Utils.getDomElements($el),
                  "Elements": $el.length,
                  "Coords": coords,
                  "Options": deltaOptions
                });
                if ($el.get(0) !== $elToClick.get(0)) {
                  consoleObj["Actual Element Clicked"] = $Cypress.Utils.getDomElements($elToClick);
                }
                consoleObj.groups = function() {
                  var groups;
                  groups = [
                    {
                      name: "MouseDown",
                      items: _(domEvents.mouseDown).pick("preventedDefault", "stoppedPropagation")
                    }
                  ];
                  if (domEvents.mouseUp) {
                    groups.push({
                      name: "MouseUp",
                      items: _(domEvents.mouseUp).pick("preventedDefault", "stoppedPropagation")
                    });
                  }
                  if (domEvents.click) {
                    groups.push({
                      name: "Click",
                      items: _(domEvents.click).pick("preventedDefault", "stoppedPropagation")
                    });
                  }
                  return groups;
                };
                return consoleObj;
              };
              return Promise.delay(delay).then(function() {
                if (options._log) {
                  options._log.set({
                    coords: coords,
                    onConsole: onConsole
                  });
                }
                if (options._log && options.log) {
                  return options._log.snapshot().end();
                }
              })["return"](null);
            };
            findElByCoordinates = function($el) {
              var coordsObj, getCoords, getElementWithFixedPosition, scrollWindowPastFixedElement, verifyElementAtCoordinates;
              coordsObj = function(coords, $el) {
                return {
                  coords: coords,
                  $elToClick: $el
                };
              };
              scrollWindowPastFixedElement = function($fixed) {
                var height, width;
                height = $fixed.outerHeight();
                width = $fixed.outerWidth();
                win.scrollBy(-width, -height);
                if (options._log) {
                  return options._log.set("scrollBy", {
                    x: -width,
                    y: -height
                  });
                }
              };
              getElementWithFixedPosition = function($el) {
                if (!$el || $el.is("body,html")) {
                  return null;
                }
                if ($el.css("position") === "fixed") {
                  return $el;
                }
                return getElementWithFixedPosition($el.parent());
              };
              verifyElementAtCoordinates = function(coords) {
                var $elToClick, $fixed, err, error, retry;
                if (options.force === true) {
                  return coordsObj(coords, $el);
                }
                $elToClick = _this.getElementAtCoordinates(coords.x, coords.y);
                try {
                  _this.ensureDescendents($el, $elToClick, options._log);
                } catch (error) {
                  err = error;
                  if (options._log) {
                    options._log.set({
                      onConsole: function() {
                        var obj;
                        obj = {};
                        obj["Tried to Click"] = $Cypress.Utils.getDomElements($el);
                        obj["But its Covered By"] = $Cypress.Utils.getDomElements($elToClick);
                        return obj;
                      }
                    });
                  }
                  err.onFail = function() {
                    if (options._log) {
                      return options._log.snapshot();
                    }
                  };
                  options.error = err;
                  if ($fixed = getElementWithFixedPosition($elToClick)) {
                    scrollWindowPastFixedElement($fixed);
                    retry = function() {
                      return getCoords(false);
                    };
                    return _this._retry(retry, options);
                  }
                  return _this._retry(getCoords, options);
                }
                return coordsObj(coords, $elToClick);
              };
              getCoords = function(scrollIntoView, coordsHistory) {
                var err, error, retry;
                if (scrollIntoView == null) {
                  scrollIntoView = true;
                }
                if (coordsHistory == null) {
                  coordsHistory = [];
                }
                retry = function() {
                  return getCoords(scrollIntoView, coordsHistory);
                };
                if (options.force !== true) {
                  try {
                    _this.ensureVisibility($el, options._log);
                    _this.ensureActionability($el, options._log);
                  } catch (error) {
                    err = error;
                    options.error = err;
                    return _this._retry(retry, options);
                  }
                }
                if (scrollIntoView) {
                  $el.get(0).scrollIntoView();
                }
                return _this._waitForAnimations($el, options, coordsHistory).then(verifyElementAtCoordinates);
              };
              return Promise["try"](getCoords);
            };
            shouldFireFocusEvent = function($focused, $elToFocus) {
              if (!$focused) {
                return true;
              }
              if (!$previouslyFocusedEl) {
                return true;
              }
              if ($focused.get(0) !== $elToFocus.get(0)) {
                return true;
              }
              if ($previouslyFocusedEl.get(0) !== $focused.get(0)) {
                return true;
              }
              return false;
            };
            _this._timeout(delay, true);
            p = findElByCoordinates($el).cancellable().then(function(obj) {
              var $elToClick, coords;
              $elToClick = obj.$elToClick, coords = obj.coords;
              return _this.execute("focused", {
                log: false,
                verify: false
              }).then(function($focused) {
                var $elToFocus;
                $previouslyFocusedEl = $focused;
                domEvents.mouseDown = _this.Cypress.Mouse.mouseDown($elToClick, coords, win);
                if (domEvents.mouseDown.preventedDefault || !isAttached($elToClick)) {
                  return afterMouseDown($elToClick, coords);
                } else {
                  $elToFocus = getFirstFocusableEl($elToClick);
                  return _this.execute("focused", {
                    log: false,
                    verify: false
                  }).then(function($focused) {
                    if (shouldFireFocusEvent($focused, $elToFocus)) {
                      dispatchPrimedChangeEvents.call(_this);
                      return _this.execute("focus", {
                        $el: $elToFocus,
                        error: false,
                        verify: false,
                        log: false
                      }).then(function() {
                        return afterMouseDown($elToClick, coords);
                      });
                    } else {
                      return afterMouseDown($elToClick, coords);
                    }
                  });
                }
              });
            });
            clicks.push(p);
            return p;
          };
        })(this);
        return Promise.each(options.$el.toArray(), click).cancellable().then((function(_this) {
          return function() {
            var verifyAssertions;
            if (options.verify === false) {
              return options.$el;
            }
            return (verifyAssertions = function() {
              return _this.verifyUpcomingAssertions(options.$el, options, {
                onRetry: verifyAssertions
              });
            })();
          };
        })(this))["catch"](Promise.CancellationError, function(err) {
          _(clicks).invoke("cancel");
          throw err;
        });
      },
      type: function(subject, chars, options) {
        var deltaOptions, getRow, getTableData, node, num, table, type, updateTable;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          $el: subject,
          log: true,
          verify: true,
          force: false,
          delay: 10
        });
        this.ensureDom(options.$el);
        if (options.log) {
          deltaOptions = Cypress.Utils.filterOutOptions(options);
          table = {};
          getRow = function(id, key, which) {
            return table[id] || (function() {
              var obj;
              table[id] = (obj = {});
              if (key) {
                obj.typed = key;
                if (which) {
                  obj.which = which;
                }
              }
              return obj;
            })();
          };
          updateTable = function(id, key, column, value, which) {
            var row;
            row = getRow(id, key, which);
            return row[column] = value || "preventedDefault";
          };
          getTableData = function() {
            return _.reduce(_(table).values(), function(memo, value, index) {
              memo[index + 1] = value;
              return memo;
            }, {});
          };
          options._log = Cypress.Log.command({
            message: [chars, deltaOptions],
            $el: options.$el,
            onConsole: function() {
              return {
                "Typed": chars,
                "Applied To": $Cypress.Utils.getDomElements(options.$el),
                "Options": deltaOptions,
                "table": function() {
                  return {
                    name: "Key Events Table",
                    data: getTableData(),
                    columns: ["typed", "which", "keydown", "keypress", "textInput", "input", "keyup", "change"]
                  };
                }
              };
            }
          });
          options._log.snapshot("before", {
            next: "after"
          });
        }
        if (!options.$el.is(textLike)) {
          node = Cypress.Utils.stringifyElement(options.$el);
          $Cypress.Utils.throwErrByPath("type.not_on_text_field", {
            onFail: options._log,
            args: {
              node: node
            }
          });
        }
        if ((num = options.$el.length) && num > 1) {
          $Cypress.Utils.throwErrByPath("type.multiple_elements", {
            onFail: options._log,
            args: {
              num: num
            }
          });
        }
        if (!(_.isString(chars) || _.isFinite(chars))) {
          $Cypress.Utils.throwErrByPath("type.wrong_type", {
            onFail: options._log,
            args: {
              chars: chars
            }
          });
        }
        if (_.isBlank(chars)) {
          $Cypress.Utils.throwErrByPath("type.empty_string", {
            onFail: options._log
          });
        }
        options.chars = "" + chars;
        type = (function(_this) {
          return function() {
            var dispatchChangeEvent, simulateSubmitHandler;
            simulateSubmitHandler = function() {
              var clickedDefaultButton, defaultButton, defaultButtonisDisabled, form, getDefaultButton, multipleInputsAndNoSubmitElements;
              form = options.$el.parents("form");
              if (!form.length) {
                return;
              }
              multipleInputsAndNoSubmitElements = function(form) {
                var inputs, submits;
                inputs = form.find("input");
                submits = form.find("input[type=submit], button[type!=button]");
                return inputs.length > 1 && submits.length === 0;
              };
              if (multipleInputsAndNoSubmitElements(form)) {
                return;
              }
              clickedDefaultButton = function(button) {
                if (button.length) {
                  button.get(0).click();
                  return true;
                } else {
                  return false;
                }
              };
              getDefaultButton = function(form) {
                return form.find("input[type=submit], button[type!=button]").first();
              };
              defaultButtonisDisabled = function(button) {
                return button.prop("disabled");
              };
              defaultButton = getDefaultButton(form);
              if (defaultButtonisDisabled(defaultButton)) {
                return;
              }
              if (!clickedDefaultButton(defaultButton)) {
                return _this.execute("submit", {
                  log: false,
                  $el: form
                });
              }
            };
            dispatchChangeEvent = function(id) {
              var change, dispatched;
              change = document.createEvent("HTMLEvents");
              change.initEvent("change", true, false);
              dispatched = options.$el.get(0).dispatchEvent(change);
              if (id && updateTable) {
                updateTable.call(_this, id, null, "change", dispatched);
              }
              return dispatched;
            };
            return _this.Cypress.Keyboard.type({
              $el: options.$el,
              chars: options.chars,
              delay: options.delay,
              window: _this["private"]("window"),
              onBeforeType: function(totalKeys) {
                return _this._timeout(totalKeys * options.delay, true);
              },
              onEvent: function() {
                if (updateTable) {
                  return updateTable.apply(_this, arguments);
                }
              },
              onTypeChange: function() {
                if (options.$el.is("[contenteditable]")) {
                  return;
                }
                return _this.prop("changeEvent", function() {
                  dispatchChangeEvent();
                  return this.prop("changeEvent", null);
                });
              },
              onEnterPressed: function(changed, id) {
                if (options.$el.is("textarea,[contenteditable]")) {
                  return;
                }
                if (changed) {
                  dispatchChangeEvent(id);
                }
                return simulateSubmitHandler();
              },
              onNoMatchingSpecialChars: function(chars, allChars) {
                if (chars === "{tab}") {
                  return $Cypress.Utils.throwErrByPath("type.tab", {
                    onFail: options._log
                  });
                } else {
                  return $Cypress.Utils.throwErrByPath("type.invalid", {
                    onFail: options._log,
                    args: {
                      chars: chars,
                      allChars: allChars
                    }
                  });
                }
              }
            });
          };
        })(this);
        return this.execute("focused", {
          log: false,
          verify: false
        }).then((function(_this) {
          return function($focused) {
            if (!$focused || ($focused && $focused.get(0) !== options.$el.get(0))) {
              return _this.execute("click", {
                $el: options.$el,
                log: false,
                verify: false,
                _log: options._log,
                force: options.force,
                timeout: options.timeout,
                interval: options.interval
              }).then(function() {
                return type();
              });
            } else {
              return _this._waitForAnimations(options.$el, options).then(type);
            }
          };
        })(this)).then((function(_this) {
          return function() {
            _this._timeout(delay, true);
            return Promise.delay(delay).then(function() {
              var verifyAssertions;
              if (options.verify === false) {
                return options.$el;
              }
              return (verifyAssertions = function() {
                return _this.verifyUpcomingAssertions(options.$el, options, {
                  onRetry: verifyAssertions
                });
              })();
            });
          };
        })(this));
      },
      clear: function(subject, options) {
        var clear;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true,
          force: false
        });
        this.ensureDom(subject);
        clear = (function(_this) {
          return function(el, index) {
            var $el, deltaOptions, node, word;
            $el = $(el);
            if (options.log) {
              deltaOptions = Cypress.Utils.filterOutOptions(options);
              options._log = Cypress.Log.command({
                message: deltaOptions,
                $el: $el,
                onConsole: function() {
                  return {
                    "Applied To": $Cypress.Utils.getDomElements($el),
                    "Elements": $el.length,
                    "Options": deltaOptions
                  };
                }
              });
            }
            node = Cypress.Utils.stringifyElement($el);
            if (!$el.is(textLike)) {
              word = Cypress.Utils.plural(subject, "contains", "is");
              $Cypress.Utils.throwErrByPath("clear.invalid_element", {
                onFail: options._log,
                args: {
                  word: word,
                  node: node
                }
              });
            }
            return _this.execute("type", "{selectall}{del}", {
              $el: $el,
              log: false,
              verify: false,
              _log: options._log,
              force: options.force,
              timeout: options.timeout,
              interval: options.interval
            }).then(function() {
              if (options._log) {
                options._log.snapshot().end();
              }
              return null;
            });
          };
        })(this);
        return Promise.resolve(subject.toArray()).each(clear).cancellable().then((function(_this) {
          return function() {
            var verifyAssertions;
            return (verifyAssertions = function() {
              return _this.verifyUpcomingAssertions(subject, options, {
                onRetry: verifyAssertions
              });
            })();
          };
        })(this));
      },
      select: function(subject, valueOrText, options) {
        var deltaOptions, getOptions, multiple, node, num, onConsole, retryOptions;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          $el: subject,
          log: true,
          force: false
        });
        this.ensureDom(options.$el);
        onConsole = {};
        if (options.log) {
          deltaOptions = Cypress.Utils.filterOutOptions(options);
          options._log = Cypress.Log.command({
            message: deltaOptions,
            $el: options.$el,
            onConsole: function() {
              return _.extend({}, onConsole, {
                "Applied To": $Cypress.Utils.getDomElements(options.$el),
                "Options": deltaOptions
              });
            }
          });
          options._log.snapshot("before", {
            next: "after"
          });
        }
        if (!options.$el.is("select")) {
          node = Cypress.Utils.stringifyElement(options.$el);
          $Cypress.Utils.throwErrByPath("select.invalid_element", {
            args: {
              node: node
            }
          });
        }
        if ((num = options.$el.length) && num > 1) {
          $Cypress.Utils.throwErrByPath("select.multiple_elements", {
            args: {
              num: num
            }
          });
        }
        valueOrText = [].concat(valueOrText);
        multiple = options.$el.prop("multiple");
        if (!multiple && valueOrText.length > 1) {
          $Cypress.Utils.throwErrByPath("select.invalid_multiple");
        }
        getOptions = (function(_this) {
          return function() {
            var optionEls, optionsObjects, values;
            if (options.$el.prop("disabled")) {
              node = Cypress.Utils.stringifyElement(options.$el);
              $Cypress.Utils.throwErrByPath("select.disabled", {
                args: {
                  node: node
                }
              });
            }
            values = [];
            optionEls = [];
            optionsObjects = options.$el.children().map(function(index, el) {
              var optEl, value;
              value = el.value;
              optEl = $(el);
              if (indexOf.call(valueOrText, value) >= 0) {
                optionEls.push(optEl);
                values.push(value);
              }
              return {
                value: value,
                text: optEl.text(),
                $el: optEl
              };
            });
            if (!values.length) {
              _.each(optionsObjects.get(), function(obj, index) {
                var ref;
                if (ref = obj.text, indexOf.call(valueOrText, ref) >= 0) {
                  optionEls.push(obj.$el);
                  return values.push(obj.value);
                }
              });
            }
            if (!multiple && values.length > 1) {
              $Cypress.Utils.throwErrByPath("select.multiple_matches", {
                args: {
                  value: valueOrText.join(", ")
                }
              });
            }
            if (!values.length) {
              $Cypress.Utils.throwErrByPath("select.no_matches", {
                args: {
                  value: valueOrText.join(", ")
                }
              });
            }
            _.each(optionEls, function($el) {
              if ($el.prop("disabled")) {
                node = Cypress.Utils.stringifyElement($el);
                return $Cypress.Utils.throwErrByPath("select.option_disabled", {
                  args: {
                    node: node
                  }
                });
              }
            });
            return {
              values: values,
              optionEls: optionEls
            };
          };
        })(this);
        retryOptions = (function(_this) {
          return function() {
            return Promise["try"](getOptions)["catch"](function(err) {
              options.error = err;
              return _this._retry(retryOptions, options);
            });
          };
        })(this);
        return Promise["try"](retryOptions).then((function(_this) {
          return function(obj) {
            var optionEls, values;
            if (obj == null) {
              obj = {};
            }
            values = obj.values, optionEls = obj.optionEls;
            onConsole.Selected = values;
            return _this.execute("click", {
              $el: options.$el,
              log: false,
              verify: false,
              errorOnSelect: false,
              _log: options._log,
              force: options.force,
              timeout: options.timeout,
              interval: options.interval
            }).then(function() {
              return Promise.resolve(optionEls).each(function(optEl) {
                return _this.execute("click", {
                  $el: optEl,
                  log: false,
                  verify: false,
                  force: true,
                  timeout: options.timeout,
                  interval: options.interval
                });
              }).cancellable().then(function() {
                var change, input;
                options.$el.val(values);
                input = new Event("input", {
                  bubbles: true,
                  cancelable: false
                });
                options.$el.get(0).dispatchEvent(input);
                change = document.createEvent("HTMLEvents");
                change.initEvent("change", true, false);
                return options.$el.get(0).dispatchEvent(change);
              });
            }).then(function() {
              var verifyAssertions;
              return (verifyAssertions = function() {
                return _this.verifyUpcomingAssertions(options.$el, options, {
                  onRetry: verifyAssertions
                });
              })();
            });
          };
        })(this));
      }
    });
    Cypress.addParentCommand({
      focused: function(options) {
        var getFocused, log, resolveFocused;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          verify: true,
          log: true
        });
        if (options.log) {
          options._log = Cypress.Log.command();
        }
        log = function($el) {
          if (options.log === false) {
            return;
          }
          return options._log.set({
            $el: $el,
            onConsole: function() {
              var ref, ret;
              ret = $el ? $Cypress.Utils.getDomElements($el) : "--nothing--";
              return {
                Returned: ret,
                Elements: (ref = $el != null ? $el.length : void 0) != null ? ref : 0
              };
            }
          });
        };
        getFocused = (function(_this) {
          return function() {
            var d, el, error, forceFocusedEl;
            try {
              d = _this["private"]("document");
              forceFocusedEl = _this.prop("forceFocusedEl");
              if (forceFocusedEl) {
                if (_this._contains(forceFocusedEl)) {
                  el = forceFocusedEl;
                } else {
                  _this.prop("forceFocusedEl", null);
                }
              } else {
                el = d.activeElement;
              }
              if (el && el !== _this.prop("blacklistFocusedEl")) {
                el = $(el);
                if (el.is("body")) {
                  log(null);
                  return null;
                }
                log(el);
                return el;
              } else {
                log(null);
                return null;
              }
            } catch (error) {
              log(null);
              return null;
            }
          };
        })(this);
        return (resolveFocused = (function(_this) {
          return function(failedByNonAssertion) {
            return Promise["try"](getFocused).then(function($el) {
              if (options.verify === false) {
                return $el;
              }
              options.$el = $el;
              return _this.verifyUpcomingAssertions($el != null ? $el : $(null), options, {
                onRetry: resolveFocused
              })["return"](options.$el);
            });
          };
        })(this))(false);
      }
    });
    return Cypress.Cy.extend({
      _waitForAnimations: function($el, options, coordsHistory) {
        var coords, err, error, error1, opts, retry;
        if (coordsHistory == null) {
          coordsHistory = [];
        }
        if (options.x && options.y) {
          coords = this.getRelativeCoordinates($el, options.x, options.y);
        } else {
          try {
            coords = this.getCoordinates($el, options.position);
          } catch (error) {
            err = error;
            $Cypress.Utils.throwErr(err, {
              onFail: options._log
            });
          }
        }
        if (options.force === true || options.waitForAnimations === false) {
          return Promise.resolve(coords);
        } else {
          coordsHistory.push(coords);
          retry = (function(_this) {
            return function() {
              return _this._waitForAnimations($el, options, coordsHistory);
            };
          })(this);
          if (coordsHistory.length < 2) {
            opts = _.chain(options).clone().extend({
              silent: true
            }).value();
            return this._retry(retry, opts);
          }
          try {
            this.ensureElementIsNotAnimating($el, coordsHistory, options.animationDistanceThreshold);
            return Promise.resolve(coords);
          } catch (error1) {
            err = error1;
            options.error = err;
            return this._retry(retry, options);
          }
        }
      },
      _check_or_uncheck: function(type, subject, values, options) {
        var checkOrUncheck, elHasMatchingValue, isAcceptableElement, isNoop, matchingElements;
        if (values == null) {
          values = [];
        }
        if (options == null) {
          options = {};
        }
        if (!_.isArray(values) && _.isObject(values)) {
          options = values;
          values = [];
        } else {
          values = [].concat(values);
        }
        matchingElements = [];
        _.defaults(options, {
          $el: subject,
          log: true,
          force: false
        });
        this.ensureDom(options.$el);
        isNoop = function($el) {
          switch (type) {
            case "check":
              return $el.prop("checked");
            case "uncheck":
              return !$el.prop("checked");
          }
        };
        isAcceptableElement = function($el) {
          switch (type) {
            case "check":
              return $el.is(":checkbox,:radio");
            case "uncheck":
              return $el.is(":checkbox");
          }
        };
        elHasMatchingValue = function($el) {
          var ref;
          return values.length === 0 || (ref = $el.val(), indexOf.call(values, ref) >= 0);
        };
        checkOrUncheck = (function(_this) {
          return function(el, index) {
            var $el, coords, deltaOptions, inputType, isElActionable, node, onConsole, phrase, word;
            $el = $(el);
            isElActionable = elHasMatchingValue($el);
            if (isElActionable) {
              matchingElements.push(el);
            }
            onConsole = {
              "Applied To": $Cypress.Utils.getDomElements($el),
              "Elements": $el.length
            };
            if (options.log && isElActionable) {
              deltaOptions = Cypress.Utils.filterOutOptions(options);
              options._log = Cypress.Log.command({
                message: deltaOptions,
                $el: $el,
                onConsole: function() {
                  return _.extend(onConsole, {
                    Options: deltaOptions
                  });
                }
              });
              options._log.snapshot("before", {
                next: "after"
              });
              if (!isAcceptableElement($el)) {
                node = Cypress.Utils.stringifyElement($el);
                word = Cypress.Utils.plural(options.$el, "contains", "is");
                phrase = type === "check" ? " and :radio" : "";
                $Cypress.Utils.throwErrByPath("check_uncheck.invalid_element", {
                  onFail: options._log,
                  args: {
                    node: node,
                    word: word,
                    phrase: phrase,
                    cmd: type
                  }
                });
              }
              if (isNoop($el)) {
                _this.ensureVisibility($el, options._log);
                if (options._log) {
                  inputType = $el.is(":radio") ? "radio" : "checkbox";
                  onConsole.Note = "This " + inputType + " was already " + type + "ed. No operation took place.";
                  options._log.snapshot().end();
                }
                return null;
              } else {
                coords = _this.getCoordinates($el);
                onConsole.Coords = coords;
                options._log.set("coords", coords);
              }
            }
            if (isElActionable) {
              return _this.execute("click", {
                $el: $el,
                log: false,
                verify: false,
                _log: options._log,
                force: options.force,
                timeout: options.timeout,
                interval: options.interval
              }).then(function() {
                if (options._log) {
                  options._log.snapshot().end();
                }
                return null;
              });
            }
          };
        })(this);
        return Promise.resolve(options.$el.toArray()).each(checkOrUncheck).cancellable().then((function(_this) {
          return function() {
            var verifyAssertions;
            options.$el = options.$el.filter(matchingElements);
            return (verifyAssertions = function() {
              return _this.verifyUpcomingAssertions(options.$el, options, {
                onRetry: verifyAssertions
              });
            })();
          };
        })(this));
      }
    });
  });

}).call(this);
;
(function() {
  $Cypress.register("Agents", function(Cypress, _, $) {
    var display;
    display = function(name) {
      switch (name) {
        case "spy":
          return "Spied Obj";
        case "stub":
          return "Stubbed Obj";
        case "mock":
          return "Mocked Obj";
      }
    };
    return Cypress.Cy.extend({
      agents: function() {
        return Cypress.Agents.create(this._getSandbox(), {
          onCreate: (function(_this) {
            return function(obj) {
              obj.type = [obj.type, obj.count].join("-");
              obj.callCount = 0;
              return Cypress.Log.agent(obj);
            };
          })(this),
          onInvoke: (function(_this) {
            return function(obj) {
              var log;
              if (log = obj.log) {
                log.set("callCount", log.get("callCount") + 1);
              }
              return Cypress.Log.command({
                name: [obj.name, obj.count].join("-"),
                message: obj.message,
                error: obj.error,
                type: "parent",
                end: true,
                snapshot: true,
                event: true,
                onConsole: function() {
                  var console;
                  console = {};
                  console.Command = null;
                  console.Error = null;
                  console[obj.name] = obj.agent;
                  console[display(obj.name)] = obj.obj;
                  console.Calls = obj.agent.callCount;
                  console.groups = function() {
                    var items;
                    if (obj.callCount === 0) {
                      return;
                    }
                    items = {
                      Arguments: obj.call.args,
                      Context: obj.call.thisValue,
                      Returned: obj.call.returnValue
                    };
                    if (obj.error) {
                      items.Error = obj.error.stack;
                    }
                    return [
                      {
                        name: "Call #" + obj.callCount + ":",
                        items: items
                      }
                    ];
                  };
                  return console;
                }
              });
            };
          })(this),
          onError: (function(_this) {
            return function(err) {
              return $Cypress.Utils.throwErr(err);
            };
          })(this)
        });
      }
    });
  });

}).call(this);
;
(function() {
  var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $Cypress.register("Aliasing", function(Cypress, _, $) {
    var blacklist;
    blacklist = ["test", "runnable", "timeout", "slow", "skip", "inspect"];
    return Cypress.addUtilityCommand({
      as: function(subject, str) {
        var aliases, log, noLogFromPreviousCommandisAlreadyAliased, prev, ref, remoteSubject;
        this.ensureParent();
        this.ensureSubject();
        aliases = (ref = this.prop("aliases")) != null ? ref : {};
        if (!_.isString(str)) {
          $Cypress.Utils.throwErrByPath("as.invalid_type");
        }
        if (_.isBlank(str)) {
          $Cypress.Utils.throwErrByPath("as.empty_string");
        }
        if (indexOf.call(blacklist, str) >= 0) {
          $Cypress.Utils.throwErrByPath("as.reserved_word", {
            args: {
              str: str
            }
          });
        }
        prev = this.prop("current").get("prev");
        prev.set("alias", str);
        noLogFromPreviousCommandisAlreadyAliased = function() {
          return _.all(prev.get("logs"), function(log) {
            return log.get("alias") !== str;
          });
        };
        if (log = _.last(this.commands.logs({
          instrument: "command",
          event: false,
          chainerId: this.prop("chainerId")
        }))) {
          if (noLogFromPreviousCommandisAlreadyAliased()) {
            log.set({
              alias: str,
              aliasType: $Cypress.Utils.hasElement(subject) ? "dom" : "primitive"
            });
          }
        }
        aliases[str] = {
          subject: subject,
          command: prev,
          alias: str
        };
        this.prop("aliases", aliases);
        remoteSubject = this.getRemotejQueryInstance(subject);
        this.assign(str, remoteSubject != null ? remoteSubject : subject);
        return subject;
      }
    });
  });

}).call(this);
;
(function() {
  var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $Cypress.register("Angular", function(Cypress, _, $, Promise) {
    var ngPrefixes;
    ngPrefixes = ['ng-', 'ng_', 'data-ng-', 'x-ng-'];
    Cypress.addParentCommand({
      ng: function(type, selector, options) {
        if (options == null) {
          options = {};
        }
        if (!this["private"]("window").angular) {
          $Cypress.Utils.throwErrByPath("ng.no_global");
        }
        _.defaults(options, {
          log: true
        });
        if (options.log) {
          options._log = Cypress.Log.command();
        }
        switch (type) {
          case "model":
            return this._findByNgAttr("model", "model=", selector, options);
          case "repeater":
            return this._findByNgAttr("repeater", "repeat*=", selector, options);
          case "binding":
            return this._findByNgBinding(selector, options);
        }
      }
    });
    return Cypress.Cy.extend({
      _findByNgBinding: function(binding, options) {
        var angular, getEl, resolveElements, selector;
        selector = ".ng-binding";
        angular = this["private"]("window").angular;
        _.extend(options, {
          verify: false,
          log: false
        });
        getEl = function($elements) {
          var filtered;
          filtered = $elements.filter(function(index, el) {
            var bindingName, dataBinding;
            dataBinding = angular.element(el).data("$binding");
            if (dataBinding) {
              bindingName = dataBinding.exp || dataBinding[0].exp || dataBinding;
              return indexOf.call(bindingName, binding) >= 0;
            }
          });
          if (filtered.length) {
            return filtered;
          }
          return $(null);
        };
        return (resolveElements = (function(_this) {
          return function() {
            return _this.execute("get", selector, options).then(function($elements) {
              return _this.verifyUpcomingAssertions(getEl($elements), options, {
                onRetry: resolveElements,
                onFail: function(err) {
                  return err.longMessage = "Could not find element for binding: '" + binding + "'.";
                }
              });
            });
          };
        })(this))();
      },
      _findByNgAttr: function(name, attr, el, options) {
        var cancelAll, error, finds, selectors;
        selectors = [];
        error = "Could not find element for " + name + ": '" + el + "'.  Searched ";
        _.extend(options, {
          verify: false,
          log: false
        });
        finds = _.map(ngPrefixes, (function(_this) {
          return function(prefix) {
            var resolveElements, selector;
            selector = "[" + prefix + attr + "'" + el + "']";
            selectors.push(selector);
            return (resolveElements = function() {
              return _this.execute("get", selector, options).then(function($elements) {
                return _this.verifyUpcomingAssertions($elements, options, {
                  onRetry: resolveElements
                });
              });
            })();
          };
        })(this));
        error += selectors.join(", ") + ".";
        cancelAll = function() {
          return _(finds).invoke("cancel");
        };
        return Promise.any(finds).cancellable().then(function(subject) {
          cancelAll();
          return subject;
        })["catch"](Promise.CancellationError, function(err) {
          cancelAll();
          throw err;
        })["catch"](Promise.AggregateError, (function(_this) {
          return function(err) {
            return $Cypress.Utils.throwErr(error);
          };
        })(this));
      }
    });
  });

}).call(this);
;
(function() {
  var slice = [].slice;

  $Cypress.register("Assertions", function(Cypress, _, $, Promise) {
    var allButs, bRe, bTagClosed, bTagOpen, convertMessage, convertRowFontSize, convertTags, parseValueActualAndExpected, reEventually, reExistance, reHaveLength, shouldFn, shouldFnWithCallback;
    bRe = /(\[b\])(.+)(\[\\b\])/;
    bTagOpen = /\[b\]/g;
    bTagClosed = /\[\\b\]/g;
    allButs = /\bbut\b/g;
    reExistance = /exist/;
    reEventually = /^eventually/;
    reHaveLength = /length/;
    Cypress.on("assert", function() {
      return this.assert.apply(this, arguments);
    });
    convertTags = function(str) {
      str = _.escape(str);
      if (!bRe.test(str)) {
        return str;
      }
      return str.replace(bTagOpen, ": <strong>").replace(bTagClosed, "</strong>").split(" :").join(":");
    };
    convertMessage = function($row, message) {
      message = convertTags(message);
      return $row.find("[data-js=message]").html(message);
    };
    convertRowFontSize = function($row, message) {
      var len;
      len = message.length;
      if (len < 100) {
        return;
      }
      return $row.css({
        fontSize: "85%",
        lineHeight: "14px"
      });
    };
    parseValueActualAndExpected = function(value, actual, expected) {
      var obj;
      obj = {
        actual: actual,
        expected: expected
      };
      if (value instanceof $) {
        obj.subject = value;
        if (_.isUndefined(actual) || actual !== expected) {
          delete obj.actual;
          delete obj.expected;
        }
      }
      return obj;
    };
    shouldFnWithCallback = function(subject, fn) {
      return Promise["try"]((function(_this) {
        return function() {
          var remoteSubject;
          remoteSubject = _this.getRemotejQueryInstance(subject);
          return fn.call(_this["private"]("runnable").ctx, remoteSubject != null ? remoteSubject : subject);
        };
      })(this))["return"](subject);
    };
    shouldFn = function() {
      var applyChainer, applyChainers, args, chainers, err, exp, lastChainer, options, originalChainers, originalObj, subject, throwAndLogErr;
      subject = arguments[0], chainers = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
      if (_.isFunction(chainers)) {
        return shouldFnWithCallback.apply(this, arguments);
      }
      exp = Cypress.Chai.expect(subject).to;
      originalChainers = chainers;
      throwAndLogErr = (function(_this) {
        return function(err) {
          var current, log;
          current = _this.prop("current");
          log = Cypress.Log.command({
            name: "should",
            type: "child",
            message: [].concat(originalChainers, args),
            end: true,
            snapshot: true,
            error: err
          });
          return $Cypress.Utils.throwErr(err, {
            onFail: log
          });
        };
      })(this);
      chainers = chainers.split(".");
      lastChainer = _(chainers).last();
      originalObj = exp._obj;
      options = {};
      if (reEventually.test(chainers)) {
        err = $Cypress.Utils.cypressErr("The 'eventually' assertion chainer has been deprecated. This is now the default behavior so you can safely remove this word and everything should work as before.");
        err.retry = false;
        throwAndLogErr(err);
      }
      if (reHaveLength.test(chainers) || reExistance.test(chainers)) {
        exp.isCheckingExistence = true;
      }
      applyChainer = function(memo, value) {
        var error1;
        if (value === lastChainer) {
          if (_.isFunction(memo[value])) {
            try {
              return memo[value].apply(memo, args);
            } catch (error1) {
              err = error1;
              if (err.retry === false) {
                return throwAndLogErr(err);
              } else {
                throw err;
              }
            }
          }
        } else {
          return memo[value];
        }
      };
      applyChainers = (function(_this) {
        return function() {
          if (!exp.isCheckingExistence && Cypress.Utils.hasElement(subject)) {
            _this.ensureDom(subject, "should");
          }
          return _.reduce(chainers, function(memo, value) {
            if (!(value in memo)) {
              err = $Cypress.Utils.cypressErr("The chainer: '" + value + "' was not found. Could not build assertion.");
              err.retry = false;
              throwAndLogErr(err);
            }
            return applyChainer(memo, value);
          }, exp);
        };
      })(this);
      return Promise["try"](applyChainers).then(function() {
        if (originalObj !== exp._obj) {
          return exp._obj;
        }
        return subject;
      });
    };
    Cypress.addAssertionCommand({
      should: function() {
        return shouldFn.apply(this, arguments);
      },
      and: function() {
        return shouldFn.apply(this, arguments);
      }
    });
    return Cypress.Cy.extend({
      verifyUpcomingAssertions: function(subject, options, callbacks) {
        var assert, assertions, cmdHasFunctionArg, cmds, determineEl, fns, i, onFailFn, onPassFn, restore, setSubjectAndSkip, subjects;
        if (options == null) {
          options = {};
        }
        if (callbacks == null) {
          callbacks = {};
        }
        cmds = this.getUpcomingAssertions();
        this.prop("upcomingAssertions", cmds);
        if (options.assertions == null) {
          options.assertions = [];
        }
        determineEl = function($el, subject) {
          if (!_.isUndefined($el)) {
            return $el;
          } else {
            return subject;
          }
        };
        onPassFn = (function(_this) {
          return function() {
            if (_.isFunction(callbacks.onPass)) {
              return callbacks.onPass.call(_this, cmds);
            } else {
              return subject;
            }
          };
        })(this);
        onFailFn = (function(_this) {
          return function(err) {
            var e2, e3, error1, error2, onFail, onRetry;
            try {
              _this.ensureElExistance(determineEl(options.$el, subject));
            } catch (error1) {
              e2 = error1;
              err = e2;
            }
            options.error = err;
            if (err.retry === false) {
              throw err;
            }
            onFail = callbacks.onFail;
            onRetry = callbacks.onRetry;
            if (!onFail && !onRetry) {
              throw err;
            }
            try {
              if (_.isFunction(onFail)) {
                onFail.call(_this, err);
              }
            } catch (error2) {
              e3 = error2;
              _this.finishAssertions(options.assertions);
              throw e3;
            }
            if (_.isFunction(onRetry)) {
              return _this._retry(onRetry, options);
            }
          };
        })(this);
        if (!cmds.length) {
          return Promise["try"]((function(_this) {
            return function() {
              return _this.ensureElExistance(determineEl(options.$el, subject));
            };
          })(this)).then(onPassFn)["catch"](onFailFn);
        }
        i = 0;
        cmdHasFunctionArg = function(cmd) {
          return _.isFunction(cmd.get("args")[0]);
        };
        assert = this.assert;
        this.assert = function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          (function(_this) {
            return (function(cmd) {
              var setCommandLog;
              setCommandLog = function(log) {
                var assertion, assertions, incrementIndex, index, insertNewLog, l;
                if (log.get("name") !== "assert") {
                  return;
                }
                _this.stopListening(_this.Cypress, "before:log", setCommandLog);
                insertNewLog = function(log) {
                  cmd.log(log);
                  return options.assertions.push(log);
                };
                if (!cmd) {
                  cmd = cmds[i - 1];
                } else {
                  i += 1;
                }
                if (cmdHasFunctionArg(cmd)) {
                  index = cmd.get("assertionIndex");
                  assertions = cmd.get("assertions");
                  incrementIndex = function() {
                    return cmd.set("assertionIndex", index += 1);
                  };
                  if (!(assertion = assertions[index])) {
                    assertions.push(log);
                    incrementIndex();
                    return insertNewLog(log);
                  } else {
                    incrementIndex();
                    assertion.merge(log);
                    return false;
                  }
                }
                if (l = cmd.getLastLog()) {
                  l.merge(log);
                  return false;
                } else {
                  return insertNewLog(log);
                }
              };
              return _this.listenTo(_this.Cypress, "before:log", setCommandLog);
            });
          })(this)(cmds[i]);
          return assert.apply(this, args.concat(true));
        };
        fns = this._injectAssertionFns(cmds);
        subjects = [];
        setSubjectAndSkip = function() {
          var cmd, j, len1, results;
          results = [];
          for (i = j = 0, len1 = subjects.length; j < len1; i = ++j) {
            subject = subjects[i];
            cmd = cmds[i];
            cmd.set("subject", subject);
            results.push(cmd.skip());
          }
          return results;
        };
        assertions = (function(_this) {
          return function(memo, fn, i) {
            return fn(memo).then(function(subject) {
              return subjects[i] = subject;
            });
          };
        })(this);
        restore = (function(_this) {
          return function() {
            _this.prop("upcomingAssertions", []);
            return _this.assert = assert;
          };
        })(this);
        return Promise.reduce(fns, assertions, subject).then(restore).then(setSubjectAndSkip).then((function(_this) {
          return function() {
            return _this.finishAssertions(options.assertions);
          };
        })(this)).then(onPassFn).cancellable()["catch"](Promise.CancellationError, function() {
          return restore();
        })["catch"]((function(_this) {
          return function(err) {
            var e, error1;
            restore();
            if (err.retry === false) {
              _this.finishAssertions(options.assertions);
              try {
                $Cypress.Utils.throwErr(err, {
                  onFail: options._log
                });
              } catch (error1) {
                e = error1;
                err = e;
              }
            }
            throw err;
          };
        })(this))["catch"](onFailFn);
      },
      finishAssertions: function(assertions) {
        return _.each(assertions, function(log) {
          var e;
          log.snapshot();
          if (e = log.get("_error")) {
            return log.error(e);
          } else {
            return log.end();
          }
        });
      },
      _injectAssertionFns: function(cmds) {
        return _.map(cmds, _.bind(this._injectAssertion, this));
      },
      _injectAssertion: function(cmd) {
        return (function(_this) {
          return function(subject) {
            if (!cmd.get("assertions")) {
              cmd.set("assertions", []);
            }
            cmd.set("assertionIndex", 0);
            return cmd.get("fn").originalFn.apply(_this, [subject].concat(cmd.get("args")));
          };
        })(this);
      },
      getUpcomingAssertions: function() {
        var assertions, cmd, current, index, j, len1, ref;
        current = this.prop("current");
        index = this.prop("index") + 1;
        assertions = [];
        ref = this.commands.slice(index).get();
        for (j = 0, len1 = ref.length; j < len1; j++) {
          cmd = ref[j];
          if (cmd.is("utility")) {
            continue;
          }
          if (cmd.is("assertion") && cmd.get("chainerId") === current.get("chainerId")) {
            assertions.push(cmd);
          } else {
            break;
          }
        }
        return assertions;
      },
      assert: function(passed, message, value, actual, expected, error, verifying) {
        var current, functionHadArguments, isAssertionType, isChildLike, obj;
        if (verifying == null) {
          verifying = false;
        }
        if (message && passed) {
          message = message.split(allButs).join("and");
        }
        obj = parseValueActualAndExpected(value, actual, expected);
        if (Cypress.Utils.hasElement(value)) {
          obj.$el = value;
        }
        functionHadArguments = function(current) {
          var fn;
          fn = current && current.get("args") && current.get("args")[0];
          return fn && _.isFunction(fn) && fn.length > 0;
        };
        isAssertionType = function(cmd) {
          return cmd && cmd.is("assertion");
        };
        current = this.prop("current");
        if (verifying) {
          obj._error = error;
        } else {
          obj.end = true;
          obj.snapshot = true;
          obj.error = error;
        }
        isChildLike = (function(_this) {
          return function(subject, current) {
            var ref;
            return (value === subject) || isAssertionType(current) || ((ref = _this.prop("upcomingAssertions")) != null ? ref.length : void 0) > 0 || functionHadArguments(current);
          };
        })(this);
        _.extend(obj, {
          name: "assert",
          message: message,
          passed: passed,
          selector: value != null ? value.selector : void 0,
          type: function(current, subject) {
            if (isChildLike(subject, current)) {
              return "child";
            } else {
              return "parent";
            }
          },
          onRender: function($row) {
            var klasses;
            $row.find("[data-js=numElements]").remove();
            klasses = "command-assertion-failed command-assertion-passed command-assertion-pending";
            $row.removeClass(klasses).addClass("command-assertion-" + this.state);
            convertRowFontSize($row, this.message);
            return convertMessage($row, this.message);
          },
          onConsole: (function(_this) {
            return function() {
              obj = {
                Command: "assert"
              };
              _.extend(obj, parseValueActualAndExpected(value, actual, expected));
              return _.extend(obj, {
                Message: message.replace(bTagOpen, "").replace(bTagClosed, "")
              });
            };
          })(this)
        });
        if (error) {
          error.onFail = function(err) {};
        }
        Cypress.Log.command(obj);
        return Cypress;
      }
    });
  });

}).call(this);
;
(function() {
  var slice = [].slice;

  $Cypress.register("Commands", function(Cypress, _) {
    var command;
    command = function() {
      var args, cmds, ctx, name, ref;
      name = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      ctx = (ref = this.prop("chain")) != null ? ref : this;
      if (ctx[name] == null) {
        cmds = _.keys(Cypress.Chainer.prototype).join(", ");
        $Cypress.Utils.throwErrByPath("miscellaneous.invalid_command", {
          args: {
            name: name,
            cmds: cmds
          }
        });
      }
      return ctx[name].apply(ctx, args);
    };
    Cypress.Cy.extend({
      cmd: function() {
        return command.apply(this, arguments);
      },
      command: function() {
        return command.apply(this, arguments);
      }
    });
    return ["cmd", "command"].forEach(function(val) {
      return Cypress.Chainer.inject(val, function(id, args) {
        return command.apply(this, args);
      });
    });
  });

}).call(this);
;
(function() {
  $Cypress.register("Communications", function(Cypress, _, $, Promise) {
    return Cypress.addParentCommand({
      msg: function() {
        return this.sync.message.apply(this, arguments);
      },
      message: function(msg, data, options) {
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true
        });
        _.defaults(options, {
          log: true
        });
        return new Promise((function(_this) {
          return function(resolve, reject) {
            if (options.log !== false) {
              options._log = Cypress.Log.command({
                name: "message",
                message: Cypress.Utils.stringify([msg, data])
              });
            }
            return Cypress.trigger("message", msg, data, function(resp) {
              var e, err, error;
              if (err = resp.__error) {
                try {
                  return $Cypress.Utils.throwErr(err, {
                    onFail: options._log
                  });
                } catch (error) {
                  e = error;
                  e.__isMessage = true;
                  if (resp.__name) {
                    e.name = resp.__name;
                  }
                  if (resp.__stack) {
                    e.stack = resp.__stack;
                  }
                  return reject(e);
                }
              } else {
                if (options._log) {
                  options._log.set({
                    onConsole: function() {
                      return {
                        Message: msg,
                        "Data Sent": data,
                        "Data Returned": resp.response,
                        "Logs": resp.__logs
                      };
                    }
                  });
                  options._log.snapshot();
                }
                return resolve(resp.response);
              }
            });
          };
        })(this));
      }
    });
  });

}).call(this);
;
(function() {
  var slice = [].slice;

  $Cypress.register("Connectors", function(Cypress, _, $) {
    var invokeFn, returnFalseIfThenable, thenFn;
    returnFalseIfThenable = function() {
      var args, key;
      key = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (key === "then" && _.isFunction(args[0]) && _.isFunction(args[1])) {
        args[0]();
        return false;
      }
    };
    Cypress.Cy.extend({
      isCommandFromThenable: function(cmd) {
        var args;
        args = cmd.get("args");
        return cmd.get("name") === "then" && args.length === 3 && _.all(args, _.isFunction);
      },
      isCommandFromMocha: function(cmd) {
        return !cmd.get("next") && cmd.get("args").length === 2 && (cmd.get("args")[1].name === "done" || cmd.get("args")[1].length === 1);
      }
    });
    thenFn = function(subject, options, fn) {
      var args, cleanup, current, getRet, name, remoteSubject;
      if (_.isFunction(options)) {
        fn = options;
        options = {};
      }
      current = this.prop("current");
      if (this.isCommandFromMocha(current)) {
        return this.prop("next", fn);
      }
      _.defaults(options, {
        timeout: this._timeout()
      });
      this._clearTimeout();
      remoteSubject = this.getRemotejQueryInstance(subject);
      args = remoteSubject || subject;
      args = (args != null ? args._spreadArray : void 0) ? args : [args];
      name = this.prop("current").get("name");
      cleanup = (function(_this) {
        return function() {
          return _this.stopListening(_this.Cypress, "on:inject:command", returnFalseIfThenable);
        };
      })(this);
      this.listenTo(this.Cypress, "on:inject:command", returnFalseIfThenable);
      getRet = (function(_this) {
        return function() {
          var ret;
          ret = fn.apply(_this["private"]("runnable").ctx, args);
          if (ret === _this || ret === _this.chain()) {
            return null;
          } else {
            return ret;
          }
        };
      })(this);
      return Promise["try"](getRet).timeout(options.timeout).then((function(_this) {
        return function(ret) {
          cleanup();
          return ret != null ? ret : subject;
        };
      })(this))["catch"](Promise.TimeoutError, (function(_this) {
        return function() {
          return $Cypress.Utils.throwErrByPath("invoke_its.timed_out", {
            onFail: options._log,
            args: {
              cmd: name,
              timeout: options.timeout,
              func: fn.toString()
            }
          });
        };
      })(this));
    };
    invokeFn = function() {
      var args, fail, failOnCurrentNullOrUndefinedValue, failOnPreviousNullOrUndefinedValue, fn, getMessage, getReducedProp, getValue, message, name, options, resolveValue, retryValue, subject;
      subject = arguments[0], fn = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
      this.ensureParent();
      this.ensureSubject();
      options = {};
      getMessage = function() {
        if (name === "invoke") {
          return ("." + fn + "(") + Cypress.Utils.stringify(args) + ")";
        } else {
          return "." + fn;
        }
      };
      name = this.prop("current").get("name");
      message = getMessage();
      options._log = Cypress.Log.command({
        message: message,
        $el: Cypress.Utils.hasElement(subject) ? subject : null,
        onConsole: function() {
          return {
            Subject: subject
          };
        }
      });
      if (!_.isString(fn)) {
        $Cypress.Utils.throwErrByPath("invoke_its.invalid_1st_arg", {
          onFail: options._log,
          args: {
            cmd: name
          }
        });
      }
      fail = (function(_this) {
        return function(prop) {
          return $Cypress.Utils.throwErrByPath("invoke_its.invalid_property", {
            onFail: options._log,
            args: {
              prop: prop,
              cmd: name
            }
          });
        };
      })(this);
      failOnPreviousNullOrUndefinedValue = (function(_this) {
        return function(previousProp, currentProp, value) {
          return $Cypress.Utils.throwErrByPath("invoke_its.previous_prop_nonexistent", {
            args: {
              previousProp: previousProp,
              currentProp: currentProp,
              value: value,
              cmd: name
            }
          });
        };
      })(this);
      failOnCurrentNullOrUndefinedValue = (function(_this) {
        return function(prop, value) {
          return $Cypress.Utils.throwErrByPath("invoke_its.current_prop_nonexistent", {
            args: {
              prop: prop,
              value: value,
              cmd: name
            }
          });
        };
      })(this);
      getReducedProp = function(str, subject) {
        var getValue;
        getValue = function(memo, prop) {
          switch (false) {
            case !_.isString(memo):
              return new String(memo);
            case !_.isNumber(memo):
              return new Number(memo);
            default:
              return memo;
          }
        };
        return _.reduce(str.split("."), function(memo, prop, index, array) {
          var e, error;
          try {
            if (!(prop in getValue(memo, prop))) {
              fail(prop);
            }
          } catch (error) {
            e = error;
            if (_.isNull(memo) || _.isUndefined(memo)) {
              if (index > 0) {
                failOnPreviousNullOrUndefinedValue(array[index - 1], prop, memo);
              } else {
                failOnCurrentNullOrUndefinedValue(prop, memo);
              }
            } else {
              throw e;
            }
          }
          return memo[prop];
        }, subject);
      };
      getValue = (function(_this) {
        return function() {
          var actualSubject, getFormattedElement, invoke, prop, remoteSubject, value;
          remoteSubject = _this.getRemotejQueryInstance(subject);
          actualSubject = remoteSubject || subject;
          prop = getReducedProp(fn, actualSubject);
          invoke = function() {
            switch (name) {
              case "its":
                return prop;
              case "invoke":
                if (_.isFunction(prop)) {
                  return prop.apply(actualSubject, args);
                } else {
                  return $Cypress.Utils.throwErrByPath("invoke.invalid_type", {
                    onFail: options._log,
                    args: {
                      prop: fn
                    }
                  });
                }
            }
          };
          getFormattedElement = function($el) {
            if (Cypress.Utils.hasElement($el)) {
              return Cypress.Utils.getDomElements($el);
            } else {
              return $el;
            }
          };
          value = invoke();
          if (options._log) {
            options._log.set({
              onConsole: function() {
                var obj;
                obj = {};
                if (name === "invoke") {
                  obj["Function"] = message;
                  if (args.length) {
                    obj["With Arguments"] = args;
                  }
                } else {
                  obj["Property"] = message;
                }
                _.extend(obj, {
                  On: getFormattedElement(actualSubject),
                  Returned: getFormattedElement(value)
                });
                return obj;
              }
            });
          }
          return value;
        };
      })(this);
      retryValue = (function(_this) {
        return function() {
          return Promise["try"](getValue)["catch"](function(err) {
            options.error = err;
            return _this._retry(retryValue, options);
          });
        };
      })(this);
      return (resolveValue = (function(_this) {
        return function() {
          return Promise["try"](retryValue).then(function(value) {
            return _this.verifyUpcomingAssertions(value, options, {
              onRetry: resolveValue
            });
          });
        };
      })(this))();
    };
    Cypress.addChildCommand({
      spread: function(subject, options, fn) {
        if (!_.isArray(subject)) {
          $Cypress.Utils.throwErrByPath("spread.invalid_type");
        }
        subject._spreadArray = true;
        return thenFn.call(this, subject, options, fn);
      }
    });
    return Cypress.addDualCommand({
      then: function() {
        return thenFn.apply(this, arguments);
      },
      invoke: function() {
        return invokeFn.apply(this, arguments);
      },
      its: function() {
        return invokeFn.apply(this, arguments);
      }
    });
  });

}).call(this);
;
(function() {
  $Cypress.register("Cookies", function(Cypress, _, $, Promise, moment) {
    var COOKIE_PROPS, commandNameRe, getAndClear, getCommandFromEvent, mergeDefaults;
    COOKIE_PROPS = "name value path secure httpOnly expiry domain".split(" ");
    commandNameRe = /(:)(\w)/;
    getCommandFromEvent = function(event) {
      return event.replace(commandNameRe, function(match, p1, p2) {
        return p2.toUpperCase();
      });
    };
    mergeDefaults = function(obj) {
      var merge;
      merge = function(o) {
        return _.defaults(o, {
          domain: window.location.hostname
        });
      };
      if (_.isArray(obj)) {
        return _.map(obj, merge);
      } else {
        return merge(obj);
      }
    };
    getAndClear = function(log, timeout) {
      return this._automateCookies("get:cookies", {}, log, timeout).then((function(_this) {
        return function(resp) {
          var cookies;
          if (resp && resp.length === 0) {
            return resp;
          }
          cookies = Cypress.Cookies.getClearableCookies(resp);
          return _this._automateCookies("clear:cookies", cookies, log, timeout);
        };
      })(this));
    };
    Cypress.on("test:before:hooks", function() {
      // return getAndClear.call(this);
    });
    Cypress.Cy.extend({
      _addTwentyYears: function() {
        return moment().add(20, "years").unix();
      },
      _automateCookies: function(event, obj, log, timeout) {
        var automate;
        if (obj == null) {
          obj = {};
        }
        automate = function() {
          return new Promise(function(resolve, reject) {
            var fn;
            fn = (function(_this) {
              return function(resp) {
                var e, err, error;
                if (e = resp.__error) {
                  err = $Cypress.Utils.cypressErr(e);
                  err.name = resp.__name;
                  err.stack = resp.__stack;
                  try {
                    return $Cypress.Utils.throwErr(err, {
                      onFail: log
                    });
                  } catch (error) {
                    e = error;
                    return reject(e);
                  }
                } else {
                  return resolve(resp.response);
                }
              };
            })(this);
            return Cypress.trigger(event, mergeDefaults(obj), fn);
          });
        };
        if (!timeout) {
          return automate();
        } else {
          this._clearTimeout();
          return automate().timeout(timeout)["catch"](Promise.TimeoutError, function(err) {
            return $Cypress.Utils.throwErrByPath("cookies.timed_out", {
              onFail: log,
              args: {
                cmd: getCommandFromEvent(event),
                timeout: timeout
              }
            });
          });
        }
      }
    });
    return Cypress.addParentCommand({
      getCookie: function(name, options) {
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true,
          timeout: Cypress.config("responseTimeout")
        });
        if (options.log) {
          options._log = Cypress.Log.command({
            message: name,
            displayName: "get cookie",
            onConsole: function() {
              var c, obj;
              obj = {};
              if (c = options.cookie) {
                obj["Returned"] = c;
              } else {
                obj["Returned"] = "null";
                obj["Note"] = "No cookie with the name: '" + name + "' was found.";
              }
              return obj;
            }
          });
        }
        if (!_.isString(name)) {
          $Cypress.Utils.throwErrByPath("getCookie.invalid_argument", {
            onFail: options._log
          });
        }
        return this._automateCookies("get:cookie", {
          name: name
        }, options._log, options.timeout).then(function(resp) {
          options.cookie = resp;
          return resp;
        });
      },
      getCookies: function(options) {
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true,
          timeout: Cypress.config("responseTimeout")
        });
        if (options.log) {
          options._log = Cypress.Log.command({
            message: "",
            displayName: "get cookies",
            onConsole: function() {
              var c, obj;
              obj = {};
              if (c = options.cookies) {
                obj["Returned"] = c;
                obj["Num Cookies"] = c.length;
              }
              return obj;
            }
          });
        }
        return this._automateCookies("get:cookies", {}, options._log, options.timeout).then(function(resp) {
          options.cookies = resp;
          return resp;
        });
      },
      setCookie: function(name, value, options) {
        var cookie;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          name: name,
          value: value,
          path: "/",
          secure: false,
          httpOnly: false,
          log: true,
          expiry: this._addTwentyYears(),
          timeout: Cypress.config("responseTimeout")
        });
        cookie = _.pick(options, COOKIE_PROPS);
        if (options.log) {
          options._log = Cypress.Log.command({
            message: [name, value],
            displayName: "set cookie",
            onConsole: function() {
              var c, obj;
              obj = {};
              if (c = options.cookie) {
                obj["Returned"] = c;
              }
              return obj;
            }
          });
        }
        if (!_.isString(name) || !_.isString(value)) {
          $Cypress.Utils.throwErrByPath("setCookie.invalid_arguments", {
            onFail: options._log
          });
        }
        return this._automateCookies("set:cookie", cookie, options._log, options.timeout).then(function(resp) {
          options.cookie = resp;
          return resp;
        });
      },
      clearCookie: function(name, options) {
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true,
          timeout: Cypress.config("responseTimeout")
        });
        if (options.log) {
          options._log = Cypress.Log.command({
            message: name,
            displayName: "clear cookie",
            onConsole: function() {
              var c, obj;
              obj = {};
              obj["Returned"] = "null";
              if (c = options.cookie) {
                obj["Cleared Cookie"] = c;
              } else {
                obj["Note"] = "No cookie with the name: '" + name + "' was found or removed.";
              }
              return obj;
            }
          });
        }
        if (!_.isString(name)) {
          $Cypress.Utils.throwErrByPath("clearCookie.invalid_argument", {
            onFail: options._log
          });
        }
        return this._automateCookies("clear:cookie", {
          name: name
        }, options._log, options.timeout).then(function(resp) {
          options.cookie = resp;
          return null;
        });
      },
      clearCookies: function(options) {
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true,
          timeout: Cypress.config("responseTimeout")
        });
        if (options.log) {
          options._log = Cypress.Log.command({
            message: "",
            displayName: "clear cookies",
            onConsole: function() {
              var c, obj;
              obj = {};
              obj["Returned"] = "null";
              if ((c = options.cookies) && c.length) {
                obj["Cleared Cookies"] = c;
                obj["Num Cookies"] = c.length;
              } else {
                obj["Note"] = "No cookies were found or removed.";
              }
              return obj;
            }
          });
        }
        return getAndClear.call(this, options._log, options.timeout, "clearCookies").then(function(resp) {
          options.cookies = resp;
          return null;
        })["catch"](function(err) {
          err.message = err.message.replace("getCookies", "clearCookies");
          throw err;
        });
      }
    });
  });

}).call(this);
;
(function() {
  $Cypress.register("Debugging", function(Cypress, _, $) {
    Cypress.on("resume:next", function() {
      return this.resume(false);
    });
    Cypress.on("resume:all", function() {
      return this.resume();
    });
    Cypress.on("pause", function() {
      var chain;
      if (chain = this.prop("chain")) {
        return chain.pause();
      } else {
        return this.pause();
      }
    });
    Cypress.Cy.extend({
      resume: function(resumeAll) {
        var onResume;
        if (resumeAll == null) {
          resumeAll = true;
        }
        onResume = this.prop("onResume");
        if (!_.isFunction(onResume)) {
          return;
        }
        this.prop("onResume", null);
        return onResume.call(this, resumeAll);
      },
      getNextQueuedCommand: function() {
        var search;
        search = (function(_this) {
          return function(i) {
            var cmd;
            cmd = _this.commands.at(i);
            if (cmd && cmd.get("skip")) {
              return search(i + 1);
            } else {
              return cmd;
            }
          };
        })(this);
        return search(this.prop("index"));
      }
    });
    return Cypress.addUtilityCommand({
      pause: function(options) {
        var onResume;
        if (options == null) {
          options = {};
        }
        if ($Cypress.isHeadless) {
          return this.prop("subject");
        }
        _.defaults(options, {
          log: true
        });
        if (options.log) {
          options._log = Cypress.Log.command({
            snapshot: true,
            autoEnd: false
          });
        }
        onResume = (function(_this) {
          return function(fn, timeout) {
            return _this.prop("onResume", function(resumeAll) {
              if (resumeAll) {
                this.prop("onPaused", null);
                if (options.log) {
                  options._log.end();
                }
              }
              this._timeout(timeout);
              return fn.call(this);
            });
          };
        })(this);
        this.prop("onPaused", function(fn) {
          var next, timeout;
          next = this.getNextQueuedCommand();
          if (next && this.isCommandFromMocha(next)) {
            return fn.call(this);
          }
          Cypress.trigger("paused", next != null ? next.get("name") : void 0);
          timeout = this._timeout();
          this._clearTimeout();
          return onResume(fn, timeout);
        });
        return this.prop("subject");
      },
      debug: function(options) {
        var previous;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true
        });
        if (options.log) {
          options._log = Cypress.Log.command({
            snapshot: true,
            end: true
          });
        }
        previous = this.prop("current").get("prev");

        /*
        cy.debug provides the previous command and the current subject below:
         */
        console.log("\n%c------------------------Cypress Debug Info------------------------", "font-weight: bold;");
        console.log("Previous Command Name: ", previous && previous.get("name"));
        console.log("Previous Command Args: ", previous && previous.get("args"));
        console.log("Current Subject:       ", this.prop("subject"));
        debugger;
        return this.prop("subject");
      }
    });
  });

}).call(this);
;
(function() {
  $Cypress.register("Eval", function(Cypress, _, $, Promise) {
    Cypress.on("abort", function() {
      var ref;
      if (this.prop) {
        return (ref = this.prop("xhr")) != null ? ref.abort() : void 0;
      }
    });
    return Cypress.addParentCommand({
      "eval": function(code, options) {
        var prevTimeout, xhr;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          timeout: 15000
        });
        prevTimeout = this._timeout();
        this._timeout(options.timeout);
        xhr = this.prop("xhr", $.getJSON("/eval", {
          code: code
        }));
        return Promise.resolve(xhr).then((function(_this) {
          return function(response) {
            try {
              response = JSON.parse(response);
            } catch (undefined) {}
            _this._timeout(prevTimeout);
            return response;
          };
        })(this));
      }
    });
  });

}).call(this);
;
(function() {
  $Cypress.register("Exec", function(Cypress, _, $, Promise) {
    var exec;
    exec = (function(_this) {
      return function(options) {
        return new Promise(function(resolve, reject) {
          return Cypress.trigger("exec", options, function(resp) {
            var err;
            if (err = resp.__error) {
              err.timedout = resp.timedout;
              return reject(err);
            } else {
              return resolve(resp);
            }
          });
        });
      };
    })(this);
    return Cypress.addParentCommand({
      exec: function(cmd, options) {
        var isTimedoutError;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true,
          timeout: Cypress.config("execTimeout"),
          failOnNonZeroExit: true,
          env: {}
        });
        if (options.log) {
          options._log = Cypress.Log.command({
            message: _.truncate(cmd, 25)
          });
        }
        if (!cmd || !_.isString(cmd)) {
          $Cypress.Utils.throwErrByPath("exec.invalid_argument", {
            onFail: options._log,
            args: {
              cmd: cmd != null ? cmd : ''
            }
          });
        }
        options.cmd = cmd;
        this._clearTimeout();
        isTimedoutError = function(err) {
          return err.timedout;
        };
        return exec(_.pick(options, "cmd", "timeout", "env")).timeout(options.timeout).then(function(result) {
          var output;
          if (result.code === 0 || !options.failOnNonZeroExit) {
            return result;
          }
          output = "";
          if (result.stdout) {
            output += "\nStdout:\n" + (_.truncate(result.stdout, 50));
          }
          if (result.stderr) {
            output += "\nStderr:\n" + (_.truncate(result.stderr, 50));
          }
          return $Cypress.Utils.throwErrByPath("exec.non_zero_exit", {
            onFail: options._log,
            args: {
              cmd: cmd,
              output: output,
              code: result.code
            }
          });
        })["catch"](Promise.TimeoutError, isTimedoutError, function(err) {
          return $Cypress.Utils.throwErrByPath("exec.timed_out", {
            onFail: options._log,
            args: {
              cmd: cmd,
              timeout: options.timeout
            }
          });
        })["catch"](function(error) {
          if (error.name === "CypressError") {
            throw error;
          }
          return $Cypress.Utils.throwErrByPath("exec.failed", {
            onFail: options._log,
            args: {
              cmd: cmd,
              error: error
            }
          });
        });
      }
    });
  });

}).call(this);
;
(function() {
  $Cypress.register("Fixtures", function(Cypress, _, $, Promise) {
    var cache, clone, fixture, fixturesRe;
    cache = {};
    fixturesRe = /^(fx:|fixture:)/;
    clone = function(obj) {
      return JSON.parse(JSON.stringify(obj));
    };
    fixture = (function(_this) {
      return function(fixture) {
        return new Promise(function(resolve) {
          return Cypress.trigger("fixture", fixture, resolve);
        });
      };
    })(this);
    Cypress.on("stop", function() {
      return cache = {};
    });
    Cypress.addParentCommand({
      fixture: function(fx, options) {
        var resp;
        if (options == null) {
          options = {};
        }
        if (resp = cache[fx]) {
          return Promise.resolve(clone(resp));
        }
        _.defaults(options, {
          timeout: Cypress.config("responseTimeout")
        });
        this._clearTimeout();
        return fixture(fx).timeout(options.timeout).then((function(_this) {
          return function(response) {
            var err;
            if (err = response.__error) {
              return $Cypress.Utils.throwErr(err);
            } else {
              cache[fx] = response;
              return clone(response);
            }
          };
        })(this))["catch"](Promise.TimeoutError, function(err) {
          return $Cypress.Utils.throwErrByPath("fixture.timed_out", {
            args: {
              timeout: options.timeout
            }
          });
        });
      }
    });
    return Cypress.Cy.extend({
      matchesFixture: function(fixture) {
        return fixturesRe.test(fixture);
      },
      parseFixture: function(fixture) {
        return fixture.replace(fixturesRe, "");
      }
    });
  });

}).call(this);
;
(function() {
  $Cypress.register("LocalStorage", function(Cypress, _, $) {
    var clearLocalStorage;
    clearLocalStorage = function(keys) {
      var local, remote;
      local = window.localStorage;
      remote = this["private"]("window").localStorage;
      Cypress.LocalStorage.setStorages(local, remote);
      Cypress.LocalStorage.clear(keys);
      Cypress.LocalStorage.unsetStorages();
      return remote;
    };
    Cypress.on("test:before:hooks", function() {
      return clearLocalStorage.call(this, []);
    });
    return Cypress.addParentCommand({
      clearLocalStorage: function(keys) {
        var remote;
        if (keys && !_.isString(keys) && !_.isRegExp(keys)) {
          $Cypress.Utils.throwErrByPath("clearLocalStorage.invalid_argument");
        }
        remote = clearLocalStorage.call(this, keys);
        Cypress.Log.command({
          name: "clear ls",
          snapshot: true,
          end: true
        });
        return remote;
      }
    });
  });

}).call(this);
;
(function() {
  $Cypress.register("Location", function(Cypress, _, $) {
    Cypress.Cy.extend({
      _getLocation: function(key) {
        var location, remoteUrl;
        remoteUrl = this["private"]("window").location.toString();
        location = Cypress.Location.create(remoteUrl);
        if (key) {
          return location[key];
        } else {
          return location;
        }
      }
    });
    return Cypress.addParentCommand({
      url: function(options) {
        var getHref, resolveHref;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true
        });
        if (options.log !== false) {
          options._log = Cypress.Log.command({
            message: ""
          });
        }
        getHref = (function(_this) {
          return function() {
            return _this._getLocation("href");
          };
        })(this);
        return (resolveHref = (function(_this) {
          return function() {
            return Promise["try"](getHref).then(function(href) {
              return _this.verifyUpcomingAssertions(href, options, {
                onRetry: resolveHref
              });
            });
          };
        })(this))();
      },
      hash: function(options) {
        var getHash, resolveHash;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true
        });
        if (options.log !== false) {
          options._log = Cypress.Log.command({
            message: ""
          });
        }
        getHash = (function(_this) {
          return function() {
            return _this._getLocation("hash");
          };
        })(this);
        return (resolveHash = (function(_this) {
          return function() {
            return Promise["try"](getHash).then(function(hash) {
              return _this.verifyUpcomingAssertions(hash, options, {
                onRetry: resolveHash
              });
            });
          };
        })(this))();
      },
      location: function(key, options) {
        var getLocation, resolveLocation;
        if (_.isObject(key) && _.isUndefined(options)) {
          options = key;
        }
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true
        });
        getLocation = (function(_this) {
          return function() {
            var location, ref, ret;
            location = _this._getLocation();
            return ret = _.isString(key) ? (ref = location[key]) != null ? ref : $Cypress.Utils.throwErrByPath("location.invalid_key", {
              args: {
                key: key
              }
            }) : location;
          };
        })(this);
        if (options.log !== false) {
          options._log = Cypress.Log.command({
            message: key != null ? key : ""
          });
        }
        return (resolveLocation = (function(_this) {
          return function() {
            return Promise["try"](getLocation).then(function(ret) {
              return _this.verifyUpcomingAssertions(ret, options, {
                onRetry: resolveLocation
              });
            });
          };
        })(this))();
      }
    });
  });

}).call(this);
;
(function() {
  $Cypress.register("Misc", function(Cypress, _, $) {
    Cypress.addDualCommand({
      end: function() {
        return null;
      }
    });
    return Cypress.addParentCommand({
      options: function(options) {
        if (options == null) {
          options = {};
        }
      },
      noop: function(subject) {
        return subject;
      },
      wrap: function(subject, options) {
        var remoteSubject, resolveWrap;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true
        });
        remoteSubject = this.getRemotejQueryInstance(subject);
        if (options.log !== false) {
          options._log = Cypress.Log.command();
          if (Cypress.Utils.hasElement(subject)) {
            options._log.set({
              $el: subject
            });
          }
        }
        return (resolveWrap = (function(_this) {
          return function() {
            return _this.verifyUpcomingAssertions(subject, options, {
              onRetry: resolveWrap
            });
          };
        })(this))();
      }
    });
  });

}).call(this);
;
(function() {
  var slice = [].slice;

  $Cypress.register("Navigation", function(Cypress, _, $, Promise) {
    var commandCausingLoading, overrideRemoteLocationGetters, timedOutWaitingForPageLoad;
    commandCausingLoading = /^(visit|reload)$/;
    overrideRemoteLocationGetters = function(cy, contentWindow) {
      var navigated;
      navigated = function(attr, args) {
        return cy.urlChanged(null, {
          by: attr,
          args: args
        });
      };
      return Cypress.Location.override(Cypress, contentWindow, navigated);
    };
    timedOutWaitingForPageLoad = function(ms, log) {
      return $Cypress.Utils.throwErrByPath("navigation.timed_out", {
        onFail: log,
        args: {
          ms: ms
        }
      });
    };
    Cypress.on("before:window:load", function(contentWindow) {
      var current, options, ref, runnable;
      overrideRemoteLocationGetters(this, contentWindow);
      current = this.prop("current");
      if (!current) {
        return;
      }
      runnable = this["private"]("runnable");
      if (!runnable) {
        return;
      }
      options = _.last(current.get("args"));
      return options != null ? (ref = options.onBeforeLoad) != null ? ref.call(runnable.ctx, contentWindow) : void 0 : void 0;
    });
    Cypress.Cy.extend({
      _href: function(win, url) {
        return win.location.href = url;
      },
      submitting: function(e, options) {
        if (options == null) {
          options = {};
        }
        this.prop("pageChangeEvent", true);
        return Cypress.Log.command({
          type: "parent",
          name: "form sub",
          message: "--submitting form---",
          event: true,
          end: true,
          snapshot: true,
          onConsole: function() {
            return {
              "Originated From": e.target
            };
          }
        });
      },
      loading: function(options) {
        var current, ready;
        if (options == null) {
          options = {};
        }
        current = this.prop("current");
        if (commandCausingLoading.test(current != null ? current.get("name") : void 0)) {
          return;
        }
        if (!this["private"]("runnable")) {
          return;
        }
        this.prop("pageChangeEvent", true);
        _.defaults(options, {
          timeout: Cypress.config("pageLoadTimeout")
        });
        options._log = Cypress.Log.command({
          type: "parent",
          name: "page load",
          message: "--waiting for new page to load---",
          event: true,
          onConsole: function() {
            return {
              "Notes": "This page event automatically nulls the current subject. This prevents chaining off of DOM objects which existed on the previous page."
            };
          }
        });
        this._clearTimeout();
        ready = this.prop("ready");
        return ready.promise.cancellable().timeout(options.timeout).then((function(_this) {
          return function() {
            var e, error;
            if (Cypress.cy.$$("[data-cypress-visit-error]").length) {
              try {
                $Cypress.Utils.throwErrByPath("navigation.loading_failed", {
                  onFail: options._log
                });
              } catch (error) {
                e = error;
                _this.fail(e);
              }
            } else {
              options._log.set("message", "--page loaded--").snapshot().end();
            }
            return null;
          };
        })(this))["catch"](Promise.CancellationError, function(err) {})["catch"](Promise.TimeoutError, (function(_this) {
          return function(err) {
            var e, error;
            try {
              return timedOutWaitingForPageLoad.call(_this, options.timeout, options._log);
            } catch (error) {
              e = error;
              return _this.fail(e);
            }
          };
        })(this));
      }
    });
    return Cypress.addParentCommand({
      reload: function() {
        var args, cleanup, forceReload, options, p, throwArgsErr;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        throwArgsErr = (function(_this) {
          return function() {
            return $Cypress.Utils.throwErrByPath("reload.invalid_arguments");
          };
        })(this);
        switch (args.length) {
          case 0:
            forceReload = false;
            options = {};
            break;
          case 1:
            if (_.isObject(args[0])) {
              options = args[0];
            } else {
              forceReload = args[0];
            }
            break;
          case 2:
            forceReload = args[0];
            options = args[1];
            break;
          default:
            throwArgsErr();
        }
        this._clearTimeout();
        cleanup = null;
        return p = new Promise((function(_this) {
          return function(resolve, reject) {
            var loaded;
            if (forceReload == null) {
              forceReload = false;
            }
            if (options == null) {
              options = {};
            }
            _.defaults(options, {
              log: true,
              timeout: Cypress.config("pageLoadTimeout")
            });
            if (!_.isBoolean(forceReload)) {
              throwArgsErr();
            }
            if (!_.isObject(options)) {
              throwArgsErr();
            }
            if (options.log) {
              options._log = Cypress.Log.command();
              options._log.snapshot("before", {
                next: "after"
              });
            }
            cleanup = function() {
              return Cypress.off("load", loaded);
            };
            loaded = function() {
              cleanup();
              return resolve(_this["private"]("window"));
            };
            Cypress.on("load", loaded);
            return _this["private"]("window").location.reload(forceReload);
          };
        })(this)).timeout(options.timeout)["catch"](Promise.TimeoutError, (function(_this) {
          return function(err) {
            cleanup();
            return timedOutWaitingForPageLoad.call(_this, options.timeout, options._log);
          };
        })(this));
      },
      go: function(numberOrString, options) {
        var goNumber, goString, win;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true,
          timeout: Cypress.config("pageLoadTimeout")
        });
        if (options.log) {
          options._log = Cypress.Log.command();
        }
        win = this["private"]("window");
        goNumber = (function(_this) {
          return function(num) {
            var beforeUnload, cleanup, didUnload, pending, resolve;
            if (num === 0) {
              $Cypress.Utils.throwErrByPath("go.invalid_number", {
                onFail: options._log
              });
            }
            didUnload = false;
            pending = Promise.pending();
            beforeUnload = function() {
              return didUnload = true;
            };
            resolve = function() {
              return pending.resolve();
            };
            Cypress.on("before:unload", beforeUnload);
            Cypress.on("load", resolve);
            _this._clearTimeout();
            win.history.go(num);
            cleanup = function() {
              Cypress.off("load", resolve);
              return _this["private"]("window");
            };
            return Promise.delay(100).then(function() {
              Cypress.off("before:unload", beforeUnload);
              if (didUnload) {
                return pending.promise.then(cleanup);
              } else {
                return cleanup();
              }
            }).timeout(options.timeout)["catch"](Promise.TimeoutError, function(err) {
              cleanup();
              return timedOutWaitingForPageLoad.call(_this, options.timeout, options._log);
            });
          };
        })(this);
        goString = (function(_this) {
          return function(str) {
            switch (str) {
              case "forward":
                return goNumber(1);
              case "back":
                return goNumber(-1);
              default:
                return $Cypress.Utils.throwErrByPath("go.invalid_direction", {
                  onFail: options._log,
                  args: {
                    str: str
                  }
                });
            }
          };
        })(this);
        switch (false) {
          case !_.isFinite(numberOrString):
            return goNumber(numberOrString);
          case !_.isString(numberOrString):
            return goString(numberOrString);
          default:
            return $Cypress.Utils.throwErrByPath("go.invalid_argument", {
              onFail: options._log
            });
        }
      },
      visit: function(url, options) {
        var $remoteIframe, baseUrl, p, prevTimeout, runnable, win;
        if (options == null) {
          options = {};
        }
        if (!_.isString(url)) {
          $Cypress.Utils.throwErrByPath("visit.invalid_1st_arg");
        }
        _.defaults(options, {
          log: true,
          timeout: Cypress.config("pageLoadTimeout"),
          onBeforeLoad: function() {},
          onLoad: function() {}
        });
        if (options.log) {
          options._log = Cypress.Log.command();
        }
        baseUrl = this.Cypress.config("baseUrl");
        url = Cypress.Location.getRemoteUrl(url, baseUrl);
        prevTimeout = this._timeout();
        this._clearTimeout();
        win = this["private"]("window");
        $remoteIframe = this["private"]("$remoteIframe");
        runnable = this["private"]("runnable");
        p = new Promise((function(_this) {
          return function(resolve, reject) {
            var visit;
            visit = function(win, url, options) {
              $remoteIframe.one("load", function() {
                var e, error, ref;
                _this._timeout(prevTimeout);
                if ((ref = options.onLoad) != null) {
                  ref.call(runnable.ctx, win);
                }
                if (Cypress.cy.$$("[data-cypress-visit-error]").length) {
                  try {
                    return $Cypress.Utils.throwErrByPath("visit.loading_failed", {
                      onFail: options._log,
                      args: {
                        url: url
                      }
                    });
                  } catch (error) {
                    e = error;
                    return reject(e);
                  }
                } else {
                  if (options._log) {
                    options._log.set({
                      url: url
                    }).snapshot();
                  }
                  return resolve(win);
                }
              });
              return $remoteIframe.prop("src", Cypress.Location.createInitialRemoteSrc(url));
            };
            if (_this._getLocation("href") !== "about:blank") {
              $remoteIframe.one("load", function() {
                return visit(win, url, options);
              });
              return _this._href(win, "about:blank");
            } else {
              return visit(win, url, options);
            }
          };
        })(this));
        return p.timeout(options.timeout)["catch"](Promise.TimeoutError, (function(_this) {
          return function(err) {
            $remoteIframe.off("load");
            return timedOutWaitingForPageLoad.call(_this, options.timeout, options._log);
          };
        })(this));
      }
    });
  });

}).call(this);
;
(function() {
  $Cypress.register("Querying", function(Cypress, _, $) {
    var priorityElement;
    priorityElement = "input[type='submit'], button, a, label";
    Cypress.addParentCommand({
      get: function(selector, options) {
        var alias, aliasObj, command, getElements, log, onConsole, resolveAlias, resolveElements, setEl, start, subject;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          retry: true,
          withinSubject: this.prop("withinSubject"),
          log: true,
          command: null,
          verify: true
        });
        this.ensureNoCommandOptions(options);
        onConsole = {};
        start = function(aliasType) {
          if (options.log === false) {
            return;
          }
          return options._log != null ? options._log : options._log = Cypress.Log.command({
            message: selector,
            referencesAlias: typeof aliasObj !== "undefined" && aliasObj !== null ? aliasObj.alias : void 0,
            aliasType: aliasType,
            onConsole: function() {
              return onConsole;
            }
          });
        };
        log = function(value, aliasType) {
          var obj;
          if (aliasType == null) {
            aliasType = "dom";
          }
          if (options.log === false) {
            return;
          }
          if (!_.isObject(options._log)) {
            start(aliasType);
          }
          obj = {};
          if (aliasType === "dom") {
            _.extend(obj, {
              $el: value,
              numRetries: options._retries
            });
          }
          obj.onConsole = function() {
            var key;
            key = aliasObj ? "Alias" : "Selector";
            onConsole[key] = selector;
            switch (aliasType) {
              case "dom":
                _.extend(onConsole, {
                  Returned: Cypress.Utils.getDomElements(value),
                  Elements: value != null ? value.length : void 0
                });
                break;
              case "primitive":
                _.extend(onConsole, {
                  Returned: value
                });
                break;
              case "route":
                _.extend(onConsole, {
                  Returned: value
                });
            }
            return onConsole;
          };
          return options._log.set(obj);
        };
        if (aliasObj = this.getAlias(selector.split(".")[0])) {
          subject = aliasObj.subject, alias = aliasObj.alias, command = aliasObj.command;
          return (resolveAlias = (function(_this) {
            return function() {
              var ref, replay, replayFrom, responses;
              switch (false) {
                case !Cypress.Utils.hasElement(subject):
                  replayFrom = false;
                  replay = function() {
                    _this._replayFrom(command);
                    return null;
                  };
                  if (!_this._contains(subject)) {
                    subject = subject.filter(function(index, el) {
                      return cy._contains(el);
                    });
                    if (!subject.length) {
                      return replay();
                    }
                  }
                  log(subject);
                  return _this.verifyUpcomingAssertions(subject, options, {
                    onFail: function(err) {
                      if (err.type === "length" && err.actual < err.expected) {
                        return replayFrom = true;
                      }
                    },
                    onRetry: function() {
                      if (replayFrom) {
                        return replay();
                      } else {
                        return resolveAlias();
                      }
                    }
                  });
                case command.get("name") !== "route":
                  alias = _.compact([alias, selector.split(".")[1]]).join(".");
                  responses = (ref = _this.getResponsesByAlias(alias)) != null ? ref : null;
                  log(responses, "route");
                  return responses;
                default:
                  log(subject, "primitive");
                  return subject;
              }
            };
          })(this))();
        }
        start("dom");
        setEl = function($el) {
          if (options.log === false) {
            return;
          }
          onConsole.Returned = Cypress.Utils.getDomElements($el);
          onConsole.Elements = $el != null ? $el.length : void 0;
          return options._log.set({
            $el: $el
          });
        };
        getElements = (function(_this) {
          return function() {
            var $el, e, error, filtered, ret;
            try {
              $el = _this.$$(selector, options.withinSubject);
            } catch (error) {
              e = error;
              e.onFail = function() {
                return options._log.error(e);
              };
              throw e;
            }
            if (!$el.length && options.withinSubject && options.filter) {
              filtered = options.withinSubject.filter(selector);
              if (filtered.length) {
                $el = filtered;
              }
            }
            setEl($el);
            if (_.isFunction(options.onRetry)) {
              if (ret = options.onRetry.call(_this, $el)) {
                log($el);
                return ret;
              }
            } else {
              log($el);
              return $el;
            }
          };
        })(this);
        return (resolveElements = (function(_this) {
          return function() {
            return Promise["try"](getElements).then(function($el) {
              if (options.verify === false) {
                return $el;
              }
              return _this.verifyUpcomingAssertions($el, options, {
                onRetry: resolveElements
              });
            });
          };
        })(this))();
      },
      root: function(options) {
        var log, withinSubject;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true
        });
        if (options.log !== false) {
          options._log = Cypress.Log.command({
            message: ""
          });
        }
        log = function($el) {
          if (options.log) {
            options._log.set({
              $el: $el
            });
          }
          return $el;
        };
        if (withinSubject = this.prop("withinSubject")) {
          return log(withinSubject);
        }
        return this.execute("get", "html", {
          log: false
        }).then(log);
      }
    });
    Cypress.addDualCommand({
      contains: function(subject, filter, text, options) {
        var checkToAutomaticallyRetry, getErr, getFirstDeepestElement, getOpts, getPhrase, onConsole, resolveElements, selector, setEl;
        if (options == null) {
          options = {};
        }
        if (subject && !Cypress.Utils.hasElement(subject)) {
          subject = null;
        }
        switch (false) {
          case !_.isObject(text):
            options = text;
            text = filter;
            filter = "";
            break;
          case !_.isUndefined(text):
            text = filter;
            filter = "";
        }
        _.defaults(options, {
          log: true
        });
        this.ensureNoCommandOptions(options);
        if (!(_.isString(text) || _.isFinite(text))) {
          $Cypress.Utils.throwErrByPath("contains.invalid_argument");
        }
        if (_.isBlank(text)) {
          $Cypress.Utils.throwErrByPath("contains.empty_string");
        }
        getPhrase = function(type, negated) {
          var node;
          switch (false) {
            case !filter:
              return "within the selector: '" + filter + "' ";
            case !subject:
              node = Cypress.Utils.stringifyElement(subject, "short");
              return "within the element: " + node + " ";
            default:
              return "";
          }
        };
        getErr = function(err) {
          var negated, node, type;
          type = err.type, negated = err.negated, node = err.node;
          switch (type) {
            case "existence":
              if (negated) {
                return "Expected not to find content: '" + text + "' " + (getPhrase(type, negated)) + "but continuously found it.";
              } else {
                return "Expected to find content: '" + text + "' " + (getPhrase(type, negated)) + "but never did.";
              }
          }
        };
        if (options.log !== false) {
          onConsole = {
            Content: text,
            "Applied To": Cypress.Utils.getDomElements(subject || this.prop("withinSubject"))
          };
          options._log = Cypress.Log.command({
            message: _.compact([filter, text]),
            type: subject ? "child" : "parent",
            onConsole: function() {
              return onConsole;
            }
          });
        }
        getOpts = _.extend(_.clone(options), {
          withinSubject: subject || this.prop("withinSubject") || this.$$("body"),
          filter: true,
          log: false,
          verify: false
        });
        setEl = function($el) {
          if (options.log === false) {
            return;
          }
          onConsole.Returned = Cypress.Utils.getDomElements($el);
          onConsole.Elements = $el != null ? $el.length : void 0;
          return options._log.set({
            $el: $el
          });
        };
        getFirstDeepestElement = function(elements, index) {
          var $current, $next, $priorities;
          if (index == null) {
            index = 0;
          }
          $current = elements.slice(index, index + 1);
          $next = elements.slice(index + 1, index + 2);
          if (!$next) {
            return $current;
          }
          if ($.contains($current.get(0), $next.get(0))) {
            return getFirstDeepestElement(elements, index + 1);
          } else {
            if ($current.is(priorityElement)) {
              return $current;
            }
            $priorities = elements.filter($current.parents(priorityElement));
            if ($priorities.length) {
              return $priorities.last();
            } else {
              return $current;
            }
          }
        };
        text = Cypress.Utils.escapeQuotes(text);
        selector = filter + ":not(script):contains('" + text + "'), " + filter + "[type='submit'][value~='" + text + "']";
        checkToAutomaticallyRetry = function(count, $el) {
          if (count !== 0 || ($el && $el.length)) {
            return;
          }
          throw new Error();
        };
        return (resolveElements = (function(_this) {
          return function() {
            return _this.execute("get", selector, getOpts).then(function($elements) {
              var $el;
              $el = (function() {
                switch (false) {
                  case !($elements && $elements.length && filter):
                    return $elements.last();
                  case !($elements && $elements.length):
                    return getFirstDeepestElement($elements);
                  default:
                    return $elements;
                }
              })();
              setEl($el);
              return _this.verifyUpcomingAssertions($el, options, {
                onRetry: resolveElements,
                onFail: function(err) {
                  switch (err.type) {
                    case "length":
                      if (err.expected > 1) {
                        return $Cypress.Utils.throwErrByPath("contains.length_option", {
                          onFail: options._log
                        });
                      }
                      break;
                    case "existence":
                      return err.longMessage = getErr(err);
                  }
                }
              });
            });
          };
        })(this))();
      }
    });
    return Cypress.addChildCommand({
      within: function(subject, options, fn) {
        var next, prevWithinSubject, setWithinSubject, stop;
        this.ensureDom(subject);
        if (_.isUndefined(fn)) {
          fn = options;
          options = {};
        }
        _.defaults(options, {
          log: true
        });
        if (options.log) {
          options._log = Cypress.Log.command({
            $el: subject,
            message: ""
          });
        }
        if (!_.isFunction(fn)) {
          $Cypress.Utils.throwErrByPath("within.invalid_argument", {
            onFail: options._log
          });
        }
        next = this.prop("current").get("next");
        prevWithinSubject = this.prop("withinSubject");
        this.prop("withinSubject", subject);
        fn.call(this["private"]("runnable").ctx, subject);
        stop = (function(_this) {
          return function() {
            return _this.off("command:start", setWithinSubject);
          };
        })(this);
        setWithinSubject = function(obj) {
          if (obj !== next) {
            return;
          }
          if (next !== this.prop("nextWithinSubject")) {
            this.prop("withinSubject", prevWithinSubject || null);
            this.prop("nextWithinSubject", next);
          }
          return stop();
        };
        if (next) {
          this.on("command:start", setWithinSubject);
        } else {
          this.once("end", function() {
            stop();
            return this.prop("withinSubject", null);
          });
        }
        return subject;
      }
    });
  });

}).call(this);
;
(function() {
  var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice;

  $Cypress.register("Request", function(Cypress, _, $) {
    var argIsHttpMethod, defaults, isOkStatusCodeRe, isValidJsonObj, optionalOpts, request, validHttpMethodsRe, whichAreUntruthyAndOptional;
    isOkStatusCodeRe = /^2/;
    validHttpMethodsRe = /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/;
    optionalOpts = "body auth headers json".split(" ");
    defaults = {
      log: true,
      body: null,
      auth: null,
      headers: null,
      json: false,
      cookies: true,
      gzip: true,
      failOnStatus: true,
      method: "GET"
    };
    request = (function(_this) {
      return function(options) {
        return new Promise(function(resolve) {
          return Cypress.trigger("request", options, resolve);
        });
      };
    })(this);
    argIsHttpMethod = function(str) {
      return _.isString(str) && validHttpMethodsRe.test(str.toUpperCase());
    };
    isValidJsonObj = function(body) {
      return _.isObject(body) && !_.isFunction(body);
    };
    whichAreUntruthyAndOptional = function(val, key) {
      return !val && indexOf.call(optionalOpts, key) >= 0;
    };
    return Cypress.addParentCommand({
      request: function() {
        var a, args, c, h, isPlainObject, o, options, origin, requestOpts;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        options = o = {};
        switch (false) {
          case !_.isObject(args[0]):
            _.extend(options, args[0]);
            break;
          case args.length !== 1:
            o.url = args[0];
            break;
          case args.length !== 2:
            if (argIsHttpMethod(args[0])) {
              o.method = args[0];
              o.url = args[1];
            } else {
              o.url = args[0];
              o.body = args[1];
            }
            break;
          case args.length !== 3:
            o.method = args[0];
            o.url = args[1];
            o.body = args[2];
        }
        _.defaults(options, defaults, {
          domain: window.location.hostname,
          timeout: Cypress.config("responseTimeout")
        });
        options.method = options.method.toUpperCase();
        if (!validHttpMethodsRe.test(options.method)) {
          $Cypress.Utils.throwErrByPath("request.invalid_method", {
            args: {
              method: o.method
            }
          });
        }
        if (!options.url) {
          $Cypress.Utils.throwErrByPath("request.url_missing");
        }
        if (!_.isString(options.url)) {
          $Cypress.Utils.throwErrByPath("request.url_wrong_type");
        }
        origin = this._getLocation("origin") || this.Cypress.config("baseUrl");
        options.url = Cypress.Location.getRemoteUrl(options.url, origin);
        if (!Cypress.Location.isFullyQualifiedUrl(options.url)) {
          $Cypress.Utils.throwErrByPath("request.url_invalid");
        }
        if (isValidJsonObj(options.body)) {
          options.json = true;
        }
        options = _.omit(options, whichAreUntruthyAndOptional);
        if (a = options.auth) {
          if (!_.isObject(a)) {
            $Cypress.Utils.throwErrByPath("request.auth_invalid");
          }
        }
        if (h = options.headers) {
          if (_.isObject(h)) {
            options.headers = h;
          } else {
            $Cypress.Utils.throwErrByPath("request.headers_invalid");
          }
        }
        isPlainObject = function(obj) {
          return _.isObject(obj) && !_.isArray(obj) && !_.isFunction(obj);
        };
        if (c = options.cookies) {
          if (!_.isBoolean(c) && !isPlainObject(c)) {
            $Cypress.Utils.throwErrByPath("request.cookies_invalid");
          }
        }
        if (!_.isBoolean(options.gzip)) {
          $Cypress.Utils.throwErrByPath("request.gzip_invalid");
        }
        requestOpts = _(options).pick("method", "url", "body", "headers", "cookies", "json", "auth", "gzip", "domain");
        if (options.log) {
          options._log = Cypress.Log.command({
            message: "",
            onConsole: function() {
              return {
                Request: requestOpts,
                Returned: options.response
              };
            },
            onRender: function($row) {
              var klass, r, status;
              status = (function() {
                switch (false) {
                  case !(r = options.response):
                    return r.status;
                  default:
                    klass = "pending";
                    return "---";
                }
              })();
              if (klass == null) {
                klass = isOkStatusCodeRe.test(status) ? "successful" : "bad";
              }
              return $row.find(".command-message").html(function() {
                return [("<i class='fa fa-circle " + klass + "'></i>") + options.method, status, _.truncate(options.url, 25)].join(" ");
              });
            }
          });
        }
        this._clearTimeout();
        return request(requestOpts).timeout(options.timeout).then((function(_this) {
          return function(response) {
            var b, body, err, headers;
            options.response = response;
            if (err = response.__error) {
              body = (b = requestOpts.body) ? "Body: " + (Cypress.Utils.stringify(b)) : "";
              headers = (h = requestOpts.headers) ? "Headers: " + (Cypress.Utils.stringify(h)) : "";
              $Cypress.Utils.throwErrByPath("request.loading_failed", {
                onFail: options._log,
                args: {
                  error: err,
                  method: requestOpts.method,
                  url: requestOpts.url,
                  body: body,
                  headers: headers
                }
              });
            }
            if (options.failOnStatus && !isOkStatusCodeRe.test(response.status)) {
              $Cypress.Utils.throwErrByPath("request.status_invalid", {
                onFail: options._log,
                args: {
                  status: response.status
                }
              });
            }
            return response;
          };
        })(this))["catch"](Promise.TimeoutError, (function(_this) {
          return function(err) {
            return $Cypress.Utils.throwErrByPath("request.timed_out", {
              onFail: options._log,
              args: {
                timeout: options.timeout
              }
            });
          };
        })(this));
      }
    });
  });

}).call(this);
;
(function() {
  $Cypress.register("Sandbox", function(Cypress, _, $) {
    var createSandbox;
    createSandbox = function(sinon) {
      sinon.format = function() {
        return "";
      };
      return sinon.sandbox.create();
    };
    Cypress.on("restore", function() {
      var sandbox;
      if (!this.prop) {
        return;
      }
      if (sandbox = this.prop("sandbox")) {
        return sandbox.restore();
      }
    });
    return Cypress.Cy.extend({
      _getSandbox: function() {
        var ref, sandbox, sinon;
        sinon = this["private"]("window").sinon;
        if (!sinon) {
          $Cypress.Utils.throwErrByPath("miscellaneous.no_sandbox");
        }
        sandbox = (ref = this.prop("sandbox")) != null ? ref : createSandbox(sinon);
        return this.prop("sandbox", sandbox);
      }
    });
  });

}).call(this);
;
(function() {
  $Cypress.register("Traversals", function(Cypress, _, $) {
    var traversals;
    traversals = "find filter not children eq closest first last next parent parents prev siblings".split(" ");
    return _.each(traversals, function(traversal) {
      return Cypress.addChildCommand(traversal, function(subject, arg1, arg2, options) {
        var getElements, getSelector, onConsole, setEl;
        this.ensureDom(subject);
        if (_.isObject(arg2)) {
          options = arg2;
        }
        if (_.isObject(arg1)) {
          options = arg1;
        }
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true
        });
        this.ensureNoCommandOptions(options);
        getSelector = function() {
          var args;
          args = _([arg1, arg2]).chain().reject(_.isFunction).reject(_.isObject).value();
          args = _(args).without(null, void 0);
          return args.join(", ");
        };
        onConsole = {
          Selector: getSelector(),
          "Applied To": $Cypress.Utils.getDomElements(subject)
        };
        if (options.log !== false) {
          options._log = Cypress.Log.command({
            message: getSelector(),
            onConsole: function() {
              return onConsole;
            }
          });
        }
        setEl = function($el) {
          if (options.log === false) {
            return;
          }
          onConsole.Returned = Cypress.Utils.getDomElements($el);
          onConsole.Elements = $el != null ? $el.length : void 0;
          return options._log.set({
            $el: $el
          });
        };
        return (getElements = (function(_this) {
          return function() {
            var $el, e, error;
            try {
              $el = subject[traversal].call(subject, arg1, arg2);
              $el.selector = getSelector();
            } catch (error) {
              e = error;
              e.onFail = function() {
                return options._log.error(e);
              };
              throw e;
            }
            setEl($el);
            return _this.verifyUpcomingAssertions($el, options, {
              onRetry: getElements,
              onFail: function(err) {
                var node;
                if (err.type === "existence") {
                  node = $Cypress.Utils.stringifyElement(subject, "short");
                  return err.longMessage += " Queried from element: " + node;
                }
              }
            });
          };
        })(this))();
      });
    });
  });

}).call(this);
;
(function() {
  $Cypress.register("Waiting", function(Cypress, _, $, Promise) {
    Cypress.addDualCommand({
      wait: function(subject, msOrFnOrAlias, options) {
        var args;
        if (options == null) {
          options = {};
        }
        if (msOrFnOrAlias == null) {
          msOrFnOrAlias = 1e9;
        }
        if (_.isString(options)) {
          $Cypress.Utils.throwErrByPath("wait.invalid_arguments");
        }
        _.defaults(options, {
          log: true
        });
        args = [subject, msOrFnOrAlias, options];
        switch (false) {
          case !_.isNumber(msOrFnOrAlias):
            return this._waitNumber.apply(this, args);
          case !_.isFunction(msOrFnOrAlias):
            return this._waitFunction.apply(this, args);
          case !_.isString(msOrFnOrAlias):
            return this._waitString.apply(this, args);
          case !_.isArray(msOrFnOrAlias):
            return this._waitString.apply(this, args);
          default:
            return $Cypress.Utils.throwErrByPath("wait.invalid_1st_arg");
        }
      }
    });
    return Cypress.Cy.extend({
      _waitNumber: function(subject, ms, options) {
        this._timeout(ms, true);
        if (options.log !== false) {
          options._log = Cypress.Log.command({
            onConsole: function() {
              return {
                "Waited For": ms + "ms before continuing",
                "Returned": subject
              };
            }
          });
        }
        return Promise.delay(ms)["return"](subject);
      },
      _waitFunction: function(subject, fn, options) {
        return $Cypress.Utils.throwErrByPath("wait.fn_deprecated");
      },
      _waitString: function(subject, str, options) {
        var checkForXhr, getNumRequests, log, waitForXhr, xhrs;
        if (options.log !== false) {
          log = options._log = Cypress.Log.command({
            type: "parent",
            aliasType: "route"
          });
        }
        getNumRequests = (function(_this) {
          return function(alias) {
            var ref, requests;
            requests = (ref = _this.prop("aliasRequests")) != null ? ref : {};
            if (requests[alias] == null) {
              requests[alias] = 0;
            }
            requests[alias] += 1;
            _this.prop("aliasRequests", requests);
            return _.ordinalize(requests[alias]);
          };
        })(this);
        checkForXhr = function(alias, type, num, options) {
          var args, xhr;
          options.type = type;
          xhr = this.getLastXhrByAlias(alias + "." + type);
          if (xhr) {
            return Promise.resolve(xhr);
          }
          options.error = $Cypress.Utils.errMessageByPath("wait.timed_out", {
            timeout: options.timeout,
            alias: alias,
            num: num,
            type: type
          });
          args = arguments;
          return this._retry(function() {
            return checkForXhr.apply(this, args);
          }, options);
        };
        waitForXhr = function(str, options) {
          var alias, aliasObj, aliases, command, num, ref, ref1, referencesAlias, str2, timeout, type, waitForRequest, waitForResponse;
          ref = str.split("."), str = ref[0], str2 = ref[1];
          if (!(aliasObj = this.getAlias(str, "wait", log))) {
            this.aliasNotFoundFor(str, "wait", log);
          }
          alias = aliasObj.alias, command = aliasObj.command;
          str = _.compact([alias, str2]).join(".");
          type = this.getXhrTypeByAlias(str);
          if (log) {
            referencesAlias = (ref1 = log.get("referencesAlias")) != null ? ref1 : [];
            aliases = [].concat(referencesAlias);
            aliases.push(str);
            log.set("referencesAlias", aliases);
          }
          if (command.get("name") !== "route") {
            $Cypress.Utils.throwErrByPath("wait.invalid_alias", {
              onFail: options._log,
              args: {
                alias: alias
              }
            });
          }
          timeout = options.timeout;
          num = getNumRequests(alias);
          waitForRequest = (function(_this) {
            return function() {
              options = _.omit(options, "_runnableTimeout");
              options.timeout = timeout != null ? timeout : Cypress.config("requestTimeout");
              return checkForXhr.call(_this, alias, "request", num, options);
            };
          })(this);
          waitForResponse = (function(_this) {
            return function() {
              options = _.omit(options, "_runnableTimeout");
              options.timeout = timeout != null ? timeout : Cypress.config("responseTimeout");
              return checkForXhr.call(_this, alias, "response", num, options);
            };
          })(this);
          if (type === "request") {
            return waitForRequest();
          } else {
            return waitForRequest().then(waitForResponse);
          }
        };
        xhrs = [];
        return Promise.map([].concat(str), (function(_this) {
          return function(str) {
            var xhr;
            xhr = Promise.resolve(waitForXhr.call(_this, str, _.omit(options, "error", "timeout")));
            xhrs.push(xhr);
            return xhr;
          };
        })(this)).then(function(responses) {
          var ret;
          ret = responses.length === 1 ? responses[0] : responses;
          if (options._log) {
            options._log.set("onConsole", function() {
              return {
                "Waited For": this.referencesAlias.join(", "),
                "Returned": ret
              };
            });
            options._log.snapshot().end();
          }
          return ret;
        })["catch"](function(err) {
          _(xhrs).invoke("cancel");
          throw err;
        });
      }
    });
  });

}).call(this);
;
(function() {
  var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $Cypress.register("Window", function(Cypress, _, $) {
    var triggerAndSetViewport, validOrientations, viewportDefaults, viewports;
    viewportDefaults = null;
    viewports = {
      "macbook-15": "1440x900",
      "macbook-13": "1280x800",
      "macbook-11": "1366x768",
      "ipad-2": "768x1024",
      "ipad-mini": "768x1024",
      "iphone-6+": "414x736",
      "iphone-6": "375x667",
      "iphone-5": "320x568",
      "iphone-4": "320x480",
      "iphone-3": "320x480"
    };
    validOrientations = ["landscape", "portrait"];
    Cypress.on("test:before:hooks", function() {
      var d;
      if (d = viewportDefaults) {
        triggerAndSetViewport.call(this, d.viewportWidth, d.viewportHeight);
        return viewportDefaults = null;
      }
    });
    triggerAndSetViewport = function(width, height) {
      var viewport;
      this.Cypress.config("viewportWidth", width);
      this.Cypress.config("viewportHeight", height);
      viewport = {
        viewportWidth: width,
        viewportHeight: height
      };
      Cypress.trigger("viewport", viewport);
      return viewport;
    };
    return Cypress.addParentCommand({
      title: function(options) {
        var resolveTitle;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true
        });
        if (options.log) {
          options._log = Cypress.Log.command();
        }
        return (resolveTitle = (function(_this) {
          return function() {
            return _this.execute("get", "title", {
              log: false,
              verify: false
            }).then(function($el) {
              options.$el = $el.filter("head title");
              options.$el.selector = $el.selector;
              return _this.verifyUpcomingAssertions(options.$el.text(), options, {
                onRetry: resolveTitle
              });
            });
          };
        })(this))();
      },
      window: function(options) {
        var getWindow, retryWindow, verifyAssertions;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true
        });
        if (options.log) {
          options._log = Cypress.Log.command();
        }
        getWindow = (function(_this) {
          return function() {
            var window;
            window = _this["private"]("window");
            if (!window) {
              $Cypress.Utils.throwErrByPath("window.iframe_undefined", {
                onFail: options._log
              });
            }
            return window;
          };
        })(this);
        retryWindow = (function(_this) {
          return function() {
            return Promise["try"](getWindow)["catch"](function(err) {
              options.error = err;
              return _this._retry(retryWindow, options);
            });
          };
        })(this);
        return (verifyAssertions = (function(_this) {
          return function() {
            return Promise["try"](retryWindow).then(function(win) {
              return _this.verifyUpcomingAssertions(win, options, {
                onRetry: verifyAssertions
              });
            });
          };
        })(this))();
      },
      document: function(options) {
        var getDocument, retryDocument, verifyAssertions;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          log: true
        });
        if (options.log) {
          options._log = Cypress.Log.command();
        }
        getDocument = (function(_this) {
          return function() {
            var win;
            win = _this["private"]("window");
            if (!(win != null ? win.document : void 0)) {
              $Cypress.Utils.throwErrByPath("window.iframe_doc_undefined");
            }
            return win.document;
          };
        })(this);
        retryDocument = (function(_this) {
          return function() {
            return Promise["try"](getDocument)["catch"](function(err) {
              options.error = err;
              return _this._retry(retryDocument, options);
            });
          };
        })(this);
        return (verifyAssertions = (function(_this) {
          return function() {
            return Promise["try"](retryDocument).then(function(doc) {
              return _this.verifyUpcomingAssertions(doc, options, {
                onRetry: verifyAssertions
              });
            });
          };
        })(this))();
      },
      doc: function() {
        return this.sync.document();
      },
      viewport: function(presetOrWidth, heightOrOrientation, options) {
        var dimensions, getPresetDimensions, height, orientation, orientationIsValidAndLandscape, preset, throwErrBadArgs, viewport, width, widthAndHeightAreValidNumbers, widthAndHeightAreWithinBounds;
        if (options == null) {
          options = {};
        }
        if (_.isObject(heightOrOrientation)) {
          options = heightOrOrientation;
        }
        _.defaults(options, {
          log: true
        });
        if (options.log) {
          options._log = Cypress.Log.command({
            onConsole: function() {
              var obj;
              obj = {};
              if (preset) {
                obj.Preset = preset;
              }
              obj.Width = width;
              obj.Height = height;
              return obj;
            }
          });
        }
        throwErrBadArgs = (function(_this) {
          return function() {
            return $Cypress.Utils.throwErrByPath("viewport.bad_args", {
              onFail: options._log
            });
          };
        })(this);
        widthAndHeightAreValidNumbers = function(width, height) {
          return _.all([width, height], function(val) {
            return _.isNumber(val) && _.isFinite(val);
          });
        };
        widthAndHeightAreWithinBounds = function(width, height) {
          return _.all([width, height], function(val) {
            return val > 200 && val < 3000;
          });
        };
        switch (false) {
          case !(_.isString(presetOrWidth) && _.isBlank(presetOrWidth)):
            $Cypress.Utils.throwErrByPath("viewport.empty_string", {
              onFail: options._log
            });
            break;
          case !_.isString(presetOrWidth):
            getPresetDimensions = (function(_this) {
              return function(preset) {
                var e, error, presets;
                try {
                  return _(viewports[presetOrWidth].split("x")).map(Number);
                } catch (error) {
                  e = error;
                  presets = _.keys(viewports).join(", ");
                  return $Cypress.Utils.throwErrByPath("viewport.missing_preset", {
                    onFail: options._log,
                    args: {
                      preset: preset,
                      presets: presets
                    }
                  });
                }
              };
            })(this);
            orientationIsValidAndLandscape = (function(_this) {
              return function(orientation) {
                var all;
                if (indexOf.call(validOrientations, orientation) < 0) {
                  all = validOrientations.join("' or '");
                  $Cypress.Utils.throwErrByPath("viewport.invalid_orientation", {
                    onFail: options._log,
                    args: {
                      all: all,
                      orientation: orientation
                    }
                  });
                }
                return orientation === "landscape";
              };
            })(this);
            preset = presetOrWidth;
            orientation = heightOrOrientation;
            dimensions = getPresetDimensions(preset);
            if (_.isString(orientation)) {
              if (orientationIsValidAndLandscape(orientation)) {
                dimensions.reverse();
              }
            }
            width = dimensions[0], height = dimensions[1];
            break;
          case !widthAndHeightAreValidNumbers(presetOrWidth, heightOrOrientation):
            width = presetOrWidth;
            height = heightOrOrientation;
            if (!widthAndHeightAreWithinBounds(width, height)) {
              $Cypress.Utils.throwErrByPath("viewport.dimensions_out_of_range", {
                onFail: options._log
              });
            }
            break;
          default:
            throwErrBadArgs();
        }
        if (!viewportDefaults) {
          viewportDefaults = _.pick(this.Cypress.config(), "viewportWidth", "viewportHeight");
        }
        viewport = triggerAndSetViewport.call(this, width, height);
        if (options._log) {
          options._log.set(viewport);
        }
        return null;
      }
    });
  });

}).call(this);
;
(function() {
  var slice = [].slice;

  $Cypress.register("XHR2", function(Cypress, _) {
    var abort, defaults, getDisplayName, getServer, getUrl, isUrlLikeArgs, requestXhrRe, server, setRequest, setResponse, stripOrigin, unavailableErr, validAliasApiRe, validHttpMethodsRe;
    validHttpMethodsRe = /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/i;
    requestXhrRe = /\.request$/;
    validAliasApiRe = /^(\d+|all)$/;
    server = null;
    getServer = function() {
      return server != null ? server : unavailableErr.call(this);
    };
    abort = function() {
      if (server) {
        return server.abort();
      }
    };
    isUrlLikeArgs = function(url, response) {
      return (!_.isObject(url) && !_.isObject(response)) || (_.isRegExp(url) || _.isString(url));
    };
    getUrl = function(options) {
      return options.originalUrl || options.url;
    };
    unavailableErr = function() {
      return $Cypress.Utils.throwErrByPath("server.unavailable");
    };
    getDisplayName = function(route) {
      if (route && (route.response != null)) {
        return "xhr stub";
      } else {
        return "xhr";
      }
    };
    stripOrigin = function(url) {
      var location;
      location = Cypress.Location.parse(url);
      return url.replace(location.origin, "");
    };
    setRequest = function(xhr, alias) {
      var ref, requests;
      requests = (ref = this.prop("requests")) != null ? ref : [];
      requests.push({
        xhr: xhr,
        alias: alias
      });
      return this.prop("requests", requests);
    };
    setResponse = function(xhr) {
      var obj, ref, responses;
      obj = _.findWhere(this.prop("requests"), {
        xhr: xhr
      });
      responses = (ref = this.prop("responses")) != null ? ref : [];
      responses.push({
        xhr: xhr,
        alias: obj != null ? obj.alias : void 0
      });
      return this.prop("responses", responses);
    };
    defaults = {
      method: void 0,
      status: void 0,
      delay: void 0,
      headers: void 0,
      response: void 0,
      autoRespond: void 0,
      waitOnResponses: void 0,
      onAbort: void 0,
      onRequest: void 0,
      onResponse: void 0
    };
    Cypress.on("before:unload", function() {
      if (server) {
        return server.abort();
      }
    });
    Cypress.on("abort", abort);
    Cypress.on("test:before:hooks", function(test) {
      if (test == null) {
        test = {};
      }
      abort();
      return server = this.startXhrServer(test.id);
    });
    Cypress.on("before:window:load", function(contentWindow) {
      if (server) {
        return $Cypress.Server.bindTo(contentWindow, _.bind(getServer, this));
      } else {
        return unavailableErr.call(this);
      }
    });
    Cypress.Cy.extend({
      getXhrServer: function() {
        var ref;
        return (ref = this.prop("server")) != null ? ref : unavailableErr.call(this);
      },
      startXhrServer: function(testId) {
        var cy, logs;
        logs = {};
        cy = this;
        return this.prop("server", $Cypress.Server.create({
          testId: testId,
          xhrUrl: this.Cypress.config("xhrUrl"),
          stripOrigin: stripOrigin,
          getUrlOptions: (function(_this) {
            return function(url) {
              var currentOrigin, remoteOrigin, requestOrigin;
              requestOrigin = Cypress.Location.parse(url).origin;
              currentOrigin = Cypress.Location.parse(window.location.href).origin;
              remoteOrigin = _this._getLocation("origin");
              switch (false) {
                case requestOrigin !== currentOrigin:
                  return {
                    actual: stripOrigin(url),
                    display: Cypress.Location.resolve(remoteOrigin || currentOrigin, stripOrigin(url))
                  };
                case requestOrigin !== remoteOrigin:
                  return {
                    actual: stripOrigin(url),
                    display: url
                  };
                default:
                  return {
                    actual: "/" + url,
                    display: url
                  };
              }
            };
          })(this),
          onSend: (function(_this) {
            return function(xhr, stack, route) {
              var alias, log, numResponses, rl;
              alias = route != null ? route.alias : void 0;
              setRequest.call(_this, xhr, alias);
              if (rl = route && route.log) {
                numResponses = rl.get("numResponses");
                rl.set("numResponses", numResponses + 1);
              }
              logs[xhr.id] = log = Cypress.Log.command({
                message: "",
                name: "xhr",
                displayName: getDisplayName(route),
                alias: alias,
                aliasType: "route",
                type: "parent",
                event: true,
                onConsole: function() {
                  var consoleObj;
                  consoleObj = {
                    Alias: alias,
                    Method: xhr.method,
                    URL: xhr.url,
                    "Matched URL": route != null ? route.url : void 0,
                    Status: xhr.statusMessage,
                    Duration: xhr.duration,
                    "Stubbed": route && (route.response != null) ? "Yes" : "No",
                    Request: xhr.request,
                    Response: xhr.response,
                    XHR: xhr._getXhr()
                  };
                  if (route && route.is404) {
                    consoleObj.Note = "This request did not match any of your routes. It was automatically sent back '404'. Setting cy.server({force404: false}) will turn off this behavior.";
                  }
                  consoleObj.groups = function() {
                    return [
                      {
                        name: "Initiator",
                        items: [stack],
                        label: false
                      }
                    ];
                  };
                  return consoleObj;
                },
                onRender: function($row) {
                  var klass, status;
                  status = (function() {
                    switch (false) {
                      case !xhr.aborted:
                        klass = "aborted";
                        return "(aborted)";
                      case !(xhr.status > 0):
                        return xhr.status;
                      default:
                        klass = "pending";
                        return "---";
                    }
                  })();
                  if (klass == null) {
                    klass = /^2/.test(status) ? "successful" : "bad";
                  }
                  return $row.find(".command-message").html(function() {
                    return [("<i class='fa fa-circle " + klass + "'></i>") + xhr.method, status, _.truncate(stripOrigin(xhr.url), 20)].join(" ");
                  });
                }
              });
              return log.snapshot("request");
            };
          })(this),
          onLoad: (function(_this) {
            return function(xhr) {
              var log;
              setResponse.call(_this, xhr);
              if (log = logs[xhr.id]) {
                return log.snapshot("response").end();
              }
            };
          })(this),
          onNetworkError: function(xhr) {
            var err, log;
            err = $Cypress.Utils.cypressErr($Cypress.Utils.errMessageByPath("xhr.network_error"));
            if (log = logs[xhr.id]) {
              return log.snapshot("failed").error(err);
            }
          },
          onFixtureError: function(xhr, err) {
            err = $Cypress.Utils.cypressErr(err);
            return this.onError(xhr, err);
          },
          onError: (function(_this) {
            return function(xhr, err) {
              var log;
              err.onFail = function() {};
              if (log = logs[xhr.id]) {
                log.snapshot("error").error(err);
              }
              return _this.fail(err);
            };
          })(this),
          onXhrAbort: (function(_this) {
            return function(xhr, stack) {
              var err, log;
              setResponse.call(_this, xhr);
              err = new Error($Cypress.Utils.errMessageByPath("xhr.aborted"));
              err.name = "AbortError";
              err.stack = stack;
              if (log = logs[xhr.id]) {
                return log.snapshot("aborted").error(err);
              }
            };
          })(this),
          onAnyAbort: (function(_this) {
            return function(route, xhr) {
              if (route && _.isFunction(route.onAbort)) {
                return route.onAbort.call(_this, xhr);
              }
            };
          })(this),
          onAnyRequest: (function(_this) {
            return function(route, xhr) {
              if (route && _.isFunction(route.onRequest)) {
                return route.onRequest.call(_this, xhr);
              }
            };
          })(this),
          onAnyResponse: (function(_this) {
            return function(route, xhr) {
              if (route && _.isFunction(route.onResponse)) {
                return route.onResponse.call(_this, xhr);
              }
            };
          })(this)
        }));
      }
    });
    Cypress.addParentCommand({
      server: function(options) {
        if (arguments.length === 0) {
          options = {};
        }
        if (!_.isObject(options)) {
          $Cypress.Utils.throwErrByPath("server.invalid_argument");
        }
        _.defaults(options, {
          enable: true
        });
        this.prop("serverIsStubbed", options.enable);
        return this.getXhrServer().set(options);
      },
      route: function() {
        var alias, aliasObj, args, hasResponse, o, options;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        hasResponse = true;
        if (!this.prop("serverIsStubbed")) {
          $Cypress.Utils.throwErrByPath("route.failed_prerequisites");
        }
        options = o = this.getXhrServer().getOptions();
        switch (false) {
          case !(_.isObject(args[0]) && !_.isRegExp(args[0])):
            if (!_.has(args[0], "response")) {
              hasResponse = false;
            }
            options = o = _.extend({}, options, args[0]);
            break;
          case args.length !== 0:
            $Cypress.Utils.throwErrByPath("route.invalid_arguments");
            break;
          case args.length !== 1:
            o.url = args[0];
            hasResponse = false;
            break;
          case args.length !== 2:
            if (_.isString(args[0]) && validHttpMethodsRe.test(args[0])) {
              o.method = args[0];
              o.url = args[1];
              hasResponse = false;
            } else {
              o.url = args[0];
              o.response = args[1];
            }
            break;
          case args.length !== 3:
            if (validHttpMethodsRe.test(args[0]) || isUrlLikeArgs(args[1], args[2])) {
              o.method = args[0];
              o.url = args[1];
              o.response = args[2];
            } else {
              o.url = args[0];
              o.response = args[1];
              _.extend(o, args[2]);
            }
            break;
          case args.length !== 4:
            o.method = args[0];
            o.url = args[1];
            o.response = args[2];
            _.extend(o, args[3]);
        }
        if (_.isString(o.method)) {
          o.method = o.method.toUpperCase();
        }
        _.defaults(options, defaults);
        if (!options.url) {
          $Cypress.Utils.throwErrByPath("route.url_missing");
        }
        if (!(_.isString(options.url) || _.isRegExp(options.url))) {
          $Cypress.Utils.throwErrByPath("route.url_invalid");
        }
        if (!validHttpMethodsRe.test(options.method)) {
          $Cypress.Utils.throwErrByPath("route.method_invalid", {
            args: {
              method: o.method
            }
          });
        }
        if (hasResponse && (options.response == null)) {
          $Cypress.Utils.throwErrByPath("route.response_invalid");
        }
        if (options.url === "*") {
          options.originalUrl = "*";
          options.url = /.*/;
        }
        if (alias = this.getNextAlias()) {
          options.alias = alias;
        }
        if (_.isString(o.response) && (aliasObj = this.getAlias(o.response, "route"))) {
          options.response = aliasObj.subject;
        }
        options.log = Cypress.Log.route({
          method: options.method,
          url: getUrl(options),
          status: options.status,
          response: options.response,
          alias: options.alias,
          isStubbed: options.response != null,
          numResponses: 0,
          onConsole: function() {
            return {
              Method: options.method,
              URL: getUrl(options),
              Status: options.status,
              Response: options.response,
              Alias: options.alias
            };
          }
        });
        return this.getXhrServer().route(options);
      }
    });
    return Cypress.Cy.extend({
      getPendingRequests: function() {
        var requests, responses;
        if (!(requests = this.prop("requests"))) {
          return [];
        }
        if (!(responses = this.prop("responses"))) {
          return requests;
        }
        return _.difference(requests, responses);
      },
      getCompletedRequests: function() {
        var ref;
        return (ref = this.prop("responses")) != null ? ref : [];
      },
      _getLastXhrByAlias: function(alias, prop) {
        var i, len, obj, privateProp, ref, xhrs;
        xhrs = (ref = this.prop(prop)) != null ? ref : [];
        privateProp = "_has" + prop + "BeenWaitedOn";
        for (i = 0, len = xhrs.length; i < len; i++) {
          obj = xhrs[i];
          if (!obj[privateProp] && obj.alias === alias) {
            obj[privateProp] = true;
            return obj.xhr;
          }
        }
      },
      getResponsesByAlias: function(alias) {
        var matching, prop, ref;
        ref = alias.split("."), alias = ref[0], prop = ref[1];
        if (prop && !validAliasApiRe.test(prop)) {
          $Cypress.Utils.throwErrByPath("get.alias_invalid", {
            args: {
              prop: prop
            }
          });
        }
        if (prop === "0") {
          $Cypress.Utils.throwErrByPath("get.alias_zero", {
            args: {
              alias: alias
            }
          });
        }
        matching = _(this.prop("responses")).chain().where({
          alias: alias
        }).pluck("xhr").value();
        if (prop === "all") {
          return matching;
        }
        if (prop) {
          return matching[_.toNumber(prop) - 1];
        }
        return _.last(matching);
      },
      getLastXhrByAlias: function(alias) {
        var prop, ref, str;
        ref = alias.split("."), str = ref[0], prop = ref[1];
        if (prop) {
          if (prop === "request") {
            return this._getLastXhrByAlias(str, "requests");
          } else {
            if (prop !== "response") {
              $Cypress.Utils.throwErrByPath("wait.alias_invalid", {
                args: {
                  prop: prop,
                  str: str
                }
              });
            }
          }
        }
        return this._getLastXhrByAlias(str, "responses");
      },
      getXhrTypeByAlias: function(alias) {
        if (requestXhrRe.test(alias)) {
          return "request";
        } else {
          return "response";
        }
      }
    });
  });

}).call(this);
