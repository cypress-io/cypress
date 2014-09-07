(function() {
  window.Eclectus = (function($, _) {
    var Eclectus, methods;
    methods = {
      find: function(obj, el) {
        var dom;
        dom = Eclectus.createDom(obj);
        return dom.find(el);
      },
      within: function(obj, el, fn) {
        var dom;
        if (!_.isFunction(fn)) {
          throw new Error("Ecl.within() must be given a callback function!");
        }
        dom = Eclectus.createDom(obj);
        return dom.within(el, fn);
      },
      assert: function(obj, passed, message, value, actual, expected) {
        var assertion;
        assertion = new Eclectus.Assertion(obj.contentWindow.document, obj.channel, obj.runnable);
        return assertion.log(value, actual, expected, message, passed);
      },
      server: function(obj) {
        var server;
        this.sandbox._server = server = obj.contentWindow.sinon.fakeServer.create();
        this.sandbox.server = new Eclectus.Xhr(obj.contentWindow.document, obj.channel, obj.runnable);
        this.sandbox.server.setServer(server);
        return Eclectus.Xhr.bindServerTo(this, "server", this.sandbox.server);
      },
      stub: function(obj) {},
      mock: function(obj) {},
      spy: function(obj) {}
    };
    Eclectus = (function() {
      function Eclectus() {}

      Eclectus.patch = function(args, fns) {
        return _.each(fns || methods, function(fn, key, obj) {
          return Eclectus.prototype[key] = _.partial(fn, args);
        });
      };

      Eclectus.sandbox = function(contentWindow) {
        return Eclectus.prototype.sandbox = contentWindow.sinon.sandbox.create();
      };

      Eclectus.scope = function(dom) {
        var fns;
        fns = {
          find: methods.find,
          within: methods.within
        };
        dom.unscope = (function(_this) {
          return function() {
            return _this.patch(_(dom).pick("runnable", "channel", "document"), fns);
          };
        })(this);
        return this.patch(dom, fns);
      };

      Eclectus.createDom = function(argsOrInstance) {
        var dom, obj;
        obj = dom = argsOrInstance;
        try {
          if (dom instanceof Eclectus.Dom) {
            return dom;
          }
        } catch (_error) {}
        dom = new Eclectus.Dom(obj.contentWindow.document, obj.channel, obj.runnable);
        dom.scope = _.bind(this.scope, this, dom);
        return dom;
      };

      return Eclectus;

    })();
    return Eclectus;
  })($, _);

}).call(this);
; 
(function() {
  Eclectus.Reporter = (function($, _, Mocha) {
    var Reporter;
    Reporter = (function() {
      function Reporter(runner) {
        this.runner = runner;
      }

      return Reporter;

    })();
    return Reporter;
  })($, _, Mocha);

}).call(this);
; 
(function() {
  Eclectus.Sandbox = (function($, _, Mocha) {
    var Sandbox;
    Sandbox = (function() {
      function Sandbox() {}

      return Sandbox;

    })();
    return Sandbox;
  })($, _, Mocha);

}).call(this);
; 
(function() {
  Eclectus.Command = (function($, _) {
    var Command;
    Command = (function() {
      Command.prototype.highlightAttr = "data-eclectus-el";

      function Command(document, channel, runnable) {
        this.document = document;
        this.channel = channel;
        this.runnable = runnable;
        this.id = this.getId();
        if (this.initialize) {
          this.initialize.apply(this, arguments);
        }
      }

      Command.prototype.$ = function(selector) {
        return new $.fn.init(selector, this.document);
      };

      Command.prototype.getId = function() {
        return _.uniqueId("instance");
      };

      Command.prototype.getConfig = function() {
        var config;
        if (!this.config) {
          throw new Error("config must be set");
        }
        config = _(this).result("config");
        if (!config.type) {
          throw new Error("config.type must be set");
        }
        return _(config).defaults({
          dom: true
        });
      };

      Command.prototype.getDom = function() {
        var body;
        if (this.$el) {
          this.$el.attr(this.highlightAttr, true);
        }
        body = this.$("body").clone(true, true);
        body.find("script").remove();
        if (this.$el) {
          this.$el.removeAttr(this.highlightAttr);
        }
        return body;
      };

      Command.prototype.emit = function(obj) {
        var config;
        config = this.getConfig();
        _.defaults(obj, {
          parent: this.getParentId(this.prevObject),
          length: this.length,
          highlightAttr: this.highlightAttr,
          id: this.id,
          selector: "",
          canBeParent: this.canBeParent
        });
        obj.selector = obj.selector.toString();
        if (this.$el) {
          obj.el = this.$el;
        }
        if (this.error) {
          obj.error = this.error;
        }
        this._parent = obj.parent;
        if (config.dom) {
          if (obj.dom == null) {
            obj.dom = this.getDom();
          }
        }
        if (this.channel) {
          return this.channel.trigger(config.type, this.runnable, obj);
        }
      };

      Command.prototype.getParentId = function(parent) {
        if (!parent) {
          return;
        }
        if (parent.canBeParent) {
          return parent.id;
        }
        return this.getParentId(parent.prevObject);
      };

      Command.prototype.elExistsInDocument = function() {
        return $.contains(this.document, this.$el[0]);
      };

      Command.prototype.clone = function() {
        return new this.constructor(this.document, this.channel, this.runnable);
      };

      return Command;

    })();
    return Command;
  })($, _);

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Eclectus.Dom = (function($, _, Eclectus) {
    var Dom, jQueryMethods, jQueryTriggers, traversalMethods;
    jQueryMethods = ["attr", "class", "css", "data", "have", "html", "id", "is", "prop", "text", "val"];
    traversalMethods = ["children", "eq", "first", "last", "next", "parent", "parents", "prev", "siblings"];
    jQueryTriggers = [];
    Dom = (function(_super) {
      __extends(Dom, _super);

      function Dom() {
        return Dom.__super__.constructor.apply(this, arguments);
      }

      Dom.prototype.config = {
        type: "dom"
      };

      Dom.prototype.initialize = function() {
        return this.canBeParent = true;
      };

      Dom.prototype.wrap = function(obj) {
        if (!obj instanceof $) {
          return new Error("Ecl.wrap must be passed a jQuery instance");
        }
        this.$el = obj;
        this.length = obj.length;
        this.selector = obj.selector || obj.prop("nodeName").toLowerCase();
        this.checkForDomErrors();
        return this.emit({
          selector: this.selector,
          method: "wrap"
        });
      };

      Dom.prototype.find = function(selector) {
        var dom;
        if (this.$el) {
          dom = this.clone();
          dom.prevObject = this;
          dom.$el = this.$el.find(selector);
        } else {
          dom = this;
          dom.$el = this.$(selector);
        }
        dom.checkForDomErrors();
        dom.length = dom.$el.length;
        dom.selector = selector;
        dom.emit({
          selector: dom.selector,
          method: "find"
        });
        return dom;
      };

      Dom.prototype.within = function(selector, fn) {
        var dom;
        if (this.$el) {
          dom = this.clone();
          dom.prevObject = this;
          dom.$el = this.$el.find(selector);
        } else {
          dom = this;
          dom.$el = this.$(selector);
        }
        dom.checkForDomErrors();
        dom.length = dom.$el.length;
        dom.selector = selector;
        dom.emit({
          selector: dom.selector,
          method: "within"
        });
        this.scope();
        fn.call(dom);
        this.unscope();
        return dom;
      };

      Dom.prototype.hover = function() {};

      Dom.prototype.type = function(sequence, options) {
        var dom;
        if (options == null) {
          options = {};
        }
        dom = this.clone();
        _.extend(options, {
          sequence: sequence
        });
        if (this.elExistsInDocument()) {
          this.$el.simulate("key-sequence", options);
        } else {
          dom.error = "not found";
        }
        dom.prevObject = this;
        dom.$el = this.$el;
        dom.length = this.$el.length;
        dom.selector = this.selector;
        dom.canBeParent = false;
        dom.emit({
          method: "type",
          sequence: sequence
        });
        return dom;
      };

      Dom.prototype.click = function() {
        var dom;
        dom = this.clone();
        if (this.elExistsInDocument()) {
          this.$el.simulate("click");
        } else {
          dom.error = "not found";
        }
        dom.prevObject = this;
        dom.$el = this.$el;
        dom.length = this.$el.length;
        dom.selector = this.selector;
        dom.canBeParent = false;
        dom.emit({
          method: "click"
        });
        return dom;
      };

      Dom.prototype.submit = function() {
        var dom, submit;
        submit = new Event("submit");
        if (!this.$el) {
          throw new Error("Cannot call method: " + method + " without an existing DOM element.  Did you forget to call 'find' or 'within'?");
        }
        dom = this.clone();
        if (this.elExistsInDocument()) {
          this.$el.each(function(index, el) {
            return el.dispatchEvent(submit);
          });
        } else {
          dom.error = "not found";
        }
        dom.prevObject = this;
        dom.$el = this.$el;
        dom.length = dom.$el.length;
        dom.selector = arguments[0];
        return dom.emit({
          selector: dom.selector,
          method: "submit"
        });
      };

      Dom.prototype.pauseRunnable = function() {
        this.runnable.async = true;
        this.runnable.sync = false;
        return _.defer((function(_this) {
          return function() {
            return _this.runnable.clearTimeout();
          };
        })(this));
      };

      Dom.prototype.checkForDomErrors = function() {
        var error;
        error = (function() {
          switch (false) {
            case !(this.$el.length === 0 || !this.elExistsInDocument()):
              return "not found";
          }
        }).call(this);
        if (error) {
          this.error = error;
        }
        return this;
      };

      Dom.prototype.exist = function() {
        return this.$el.length > 0;
      };

      return Dom;

    })(Eclectus.Command);
    _.each(jQueryMethods, function(method) {
      return Dom.prototype[method] = function() {
        this.$el[method].apply(this.$el, arguments);
        return this;
      };
    });
    _.each(traversalMethods, function(method) {
      return Dom.prototype[method] = function() {
        var dom;
        if (!this.$el) {
          throw new Error("Cannot call method: " + method + " without an existing DOM element.  Did you forget to call 'find' or 'within'?");
        }
        dom = this.clone();
        dom.prevObject = this;
        dom.$el = this.$el[method].apply(this.$el, arguments);
        dom.length = dom.$el.length;
        dom.selector = arguments[0];
        dom.emit({
          selector: dom.selector,
          method: method
        });
        return dom;
      };
    });
    _.each(jQueryTriggers, function(method) {
      return Dom.prototype[method] = function() {
        var dom;
        if (!this.$el) {
          throw new Error("Cannot call method: " + method + " without an existing DOM element.  Did you forget to call 'find' or 'within'?");
        }
        dom = this.clone();
        if (this.elExistsInDocument()) {
          this.$el[method].call(this.$el);
        } else {
          dom.error = "not found";
        }
        dom.prevObject = this;
        dom.$el = this.$el;
        dom.length = dom.$el.length;
        dom.selector = arguments[0];
        return dom.emit({
          selector: dom.selector,
          method: method
        });
      };
    });
    return Dom;
  })($, _, Eclectus);

}).call(this);
; 
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Eclectus.Xhr = (function($, _, Eclectus) {
    var Xhr, methods;
    methods = ["stub", "get", "post", "put", "patch", "delete", "respond", "requests", "onRequest", "autoRespond"];
    Xhr = (function(_super) {
      __extends(Xhr, _super);

      function Xhr() {
        this.respondToRequest = __bind(this.respondToRequest, this);
        return Xhr.__super__.constructor.apply(this, arguments);
      }

      Xhr.prototype.config = {
        type: "xhr"
      };

      Xhr.prototype.initialize = function() {
        this.requests = [];
        this.responses = [];
        this.onRequests = [];
        return this.canBeParent = true;
      };

      Xhr.prototype.setServer = function(server) {
        var _this;
        this.server = server;
        _this = this;
        return this.server.addRequest = _.wrap(this.server.addRequest, function(addRequestOrig, xhr) {
          addRequestOrig.call(this, xhr);
          xhr.onSend = _.wrap(xhr.onSend, function(onSendOrig) {
            _this.requests.push(xhr);
            onSendOrig.call(this);
            xhr.id = _this.getId();
            _this.emit({
              method: xhr.method,
              url: xhr.url,
              id: xhr.id,
              xhr: xhr
            });
            return _this.invokeOnRequest(xhr);
          });
          xhr.respond = _.wrap(xhr.respond, function() {
            var args, orig;
            orig = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
            orig.apply(this, args);
            if (_this.requestDidNotMatchAnyResponses(xhr, args)) {
              return _this.respondToRequest(xhr, {
                status: 404,
                headers: {},
                response: ""
              });
            }
          });
          return xhr;
        });
      };

      Xhr.prototype.invokeOnRequest = function(xhr) {
        var found, response, _i, _ref;
        found = false;
        _ref = this.server.responses || [];
        for (_i = _ref.length - 1; _i >= 0; _i += -1) {
          response = _ref[_i];
          if (found) {
            break;
          }
          response.response(xhr, function(options) {
            found = true;
            return options.onRequest.call(xhr, xhr);
          });
        }
        return _.each(this.onRequests, function(onRequest) {
          return onRequest.call(xhr, xhr);
        });
      };

      Xhr.prototype.requestDidNotMatchAnyResponses = function(request, args) {
        var body, headers, status;
        if (request.hasResponded) {
          return;
        }
        status = args[0];
        headers = args[1];
        body = args[2];
        return status === 404 && _.isEqual(headers, {}) && body === "";
      };

      Xhr.prototype.respondToRequest = function(request, response) {
        this.responses.push(response);
        request.hasResponded = true;
        response.id = this.getId();
        return this.emit({
          method: "resp",
          xhr: request,
          response: response,
          parent: request.id,
          canBeParent: false,
          id: response.id
        });
      };

      Xhr.prototype.stub = function(options) {
        if (options == null) {
          options = {};
        }
        if (!options.method) {
          throw new Error("Ecl.server.stub() must be called with a method option");
        }
        _.defaults(options, {
          url: /.*/,
          status: 200,
          contentType: "application/json",
          response: "",
          headers: {},
          onRequest: function() {}
        });
        return this.server.respondWith((function(_this) {
          return function(request, fn) {
            var headers, response;
            if (request.readyState === 4) {
              return;
            }
            if (_this.requestMatchesResponse(request, options)) {
              if (fn) {
                return fn(options);
              }
              headers = _.extend(options.headers, {
                "Content-Type": options.contentType
              });
              response = {
                status: options.status,
                headers: headers,
                body: _this.parseResponse(options)
              };
              request.respond(response.status, response.headers, response.body);
              return _this.respondToRequest(request, options);
            }
          };
        })(this));
      };

      Xhr.prototype.requestMatchesResponse = function(request, options) {
        return request.method === options.method && (_.isRegExp(options.url) ? options.url.test(request.url) : options.url === request.url);
      };

      Xhr.prototype.parseResponse = function(options) {
        var response;
        response = _.result(options, "response");
        if (_.isString(response)) {
          return response;
        }
        return JSON.stringify(response);
      };

      Xhr.prototype.get = function(options) {
        if (options == null) {
          options = {};
        }
        options.method = "GET";
        return this.stub(options);
      };

      Xhr.prototype.post = function(options) {
        if (options == null) {
          options = {};
        }
        options.method = "POST";
        return this.stub(options);
      };

      Xhr.prototype.put = function(options) {
        if (options == null) {
          options = {};
        }
        options.method = "PUT";
        return this.stub(options);
      };

      Xhr.prototype.patch = function(options) {
        if (options == null) {
          options = {};
        }
        options.method = "PATCH";
        return this.stub(options);
      };

      Xhr.prototype["delete"] = function(options) {
        if (options == null) {
          options = {};
        }
        options.method = "DELETE";
        return this.stub(options);
      };

      Xhr.prototype.respond = function() {
        return this.server.respond();
      };

      Xhr.prototype.onRequest = function(fn) {
        return this.onRequests.push(fn);
      };

      Xhr.prototype.autoRespond = function(bool) {
        if (bool == null) {
          bool = true;
        }
        return this.server.autoRespond = bool;
      };

      Xhr.bindServerTo = function(obj, property, server) {
        return _.each(methods, function(method) {
          if (_.isFunction(server[method])) {
            return obj[property][method] = _.bind(server[method], server);
          } else {
            return obj[property][method] = server[method];
          }
        });
      };

      return Xhr;

    })(Eclectus.Command);
    return Xhr;
  })($, _, Eclectus);

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Eclectus.Assertion = (function($, _, Eclectus) {
    var Assertion;
    Assertion = (function(_super) {
      __extends(Assertion, _super);

      function Assertion() {
        return Assertion.__super__.constructor.apply(this, arguments);
      }

      Assertion.prototype.config = {
        type: "assertion"
      };

      Assertion.prototype.log = function(value, actual, expected, message, passed) {
        var obj;
        if (value instanceof $) {
          if (message && passed) {
            message = message.split("but").join("and");
          }
          this.$el = value;
        }
        obj = this.parseValueActualAndExpected(value, actual, expected);
        _.extend(obj, {
          method: "assert",
          message: message,
          passed: passed
        });
        this.emit(obj);
        return this;
      };

      Assertion.prototype.parseValueActualAndExpected = function(value, actual, expected) {
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

      return Assertion;

    })(Eclectus.Command);
    return Assertion;
  })($, _, Eclectus);

}).call(this);
; 
(function() {
  (function($, _) {
    $.ajaxSetup({
      cache: false
    });
    return $.fn.toggleWrapper = function(obj, cid, init) {
      var dimensions, methods;
      if (obj == null) {
        obj = {};
      }
      methods = {
        getWrapperByCid: function(cid) {
          return $("[data-wrapper='" + cid + "']");
        },
        isTransparent: function(bg) {
          return /transparent|rgba/.test(bg);
        },
        setBackgroundColor: function(bg) {
          if (this.isTransparent(bg)) {
            return "white";
          } else {
            return bg;
          }
        },
        walkDownToChild: function(el) {
          return this.getDimensions(el.children());
        },
        hasDimensions: function(vals) {
          return vals.width > 0 && vals.height > 0;
        },
        getDimensions: function(el) {
          var vals;
          vals = {
            offset: el.offset(),
            width: el.outerWidth(false),
            height: el.outerHeight(false)
          };
          if (this.hasDimensions(vals) || el.children().length === 0) {
            return vals;
          }
          return this.walkDownToChild(el);
        }
      };
      _.defaults(obj, {
        className: "",
        backgroundColor: methods.setBackgroundColor(this.css("backgroundColor")),
        zIndex: this.css("zIndex") === "auto" || 0 ? 1000 : Number(this.css("zIndex"))
      });
      dimensions = methods.getDimensions(this);
      if (init) {
        if (methods.getWrapperByCid(cid).length) {
          return;
        }
        return $("<div>").appendTo("body").addClass(obj.className).attr("data-wrapper", cid).css({
          width: dimensions.width,
          height: dimensions.height,
          top: dimensions.offset.top,
          left: dimensions.offset.left,
          position: "absolute",
          zIndex: obj.zIndex + 1,
          backgroundColor: obj.backgroundColor
        });
      } else {
        return methods.getWrapperByCid(cid).remove();
      }
    };
  })($, _);

}).call(this);
; 
(function() {
  (function(_) {
    return _.mixin(_.str.exports());
  })(_);

}).call(this);
; 
(function() {
  this.App = (function(Backbone, Marionette) {
    var App;
    App = new Marionette.Application;
    App.rootRoute = "/organize";
    App.addRegions({
      navRegion: "#nav-region",
      mainRegion: "#main-region"
    });
    App.reqres.setHandler("default:region", function() {
      return App.mainRegion;
    });
    App.reqres.setHandler("app:config:entity", function() {
      return App.config;
    });
    App.vent.on("main:nav:choose", function(nav) {
      return App.navs.chooseByName(nav);
    });
    App.on("before:start", function(options) {
      if (options == null) {
        options = {};
      }
      App.config = App.request("new:config:entity", options);
      return App.navs = App.request("nav:entities");
    });
    App.on("start", function(options) {
      if (options == null) {
        options = {};
      }
      App.execute("socket:start");
      App.module("NavApp").start(App.navs);
      App.startHistory();
      if (!App.currentRoute()) {
        return App.visit(App.rootRoute, {
          trigger: true
        });
      }
    });
    return App;
  })(Backbone, Marionette);

}).call(this);
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/lib/templates/_empty"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push("<" + this.containerTag + ">");
    
      __out.push('\n  <span>\n    ');
    
      __out.push(__sanitize(this.content));
    
      __out.push('\n  </span>\n');
    
      __out.push("</" + this.containerTag + ">");
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    return Entities.Collection = (function(_super) {
      __extends(Collection, _super);

      function Collection() {
        return Collection.__super__.constructor.apply(this, arguments);
      }

      return Collection;

    })(Backbone.Collection);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    Entities.Model = (function(_super) {
      __extends(Model, _super);

      function Model() {
        return Model.__super__.constructor.apply(this, arguments);
      }

      return Model;

    })(Backbone.Model);
    return App.reqres.setHandler("new:entity", function(attrs) {
      if (attrs == null) {
        attrs = {};
      }
      return new Entities.Model(attrs);
    });
  });

}).call(this);
; 
(function() {
  var __slice = [].slice;

  this.App.module("Utilities", function(Utilities, App, Backbone, Marionette, $, _) {
    var API, Reporter, assert, assertProto, emit, expect, overloadChaiAssertions, overloadMochaRunnableEmit, overloadMochaRunnerUncaught, uncaught;
    emit = Mocha.Runnable.prototype.emit;
    uncaught = Mocha.Runner.prototype.uncaught;
    if (chai) {
      assertProto = chai.Assertion.prototype.assert;
    }
    expect = chai.expect;
    assert = chai.assert;
    overloadMochaRunnableEmit = function() {
      return Mocha.Runnable.prototype.emit = _.wrap(emit, function(orig, event, err) {
        if (event === "error") {
          throw err;
        }
        return orig.call(this, event, err);
      });
    };
    overloadMochaRunnerUncaught = function() {
      return Mocha.Runner.prototype.uncaught = _.wrap(uncaught, function(orig, err) {
        throw err;
        return orig.call(this, err);
      });
    };
    overloadChaiAssertions = function(Ecl) {
      return chai.use(function(_chai, utils) {
        _.each({
          expect: expect,
          assert: assert
        }, function(value, key) {
          return _chai[key] = _.wrap(value, function() {
            var args, orig, _ref;
            orig = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
            switch (false) {
              case !(args[0] instanceof Eclectus.Command):
                args[0] = args[0].$el;
                break;
              case !(args[0] instanceof ((_ref = $("iframe.iframe-spec")[0]) != null ? _ref.contentWindow.$ : void 0)):
                args[0] = $(args[0]);
            }
            return orig.apply(this, args);
          });
        });
        return _chai.Assertion.prototype.assert = _.wrap(assertProto, function() {
          var actual, args, expected, message, orig, passed, value;
          orig = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          passed = utils.test(this, args);
          value = utils.flag(this, "object");
          expected = args[3];
          message = utils.getMessage(this, args);
          actual = utils.getActual(this, args);
          Ecl.assert(passed, message, value, actual, expected);
          return orig.apply(this, args);
        });
      });
    };
    Reporter = (function() {
      function Reporter(runner) {}

      return Reporter;

    })();
    API = {
      start: function() {
        var runner;
        window.Ecl = new Eclectus;
        window.mocha = new Mocha({
          reporter: Reporter
        });
        overloadMochaRunnableEmit();
        overloadMochaRunnerUncaught();
        if (chai && chai.use) {
          overloadChaiAssertions(Ecl);
        }
        runner = mocha.run();
        return App.request("runner:entity", runner, mocha.options, Eclectus.patch, Eclectus.sandbox);
      },
      stop: function(runner) {
        runner.stop();
        delete window.Ecl;
        return delete window.mocha;
      }
    };
    App.reqres.setHandler("start:test:runner", function() {
      return API.start();
    });
    return App.reqres.setHandler("stop:test:runner", function(runner) {
      return API.stop(runner);
    });
  });

}).call(this);
; 
(function() {
  this.App.module("Utilities", function(Utilities, App, Backbone, Marionette, $, _) {});

}).call(this);
; 
(function() {
  this.App.module("Utilities", function(Utilities, App, Backbone, Marionette, $, _) {
    var flattenedFetches;
    flattenedFetches = function(entities) {
      return _.chain([entities]).flatten().compact().pluck("_fetch").value();
    };
    App.commands.setHandler("when:fetched", function(entities, callback) {
      var xhrs;
      xhrs = flattenedFetches(entities);
      return $.when.apply($, xhrs).done(function() {
        return callback();
      });
    });
    return App.reqres.setHandler("fetched:entities", function(entities) {
      return flattenedFetches(entities);
    });
  });

}).call(this);
; 
(function() {
  this.App.module("Utilities", function(Utilities, App, Backbone, Marionette, $, _) {
    return _.extend(App, {
      visit: function(route, options) {
        if (options == null) {
          options = {};
        }
        return Backbone.history.navigate(route, options);
      },
      currentRoute: function() {
        return Backbone.history.fragment || null;
      },
      startHistory: function() {
        return Backbone.history.start();
      }
    });
  });

}).call(this);
; 
(function() {
  this.App.module("Utilities", function(Utilities, App, Backbone, Marionette, $, _) {
    var methods;
    methods = {
      lookups: ["backbone/apps/", "backbone/lib/components/", "backbone/lib/templates/", "support/"],
      withTemplate: function(string) {
        var array;
        array = string.split("/");
        array.splice(-1, 0, "templates");
        return array.join("/");
      }
    };
    return _.extend(Marionette.Renderer, {
      render: function(template, data) {
        var path;
        if (template === false) {
          return;
        }
        path = this.getTemplate(template);
        if (!path) {
          throw new Error("Template " + template + " not found!");
        }
        return path(data);
      },
      getTemplate: function(template) {
        var lookup, path, _i, _j, _len, _len1, _ref, _ref1;
        _ref = methods.lookups;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          lookup = _ref[_i];
          _ref1 = [template, methods.withTemplate(template)];
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            path = _ref1[_j];
            if (JST[lookup + path]) {
              return JST[lookup + path];
            }
          }
        }
      },
      templateExists: function(path) {
        return !!this.getTemplate(path);
      }
    });
  });

}).call(this);
; 
(function() {
  var __slice = [].slice;

  this.App.module("Utilities", function(Utilities, App, Backbone, Marionette, $, _) {
    return window.Routes = (function(_, Backbone) {
      var Routes, addRoutes, createPathFn, extractObjectParams, extractParams, getParams, getQueryParams, parseArray, parseObject, r, replacePath;
      getParams = /(:([\w\d]+)|\*([\w\d]+))/g;
      replacePath = function(path, part, replacement) {
        if (replacement != null) {
          return path.replace(part, replacement);
        } else {
          return path;
        }
      };
      parseObject = function(parts, path, obj) {
        return _.reduce(parts, function(memo, part, index) {
          var sliced;
          sliced = part.slice(1);
          return memo = replacePath(memo, part, obj[sliced]);
        }, path);
      };
      parseArray = function(parts, path, args) {
        return _.reduce(parts, function(memo, part, index) {
          return memo = replacePath(memo, part, args[index]);
        }, path);
      };
      extractParams = function(args, parts) {
        var count;
        if (parts == null) {
          parts = [];
        }
        count = _.isObject(args[0]) ? _.keys(args[0]).length : args.length;
        if (count <= parts.length) {
          return;
        }
        if (_.isObject(args[0])) {
          return extractObjectParams(args[0], parts);
        } else {
          return args.pop();
        }
      };
      extractObjectParams = function(obj, parts) {
        var partsOfRoute, _ref;
        partsOfRoute = _.map(parts, function(part) {
          return part.replace(":", "");
        });
        return (_ref = _(obj)).omit.apply(_ref, partsOfRoute);
      };
      getQueryParams = function(path, args, parts) {
        var params;
        params = extractParams(args, parts);
        if (!params) {
          return path;
        }
        return Backbone.Router.prototype.toFragment(path, params);
      };
      createPathFn = function(pathString) {
        var parts;
        parts = pathString.match(getParams);
        return function() {
          var args, path;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          path = pathString.toString();
          if (args.length) {
            path = (function() {
              switch (false) {
                case !_.isObject(args[0]):
                  return parseObject(parts, path, args[0]);
                default:
                  return parseArray(parts, path, args);
              }
            })();
          }
          if (!/^(http|\/\/)/.test(path)) {
            path = "/" + path;
          }
          path = getQueryParams(path, args, parts);
          return path;
        };
      };
      addRoutes = function(obj, routes) {
        var name, path, _results;
        _results = [];
        for (name in routes) {
          path = routes[name];
          obj.routes[name] = path;
          _results.push(obj[name + "_path"] = createPathFn(path));
        }
        return _results;
      };
      Routes = (function() {
        function Routes(routes) {
          this.routes = routes != null ? routes : {};
        }

        return Routes;

      })();
      r = new Routes;
      r.url_for = function(name) {
        return this.routes[name];
      };
      r.create = function() {
        var args, path;
        path = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        return createPathFn(path).apply(this, args);
      };
      return r;
    })(_, Backbone);
  });

}).call(this);
; 
(function() {
  this.App.module("Utilities", function(Utilities, App, Backbone, Marionette, $, _) {
    var API;
    API = {
      start: function() {
        var channel, socket;
        channel = io.connect();
        channel.on("test:changed", function(data) {
          return socket.trigger("test:changed", data.file);
        });
        channel.on("eclectus:css:changed", function(data) {
          var href, link;
          link = $("link").filter(function(index, link) {
            return new RegExp(data.file).test($(link).attr("href"));
          });
          href = new Uri(link.attr("href"));
          href.replaceQueryParam("t", _.now());
          return link.attr("href", href.toString());
        });
        socket = App.request("io:entity", channel);
        return App.reqres.setHandler("socket:entity", function() {
          return socket;
        });
      }
    };
    return App.commands.setHandler("socket:start", function() {
      return API.start();
    });
  });

}).call(this);
; 
(function() {
  this.App.module("Views", function(Views, App, Backbone, Marionette, $, _) {
    return _.extend(Marionette.View.prototype, {
      addOpacityWrapper: function(init, options) {
        if (init == null) {
          init = true;
        }
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          className: "opacity"
        });
        return this.$el.toggleWrapper(options, this.cid, init);
      }
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Views", function(Views, App, Backbone, Marionette, $, _) {
    return Views.CollectionView = (function(_super) {
      __extends(CollectionView, _super);

      function CollectionView() {
        return CollectionView.__super__.constructor.apply(this, arguments);
      }

      CollectionView.prototype.childViewOptions = function(model, index) {
        var options;
        options = {};
        if (this.tagName === "ul") {
          options.tagName = "li";
        }
        return options;
      };

      return CollectionView;

    })(Marionette.CollectionView);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Views", function(Views, App, Backbone, Marionette, $, _) {
    return Views.CompositeView = (function(_super) {
      __extends(CompositeView, _super);

      function CompositeView() {
        var options;
        CompositeView.__super__.constructor.apply(this, arguments);
        options = {};
        if (this.isTbody()) {
          options.tagName = "tr";
        }
        if (this.isUl()) {
          options.tagName = "li";
        }
        this.childViewOptions = _.extend({}, _.result(this, "childViewOptions"), options);
      }

      CompositeView.prototype.buildChildView = function(item, childViewType, childViewOptions) {
        if (this.isTbody()) {
          childViewOptions.tableColumns = this.$el.find("th").length;
        }
        return CompositeView.__super__.buildChildView.apply(this, arguments);
      };

      CompositeView.prototype.isTbody = function() {
        return this.childViewContainer === "tbody";
      };

      CompositeView.prototype.isUl = function() {
        return this.childViewContainer === "ul";
      };

      return CompositeView;

    })(Marionette.CompositeView);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Views", function(Views, App, Backbone, Marionette, $, _) {
    return Views.EmptyView = (function(_super) {
      __extends(EmptyView, _super);

      EmptyView.prototype.template = "_empty";

      EmptyView.prototype.ui = {
        container: ":first"
      };

      function EmptyView() {
        EmptyView.__super__.constructor.apply(this, arguments);
        this.$el.addClass("empty");
      }

      EmptyView.prototype.serializeData = function() {
        var _ref;
        return {
          containerTag: this.getContainerTag(),
          content: (_ref = _.result(this, "content")) != null ? _ref : "No items found."
        };
      };

      EmptyView.prototype.onShow = function() {
        if (this.isRow()) {
          return this.ui.container.prop("colspan", this.options.tableColumns);
        }
      };

      EmptyView.prototype.isRow = function() {
        return this.tagName === "tr";
      };

      EmptyView.prototype.getContainerTag = function() {
        if (this.isRow()) {
          return "td";
        }
        return "div";
      };

      return EmptyView;

    })(Marionette.ItemView);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Views", function(Views, App, Backbone, Marionette, $, _) {
    return Views.ItemView = (function(_super) {
      __extends(ItemView, _super);

      function ItemView() {
        return ItemView.__super__.constructor.apply(this, arguments);
      }

      return ItemView;

    })(Marionette.ItemView);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Views", function(Views, App, Backbone, Marionette, $, _) {
    return Views.LayoutView = (function(_super) {
      var regionRegex;

      __extends(LayoutView, _super);

      function LayoutView() {
        return LayoutView.__super__.constructor.apply(this, arguments);
      }

      regionRegex = /(.+)-region/;

      LayoutView.prototype.getRegionsByEl = true;

      LayoutView.prototype.render = function() {
        LayoutView.__super__.render.apply(this, arguments);
        return this._getRegionsByEl();
      };

      LayoutView.prototype._childNodes = function() {
        return this.$el.find("*");
      };

      LayoutView.prototype._getRegionsByEl = function() {
        var regions, selectors;
        if (!this.getRegionsByEl || !this.$el) {
          return;
        }
        selectors = _.reduce(this._childNodes(), function(memo, e) {
          var match;
          match = regionRegex.exec($(e).prop("id"));
          if (match) {
            memo.push(match[0]);
          }
          return memo;
        }, []);
        regions = _.reduce(selectors, function(memo, region) {
          memo[_.camelize(region)] = "#" + region;
          return memo;
        }, {});
        return this.addRegions(regions);
      };

      return LayoutView;

    })(Marionette.LayoutView);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Controllers", function(Controllers, App, Backbone, Marionette, $, _) {
    return Controllers.Application = (function(_super) {
      __extends(Application, _super);

      function Application(options) {
        var _ref;
        if (options == null) {
          options = {};
        }
        this.region = (_ref = options.region) != null ? _ref : App.request("default:region");
        Application.__super__.constructor.apply(this, arguments);
      }

      Application.prototype.show = function(view, options) {
        var _ref;
        if (options == null) {
          options = {};
        }
        view = view instanceof Controllers.Application ? view.getMainView() : view;
        if (!view) {
          throw new Error("getMainView() did not return a view instance or " + (view != null ? (_ref = view.constructor) != null ? _ref.name : void 0 : void 0) + " is not a view instance");
        }
        _.defaults(options, {
          loading: false,
          region: this.region
        });
        this.setMainView(view);
        return this._manageView(view, options);
      };

      Application.prototype.getMainView = function() {
        return this._mainView;
      };

      Application.prototype.setMainView = function(view) {
        if (this._mainView) {
          return;
        }
        this._mainView = view;
        return this.listenTo(view, "destroy", this.destroy);
      };

      Application.prototype.onMainShow = function() {};

      Application.prototype._manageView = function(view, options) {
        if (options.loading) {
          return App.execute("show:loading", view, options);
        } else {
          if (options.region) {
            return options.region.show(view);
          }
        }
      };

      return Application;

    })(Marionette.Controller);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Components.Loading", function(Loading, App, Backbone, Marionette, $, _) {
    Loading.LoadingController = (function(_super) {
      __extends(LoadingController, _super);

      function LoadingController() {
        return LoadingController.__super__.constructor.apply(this, arguments);
      }

      LoadingController.prototype.initialize = function(options) {
        var config, loadingView, view;
        view = options.view, config = options.config;
        config = _.isBoolean(config) ? {} : config;
        _.defaults(config, {
          loadingType: "spinner",
          entities: this.getEntities(view),
          debug: false,
          done: function() {}
        });
        switch (config.loadingType) {
          case "opacity":
            if (this.region.currentView) {
              this.region.currentView.addOpacityWrapper();
            }
            break;
          case "spinner":
            loadingView = this.getLoadingView();
            this.show(loadingView);
            break;
          default:
            throw new Error("Invalid loadingType");
        }
        return this.showRealView(view, loadingView, config);
      };

      LoadingController.prototype.showRealView = function(realView, loadingView, config) {
        var oldView, xhrs;
        xhrs = App.request("fetched:entities", config.entities);
        oldView = this.region.currentView;
        if (config.loadingType === "opacity" && oldView) {
          this.listenTo(oldView, "destroy", (function(_this) {
            return function() {
              return _this.removeOpacity(oldView);
            };
          })(this));
        }
        $.when.apply($, xhrs).done((function(_this) {
          return function() {
            if (loadingView && (_this.region.currentView !== loadingView)) {
              return realView.destroy();
            }
            if (!config.debug) {
              _this.show(realView);
            }
            return config.done(realView);
          };
        })(this));
        $.when.apply($, xhrs).fail((function(_this) {
          return function() {
            if (_this.region.currentView !== realView) {
              return realView.destroy();
            }
          };
        })(this));
        return $.when.apply($, xhrs).always((function(_this) {
          return function() {
            if (config.debug) {
              return;
            }
            if (config.loadingType === "opacity") {
              _this.removeOpacity(oldView);
            }
            if (loadingView != null) {
              loadingView.destroy();
            }
            _this.destroy();
            return _this.clearFetches(config.entities);
          };
        })(this));
      };

      LoadingController.prototype.getEntities = function(view) {
        return _.chain(view).pick("model", "collection").toArray().compact().value();
      };

      LoadingController.prototype.getLoadingView = function() {
        return new Loading.LoadingView;
      };

      LoadingController.prototype.removeOpacity = function(oldView) {
        if (!oldView) {
          return;
        }
        return oldView.addOpacityWrapper(false);
      };

      LoadingController.prototype.clearFetches = function(entities) {
        var entity, _i, _len, _ref, _results;
        _ref = _(entities).compact();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          entity = _ref[_i];
          _results.push(delete entity._fetch);
        }
        return _results;
      };

      return LoadingController;

    })(App.Controllers.Application);
    return App.commands.setHandler("show:loading", function(view, options) {
      return new Loading.LoadingController({
        view: view,
        region: options.region,
        config: options.loading
      });
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Components.Loading", function(Loading, App, Backbone, Marionette, $, _) {
    return Loading.LoadingView = (function(_super) {
      __extends(LoadingView, _super);

      function LoadingView() {
        return LoadingView.__super__.constructor.apply(this, arguments);
      }

      LoadingView.prototype.template = false;

      LoadingView.prototype.className = "loading-container";

      LoadingView.prototype.dialog = {
        title: "Loading...",
        size: "small"
      };

      LoadingView.prototype.onShow = function() {
        var opts;
        opts = this._getOptions();
        return this.$el.spin(opts);
      };

      LoadingView.prototype.onDestroy = function() {
        return this.$el.spin(false);
      };

      LoadingView.prototype._getOptions = function() {
        return {
          lines: 10,
          length: 5,
          width: 2.0,
          radius: 6,
          corners: 1,
          rotate: 9,
          direction: 1,
          color: '#000',
          speed: 1,
          trail: 60,
          shadow: false,
          hwaccel: true,
          className: 'spinner',
          zIndex: 2e9,
          top: 'auto',
          left: 'auto'
        };
      };

      return LoadingView;

    })(App.Views.ItemView);
  });

}).call(this);
; 
(function() {
  var __slice = [].slice;

  this.App.module("Routers", function(Routers, App, Backbone, Marionette, $, _) {
    var routeParams;
    routeParams = /(:([\w\d]+)|\*([\w\d]+))/g;
    Routers.Application = (function() {
      Application.prototype.initialize = true;

      Application.prototype.module = void 0;

      Application.prototype.updateUrl = true;

      Application.prototype.before = function() {};

      Application.prototype.after = function() {};

      Application.prototype.controllerMap = {
        "list": "List",
        "show": "Show",
        "edit": "Edit",
        "new": "New",
        "destroy": "Destroy"
      };

      function Application() {
        this.routes = this._createRoutes();
        this.handlers = this._createHandlers();
        if (this.initialize && this.hasRoutes()) {
          App.addRouter(this);
        }
      }

      Application.prototype.to = function(action, options) {
        if (options == null) {
          options = {};
        }
        return this.handlers[action](options);
      };

      Application.prototype.hasRoutes = function() {
        return !_.isEmpty(this.routes);
      };

      Application.prototype._createRoutes = function() {
        var routes;
        routes = this._getActions((function(_this) {
          return function(action, key) {
            if (_.isUndefined(action) || !_(action).has("route")) {
              return [];
            }
            return [action.route, key];
          };
        })(this));
        return this._toObject(routes);
      };

      Application.prototype._createHandlers = function() {
        var handlers;
        handlers = this._getActions((function(_this) {
          return function(action, key) {
            var fn;
            fn = function(options) {
              var controller, resolve;
              resolve = options.resolve;
              controller = new (_this._getController(action, key))(options);
              return typeof resolve === "function" ? resolve(controller) : void 0;
            };
            fn = _.wrap(fn, function() {
              var args, before, df, options, orig;
              orig = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
              options = _this._normalizeArguments(args, action, key);
              df = $.Deferred();
              df._id = _.uniqueId("deferred");
              _.defaults(options, {
                resolve: df.resolve
              });
              if (!options.resolve) {
                options.deferred = df;
              }
              before = _this._invokeBefore(options, action);
              if (before === false) {
                return;
              }
              if (_this._shouldUpdateUrl(action, args)) {
                _this._updateUrl(action, options);
              }
              $.when(before).done(function() {
                return orig.call(_this, options);
              });
              return df;
            });
            return [key, fn];
          };
        })(this));
        return this._toObject(handlers);
      };

      Application.prototype._normalizeArguments = function(args, action, key) {
        var defaultParams;
        if (this._argsArePresentAndStrings(args)) {
          args[0] = this._parseStringMatches(args, action, key);
        }
        if (args[0] == null) {
          args[0] = {};
        }
        defaultParams = _.isFunction(action != null ? action.defaultParams : void 0) ? action.defaultParams.call(this) : action != null ? action.defaultParams : void 0;
        _.defaults(args[0], defaultParams || {});
        return args[0];
      };

      Application.prototype._parseStringMatches = function(args, action, key) {
        var route;
        route = action != null ? action.route : void 0;
        if (!route) {
          throw new Error("Routes must be defined on the action: " + key);
        }
        return _.reduce(args, function(memo, arg) {
          var i, matches;
          i = _(args).indexOf(arg);
          matches = route.match(routeParams);
          memo[matches[i].slice(1)] = arg;
          return memo;
        }, {});
      };

      Application.prototype._invokeBefore = function(options, action) {
        var before;
        if (!(before = this._shouldInvokeBefore(action))) {
          return;
        }
        return before.call(this, options);
      };

      Application.prototype._shouldInvokeBefore = function(action) {
        return (action != null ? action.before : void 0) || this.before;
      };

      Application.prototype._interpolateUrl = function(action, options) {
        return Routes.create(action.route, _(options).omit("region", "resolve"));
      };

      Application.prototype._updateUrl = function(action, options) {
        var route;
        route = this._interpolateUrl(action, options);
        if (App.currentRoute() !== route.replace(/^\//, "")) {
          return App.visit(route);
        }
      };

      Application.prototype._shouldUpdateUrl = function(action, args) {
        if (!(action != null ? action.route : void 0) || this._argsArePresentAndStrings(args)) {
          return false;
        }
        if (action && _(action).has("updateUrl")) {
          return action != null ? action.updateUrl : void 0;
        }
        return this.updateUrl;
      };

      Application.prototype._getActions = function(fn) {
        return _(this.actions).map((function(_this) {
          return function(action, key) {
            action = _.result(_this.actions, key);
            return fn(action, key);
          };
        })(this));
      };

      Application.prototype._getController = function(action, key) {
        switch (false) {
          case !_.isFunction(action != null ? action.controller : void 0):
            return action.controller;
          case !_.isUndefined(this.module):
            throw new Error("Module must be defined on the resource in order to instantiate a controller");
            break;
          case !_.isString(action != null ? action.controller : void 0):
            return this._getControllerConstructor(this.module[action.controller]);
          default:
            return this._getControllerConstructor(this.module[this.controllerMap[key]], this.controllerMap[key], this.module.moduleName);
        }
      };

      Application.prototype._getControllerConstructor = function(obj, key, module) {
        var err;
        try {
          if (_.isFunction(obj)) {
            return obj;
          } else {
            return obj.Controller;
          }
        } catch (_error) {
          err = _error;
          throw new Error("The '" + key + "' Controller was not found for for the module: '" + module + "'");
        }
      };

      Application.prototype._argsArePresentAndStrings = function(args) {
        return !_.isEmpty(args) && _.all(args, _.isString);
      };

      Application.prototype._toObject = function(array) {
        return _.chain(array).reject(_.isEmpty).object().value();
      };

      return Application;

    })();
    return App.addRouter = function(resource) {
      return App.addInitializer(function() {
        return new Marionette.AppRouter({
          appRoutes: resource.routes,
          controller: resource.handlers
        });
      });
    };
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    Entities.Command = (function(_super) {
      __extends(Command, _super);

      function Command() {
        return Command.__super__.constructor.apply(this, arguments);
      }

      Command.prototype.defaults = function() {
        return {
          indent: 0,
          pause: false,
          revert: false
        };
      };

      Command.prototype.mutators = {
        selector: function() {
          return _.trim(this.stripParentSelector());
        },
        shouldDisplayControls: function() {
          return !this.get("error") && !this.isCloned();
        }
      };

      Command.prototype.initialize = function() {
        return new Backbone.Chooser(this);
      };

      Command.prototype.indent = function(indent) {
        indent = this.parent.get("indent");
        return this.set("indent", indent + 17);
      };

      Command.prototype.setParent = function(parent) {
        this.parent = parent;
        this.set("hasParent", true);
        this.parent.set("isParent", true);
        return this;
      };

      Command.prototype.hasParent = function() {
        return !!this.get("hasParent");
      };

      Command.prototype.isParent = function() {
        return !!this.get("isParent");
      };

      Command.prototype.isCloned = function() {
        return !!this.get("isCloned");
      };

      Command.prototype.stripParentSelector = function() {
        var parent, selector, _ref, _ref1;
        selector = (_ref = this.attributes.selector) != null ? _ref : "";
        if (!this.hasParent()) {
          return selector;
        }
        parent = (_ref1 = this.parent.attributes.selector) != null ? _ref1 : "";
        return selector.replace(parent, "");
      };

      Command.prototype.setResponse = function(response) {
        this.set("status", this.xhr.status);
        this.set("response", _(this.xhr.responseText).truncate(40, " "));
        this.set("truncated", this.xhr.responseText.length > 40);
        return this.response = response;
      };

      Command.prototype.getPrimaryObjects = function() {
        var objs;
        objs = (function() {
          switch (this.get("type")) {
            case "xhr":
              return this.xhr;
            case "dom":
              return this.el;
            case "assertion":
              return this.getAssertion();
          }
        }).call(this);
        return _([objs]).flatten(true);
      };

      Command.prototype.getDom = function() {
        return this.dom;
      };

      Command.prototype.getEl = function() {
        return this.el;
      };

      Command.prototype.getAssertion = function() {
        var obj;
        obj = {
          "Subject:  ": this.subject,
          "Expected: ": this.expected,
          "Actual:   ": this.actual,
          "Message:  ": this.get("message")
        };
        return _.reduce(obj, function(memo, value, key) {
          if (value) {
            memo.push([key, value]);
          }
          return memo;
        }, []);
      };

      return Command;

    })(Entities.Model);
    Entities.CommandsCollection = (function(_super) {
      __extends(CommandsCollection, _super);

      function CommandsCollection() {
        return CommandsCollection.__super__.constructor.apply(this, arguments);
      }

      CommandsCollection.prototype.model = Entities.Command;

      CommandsCollection.prototype.initialize = function() {
        return new Backbone.SingleChooser(this);
      };

      CommandsCollection.prototype.parentExistsFor = function(id) {
        return this.get(id);
      };

      CommandsCollection.prototype.getCommandIndex = function(command) {
        return this.indexOf(command) + 1;
      };

      CommandsCollection.prototype.lastParentCommandIsNotParent = function(parent, command) {
        var model, _i, _ref;
        _ref = this.models;
        for (_i = _ref.length - 1; _i >= 0; _i += -1) {
          model = _ref[_i];
          if (model.get("canBeParent")) {
            return model !== parent;
          }
        }
      };

      CommandsCollection.prototype.lastParentsAreNotXhr = function(parent, command) {
        var model, _i, _ref;
        _ref = this.models;
        for (_i = _ref.length - 1; _i >= 0; _i += -1) {
          model = _ref[_i];
          if (model.get("type") !== "xhr") {
            return true;
          }
          if (model === parent) {
            return false;
          }
        }
      };

      CommandsCollection.prototype.cloneParent = function(parent) {
        var clone;
        clone = parent.clone();
        clone.set({
          id: _.uniqueId("cloneId"),
          isCloned: true
        });
        _.each(["el", "xhr", "response", "parent"], function(prop) {
          return clone[prop] = parent[prop];
        });
        return this.add(clone);
      };

      CommandsCollection.prototype.getCommandByType = function(attrs) {
        switch (attrs.type) {
          case "dom":
            return this.addDom(attrs);
          case "xhr":
            return this.addXhr(attrs);
          case "assertion":
            return this.addAssertion(attrs);
        }
      };

      CommandsCollection.prototype.insertParents = function(command, parentId, options) {
        var parent;
        if (options == null) {
          options = {};
        }
        if (parent = this.parentExistsFor(parentId)) {
          if (options["if"] && options["if"].call(this, parent, command)) {
            if (parent.hasParent()) {
              this.insertParents(parent, parent.parent.id, options);
            }
            parent = this.cloneParent(parent);
          }
          command.setParent(parent);
          command.indent();
          if (options.onSetParent) {
            return options.onSetParent.call(this, parent);
          }
        }
      };

      CommandsCollection.prototype.getIndexByParent = function(command) {
        if (!command.hasParent()) {
          return;
        }
        return this.getCommandIndex(command.parent);
      };

      CommandsCollection.prototype.getXhrOptions = function(command, options) {
        var index;
        index = this.getIndexByParent(command);
        if (index) {
          options.at = index;
        }
        return options;
      };

      CommandsCollection.prototype.addAssertion = function(attrs) {
        var actual, command, dom, el, expected, subject;
        dom = attrs.dom, el = attrs.el, actual = attrs.actual, expected = attrs.expected, subject = attrs.subject;
        attrs = _(attrs).omit("dom", "el", "actual", "expected", "subject");
        command = new Entities.Command(attrs);
        command.dom = dom;
        command.el = el;
        command.actual = actual;
        command.expected = expected;
        command.subject = subject;
        return command;
      };

      CommandsCollection.prototype.addDom = function(attrs) {
        var command, dom, el;
        el = attrs.el, dom = attrs.dom;
        attrs = _(attrs).omit("el", "dom");
        command = new Entities.Command(attrs);
        command.dom = dom;
        command.el = el;
        this.insertParents(command, attrs.parent, {
          "if": function(parent, cmd) {
            return this.lastParentCommandIsNotParent(parent, cmd);
          }
        });
        return command;
      };

      CommandsCollection.prototype.addXhr = function(attrs) {
        var command, dom, response, xhr;
        xhr = attrs.xhr, response = attrs.response, dom = attrs.dom;
        attrs = _(attrs).omit("xhr", "response", "dom");
        command = new Entities.Command(attrs);
        command.xhr = xhr;
        command.dom = dom;
        this.insertParents(command, attrs.parent, {
          "if": function(parent, cmd) {
            return this.lastParentsAreNotXhr(parent, cmd);
          },
          onSetParent: function(parent) {
            return command.setResponse(response);
          }
        });
        return command;
      };

      CommandsCollection.prototype.add = function(attrs, type, runnable) {
        var command, options;
        try {
          command = attrs;
          options = type;
          if (command.get("type") === "xhr") {
            options = this.getXhrOptions(command, options);
          }
          if (attrs instanceof Entities.Command) {
            return CommandsCollection.__super__.add.call(this, command, options);
          }
        } catch (_error) {}
        if (_.isEmpty(attrs)) {
          return;
        }
        _.extend(attrs, {
          type: type,
          testId: runnable.cid
        });
        command = this.getCommandByType(attrs);
        return CommandsCollection.__super__.add.call(this, command);
      };

      return CommandsCollection;

    })(Entities.Collection);
    return App.reqres.setHandler("command:entities", function() {
      return new Entities.CommandsCollection;
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    Entities.Config = (function(_super) {
      __extends(Config, _super);

      function Config() {
        return Config.__super__.constructor.apply(this, arguments);
      }

      Config.prototype.defaults = function() {
        return {
          collapsed: this.getConfig("collapsed"),
          panels: this.getConfig("panels"),
          panelWidth: this.getConfig("panelWidth")
        };
      };

      Config.prototype.storageConfig = {
        collapsed: {
          "default": false,
          type: "boolean"
        },
        panels: {
          "default": {},
          type: "object"
        },
        panelWidth: {
          "default": 300,
          type: "number"
        }
      };

      Config.prototype.toggleCollapse = function() {
        return this.set("collapsed", !this.get("collapsed"));
      };

      Config.prototype.togglePanel = function(panel, bool) {
        var obj;
        obj = {};
        obj[panel.get("name")] = bool;
        return this.set("panels", obj, {
          type: "object"
        });
      };

      Config.prototype.anyPanelOpen = function() {
        return _.any(_.values(this.get("panels")));
      };

      Config.prototype.calculatePanelHeight = function() {
        var num;
        num = _.reduce(this.get("panels"), function(memo, value, key) {
          if (value) {
            memo += 1;
          }
          return memo;
        }, 0);
        return (100 / num).toFixed(2);
      };

      Config.prototype.set = function(attr, value, options) {
        var existing;
        if (options == null) {
          options = {};
        }
        existing = this.getConfig(attr, options);
        if (options.type === "object") {
          value = _.extend(existing, value);
        }
        localStorage.setItem(attr, JSON.stringify(value));
        return Config.__super__.set.apply(this, arguments);
      };

      Config.prototype.getConfig = function(attr, options) {
        var item;
        if (options == null) {
          options = {};
        }
        _.defaults(options, this.storageConfig[attr] || {});
        item = localStorage.getItem(attr) || options["default"];
        switch (options.type) {
          case "boolean":
            return _.toBoolean(item);
          case "number":
            return _.toNumber(item);
          case "object":
            if (_.isString(item)) {
              return JSON.parse(item);
            } else {
              return item;
            }
            break;
          default:
            return item;
        }
      };

      return Config;

    })(Entities.Model);
    return App.reqres.setHandler("new:config:entity", function(attrs) {
      if (attrs == null) {
        attrs = {};
      }
      return new Entities.Config(attrs);
    });
  });

}).call(this);
; 
(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice;

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    Entities.Container = (function() {
      function Container() {
        this.previousRunnables = [];
        this.previousIds = {};
        this.currentRunnables = [];
        this.currentIds = {};
      }

      Container.prototype.getPreviousById = function(id) {
        return this.previousIds[id];
      };

      Container.prototype.get = function(id) {
        return this.currentIds[id];
      };

      Container.prototype.add = function(runnable, type, root) {
        var model;
        model = this.getPreviousById(runnable.cid) || App.request("runnable:entity", type);
        this.currentRunnables.push(model);
        model.setAttrsFromRunnable(runnable, this.getIndex(model));
        this.insertIntoExistingParentOrRoot(model, root);
        this.currentIds[model.id] = model;
        return model;
      };

      Container.prototype.getIndex = function(model) {
        return _.indexOf(this.currentRunnables, model);
      };

      Container.prototype.reset = function() {
        this.previousRunnables = this.currentRunnables;
        this.previousIds = this.currentIds;
        this.currentRunnables = [];
        return this.currentIds = {};
      };

      Container.prototype.removeOldModels = function() {
        var ids;
        ids = this.pluck("id");
        return _(this.previousRunnables).each(function(runnable) {
          var _ref;
          if (_ref = runnable.id, __indexOf.call(ids, _ref) < 0) {
            return runnable.remove();
          }
        });
      };

      Container.prototype.insertIntoExistingParentOrRoot = function(model, root) {
        var parent;
        if (parent = this.get(model.get("parentId"))) {
          return parent.addRunnable(model);
        } else {
          if (!model.get("parentRoot")) {
            return;
          }
          return root.addRunnable(model);
        }
      };

      return Container;

    })();
    _.each(["each", "pluck"], function(method) {
      return Entities.Container.prototype[method] = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        args.unshift(this.currentRunnables);
        return _[method].apply(_, args);
      };
    });
    return App.reqres.setHandler("runnable:container:entity", function() {
      return new Entities.Container;
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    Entities.Dom = (function(_super) {
      __extends(Dom, _super);

      function Dom() {
        return Dom.__super__.constructor.apply(this, arguments);
      }

      Dom.prototype.initialize = function() {
        return new Backbone.Chooser(this);
      };

      Dom.prototype.getDom = function() {
        return this.dom;
      };

      Dom.prototype.getEl = function() {
        return this.el;
      };

      return Dom;

    })(Entities.Model);
    Entities.DomsCollection = (function(_super) {
      __extends(DomsCollection, _super);

      function DomsCollection() {
        return DomsCollection.__super__.constructor.apply(this, arguments);
      }

      DomsCollection.prototype.model = Entities.Dom;

      DomsCollection.prototype.initialize = function() {
        return new Backbone.MultiChooser(this);
      };

      DomsCollection.prototype.add = function(attrs, runnable) {
        var dom, el, model, _ref;
        if (attrs == null) {
          attrs = {};
        }
        if (_.isEmpty(attrs)) {
          return;
        }
        el = attrs.el, dom = attrs.dom;
        attrs = _(attrs).pick("method", "selector", "sequence");
        attrs = _(attrs).reduce(function(memo, value, key) {
          if (!_.isUndefined(value)) {
            memo[key] = value;
          }
          return memo;
        }, {});
        _.extend(attrs, {
          selector: attrs.selector.toLowerCase(),
          title: runnable.originalTitle(),
          parent: (_ref = runnable.parent) != null ? _ref.originalTitle() : void 0,
          testId: runnable.cid
        });
        if (!el.length) {
          attrs.error = "could not find: " + attrs.selector;
        }
        attrs.highlight = !attrs.error;
        model = DomsCollection.__super__.add.call(this, attrs);
        model.el = el;
        model.dom = dom;
        return model;
      };

      return DomsCollection;

    })(Entities.Collection);
    return App.reqres.setHandler("dom:entities", function() {
      return new Entities.DomsCollection;
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    var API;
    Entities.File = (function(_super) {
      __extends(File, _super);

      function File() {
        return File.__super__.constructor.apply(this, arguments);
      }

      File.prototype.defaults = function() {
        return {
          children: new Entities.FilesCollection
        };
      };

      File.prototype.hasChildren = function() {
        return this.get("children").length;
      };

      File.prototype.setFullPath = function(array) {
        return this.set("fullPath", array.join("/"));
      };

      return File;

    })(Entities.Model);
    Entities.FilesCollection = (function(_super) {
      __extends(FilesCollection, _super);

      function FilesCollection() {
        return FilesCollection.__super__.constructor.apply(this, arguments);
      }

      FilesCollection.prototype.model = Entities.File;

      FilesCollection.prototype.url = "/files";

      FilesCollection.prototype.findByName = function(path) {
        return this.findWhere({
          name: path
        });
      };

      FilesCollection.prototype.getFilesSplitByDirectory = function() {
        return this.map(function(file) {
          return file.get("name").split("/");
        });
      };

      FilesCollection.prototype.toJSON = function() {
        return _.map(FilesCollection.__super__.toJSON.apply(this, arguments), function(obj) {
          obj.children = obj.children.toJSON();
          return obj;
        });
      };

      FilesCollection.prototype.resetToTreeView = function() {
        var files;
        files = new Entities.FilesCollection;
        _.each(this.getFilesSplitByDirectory(), function(array) {
          return _.reduce(array, function(memo, path, index) {
            var model;
            model = memo.findByName(path);
            if (model == null) {
              model = memo.push({
                name: path
              });
            }
            if (_(array).last() === path) {
              model.setFullPath(array);
            }
            return model.get("children");
          }, files);
        });
        return this.reset(files.models);
      };

      return FilesCollection;

    })(Entities.Collection);
    API = {
      getFiles: function() {
        var files;
        files = new Entities.FilesCollection;
        files.fetch({
          reset: true
        });
        return files;
      }
    };
    return App.reqres.setHandler("file:entities", function() {
      return API.getFiles();
    });
  });

  [
    {
      name: "apps",
      children: [
        {
          name: "app_spec.coffee"
        }, {
          name: "accounts",
          children: [
            {
              name: "account_new_spec"
            }
          ]
        }
      ]
    }
  ];

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    var API;
    Entities.Nav = (function(_super) {
      __extends(Nav, _super);

      function Nav() {
        return Nav.__super__.constructor.apply(this, arguments);
      }

      Nav.prototype.initialize = function() {
        return new Backbone.Chooser(this);
      };

      return Nav;

    })(Entities.Model);
    Entities.NavsCollection = (function(_super) {
      __extends(NavsCollection, _super);

      function NavsCollection() {
        return NavsCollection.__super__.constructor.apply(this, arguments);
      }

      NavsCollection.prototype.model = Entities.Nav;

      NavsCollection.prototype.initialize = function() {
        return new Backbone.SingleChooser(this);
      };

      NavsCollection.prototype.chooseByName = function(nav) {
        nav = this.findWhere({
          name: nav
        });
        if (!nav) {
          throw new Error("No nav found by the name: " + nav);
        }
        return this.choose(nav);
      };

      return NavsCollection;

    })(Entities.Collection);
    API = {
      getNavs: function() {
        return new Entities.NavsCollection([
          {
            name: "Tests",
            href: "#tests",
            icon: "fa fa-code"
          }, {
            name: "Organize",
            href: "#organize",
            icon: "fa fa-th"
          }, {
            name: "Analytics",
            href: "#analytics",
            icon: "fa fa-bar-chart-o"
          }, {
            name: "Settings",
            href: "#settings",
            icon: "fa fa-cog"
          }
        ]);
      }
    };
    return App.reqres.setHandler("nav:entities", function() {
      return API.getNavs();
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    var API;
    Entities.Panel = (function(_super) {
      __extends(Panel, _super);

      function Panel() {
        return Panel.__super__.constructor.apply(this, arguments);
      }

      Panel.prototype.initialize = function() {
        return new Backbone.Chooser(this);
      };

      return Panel;

    })(Entities.Model);
    Entities.PanelsCollection = (function(_super) {
      __extends(PanelsCollection, _super);

      function PanelsCollection() {
        return PanelsCollection.__super__.constructor.apply(this, arguments);
      }

      PanelsCollection.prototype.model = Entities.Panel;

      PanelsCollection.prototype.setInitialStateByConfig = function(config) {
        if (config == null) {
          config = {};
        }
        return this.choose(this.filter(function(panel) {
          return config[panel.get("name")];
        }));
      };

      PanelsCollection.prototype.initialize = function() {
        return new Backbone.MultiChooser(this);
      };

      return PanelsCollection;

    })(Entities.Collection);
    API = {
      getPanels: function(config) {
        return new Entities.PanelsCollection([
          {
            name: "DOM",
            color: "#1C7EBB"
          }, {
            name: "XHR",
            color: "#FFB61C"
          }, {
            name: "LOG",
            color: "#999"
          }
        ]);
      }
    };
    return App.reqres.setHandler("panel:entities", function(config) {
      if (config == null) {
        config = {};
      }
      return API.getPanels(config);
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    var API;
    Entities.Runnable = (function(_super) {
      __extends(Runnable, _super);

      function Runnable() {
        return Runnable.__super__.constructor.apply(this, arguments);
      }

      Runnable.prototype.defaults = function() {
        return {
          state: "processing",
          indent: -10,
          open: false,
          error: null,
          children: new Entities.RunnableCollection,
          commands: App.request("command:entities")
        };
      };

      Runnable.prototype.initialize = function() {
        return new Backbone.Chooser(this);
      };

      Runnable.prototype.toggleOpen = function() {
        return this.set("open", !this.get("open"));
      };

      Runnable.prototype.setAttrsFromRunnable = function(runnable, index) {
        return this.set({
          id: runnable.cid,
          title: runnable.originalTitle(),
          parentId: runnable.parent.cid,
          parentRoot: runnable.parent.root,
          index: index
        });
      };

      Runnable.prototype.addRunnable = function(model) {
        var sort;
        sort = model.hasChanged("index") && !!model.collection;
        model.set("indent", this.get("indent") + 20);
        this.get("children").add(model, {
          merge: true
        });
        if (sort) {
          return this.get("children").sort();
        }
      };

      Runnable.prototype.remove = function() {
        return this.collection.remove(this);
      };

      Runnable.prototype.addCommand = function(command, options) {
        if (options == null) {
          options = {};
        }
        return this.get("commands").add(command, options);
      };

      Runnable.prototype.is = function(type) {
        return this.get("type") === type;
      };

      Runnable.prototype.isSlow = function() {
        return this.get("duration") > this._slow;
      };

      Runnable.prototype.timedOut = function() {
        return this.get("duration") > this._timeout;
      };

      Runnable.prototype.onChoose = function() {
        if (this.is("test")) {
          return this.set("open", true);
        }
      };

      Runnable.prototype.collapse = function() {
        if (this.is("test")) {
          return this.set("open", false);
        }
      };

      Runnable.prototype.reset = function() {
        if (this.is("test")) {
          return this.resetTest();
        } else {
          return this.resetSuite();
        }
      };

      Runnable.prototype.resetSuite = function() {
        return this.get("children").invoke("reset");
      };

      Runnable.prototype.resetTest = function() {
        var attributes, defaults, _ref;
        this.removeOriginalError();
        _.each(["state", "duration", "error"], (function(_this) {
          return function(key) {
            return _this.unset(key);
          };
        })(this));
        this.get("commands").reset();
        defaults = _(this).result("defaults");
        attributes = _(this.attributes).keys();
        return this.set((_ref = _(defaults)).omit.apply(_ref, attributes));
      };

      Runnable.prototype.removeOriginalError = function() {
        return delete this.originalError;
      };

      Runnable.prototype.setResults = function(test) {
        var attrs;
        attrs = {
          state: test.pending ? "pending" : test.state,
          duration: test.duration
        };
        if (test.err) {
          console.error(test.err.stack);
          this.originalError = test.err;
          attrs.error = test.err.toString();
        } else {
          this.removeOriginalError();
          attrs.error = null;
        }
        this._slow = test.slow();
        this._timeout = test.timeout();
        return this.set(attrs);
      };

      Runnable.prototype.anyAreProcessing = function(states) {
        return _(states).any(function(state) {
          return state === "processing";
        });
      };

      Runnable.prototype.anyAreFailed = function(states) {
        return _(states).any(function(state) {
          return state === "failed";
        });
      };

      Runnable.prototype.allArePassed = function(states) {
        return _(states).all(function(state) {
          return state === "passed";
        });
      };

      Runnable.prototype.allArePending = function(states) {
        return _(states).all(function(state) {
          return state === "pending";
        });
      };

      Runnable.prototype.updateState = function() {
        var state, states;
        states = this.get("children").pluck("state");
        state = (function() {
          switch (false) {
            case !this.anyAreProcessing(states):
              return "processing";
            case !this.anyAreFailed(states):
              return "failed";
            case !this.allArePassed(states):
              return "passed";
            case !this.allArePending(states):
              return "pending";
          }
        }).call(this);
        return this.set({
          state: state
        });
      };

      return Runnable;

    })(Entities.Model);
    Entities.RunnableCollection = (function(_super) {
      __extends(RunnableCollection, _super);

      function RunnableCollection() {
        return RunnableCollection.__super__.constructor.apply(this, arguments);
      }

      RunnableCollection.prototype.model = Entities.Runnable;

      RunnableCollection.prototype.comparator = "index";

      return RunnableCollection;

    })(Entities.Collection);
    API = {
      newRoot: function() {
        var root;
        root = new Entities.Runnable;
        root.set({
          root: true
        });
        return root;
      },
      newRunnable: function(type) {
        return new Entities.Runnable({
          type: type
        });
      }
    };
    App.reqres.setHandler("new:root:runnable:entity", function() {
      return API.newRoot();
    });
    return App.reqres.setHandler("runnable:entity", function(type) {
      return API.newRunnable(type);
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    var API, runnerChannel, testIdRegExp;
    testIdRegExp = /\[(.{3})\]$/;
    runnerChannel = _.extend({}, Backbone.Events);
    Entities.Runner = (function(_super) {
      __extends(Runner, _super);

      function Runner() {
        return Runner.__super__.constructor.apply(this, arguments);
      }

      Runner.prototype.defaults = function() {
        return {
          iframes: []
        };
      };

      Runner.prototype.initialize = function() {
        return this.commands = App.request("command:entities");
      };

      Runner.prototype.setContentWindow = function(contentWindow) {
        this.contentWindow = contentWindow;
      };

      Runner.prototype.setIframe = function(iframe) {
        this.iframe = iframe;
      };

      Runner.prototype.setEclPatch = function(patchEcl) {
        this.patchEcl = patchEcl;
      };

      Runner.prototype.setEclSandbox = function(patchSandbox) {
        this.patchSandbox = patchSandbox;
      };

      Runner.prototype.setOptions = function(options) {
        this.options = options;
      };

      Runner.prototype.getTestCid = function(test) {
        var matches;
        matches = testIdRegExp.exec(test.title);
        return matches && matches[1];
      };

      Runner.prototype.getIdToAppend = function(cid) {
        return " [" + cid + "]";
      };

      Runner.prototype.logResults = function(test) {
        return this.trigger("test:results:ready", test);
      };

      Runner.prototype.revertDom = function(command) {
        return this.trigger("revert:dom", command.getDom(), {
          id: command.id,
          el: command.getEl(),
          attr: command.get("highlightAttr")
        });
      };

      Runner.prototype.highlightEl = function(command, init) {
        if (init == null) {
          init = true;
        }
        return this.trigger("highlight:el", command.getEl(), {
          id: command.id,
          init: init
        });
      };

      Runner.prototype.setTestRunner = function(runner) {
        var socket;
        this.runner = runner;
        socket = App.request("socket:entity");
        this.listenTo(socket, "test:changed", this.triggerLoadIframe);
        runner = this;
        return this.runner.runSuite = _.wrap(this.runner.runSuite, function(runSuite, rootSuite, fn) {
          var generatedIds, _this;
          if (!rootSuite.root) {
            return runSuite.call(this, rootSuite, fn);
          }
          generatedIds = [];
          runner.iterateThroughRunnables(rootSuite, generatedIds, socket);
          _this = this;
          return $.when.apply($, generatedIds).done(function() {
            _this.grep(runner.getGrep(rootSuite));
            return runSuite.call(_this, rootSuite, fn);
          });
        });
      };

      Runner.prototype.iterateThroughRunnables = function(runnable, ids, socket) {
        return _.each([runnable.tests, runnable.suites], (function(_this) {
          return function(array) {
            return _.each(array, function(runnable) {
              return _this.generateId(runnable, ids, socket);
            });
          };
        })(this));
      };

      Runner.prototype.generateId = function(runnable, ids, socket) {
        var data, df, runner;
        if (ids == null) {
          ids = [];
        }
        if (runnable.root || runnable.added) {
          return;
        }
        runner = this;
        if (runnable.cid == null) {
          runnable.cid = runner.getTestCid(runnable);
        }
        runnable.originalTitle = function() {
          return this.title.replace(runner.getIdToAppend(runnable.cid), "");
        };
        df = $.Deferred();
        df.done(function() {
          var count, event, grep, _ref;
          if (runnable.added) {
            return;
          }
          runnable.added = true;
          event = runnable.type || "suite";
          grep = (_ref = runner.options) != null ? _ref.grep : void 0;
          if (grep && event === "suite") {
            count = 0;
            runnable.eachTest(function(test) {
              if (grep.test(test.fullTitle())) {
                return count += 1;
              }
            });
            if (count > 0) {
              runner.trigger("suite:add", runnable);
            }
          }
          if (grep && event === "test") {
            if (grep.test(runnable.fullTitle())) {
              runner.trigger("test:add", runnable);
            }
          }
          return runner.iterateThroughRunnables(runnable, ids, socket);
        });
        if (!runnable.cid) {
          runnable.fullTitle = _.wrap(runnable.fullTitle, function(origTitle) {
            var title;
            title = origTitle.apply(this);
            return title + runner.getIdToAppend(runnable.cid);
          });
          ids.push(df);
          data = {
            title: runnable.title,
            spec: runner.iframe
          };
          socket.emit("generate:test:id", data, function(id) {
            runnable.cid = id;
            return df.resolve(id);
          });
        } else {
          df.resolve();
        }
        return df;
      };

      Runner.prototype.getCommands = function() {
        return this.commands;
      };

      Runner.prototype.startListening = function() {
        this.listenTo(runnerChannel, "all", function(type, runnable, attrs) {
          return this.commands.add(attrs, type, runnable);
        });
        this.runner.on("start", (function(_this) {
          return function() {
            return _this.trigger("runner:start");
          };
        })(this));
        this.runner.on("end", (function(_this) {
          return function() {
            return _this.trigger("runner:end");
          };
        })(this));
        this.runner.on("suite", (function(_this) {
          return function(suite) {
            return _this.trigger("suite:start", suite);
          };
        })(this));
        this.runner.on("suite end", (function(_this) {
          return function(suite) {
            return _this.trigger("suite:stop", suite);
          };
        })(this));
        this.runner.on("fail", (function(_this) {
          return function(test, err) {
            console.warn("runner has failed", test, err);
            return test.err = err;
          };
        })(this));
        this.runner.on("pending", (function(_this) {
          return function(test) {
            return _this.trigger("test", test);
          };
        })(this));
        this.runner.on("test", (function(_this) {
          return function(test) {
            _this.patchEcl({
              runnable: test,
              channel: runnerChannel,
              contentWindow: _this.contentWindow,
              iframe: _this.iframe
            });
            return _this.trigger("test:start", test);
          };
        })(this));
        return this.runner.on("test end", (function(_this) {
          return function(test) {
            return _this.trigger("test:end", test);
          };
        })(this));
      };

      Runner.prototype.stop = function() {
        this.runner.removeAllListeners();
        delete this.runner;
        delete this.contentWindow;
        delete this.iframe;
        delete this.commands;
        return this.stopListening();
      };

      Runner.prototype.start = function(iframe) {
        this.setIframe(iframe);
        return this.triggerLoadIframe(this.iframe);
      };

      Runner.prototype.triggerLoadIframe = function(iframe, opts) {
        if (opts == null) {
          opts = {};
        }
        if (iframe !== this.iframe) {
          return;
        }
        this.commands.reset();
        this.options.grep = /.*/;
        this.runner.suite.eachTest(function(test) {
          var obj;
          test.pending = true;
          test.stopped = true;
          while (obj = test.parent) {
            if (obj.stopped) {
              return;
            }
            obj.pending = true;
            obj.stopped = true;
            obj = obj.parent;
          }
        });
        return this.trigger("load:iframe", this.iframe, opts);
      };

      Runner.prototype.hasChosen = function() {
        return !!this.get("chosen");
      };

      Runner.prototype.setChosen = function(runnable) {
        if (runnable) {
          this.set("chosen", runnable);
        } else {
          this.unset("chosen");
        }
        return this.triggerLoadIframe(this.iframe);
      };

      Runner.prototype.getRunnableCids = function(root, ids) {
        if (ids == null) {
          ids = [];
        }
        if (root.cid) {
          ids.push(root.cid);
        }
        _.each(root.tests, function(test) {
          return ids.push(test.cid);
        });
        _.each(root.suites, (function(_this) {
          return function(suite) {
            return _this.getRunnableCids(suite, ids);
          };
        })(this));
        return ids;
      };

      Runner.prototype.getGrep = function(root) {
        var chosen, re, _ref;
        console.warn("GREP IS: ", this.options.grep);
        if (re = this.parseMochaGrep(this.options.grep)) {
          return re;
        }
        chosen = this.get("chosen");
        if (chosen) {
          if (_ref = chosen.id, __indexOf.call(this.getRunnableCids(root), _ref) >= 0) {
            return new RegExp(this.escapeId("[" + chosen.id + "]"));
          } else {
            this.unset("chosen");
          }
        }
        if (!this.hasChosen()) {
          return /.*/;
        }
      };

      Runner.prototype.parseMochaGrep = function(re) {
        var matches, _ref;
        re = re.toString();
        if (re === "/.*/") {
          return;
        }
        re = re.replace(/[^a-zA-Z0-9\[\]\s]/g, "");
        matches = testIdRegExp.exec(re);
        if (!matches) {
          return;
        }
        if (matches[1] === ((_ref = this.get("chosen")) != null ? _ref.id : void 0)) {
          return;
        }
        this.unset("chosen");
        return new RegExp(this.escapeId("[" + matches[1] + "]"));
      };

      Runner.prototype.escapeId = function(id) {
        return id.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      };

      Runner.prototype.runIframeSuite = function(iframe, contentWindow) {
        this.setIframe(iframe);
        this.setContentWindow(contentWindow);
        this.patchSandbox(contentWindow);
        this.trigger("before:run");
        return this.runner.runSuite(contentWindow.mocha.suite, (function(_this) {
          return function() {
            _this.trigger("after:run");
            return console.log("finished running the iframes suite!");
          };
        })(this));
      };

      return Runner;

    })(Entities.Model);
    API = {
      getRunner: function(testRunner, options, patch, sandbox) {
        var runner;
        runner = new Entities.Runner;
        runner.setTestRunner(testRunner);
        runner.setOptions(options);
        runner.setEclPatch(patch);
        runner.setEclSandbox(sandbox);
        runner.startListening();
        return runner;
      }
    };
    return App.reqres.setHandler("runner:entity", function(testRunner, options, patch, sandbox) {
      return API.getRunner(testRunner, options, patch, sandbox);
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    Entities.Socket = (function(_super) {
      __extends(Socket, _super);

      function Socket() {
        return Socket.__super__.constructor.apply(this, arguments);
      }

      Socket.prototype.setChannel = function(channel) {
        this.channel = channel;
      };

      Socket.prototype.emit = function(event, data, fn) {
        if (fn == null) {
          fn = function() {};
        }
        return this.channel.emit(event, data, fn);
      };

      return Socket;

    })(Entities.Model);
    return App.reqres.setHandler("io:entity", function(channel) {
      var socket;
      socket = new Entities.Socket;
      socket.setChannel(channel);
      return socket;
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    Entities.Stats = (function(_super) {
      __extends(Stats, _super);

      function Stats() {
        return Stats.__super__.constructor.apply(this, arguments);
      }

      Stats.prototype.defaults = function() {
        return {
          failed: 0,
          passed: 0,
          pending: 0,
          duration: 0
        };
      };

      Stats.prototype.reset = function() {
        this.clear({
          silent: true
        });
        return this.set(_.result(this, "defaults"));
      };

      Stats.prototype.startCounting = function() {
        if (this.intervalId) {
          this.stopCounting();
        }
        return this.intervalId = setInterval(_.bind(this.increment, this, "duration"), 100);
      };

      Stats.prototype.stopCounting = function() {
        return clearInterval(this.intervalId);
      };

      Stats.prototype.increment = function(state) {
        return this.set(state, this.get(state) + 1);
      };

      Stats.prototype.countTestState = function(test) {
        return this.increment(test.get("state"));
      };

      Stats.prototype.getDurationFormatted = function() {
        var duration;
        duration = this.get("duration");
        return duration / 10;
      };

      return Stats;

    })(Entities.Model);
    return App.reqres.setHandler("stats:entity", function() {
      return new Entities.Stats;
    });
  });

}).call(this);
; 
(function() {


}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("NavApp", function(NavApp, App, Backbone, Marionette, $, _) {
    var Router, router;
    this.startWithParent = false;
    Router = (function(_super) {
      __extends(Router, _super);

      function Router() {
        return Router.__super__.constructor.apply(this, arguments);
      }

      Router.prototype.module = NavApp;

      Router.prototype.actions = {
        list: function() {
          return {
            defaultParams: {
              region: App.navRegion
            }
          };
        }
      };

      return Router;

    })(App.Routers.Application);
    router = new Router;
    return NavApp.on("start", function(navs) {
      return router.to("list", {
        navs: navs
      });
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("OrganizeApp", function(OrganizeApp, App, Backbone, Marionette, $, _) {
    var Router, router;
    Router = (function(_super) {
      __extends(Router, _super);

      function Router() {
        return Router.__super__.constructor.apply(this, arguments);
      }

      Router.prototype.module = OrganizeApp;

      Router.prototype.before = function() {
        return App.vent.trigger("main:nav:choose", "Organize");
      };

      Router.prototype.actions = {
        list: function() {
          return {
            route: "organize"
          };
        }
      };

      return Router;

    })(App.Routers.Application);
    return router = new Router;
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestCommandsApp", function(TestCommandsApp, App, Backbone, Marionette, $, _) {
    var Router, router;
    Router = (function(_super) {
      __extends(Router, _super);

      function Router() {
        return Router.__super__.constructor.apply(this, arguments);
      }

      Router.prototype.module = TestCommandsApp;

      Router.prototype.actions = {
        list: function() {}
      };

      return Router;

    })(App.Routers.Application);
    router = new Router;
    return App.commands.setHandler("list:test:commands", function(commands, runner, region) {
      return router.to("list", {
        commands: commands,
        runner: runner,
        region: region
      });
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestIframeApp", function(TestIframeApp, App, Backbone, Marionette, $, _) {
    var Router, router;
    Router = (function(_super) {
      __extends(Router, _super);

      function Router() {
        return Router.__super__.constructor.apply(this, arguments);
      }

      Router.prototype.module = TestIframeApp;

      Router.prototype.actions = {
        show: function() {}
      };

      return Router;

    })(App.Routers.Application);
    router = new Router;
    return App.commands.setHandler("show:test:iframe", function(region, runner) {
      return router.to("show", {
        region: region,
        runner: runner
      });
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestPanelsApp", function(TestPanelsApp, App, Backbone, Marionette, $, _) {
    var Router, router;
    Router = (function(_super) {
      __extends(Router, _super);

      function Router() {
        return Router.__super__.constructor.apply(this, arguments);
      }

      Router.prototype.module = TestPanelsApp;

      Router.prototype.actions = {
        list: function() {},
        dom: function() {
          return {
            controller: "DOM"
          };
        },
        xhr: function() {
          return {
            controller: "XHR"
          };
        },
        log: function() {
          return {
            controller: "LOG"
          };
        }
      };

      return Router;

    })(App.Routers.Application);
    router = new Router;
    App.commands.setHandler("list:test:panels", function(region, runner, regions) {
      return router.to("list", {
        region: region,
        runner: runner,
        regions: regions
      });
    });
    return App.commands.setHandler("show:panel", function(panel, region, runner) {
      return router.to(panel.get("name").toLowerCase(), {
        region: region,
        runner: runner,
        panel: panel
      });
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestSpecsApp", function(TestSpecsApp, App, Backbone, Marionette, $, _) {
    var Router, router;
    Router = (function(_super) {
      __extends(Router, _super);

      function Router() {
        return Router.__super__.constructor.apply(this, arguments);
      }

      Router.prototype.module = TestSpecsApp;

      Router.prototype.actions = {
        list: function() {}
      };

      return Router;

    })(App.Routers.Application);
    router = new Router;
    return App.commands.setHandler("list:test:specs", function(region, runner) {
      return router.to("list", {
        region: region,
        runner: runner
      });
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestStatsApp", function(TestStatsApp, App, Backbone, Marionette, $, _) {
    var Router, router;
    Router = (function(_super) {
      __extends(Router, _super);

      function Router() {
        return Router.__super__.constructor.apply(this, arguments);
      }

      Router.prototype.module = TestStatsApp;

      Router.prototype.actions = {
        show: function() {}
      };

      return Router;

    })(App.Routers.Application);
    router = new Router;
    return App.commands.setHandler("show:test:stats", function(region, runner) {
      return router.to("show", {
        region: region,
        runner: runner
      });
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestsApp", function(TestsApp, App, Backbone, Marionette, $, _) {
    var Router, router;
    Router = (function(_super) {
      __extends(Router, _super);

      function Router() {
        return Router.__super__.constructor.apply(this, arguments);
      }

      Router.prototype.module = TestsApp;

      Router.prototype.before = function() {
        return App.vent.trigger("main:nav:choose", "Tests");
      };

      Router.prototype.actions = {
        show: function() {
          return {
            route: "tests/*id"
          };
        }
      };

      return Router;

    })(App.Routers.Application);
    return router = new Router;
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("NavApp.List", function(List, App, Backbone, Marionette, $, _) {
    return List.Controller = (function(_super) {
      __extends(Controller, _super);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(options) {
        var config, navs;
        navs = options.navs;
        config = App.request("app:config:entity");
        this.listenTo(config, "list:test:panels", function(runner, regions) {
          return this.panelsRegion(runner, regions);
        });
        this.listenTo(config, "close:test:panels", function() {
          return this.layout.panelsRegion.empty();
        });
        this.layout = this.getLayoutView();
        this.listenTo(this.layout, "show", (function(_this) {
          return function() {
            return _this.navsRegion(navs, config);
          };
        })(this));
        return this.show(this.layout);
      };

      Controller.prototype.navsRegion = function(navs, config) {
        var navView;
        navView = this.getNavView(navs, config);
        return this.show(navView, {
          region: this.layout.navRegion
        });
      };

      Controller.prototype.panelsRegion = function(runner, regions) {
        return App.execute("list:test:panels", this.layout.panelsRegion, runner, regions);
      };

      Controller.prototype.getNavView = function(navs, config) {
        return new List.Navs({
          collection: navs,
          model: config
        });
      };

      Controller.prototype.getLayoutView = function() {
        return new List.Layout;
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("NavApp.List", function(List, App, Backbone, Marionette, $, _) {
    List.Layout = (function(_super) {
      __extends(Layout, _super);

      function Layout() {
        return Layout.__super__.constructor.apply(this, arguments);
      }

      Layout.prototype.template = "nav/list/layout";

      return Layout;

    })(App.Views.LayoutView);
    List.Nav = (function(_super) {
      __extends(Nav, _super);

      function Nav() {
        return Nav.__super__.constructor.apply(this, arguments);
      }

      Nav.prototype.template = "nav/list/_nav";

      Nav.prototype.className = "parent";

      Nav.prototype.modelEvents = {
        "change:chosen": "chosenChanged"
      };

      Nav.prototype.chosenChanged = function(model, value, options) {
        return this.$el.toggleClass("active", value);
      };

      return Nav;

    })(App.Views.ItemView);
    return List.Navs = (function(_super) {
      __extends(Navs, _super);

      function Navs() {
        return Navs.__super__.constructor.apply(this, arguments);
      }

      Navs.prototype.template = "nav/list/_navs";

      Navs.prototype.childView = List.Nav;

      Navs.prototype.childViewContainer = "ul";

      Navs.prototype.ui = {
        collapse: "#sidebar-collapse",
        angle: ".collapse-container i"
      };

      Navs.prototype.events = {
        "click @ui.collapse": "collapseClicked"
      };

      Navs.prototype.modelEvents = {
        "change:collapsed": "collapsedChanged"
      };

      Navs.prototype.onShow = function() {
        return this.collapsedChanged(this.model, this.model.get("collapsed"));
      };

      Navs.prototype.collapseClicked = function(e) {
        return this.model.toggleCollapse();
      };

      Navs.prototype.collapsedChanged = function(model, value, options) {
        var klass;
        $("#ecl-wrapper").toggleClass("collapsed", value);
        klass = value ? "fa fa-angle-right" : "fa fa-angle-left";
        return this.ui.angle.removeClass().addClass(klass);
      };

      return Navs;

    })(App.Views.CompositeView);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("OrganizeApp.List", function(List, App, Backbone, Marionette, $, _) {
    return List.Controller = (function(_super) {
      __extends(Controller, _super);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function() {
        var files;
        files = App.request("file:entities");
        this.layout = this.getLayoutView();
        this.listenTo(files, "sync", (function(_this) {
          return function() {
            return _this.filesRegion(files);
          };
        })(this));
        return this.show(this.layout, {
          loading: {
            entities: files
          }
        });
      };

      Controller.prototype.filesRegion = function(files) {
        var filesView;
        files.resetToTreeView();
        filesView = this.getFilesView(files);
        return this.show(filesView, {
          region: this.layout.filesRegion
        });
      };

      Controller.prototype.getLayoutView = function() {
        return new List.Layout;
      };

      Controller.prototype.getFilesView = function(files) {
        return new List.Files({
          collection: files
        });
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("OrganizeApp.List", function(List, App, Backbone, Marionette, $, _) {
    List.Layout = (function(_super) {
      __extends(Layout, _super);

      function Layout() {
        return Layout.__super__.constructor.apply(this, arguments);
      }

      Layout.prototype.template = "organize/list/list_layout";

      return Layout;

    })(App.Views.LayoutView);
    List.File = (function(_super) {
      __extends(File, _super);

      function File() {
        return File.__super__.constructor.apply(this, arguments);
      }

      File.prototype.childView = List.File;

      File.prototype.childViewContainer = "ul";

      File.prototype.getTemplate = function() {
        if (this.model.get("children").length) {
          return "organize/list/_folder";
        } else {
          return "organize/list/_file";
        }
      };

      File.prototype.initialize = function() {
        return this.collection = this.model.get("children");
      };

      File.prototype.onShow = function() {
        if (!this.model.hasChildren()) {
          return this.$el.addClass("file");
        }
      };

      return File;

    })(App.Views.CompositeView);
    return List.Files = (function(_super) {
      __extends(Files, _super);

      function Files() {
        return Files.__super__.constructor.apply(this, arguments);
      }

      Files.prototype.childView = List.File;

      Files.prototype.tagName = "ul";

      Files.prototype.className = "outer-files-container";

      return Files;

    })(App.Views.CollectionView);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestCommandsApp.List", function(List, App, Backbone, Marionette, $, _) {
    return List.Controller = (function(_super) {
      __extends(Controller, _super);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(options) {
        var commands, commandsView, runner;
        commands = options.commands, runner = options.runner;
        commandsView = this.getCommandsView(commands);
        this.listenTo(commandsView, "childview:pause:clicked", function(iv, args) {
          return console.warn(args);
        });
        this.listenTo(commandsView, "childview:revert:clicked", function(iv, args) {
          var command;
          command = args.model;
          command.choose();
          return runner.revertDom(command);
        });
        this.listenTo(commandsView, "childview:command:mouseenter", function(iv, args) {
          var command;
          command = args.model;
          if (command.isCloned() || !command.getEl()) {
            return;
          }
          return runner.highlightEl(command);
        });
        this.listenTo(commandsView, "childview:command:mouseleave", function(iv, args) {
          var command;
          command = args.model;
          if (command.isCloned() || !command.getEl()) {
            return;
          }
          return runner.highlightEl(command, false);
        });
        return this.show(commandsView);
      };

      Controller.prototype.getCommandsView = function(commands) {
        return new List.Commands({
          collection: commands
        });
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestCommandsApp.List", function(List, App, Backbone, Marionette, $, _) {
    List.Command = (function(_super) {
      __extends(Command, _super);

      function Command() {
        return Command.__super__.constructor.apply(this, arguments);
      }

      Command.prototype.getTemplate = function() {
        switch (this.model.get("type")) {
          case "xhr":
            return "test_commands/list/_xhr";
          case "dom":
            return "test_commands/list/_dom";
          case "assertion":
            return "test_commands/list/_assertion";
        }
      };

      Command.prototype.ui = {
        wrapper: ".command-wrapper",
        method: ".command-method",
        response: ".command-response",
        pause: ".fa-pause",
        revert: ".fa-search"
      };

      Command.prototype.modelEvents = {
        "change:response": "render",
        "change:chosen": "chosenChanged"
      };

      Command.prototype.triggers = {
        "click @ui.pause": "pause:clicked",
        "click @ui.revert": "revert:clicked",
        "mouseenter": "command:mouseenter",
        "mouseleave": "command:mouseleave"
      };

      Command.prototype.events = {
        "click": "clicked",
        "click @ui.response": "responseClicked"
      };

      Command.prototype.onShow = function() {
        this.$el.addClass("command-type-" + (this.model.get("type")));
        switch (this.model.get("type")) {
          case "dom":
            if (!this.model.isParent()) {
              this.$el.addClass("command-type-dom-action");
            }
            break;
          case "assertion":
            if (!this.model.get("passed")) {
              this.$el.addClass("command-type-assertion-failed");
            }
        }
        this.ui.method.css("padding-left", this.model.get("indent"));
        if (this.model.hasParent()) {
          this.ui.wrapper.addClass("command-child");
        } else {
          this.$el.addClass("command-parent");
        }
        if (this.model.isCloned()) {
          return this.$el.addClass("command-cloned");
        }
      };

      Command.prototype.clicked = function(e) {
        e.stopPropagation();
        return _.each(this.model.getPrimaryObjects(), function(obj, index) {
          obj = _.isArray(obj) ? obj : [obj];
          return console.log.apply(console, obj);
        });
      };

      Command.prototype.responseClicked = function(e) {
        var response;
        e.stopPropagation();
        response = this.model.xhr.responseText;
        try {
          response = JSON.parse(response);
        } catch (_error) {}
        console.log("Status:     ", this.model.xhr.status);
        console.log("URL:        ", this.model.xhr.url);
        console.log("Matched URL:", this.model.response.url);
        console.log("Request:    ", this.model.xhr);
        return console.log("Response:   ", response);
      };

      Command.prototype.chosenChanged = function(model, value, options) {
        return this.$el.toggleClass("active", value);
      };

      return Command;

    })(App.Views.ItemView);
    return List.Commands = (function(_super) {
      __extends(Commands, _super);

      function Commands() {
        return Commands.__super__.constructor.apply(this, arguments);
      }

      Commands.prototype.tagName = "ul";

      Commands.prototype.className = "commands-container";

      Commands.prototype.childView = List.Command;

      return Commands;

    })(App.Views.CollectionView);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestIframeApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    return Show.Controller = (function(_super) {
      __extends(Controller, _super);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(options) {
        var runner, view;
        runner = options.runner;
        view = this.getView();
        this.listenTo(runner, "load:iframe", function(iframe) {
          return this.loadIframe(view, runner, iframe);
        });
        this.listenTo(runner, "revert:dom", function(dom, options) {
          return view.revertToDom(dom, options);
        });
        this.listenTo(runner, "highlight:el", function(el, options) {
          return view.highlightEl(el, options);
        });
        return this.show(view);
      };

      Controller.prototype.loadIframe = function(view, runner, iframe) {
        return view.loadIframe(iframe, function(contentWindow) {
          return runner.runIframeSuite(iframe, contentWindow);
        });
      };

      Controller.prototype.getView = function() {
        return new Show.Iframe;
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestIframeApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    return Show.Iframe = (function(_super) {
      __extends(Iframe, _super);

      function Iframe() {
        return Iframe.__super__.constructor.apply(this, arguments);
      }

      Iframe.prototype.template = "test_iframe/show/iframe";

      Iframe.prototype.ui = {
        expand: ".fa-expand",
        compress: ".fa-compress",
        message: "#iframe-message"
      };

      Iframe.prototype.events = {
        "click @ui.expand": "expandClicked",
        "click @ui.compress": "compressClicked"
      };

      Iframe.prototype.revertToDom = function(dom, options) {
        dom.replaceAll(this.$el.find("iframe").contents().find("body"));
        this.addRevertMessage(options);
        if (options.el) {
          return this.highlightEl(options.el, {
            id: options.id,
            attr: options.attr,
            dom: dom
          });
        }
      };

      Iframe.prototype.addRevertMessage = function(options) {
        this.reverted = true;
        return this.ui.message.text("DOM has been reverted").show();
      };

      Iframe.prototype.getZIndex = function(el) {
        if (/^(auto|0)$/.test(el.css("zIndex"))) {
          return 1000;
        } else {
          return Number(el.css("zIndex"));
        }
      };

      Iframe.prototype.highlightEl = function(el, options) {
        var dom;
        if (options == null) {
          options = {};
        }
        _.defaults(options, {
          init: true
        });
        if (!this.reverted) {
          this.iframe.contents().find("[data-highlight-el]").remove();
        }
        if (!options.init) {
          return;
        }
        if (options.dom) {
          dom = options.dom;
          el = options.dom.find("[" + options.attr + "]");
        } else {
          dom = this.iframe.contents().find("body");
        }
        return el.each((function(_this) {
          return function(index, el) {
            var dimensions;
            el = $(el);
            dimensions = _this.getDimensions(el);
            if (!_this.elExistsInDocument(dom, el) || dimensions.width === 0 || dimensions.height === 0) {
              return;
            }
            return _.defer(function() {
              return $("<div>").attr("data-highlight-el", options.id).css({
                width: dimensions.width - 6,
                height: dimensions.height - 6,
                top: dimensions.offset.top,
                left: dimensions.offset.left,
                position: "absolute",
                zIndex: _this.getZIndex(el),
                border: "3px solid #E94B3B",
                opacity: 0.8
              }).appendTo(dom);
            });
          };
        })(this));
      };

      Iframe.prototype.elExistsInDocument = function(parent, el) {
        return $.contains(parent[0], el[0]);
      };

      Iframe.prototype.getDimensions = function(el) {
        return {
          offset: el.offset(),
          width: el.outerWidth(false),
          height: el.outerHeight(false)
        };
      };

      Iframe.prototype.onShow = function() {
        return this.ui.compress.hide();
      };

      Iframe.prototype.onDestroy = function() {
        var _ref;
        if ((_ref = this.iframe) != null) {
          _ref.remove();
        }
        delete this.iframe;
        return delete this.fn;
      };

      Iframe.prototype.loadIframe = function(src, fn) {
        var view, _ref;
        this.reverted = false;
        this.ui.message.hide().empty();
        if ((_ref = this.iframe) != null) {
          _ref.remove();
        }
        this.$el.hide();
        view = this;
        this.src = "/iframes/" + src;
        this.fn = fn;
        this.iframe = $("<iframe />", {
          src: this.src,
          "class": "iframe-spec",
          load: function() {
            fn(this.contentWindow);
            return view.$el.show();
          }
        });
        return this.iframe.appendTo(this.$el);
      };

      Iframe.prototype.expandClicked = function(e) {
        this.ui.expand.hide();
        this.ui.compress.show();
        this.$el.find("iframe").hide();
        return this.externalWindow = window.open(this.src, "testIframeWindow", "titlebar=no,menubar=no,toolbar=no,location=no,personalbar=no,status=no");
      };

      Iframe.prototype.compressClicked = function(e) {
        var _base;
        this.ui.compress.hide();
        this.ui.expand.show();
        this.$el.find("iframe").show();
        return typeof (_base = this.externalWindow).close === "function" ? _base.close() : void 0;
      };

      return Iframe;

    })(App.Views.ItemView);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestPanelsApp.DOM", function(DOM, App, Backbone, Marionette, $, _) {
    return DOM.Controller = (function(_super) {
      __extends(Controller, _super);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(options) {
        var doms, panel, runner;
        return;
        panel = options.panel, runner = options.runner;
        doms = runner.getEntitiesByEvent("dom");
        this.layout = this.getLayoutView(panel);
        this.listenTo(this.layout, "show", function() {
          return this.domContentRegion(doms, runner);
        });
        return this.show(this.layout);
      };

      Controller.prototype.domContentRegion = function(doms, runner) {
        var domView;
        domView = this.getDomsView(doms);
        this.listenTo(domView, "childview:revert:clicked", function(iv, args) {
          return runner.revertDom(args.model);
        });
        return this.show(domView, {
          region: this.layout.domContentRegion
        });
      };

      Controller.prototype.getDomsView = function(doms) {
        return new DOM.Doms({
          collection: doms
        });
      };

      Controller.prototype.getLayoutView = function(panel) {
        return new DOM.Layout({
          model: panel
        });
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestPanelsApp.DOM", function(DOM, App, Backbone, Marionette, $, _) {
    DOM.Layout = (function(_super) {
      __extends(Layout, _super);

      function Layout() {
        return Layout.__super__.constructor.apply(this, arguments);
      }

      Layout.prototype.template = "test_panels/dom/layout";

      return Layout;

    })(App.Views.LayoutView);
    DOM.Dom = (function(_super) {
      __extends(Dom, _super);

      function Dom() {
        return Dom.__super__.constructor.apply(this, arguments);
      }

      Dom.prototype.template = "test_panels/dom/_dom";

      Dom.prototype.ui = {
        meta: ".meta-container",
        icon: ".content-icon i",
        selector: ".content-selector-container",
        close: ".fa-times",
        revert: "[data-js='revert']",
        play: "[data-js='play']"
      };

      Dom.prototype.events = {
        "click @ui.meta": "metaClicked",
        "click @ui.selector": "selectorClicked",
        "click @ui.close": "closeClicked"
      };

      Dom.prototype.triggers = {
        "click @ui.revert": "revert:clicked",
        "click @ui.play": "play:clicked"
      };

      Dom.prototype.modelEvents = {
        "change:chosen": "render"
      };

      Dom.prototype.onShow = function() {
        if (this.model.get("error")) {
          return this.$el.addClass("error");
        }
      };

      Dom.prototype.onRender = function() {
        var klass;
        klass = this.model.isChosen() ? "down" : "right";
        return this.ui.icon.removeClass().addClass("fa fa-caret-" + klass);
      };

      Dom.prototype.selectorClicked = function(e) {
        e.stopPropagation();
        return console.info("DOM: ", this.model.el);
      };

      Dom.prototype.metaClicked = function(e) {
        return this.model.toggleChoose();
      };

      Dom.prototype.closeClicked = function(e) {
        return this.model.unchoose();
      };

      return Dom;

    })(App.Views.ItemView);
    return DOM.Doms = (function(_super) {
      __extends(Doms, _super);

      function Doms() {
        return Doms.__super__.constructor.apply(this, arguments);
      }

      Doms.prototype.tagName = "ul";

      Doms.prototype.childView = DOM.Dom;

      return Doms;

    })(App.Views.CollectionView);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestPanelsApp.List", function(List, App, Backbone, Marionette, $, _) {
    return List.Controller = (function(_super) {
      __extends(Controller, _super);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(options) {
        var config, panels, panelsView, regions, runner;
        runner = options.runner, regions = options.regions;
        config = App.request("app:config:entity");
        panels = App.request("panel:entities");
        this.listenTo(panels, "change:chosen", function(model, value, options) {
          this.panelRegion(model, value, regions, runner);
          return config.togglePanel(model, value);
        });
        panels.setInitialStateByConfig(config.get("panels"));
        panelsView = this.getPanelsView(panels);
        return this.show(panelsView);
      };

      Controller.prototype.panelRegion = function(panel, show, regions, runner) {
        var region;
        region = this.getRegion(panel.get("name"), regions);
        if (show) {
          return App.execute("show:panel", panel, region, runner);
        } else {
          return region.empty();
        }
      };

      Controller.prototype.getRegion = function(name, regions) {
        return regions[name.toLowerCase() + "Region"] || (function() {
          throw new Error("Did not find a valid region for: " + name);
        })();
      };

      Controller.prototype.getPanelsView = function(panels) {
        return new List.Panels({
          collection: panels
        });
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestPanelsApp.List", function(List, App, Backbone, Marionette, $, _) {
    List.Panel = (function(_super) {
      __extends(Panel, _super);

      function Panel() {
        return Panel.__super__.constructor.apply(this, arguments);
      }

      Panel.prototype.template = "test_panels/list/_panel";

      Panel.prototype.events = {
        "click": "clicked"
      };

      Panel.prototype.modelEvents = {
        "change:chosen": "chosenChanged"
      };

      Panel.prototype.onBeforeRender = function() {
        return this.chosenChanged(this.model, this.model.isChosen());
      };

      Panel.prototype.clicked = function(e) {
        e.preventDefault();
        return this.model.toggleChoose();
      };

      Panel.prototype.chosenChanged = function(model, value, options) {
        return this.$el.toggleClass("active", value);
      };

      return Panel;

    })(App.Views.ItemView);
    return List.Panels = (function(_super) {
      __extends(Panels, _super);

      function Panels() {
        return Panels.__super__.constructor.apply(this, arguments);
      }

      Panels.prototype.tagName = "ul";

      Panels.prototype.id = "ecl-test-panels";

      Panels.prototype.className = "ecl-vnavigation";

      Panels.prototype.childView = List.Panel;

      return Panels;

    })(App.Views.CollectionView);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestPanelsApp.LOG", function(LOG, App, Backbone, Marionette, $, _) {
    return LOG.Controller = (function(_super) {
      __extends(Controller, _super);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(options) {
        var panel, runner;
        panel = options.panel, runner = options.runner;
        this.layout = this.getLayoutView(panel);
        this.listenTo(this.layout, "show", function() {});
        return this.show(this.layout);
      };

      Controller.prototype.getLayoutView = function(panel) {
        return new LOG.Layout({
          model: panel
        });
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestPanelsApp.LOG", function(LOG, App, Backbone, Marionette, $, _) {
    return LOG.Layout = (function(_super) {
      __extends(Layout, _super);

      function Layout() {
        return Layout.__super__.constructor.apply(this, arguments);
      }

      Layout.prototype.template = "test_panels/log/layout";

      return Layout;

    })(App.Views.LayoutView);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestPanelsApp.XHR", function(XHR, App, Backbone, Marionette, $, _) {
    return XHR.Controller = (function(_super) {
      __extends(Controller, _super);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(options) {
        var panel, runner;
        panel = options.panel, runner = options.runner;
        this.layout = this.getLayoutView(panel);
        this.listenTo(this.layout, "show", function() {});
        return this.show(this.layout);
      };

      Controller.prototype.getLayoutView = function(panel) {
        return new XHR.Layout({
          model: panel
        });
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestPanelsApp.XHR", function(XHR, App, Backbone, Marionette, $, _) {
    return XHR.Layout = (function(_super) {
      __extends(Layout, _super);

      function Layout() {
        return Layout.__super__.constructor.apply(this, arguments);
      }

      Layout.prototype.template = "test_panels/xhr/layout";

      return Layout;

    })(App.Views.LayoutView);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestSpecsApp.List", function(List, App, Backbone, Marionette, $, _) {
    return List.Controller = (function(_super) {
      __extends(Controller, _super);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(options) {
        var commands, container, root, runnablesView, runner;
        runner = options.runner;
        container = App.request("runnable:container:entity");
        root = App.request("new:root:runnable:entity");
        commands = runner.getCommands();
        this.listenTo(commands, "add", function(command, commands, options) {
          var model;
          model = container.get(command.get("testId"));
          if (model) {
            return model.addCommand(command, options);
          }
        });
        this.addRunnable = _.partial(this.addRunnable, root, container);
        this.createRunnableListeners = _.partial(this.createRunnableListeners, runner, container);
        this.insertChildViews = _.partial(this.insertChildViews, runner);
        this.listenTo(runner, "before:run", function() {
          return container.reset();
        });
        this.listenTo(runner, "after:run", function() {
          return container.removeOldModels();
        });
        this.listenTo(runner, "suite:add", function(suite) {
          return this.addRunnable(suite, "suite");
        });
        this.listenTo(runner, "suite:stop", function(suite) {
          if (suite.root || suite.stopped) {
            return;
          }
          return container.get(suite.cid).updateState();
        });
        this.listenTo(runner, "test:add", function(test) {
          return this.addRunnable(test, "test");
        });
        this.listenTo(runner, "test:end", function(test) {
          var runnable;
          if (test.stopped) {
            return;
          }
          runnable = container.get(test.cid);
          runnable.setResults(test);
          return runner.logResults(runnable);
        });
        this.listenTo(runner, "load:iframe", function(iframe, options) {
          if (runner.hasChosen()) {
            return container.each((function(_this) {
              return function(model) {
                if (model.isChosen()) {
                  return model.reset();
                }
              };
            })(this));
          } else {
            return root.reset();
          }
        });
        runnablesView = this.getRunnablesView(root);
        return this.show(runnablesView);
      };

      Controller.prototype.addRunnable = function(root, container, runnable, type) {
        if (runnable.root || runnable.stopped) {
          return;
        }
        runnable = container.add(runnable, type, root);
        this.createRunnableListeners(runnable);
        return this.insertChildViews(runnable);
      };

      Controller.prototype.insertChildViews = function(runner, model) {
        return model.trigger("get:layout:view", (function(_this) {
          return function(layout) {
            var contentView, region, runnablesView;
            contentView = _this.getRunnableContentView(model);
            _this.show(contentView, {
              region: layout.contentRegion
            });
            if (model.is("test")) {
              return App.execute("list:test:commands", model.get("commands"), runner, layout.commandsRegion);
            } else {
              region = layout.runnablesRegion;
              if (region.hasView()) {
                return;
              }
              runnablesView = _this.getRunnablesView(model);
              return _this.show(runnablesView, {
                region: region
              });
            }
          };
        })(this));
      };

      Controller.prototype.createRunnableListeners = function(runner, container, model) {
        this.stopListening(model);
        return this.listenTo(model, "model:double:clicked", function() {
          container.each(function(runnable) {
            runnable.collapse();
            return runnable.unchoose();
          });
          model.choose();
          return runner.setChosen(model);
        });
      };

      Controller.prototype.getRunnableContentView = function(runnable) {
        return new List.RunnableContent({
          model: runnable
        });
      };

      Controller.prototype.getRunnablesView = function(runnable) {
        return new List.Runnables({
          model: runnable
        });
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestSpecsApp.List", function(List, App, Backbone, Marionette, $, _) {
    List.RunnableContent = (function(_super) {
      __extends(RunnableContent, _super);

      function RunnableContent() {
        return RunnableContent.__super__.constructor.apply(this, arguments);
      }

      RunnableContent.prototype.getTemplate = function() {
        switch (this.model.get("type")) {
          case "test":
            return "test_specs/list/_test";
          case "suite":
            return "test_specs/list/_suite";
        }
      };

      RunnableContent.prototype.ui = {
        label: "label",
        icon: ".suite-state i",
        ellipsis: ".suite-title i",
        repeat: ".fa-repeat"
      };

      RunnableContent.prototype.events = {
        "click @ui.repeat": "repeatClicked"
      };

      RunnableContent.prototype.modelEvents = {
        "change:open": "openChanged",
        "change:state": "stateChanged"
      };

      RunnableContent.prototype.openChanged = function(model, value, options) {
        if (this.model.is("suite")) {
          this.changeIconDirection(value);
          return this.displayEllipsis(value);
        }
      };

      RunnableContent.prototype.changeIconDirection = function(bool) {
        var klass;
        klass = bool ? "right" : "down";
        return this.ui.icon.removeClass().addClass("fa fa-caret-" + klass);
      };

      RunnableContent.prototype.displayEllipsis = function(bool) {
        return this.ui.ellipsis.toggleClass("hidden", !bool);
      };

      RunnableContent.prototype.repeatClicked = function(e) {
        e.stopPropagation();
        return this.model.trigger("model:double:clicked");
      };

      RunnableContent.prototype.stateChanged = function(model, value, options) {
        if (this.model.get("type") === "test") {
          if (value === "passed") {
            this.checkDuration();
          }
          if (value === "failed") {
            return this.checkTimeout();
          }
        }
      };

      RunnableContent.prototype.checkDuration = function() {
        if (!this.model.isSlow()) {
          return;
        }
        return this.ui.label.addClass("label-warning").text(this.model.get("duration") + "ms");
      };

      RunnableContent.prototype.checkTimeout = function() {
        if (!this.model.timedOut()) {
          return;
        }
        return this.ui.label.addClass("label-danger").text("Timed Out");
      };

      return RunnableContent;

    })(App.Views.ItemView);
    List.RunnableLayout = (function(_super) {
      __extends(RunnableLayout, _super);

      function RunnableLayout() {
        return RunnableLayout.__super__.constructor.apply(this, arguments);
      }

      RunnableLayout.prototype.getTemplate = function() {
        switch (this.model.get("type")) {
          case "test":
            return "test_specs/list/_test_layout";
          case "suite":
            return "test_specs/list/_suite_layout";
          default:
            throw new Error("Model type: " + (this.model.get('type')) + " does not match 'test' or 'suite'");
        }
      };

      RunnableLayout.prototype.attributes = function() {
        return {
          "class": this.model.get("type") + " runnable"
        };
      };

      RunnableLayout.prototype.regions = {
        contentRegion: ".runnable-content-region",
        commandsRegion: ".runnable-commands-region",
        runnablesRegion: ".runnables-region"
      };

      RunnableLayout.prototype.ui = {
        wrapper: ".runnable-wrapper",
        runnables: ".runnables-region",
        commands: ".runnable-commands-region",
        pre: "pre"
      };

      RunnableLayout.prototype.events = {
        "mouseover": "mouseover",
        "mouseout": "mouseout",
        "click": "clicked",
        "click @ui.pre": "preClicked",
        "mouseover .commands-container": "commandsMouseover"
      };

      RunnableLayout.prototype.modelEvents = {
        "get:layout:view": "getLayoutView",
        "change:title": "render",
        "change:state": "stateChanged",
        "change:chosen": "chosenChanged",
        "change:open": "openChanged",
        "change:error": "errorChanged"
      };

      RunnableLayout.prototype.onBeforeRender = function() {
        return this.$el.addClass(this.model.get("state"));
      };

      RunnableLayout.prototype.onRender = function() {
        return this.applyIndent();
      };

      RunnableLayout.prototype.mouseover = function(e) {
        e.stopPropagation();
        return this.$el.addClass("hover");
      };

      RunnableLayout.prototype.mouseout = function(e) {
        e.stopPropagation();
        return this.$el.removeClass("hover");
      };

      RunnableLayout.prototype.commandsMouseover = function(e) {
        e.stopPropagation();
        return this.$el.removeClass("hover");
      };

      RunnableLayout.prototype.dblClicked = function(e) {
        e.stopPropagation();
        return this.model.trigger("model:double:clicked");
      };

      RunnableLayout.prototype.clicked = function(e) {
        e.stopPropagation();
        return this.model.toggleOpen();
      };

      RunnableLayout.prototype.applyIndent = function(state) {
        var indent;
        indent = this.model.get("indent");
        if (state === "failed") {
          indent -= 1;
        }
        return this.ui.wrapper.css("padding-left", indent);
      };

      RunnableLayout.prototype.getLayoutView = function(fn) {
        return fn(this);
      };

      RunnableLayout.prototype.chosenChanged = function(model, value, options) {
        return this.$el.toggleClass("active", value);
      };

      RunnableLayout.prototype.stateChanged = function(model, value, options) {
        this.$el.removeClass("processing pending failed passed").addClass(value);
        return this.applyIndent(value);
      };

      RunnableLayout.prototype.openChanged = function(model, value, options) {
        var el;
        el = this.model.is("test") ? this.ui.commands : this.ui.runnables;
        return el.toggleClass("hidden");
      };

      RunnableLayout.prototype.errorChanged = function(model, value, options) {
        value || (value = "");
        return this.ui.pre.text(value);
      };

      RunnableLayout.prototype.preClicked = function(e) {
        if (!this.model.originalError) {
          return;
        }
        return console.error(this.model.originalError.stack);
      };

      return RunnableLayout;

    })(App.Views.LayoutView);
    return List.Runnables = (function(_super) {
      __extends(Runnables, _super);

      function Runnables() {
        return Runnables.__super__.constructor.apply(this, arguments);
      }

      Runnables.prototype.tagName = "ul";

      Runnables.prototype.className = "runnables";

      Runnables.prototype.childView = List.RunnableLayout;

      Runnables.prototype.onBeforeRender = function() {
        if (this.model.get("root")) {
          return this.$el.prop("id", "specs-list");
        }
      };

      Runnables.prototype.initialize = function() {
        return this.collection = this.model.get("children");
      };

      Runnables.prototype.resortView = function() {
        return this.collection.each((function(_this) {
          return function(model, index) {
            var view;
            view = _this.children.findByModel(model);
            if (view._index !== index) {
              return _this.moveViewToIndex(view, index);
            }
          };
        })(this));
      };

      Runnables.prototype.moveViewToIndex = function(view, index) {
        var sibling;
        view._index = index;
        sibling = view.$el.siblings().eq(index);
        return view.$el.insertBefore(sibling);
      };

      return Runnables;

    })(App.Views.CollectionView);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestStatsApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    return Show.Controller = (function(_super) {
      __extends(Controller, _super);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(options) {
        var runner, stats;
        runner = options.runner;
        stats = this.stats = App.request("stats:entity");
        this.listenTo(runner, "suite:start", function() {
          return stats.startCounting();
        });
        this.listenTo(runner, "suite:stop", function() {
          return stats.stopCounting();
        });
        this.listenTo(runner, "test:results:ready", function(test) {
          return stats.countTestState(test);
        });
        this.listenTo(runner, "change:chosen", function(model, value, options) {
          return this.chosenRegion(runner, value);
        });
        this.listenTo(runner, "load:iframe", function() {
          return stats.reset();
        });
        this.layout = this.getLayoutView();
        this.listenTo(this.layout, "show", (function(_this) {
          return function() {
            return _this.statsRegion(stats);
          };
        })(this));
        return this.show(this.layout);
      };

      Controller.prototype.onDestroy = function() {
        this.stats.stopCounting();
        return delete this.stats;
      };

      Controller.prototype.statsRegion = function(stats) {
        var statsView;
        statsView = this.getStatsView(stats);
        return this.show(statsView, {
          region: this.layout.statsRegion
        });
      };

      Controller.prototype.chosenRegion = function(runner, chosen) {
        var chosenView;
        if (!chosen) {
          return this.layout.chosenRegion.empty();
        }
        chosenView = this.getChosenView(chosen);
        this.listenTo(chosenView, "close:clicked", function() {
          chosen.unchoose();
          return runner.setChosen();
        });
        return this.show(chosenView, {
          region: this.layout.chosenRegion
        });
      };

      Controller.prototype.getChosenView = function(chosen) {
        return new Show.Chosen({
          model: chosen
        });
      };

      Controller.prototype.getStatsView = function(stats) {
        return new Show.Stats({
          model: stats
        });
      };

      Controller.prototype.getLayoutView = function() {
        return new Show.Layout;
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestStatsApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    Show.Layout = (function(_super) {
      __extends(Layout, _super);

      function Layout() {
        return Layout.__super__.constructor.apply(this, arguments);
      }

      Layout.prototype.template = "test_stats/show/show_layout";

      return Layout;

    })(App.Views.LayoutView);
    Show.Stats = (function(_super) {
      __extends(Stats, _super);

      function Stats() {
        return Stats.__super__.constructor.apply(this, arguments);
      }

      Stats.prototype.template = "test_stats/show/_stats";

      Stats.prototype.ui = {
        passed: "#tests-passed .num",
        failed: "#tests-failed .num",
        pending: "#tests-pending .num",
        duration: "#tests-duration .num"
      };

      Stats.prototype.modelEvents = {
        "change:passed": "passedChanged",
        "change:failed": "failedChanged",
        "change:pending": "pendingChanged",
        "change:duration": "durationChanged"
      };

      Stats.prototype.passedChanged = function(model, value, options) {
        return this.ui.passed.text(this.count(value));
      };

      Stats.prototype.failedChanged = function(model, value, options) {
        return this.ui.failed.text(this.count(value));
      };

      Stats.prototype.pendingChanged = function(model, value, options) {
        return this.ui.pending.text(this.count(value));
      };

      Stats.prototype.durationChanged = function(model, value, options) {
        var duration;
        duration = this.model.getDurationFormatted();
        return this.ui.duration.text(this.count(duration));
      };

      Stats.prototype.count = function(num) {
        if (num > 0) {
          return num;
        } else {
          return "--";
        }
      };

      Stats.prototype.templateHelpers = function() {
        return {
          count: this.count
        };
      };

      return Stats;

    })(App.Views.ItemView);
    return Show.Chosen = (function(_super) {
      __extends(Chosen, _super);

      function Chosen() {
        return Chosen.__super__.constructor.apply(this, arguments);
      }

      Chosen.prototype.template = "test_stats/show/_chosen";

      Chosen.prototype.ui = {
        length: ".length",
        label: "label"
      };

      Chosen.prototype.triggers = {
        "click @ui.label": "close:clicked"
      };

      Chosen.prototype.initialize = function() {
        return this.listenTo(this.model.get("children"), "add remove reset", (function(_this) {
          return function() {
            return _this.ui.length.text(_this.model.get("children").length);
          };
        })(this));
      };

      return Chosen;

    })(App.Views.ItemView);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestsApp.List", function(List, App, Backbone, Marionette, $, _) {
    return List.Controller = (function(_super) {
      __extends(Controller, _super);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function() {
        var view;
        view = this.getView();
        return this.show(view);
      };

      Controller.prototype.getView = function(navs) {
        return new List.Tests;
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestsApp.List", function(List, App, Backbone, Marionette, $, _) {
    return List.Tests = (function(_super) {
      __extends(Tests, _super);

      function Tests() {
        return Tests.__super__.constructor.apply(this, arguments);
      }

      Tests.prototype.template = "tests/list/tests";

      return Tests;

    })(App.Views.LayoutView);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestsApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    return Show.Controller = (function(_super) {
      __extends(Controller, _super);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(options) {
        var config, runner;
        config = App.request("app:config:entity");
        this.listenTo(config, "change:panels", function() {
          return this.layout.resizePanels();
        });
        this.onDestroy = _.partial(this.onDestroy, config);
        this.runner = runner = App.request("start:test:runner");
        this.layout = this.getLayoutView(config);
        this.listenTo(this.layout, "show", (function(_this) {
          return function() {
            _this.statsRegion(runner);
            _this.iframeRegion(runner);
            _this.specsRegion(runner);
            _this.panelsRegion(runner, config);
            return runner.start(options.id);
          };
        })(this));
        return this.show(this.layout);
      };

      Controller.prototype.statsRegion = function(runner) {
        return App.execute("show:test:stats", this.layout.statsRegion, runner);
      };

      Controller.prototype.iframeRegion = function(runner) {
        return App.execute("show:test:iframe", this.layout.iframeRegion, runner);
      };

      Controller.prototype.specsRegion = function(runner) {
        return App.execute("list:test:specs", this.layout.specsRegion, runner);
      };

      Controller.prototype.panelsRegion = function(runner, config) {
        return config.trigger("list:test:panels", runner, {
          domRegion: this.layout.domRegion,
          xhrRegion: this.layout.xhrRegion,
          logRegion: this.layout.logRegion
        });
      };

      Controller.prototype.onDestroy = function(config) {
        config.trigger("close:test:panels");
        return App.request("stop:test:runner", this.runner);
      };

      Controller.prototype.getLayoutView = function(config) {
        return new Show.Layout({
          model: config
        });
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("TestsApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    return Show.Layout = (function(_super) {
      __extends(Layout, _super);

      function Layout() {
        return Layout.__super__.constructor.apply(this, arguments);
      }

      Layout.prototype.template = "tests/show/test";

      Layout.prototype.ui = {
        iframeWrapper: "#iframe-wrapper",
        panelWrapper: "#panel-wrapper"
      };

      Layout.prototype.modelEvents = {
        "change:panels": "panelsChanged"
      };

      Layout.prototype.onShow = function() {
        return this.panelsChanged();
      };

      Layout.prototype.panelsChanged = function() {
        var right;
        right = this.model.anyPanelOpen() ? this.model.get("panelWidth") : 0;
        return this.ui.iframeWrapper.css("right", right);
      };

      Layout.prototype.resizePanels = function() {
        var height;
        height = this.model.calculatePanelHeight();
        return this.ui.panelWrapper.children().each((function(_this) {
          return function(index, el) {
            var found, num;
            found = _this.regionManager.find(function(region) {
              return region.$el.is(el);
            });
            if (!found) {
              return;
            }
            num = found.$el.children().length ? height : 0;
            return found.$el.css("height", "" + num + "%");
          };
        })(this));
      };

      return Layout;

    })(App.Views.LayoutView);
  });

}).call(this);
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/nav/list/templates/_nav"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<a href="');
    
      __out.push(__sanitize(this.href));
    
      __out.push('">\n  <i class="');
    
      __out.push(__sanitize(this.icon));
    
      __out.push('"></i>\n  <span>');
    
      __out.push(__sanitize(this.name));
    
      __out.push('</span>\n</a>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/nav/list/templates/_navs"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="collapse-container">\n  <div class="pull-left logo">Eclectus</div>\n  <div class="pull-right">\n    <button class="btn btn-default" id="sidebar-collapse">\n      <i></i>\n    </button>\n  </div>\n</div>\n<ul class="ecl-vnavigation"></ul>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/nav/list/templates/layout"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div id="ecl-sidebar">\n  <div id="nav-region"></div>\n  <div id="panels-region"></div>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/organize/list/templates/_file"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<a href="#/tests/');
    
      __out.push(__sanitize(this.fullPath));
    
      __out.push('">');
    
      __out.push(__sanitize(this.name));
    
      __out.push('</a>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/organize/list/templates/_folder"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<h4>\n  ');
    
      __out.push(__sanitize(this.name));
    
      __out.push('\n</h4>\n<ul></ul>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/organize/list/templates/list_layout"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div id="organize-page">\n  <div class="ecl-main-content">\n    <h2>Test Files</h2>\n    <div id="files-region" class="block-panel"></div>\n  </div>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/test_commands/list/templates/_assertion"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="command-wrapper">\n  <span class="command-method">');
    
      __out.push(__sanitize(this.method));
    
      __out.push('</span>\n  <span class="command-message">\n    ');
    
      __out.push(__sanitize(this.message));
    
      __out.push('\n  </span>\n  ');
    
      if (this.error) {
        __out.push('\n    <span class="command-error">');
        __out.push(__sanitize(this.error));
        __out.push('</span>\n  ');
      }
    
      __out.push('\n  ');
    
      if (this.shouldDisplayControls) {
        __out.push('\n    <span class="command-controls">\n      <i class="fa fa-pause"></i>\n      <i class="fa fa-search fa-flip-horizontal"></i>\n    </span>\n  ');
      }
    
      __out.push('\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/test_commands/list/templates/_dom"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="command-wrapper">\n  <span class="command-method">');
    
      __out.push(__sanitize(this.method));
    
      __out.push('</span>\n  ');
    
      if (this.sequence) {
        __out.push('\n    <span class="command-sequence">');
        __out.push(__sanitize(this.sequence));
        __out.push('</span>\n  ');
      } else if (this.selector) {
        __out.push('\n    <span class="command-selector">');
        __out.push(__sanitize(this.selector));
        __out.push('</span>\n  ');
      }
    
      __out.push('\n  ');
    
      if (this.error) {
        __out.push('\n    <span class="command-error">');
        __out.push(__sanitize(this.error));
        __out.push('</span>\n  ');
      }
    
      __out.push('\n  ');
    
      if (this.shouldDisplayControls) {
        __out.push('\n    <span class="command-controls">\n      <i class="fa fa-pause"></i>\n      <i class="fa fa-search fa-flip-horizontal"></i>\n    </span>\n  ');
      }
    
      __out.push('\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/test_commands/list/templates/_xhr"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="command-wrapper">\n  <span class="command-method">');
    
      __out.push(__sanitize(this.method));
    
      __out.push('</span>\n  ');
    
      if (this.response != null) {
        __out.push('\n    <span class="command-response">\n      <span class="command-status">');
        __out.push(__sanitize(this.status));
        __out.push('</span>\n      <span class="command-body">');
        __out.push(__sanitize(this.response));
        __out.push('</span>\n      ');
        if (this.truncated) {
          __out.push('\n        <i class="fa fa-ellipsis-h"></i>\n      ');
        }
        __out.push('\n    </span>\n  ');
      } else {
        __out.push('\n    <span class="command-request">');
        __out.push(__sanitize(this.url));
        __out.push('</span>\n  ');
      }
    
      __out.push('\n  ');
    
      if (this.error) {
        __out.push('\n    <span class="command-error">');
        __out.push(__sanitize(this.error));
        __out.push('</span>\n  ');
      }
    
      __out.push('\n  ');
    
      if (this.shouldDisplayControls) {
        __out.push('\n    <span class="command-controls">\n      <i class="fa fa-pause"></i>\n      <i class="fa fa-search fa-flip-horizontal"></i>\n    </span>\n  ');
      }
    
      __out.push('\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/test_iframe/show/templates/iframe"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<header>\n  <div id="url-container" class="pull-left">\n    <i class="fa fa-arrow-left"></i>\n    <i class="fa fa-arrow-right"></i>\n    <input class="url" />\n  </div>\n  <div class="pull-right">\n    <i class="fa fa-cog">\n      <span class="fa fa-caret-down"></span>\n    </i>\n    <i class="fa fa-compress"></i>\n    <i class="fa fa-expand"></i>\n  </div>\n</header>\n<div id="iframe-message"></div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/test_panels/dom/templates/_dom"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="meta-container">\n  <div class="content-icon">\n    <i class="fa"></i>\n  </div>\n  <div class="content-identifer">\n    <span class="content-parent">');
    
      __out.push(__sanitize(this.parent));
    
      __out.push('</span>\n    <span class="content-title">');
    
      __out.push(__sanitize(this.title));
    
      __out.push('</span>\n  </div>\n  <span class="content-msg">\n    <span class="content-selector-container">\n      <span class="content-method">');
    
      __out.push(__sanitize(this.method));
    
      __out.push('</span>\n      <span class="content-selector">');
    
      __out.push(__sanitize("" + this.selector));
    
      __out.push('</span>\n    </span>\n  </span>\n</div>\n');
    
      if (this.chosen) {
        __out.push('\n  <div class="details-wrapper">\n    <div class="details-container">\n      <i class="fa fa-times"></i>\n      <div class="actions-container">\n        <span class="icon-wrapper" data-js="revert">\n          <i class="fa fa-search"></i>\n        </span>\n        <span class="icon-wrapper" data-js="play">\n          <i class="fa fa-play"></i>\n        </span>\n      </div>\n      <dl class="dl-horizontal">\n        <dt>id</dt>\n        <dd>');
        __out.push(__sanitize(this.testId));
        __out.push('</dd>\n        ');
        if (this.parent) {
          __out.push('\n          <dt>parent</dt>\n          <dd>');
          __out.push(__sanitize(this.parent));
          __out.push('</dd>\n        ');
        }
        __out.push('\n        <dt>title</dt>\n        <dd>');
        __out.push(__sanitize(this.title));
        __out.push('</dd>\n        <dt>method</dt>\n        <dd>');
        __out.push(__sanitize(this.method));
        __out.push('</dd>\n        <dt>selector</dt>\n        <dd>');
        __out.push(__sanitize(this.selector));
        __out.push('</dd>\n        ');
        if (this.error) {
          __out.push('\n          <dt>error</dt>\n          <dd>');
          __out.push(__sanitize(this.error));
          __out.push('</dd>\n        ');
        }
        __out.push('\n      </dl>\n    </div>\n  </div>\n');
      }
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/test_panels/dom/templates/layout"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="panel-container">\n  <header>\n    <div class="panel-close">\n      <i class="fa fa-times"></i>\n    </div>\n    <i class="fa fa-circle" style="color: ');
    
      __out.push(__sanitize(this.color));
    
      __out.push('"></i>\n    ');
    
      __out.push(__sanitize(this.name));
    
      __out.push('\n    <div class="panel-controls">\n      <i class="fa fa-cog"></i>\n    </div>\n  </header>\n  <div class="panel-content">\n    <div id="dom-content-region"></div>\n  </div>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/test_panels/list/templates/_panel"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<a href="#">\n  <i class="fa fa-circle" style="color: ');
    
      __out.push(__sanitize(this.color));
    
      __out.push('"></i>\n  <span>');
    
      __out.push(__sanitize(this.name));
    
      __out.push('\n</a>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/test_panels/log/templates/layout"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="panel-container">\n  <header>\n    <div class="panel-close">\n      <i class="fa fa-times"></i>\n    </div>\n    <i class="fa fa-circle" style="color: ');
    
      __out.push(__sanitize(this.color));
    
      __out.push('"></i>\n    ');
    
      __out.push(__sanitize(this.name));
    
      __out.push('\n    <div class="panel-controls">\n      <i class="fa fa-cog"></i>\n    </div>\n  </header>\n  <div class="panel-content">\n    <div id="log-content-region"></div>\n  </div>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/test_panels/xhr/templates/layout"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="panel-container">\n  <header>\n    <div class="panel-close">\n      <i class="fa fa-times"></i>\n    </div>\n    <i class="fa fa-circle" style="color: ');
    
      __out.push(__sanitize(this.color));
    
      __out.push('"></i>\n    ');
    
      __out.push(__sanitize(this.name));
    
      __out.push('\n    <div class="panel-controls">\n      <i class="fa fa-cog"></i>\n    </div>\n  </header>\n  <div class="panel-content">\n    <div id="xhr-content-region"></div>\n  </div>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/test_specs/list/templates/_suite"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="runnable-state">\n  <span class="suite-state">\n    <i class="fa fa-caret-down"></i>\n  </span>\n  <span class="suite-title">\n    ');
    
      __out.push(__sanitize(this.title));
    
      __out.push('\n    <i class="fa fa-ellipsis-h hidden"></i>\n  </span>\n</div>\n<div class="runnable-controls">\n  <i class="fa fa-repeat"></i>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/test_specs/list/templates/_suite_layout"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="runnable-wrapper">\n  <div class="runnable-content-region"></div>\n</div>\n<div class="runnables-region"></div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/test_specs/list/templates/_test"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="runnable-state">\n  <span class="test-state">\n    <i class="fa"></i>\n  </span>\n  <span class="test-title">\n    ');
    
      __out.push(__sanitize(this.title));
    
      __out.push('\n    <label class="label"></label>\n  </span>\n</div>\n<div class="runnable-controls">\n  <i class="fa fa-repeat"></i>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/test_specs/list/templates/_test_layout"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="runnable-wrapper">\n  <div class="runnable-content-region"></div>\n  <div class="runnable-commands-region hidden"></div>\n  <pre class="test-error"></pre>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/test_stats/show/templates/_chosen"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div id="chosen-runnable">\n  <span class="uppercase">Running</span>\n  <label class="label label-primary">\n    <span class="length">');
    
      __out.push(__sanitize(this.children.length || 1));
    
      __out.push('</span> Tests\n    | <i class="fa fa-times"></i>\n  </label>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/test_stats/show/templates/_stats"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<ul id="stats-container">\n  <li id="tests-passed">\n    <i class="fa fa-check"></i>\n    <span class="num">');
    
      __out.push(__sanitize(this.count(this.passed)));
    
      __out.push('</span>\n    <span>Passed</span>\n  </li>\n  <li id="tests-failed">\n    <i class="fa fa-times"></i>\n    <span class="num">');
    
      __out.push(__sanitize(this.count(this.failed)));
    
      __out.push('</span>\n    <span>Failed</span>\n  </li>\n  <li id="tests-pending">\n    <i class="fa fa-circle-o-notch"></i>\n    <span class="num">');
    
      __out.push(__sanitize(this.count(this.pending)));
    
      __out.push('</span>\n    <span>Pending</span>\n  </li>\n  <li id="tests-duration">\n    <span>Runtime:</span>\n    <span class="num">');
    
      __out.push(__sanitize(this.count(this.duration)));
    
      __out.push('</span>\n    <span>secs</span>\n  </li>\n</ul>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/test_stats/show/templates/show_layout"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div id="stats-region"></div>\n<div id="chosen-region"></div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/tests/show/templates/test"] = function (__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div id="test-container">\n  <div id="test-specs">\n    <div id="header-container">\n      <div id="stats-region"></div>\n    </div>\n    <div id="specs-container">\n      <div id="specs-region"></div>\n    </div>\n  </div>\n</div>\n<!-- <div class="ecl-main-content">\n  <div id="test-page">\n    <div id="specs-region"></div>\n  </div>\n</div> -->\n<div id="iframe-wrapper">\n  <div id="iframe-container">\n    <div id="iframe-region"></div>\n  </div>\n</div>\n<ul id="panel-wrapper">\n  <li id="dom-region"></li>\n  <li id="xhr-region"></li>\n  <li id="log-region"></li>\n</ul>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
