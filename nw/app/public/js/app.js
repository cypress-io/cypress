(function() {
  (function($, _) {
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
  this.App = (function(Backbone, Marionette) {
    var App;
    App = new Marionette.Application;
    global.App = App;
    App.addRegions({
      mainRegion: "#main-region",
      footerRegion: "#footer-region"
    });
    App.reqres.setHandler("default:region", function() {
      return App.mainRegion;
    });
    App.on("start", function(options) {
      var manifest;
      if (options == null) {
        options = {};
      }
      options = options.backend.parseArgs(options);
      App.config = App.request("config:entity", options);
      App.config.log("Starting Desktop App", {
        options: _.omit(options, "backend")
      });
      App.updater = App.request("new:updater:entity");
      App.vent.trigger("app:entities:ready", App);
      if (options.smokeTest) {
        process.stdout.write(options.pong + "\n");
        return process.exit();
      }
      if (options.returnPkg) {
        manifest = JSON.stringify(App.config.getManifest());
        process.stdout.write(manifest + "\n");
        return process.exit();
      }
      if (options.updating) {
        App.execute("gui:display", options.coords);
        return App.execute("start:updates:applied:app", options.appPath, options.execPath);
      }
      return App.config.getUser().then(function(user) {
        App.execute("set:current:user", user);
        options.session = (user != null ? user.session_token : void 0) != null;
        return App.config.cli(options);
      });
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
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    return Entities.Collection = (function(superClass) {
      extend(Collection, superClass);

      function Collection() {
        return Collection.__super__.constructor.apply(this, arguments);
      }

      return Collection;

    })(Backbone.Collection);
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    Entities.Model = (function(superClass) {
      extend(Model, superClass);

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
  this.App.module("Utilities", function(Utilities, App, Backbone, Marionette, $, _) {
    var API, GITHUB_OAUTH, GITHUB_PARAMS, Request;
    Request = require("request-promise");
    GITHUB_OAUTH = "https://github.com/login/oauth/authorize";
    GITHUB_PARAMS = {
      client_id: "71bdc3730cd85d30955a",
      scope: "user:email"
    };
    App.execute("gui:whitelist", "https://github.com/");
    API = {
      createUrl: function() {
        var url;
        url = _.reduce(GITHUB_PARAMS, function(memo, value, key) {
          memo.addQueryParam(key, value);
          return memo;
        }, new Uri(GITHUB_OAUTH));
        return url.toString();
      },
      loginRequest: function() {
        return App.request("gui:open", this.createUrl(), {
          position: "center",
          focus: true,
          width: 900,
          height: 500,
          title: "Login"
        });
      },
      loggingIn: function(url) {
        var code;
        App.currentUser.loggingIn();
        App.execute("gui:focus");
        code = new Uri(url).getQueryParamValue("code");
        return App.config.logIn(code).then(function(user) {
          App.currentUser.loggedIn(user);
          return App.vent.trigger("start:projects:app");
        })["catch"](function(err) {
          return App.currentUser.setLoginError(err);
        });
      },
      clearCookies: function(cb) {
        var win;
        win = App.request("gui:get");
        return win.cookies.getAll({
          domain: "github.com"
        }, (function(_this) {
          return function(cookies) {
            var count, length;
            count = 0;
            length = cookies.length;
            _.each(cookies, function(cookie) {
              var obj, prefix;
              prefix = cookie.secure ? "https://" : "http://";
              if (cookie.domain[0] === ".") {
                prefix += "www";
              }
              obj = {
                name: cookie.name
              };
              obj.url = prefix + cookie.domain + cookie.path;
              return win.cookies.remove(obj);
            });
            return cb();
          };
        })(this));
      },
      logOut: function(user) {
        return App.config.logOut(user).bind(this).then(function() {
          return this.clearCookies(function() {
            return App.vent.trigger("start:login:app");
          });
        });
      }
    };
    App.commands.setHandler("login:request", function() {
      return API.loginRequest();
    });
    App.vent.on("logging:in", function(url) {
      return API.loggingIn(url);
    });
    App.reqres.setHandler("current:user", function() {
      return App.currentUser || (function() {
        throw new Error("No current user set on App!");
      })();
    });
    App.commands.setHandler("set:current:user", function(attrs) {
      if (attrs == null) {
        attrs = {};
      }
      return App.currentUser = App.request("new:user:entity", attrs);
    });
    return App.vent.on("log:out", function(user) {
      return API.logOut(user);
    });
  });

}).call(this);
; 
(function() {
  this.App.module("Utilities", function(Utilities, App, Backbone, Marionette, $, _) {
    var API, windows;
    windows = {};
    API = {
      startChromium: function(src, options) {
        var chromium, win;
        if (options == null) {
          options = {};
        }
        if (win = windows.chromium) {
          win.close(true);
        }
        if (!src) {
          throw new Error("Missing src for tests to run. Cannot start Chromium.");
        }
        _.defaults(options, {
          headless: false,
          onReady: function() {}
        });
        chromium = App.request("gui:open", src, {
          show: !options.headless,
          frame: !options.headless,
          position: "center",
          width: 1280,
          height: 720,
          title: "Running Tests"
        });
        chromium.once("document-end", function() {
          return options.onReady(chromium);
        });
        return windows.chromium = chromium;
      }
    };
    return App.commands.setHandler("start:chromium:run", function(src, options) {
      return API.startChromium(src, options);
    });
  });

}).call(this);
; 
(function() {
  this.App.module("Utilities", function(Utilities, App, Backbone, Marionette, $, _) {
    return App.silenceConsole = function() {
      var c;
      c = console;
      return _.each(["log", "warn", "info", "error"], function(fn) {
        return c[fn] = function() {};
      });
    };
  });

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
    var API, gui, windows;
    gui = require('nw.gui');
    process.argv = process.argv.concat(gui.App.argv);
    windows = {};
    API = {
      show: function(win) {
        if (App.config.get("debug")) {
          if (!win.isDevToolsOpen()) {
            win.showDevTools();
          }
          win.setAlwaysOnTop();
        }
        win.isShown = true;
        return win.show();
      },
      displayGui: function(coords) {
        var nativeMenuBar, win;
        win = gui.Window.get();
        if (coords && coords.x && coords.y) {
          win.moveTo(coords.x, coords.y);
          this.show(win);
        }
        if (!App.config.env("production")) {
          gui.App.clearCache();
          this.show(win);
          this.focus(win);
        }
        if (process.platform === "darwin") {
          nativeMenuBar = new gui.Menu({
            type: "menubar"
          });
          if (typeof nativeMenuBar.createMacBuiltin === "function") {
            nativeMenuBar.createMacBuiltin("Cypress.io");
          }
          win.menu = nativeMenuBar;
          if (!App.config.env("test")) {
            this.displayTray(win);
          }
          win.on("blur", (function(_this) {
            return function() {
              if (App.fileDialogOpened || !App.config.env("production")) {
                return;
              }
              return _this.hide(win);
            };
          })(this));
        }
        return win.on("focus", function() {
          return _.invoke(windows, "show");
        });
      },
      displayTray: function(win) {
        var iconWidth, translate, tray;
        tray = new gui.Tray({
          icon: "nw/public/img/tray/mac-normal@2x.png"
        });
        iconWidth = 13;
        translate = function(coords) {
          coords.x -= Math.floor(win.width / 2 - iconWidth);
          coords.y += 8;
          return coords;
        };
        return tray.on("click", (function(_this) {
          return function(coords) {
            coords = translate(coords);
            if (App.updater) {
              App.updater.setCoords(coords);
            }
            win.moveTo(coords.x, coords.y);
            if (win.isShown) {
              return _this.hide(win);
            } else {
              _this.show(win);
              return _this.focus(win);
            }
          };
        })(this));
      },
      hide: function(win) {
        win = gui.Window.get();
        win.isShown = false;
        return win.hide();
      },
      whitelist: function(domain) {
        return gui.App.addOriginAccessWhitelistEntry(domain, 'app', 'app', true);
      },
      focus: function(win) {
        if (win == null) {
          win = gui.Window.get();
        }
        return win.focus();
      },
      open: function(url, options) {
        return new gui.Window.open(url, options);
      },
      reload: function() {
        return gui.Window.get().reloadDev();
      },
      console: function() {
        return gui.Window.get().showDevTools();
      },
      external: function(url) {
        return gui.Shell.openExternal(url);
      },
      quit: function() {
        return gui.App.quit();
      },
      manifest: function() {
        try {
          return gui.App.manifest;
        } catch (_error) {
          return App.config.getManifest();
        }
      },
      about: function() {
        var about;
        if (about = windows.about) {
          return about.focus();
        }
        windows.about = about = App.request("gui:open", "./about.html", {
          position: "center",
          width: 300,
          height: 210,
          toolbar: false,
          title: "About"
        });
        about.once("loaded", (function(_this) {
          return function() {
            var $el;
            _this.focus(about);
            if (App.config.get("debug")) {
              about.showDevTools();
            }
            $el = $("#about-region", about.window.document);
            App.addRegions({
              aboutRegion: Marionette.Region.extend({
                el: $el
              })
            });
            return App.vent.trigger("start:about:app", App.aboutRegion, about);
          };
        })(this));
        return about.once("close", function() {
          if (App.aboutRegion) {
            App.removeRegion("aboutRegion");
          }
          delete windows.about;
          return this.close(true);
        });
      },
      updates: function() {
        var updates;
        if (updates = windows.updates) {
          return updates.focus();
        }
        windows.updates = updates = App.request("gui:open", "./updates.html", {
          position: "center",
          width: 300,
          height: 210,
          toolbar: false,
          title: "Updates"
        });
        updates.once("loaded", (function(_this) {
          return function() {
            var $el;
            _this.focus(updates);
            if (App.config.get("debug")) {
              updates.showDevTools();
            }
            $el = $("#updates-region", updates.window.document);
            App.addRegions({
              updatesRegion: Marionette.Region.extend({
                el: $el
              })
            });
            return App.vent.trigger("start:updates:app", App.updatesRegion, updates);
          };
        })(this));
        return updates.once("close", function() {
          if (App.updatesRegion) {
            App.removeRegion("updatesRegion");
          }
          delete windows.updates;
          return this.close(true);
        });
      },
      debug: function() {
        var debug;
        if (debug = windows.debug) {
          return debug.focus();
        }
        windows.debug = debug = App.request("gui:open", "app://app/nw/public/debug.html", {
          position: "center",
          width: 800,
          height: 400,
          toolbar: false,
          title: "Debug"
        });
        debug.once("loaded", (function(_this) {
          return function() {
            var $el;
            _this.focus(debug);
            debug.window.moment = moment;
            if (App.config.get("debug")) {
              debug.showDevTools();
            }
            $el = $("#debug-region", debug.window.document);
            App.addRegions({
              debugRegion: Marionette.Region.extend({
                el: $el
              })
            });
            return App.vent.trigger("start:debug:app", App.debugRegion, debug);
          };
        })(this));
        return debug.once("close", function() {
          if (App.debugRegion) {
            App.removeRegion("debugRegion");
          }
          delete windows.debug;
          return this.close(true);
        });
      },
      preferences: function() {
        var preferences;
        if (preferences = windows.preferences) {
          return preferences.focus();
        }
        windows.preferences = preferences = App.request("gui:open", "./preferences.html", {
          position: "center",
          width: 520,
          height: 270,
          toolbar: false,
          title: "Preferences"
        });
        preferences.once("loaded", (function(_this) {
          return function() {
            var $el;
            _this.focus(preferences);
            if (App.config.get("debug")) {
              preferences.showDevTools();
            }
            $el = $("#preferences-region", preferences.window.document);
            App.addRegions({
              preferencesRegion: Marionette.Region.extend({
                el: $el
              })
            });
            return App.vent.trigger("start:preferences:app", App.preferencesRegion, preferences);
          };
        })(this));
        return preferences.once("close", function() {
          if (App.preferencesRegion) {
            App.removeRegion("preferencesRegion");
          }
          delete windows.preferences;
          return this.close(true);
        });
      },
      tests: function() {
        var tests;
        if (!App.config.get("debug")) {
          return;
        }
        tests = App.request("gui:open", "http://localhost:3500", {
          position: "center",
          height: 1024,
          width: 768,
          title: "Cypress Tests"
        });
        return tests.once("loaded", function() {
          return tests.showDevTools();
        });
      },
      get: function() {
        return gui.Window.get();
      }
    };
    App.reqres.setHandler("gui:get", function() {
      return API.get();
    });
    App.commands.setHandler("gui:display", function(coords) {
      return API.displayGui(coords);
    });
    App.commands.setHandler("gui:whitelist", function(domain) {
      return API.whitelist(domain);
    });
    App.commands.setHandler("gui:focus", function() {
      return API.focus();
    });
    App.reqres.setHandler("gui:open", function(url, options) {
      if (options == null) {
        options = {};
      }
      return API.open(url, options);
    });
    App.commands.setHandler("gui:reload", function() {
      return API.reload();
    });
    App.commands.setHandler("gui:console", function() {
      return API.console();
    });
    App.commands.setHandler("gui:external:open", function(url) {
      return API.external(url);
    });
    App.commands.setHandler("gui:quit", function() {
      return API.quit();
    });
    App.commands.setHandler("gui:check:for:updates", function() {
      return API.updates();
    });
    App.reqres.setHandler("gui:manifest", function() {
      return API.manifest();
    });
    App.commands.setHandler("gui:debug", function() {
      return API.debug();
    });
    App.commands.setHandler("gui:tests", function() {
      return API.tests();
    });
    App.commands.setHandler("gui:about", function() {
      return API.about();
    });
    return App.commands.setHandler("gui:preferences", function() {
      return API.preferences();
    });
  });

}).call(this);
; 
(function() {
  this.App.module("Utilities", function(Utilities, App, Backbone, Marionette, $, _) {
    var API;
    API = {
      startIdGenerator: function(path) {
        var ref;
        if (!path) {
          throw new Error("Missing http path to ID Generator.  Cannot start ID Generator.");
        }
        if ((ref = this.idGenerator) != null) {
          ref.close();
        }
        return this.idGenerator = App.request("gui:open", path, {
          show: false
        });
      }
    };
    return App.commands.setHandler("start:id:generator", function(path) {
      return API.startIdGenerator(path);
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
        if (data == null) {
          data = {};
        }
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
        var i, j, len, len1, lookup, path, ref, ref1;
        ref = methods.lookups;
        for (i = 0, len = ref.length; i < len; i++) {
          lookup = ref[i];
          ref1 = [template, methods.withTemplate(template)];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            path = ref1[j];
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
  var slice = [].slice;

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
        var partsOfRoute, ref;
        partsOfRoute = _.map(parts, function(part) {
          return part.replace(/(:|\*)/, "");
        });
        return (ref = _(obj)).omit.apply(ref, partsOfRoute);
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
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
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
        var name, path, results;
        results = [];
        for (name in routes) {
          path = routes[name];
          obj.routes[name] = path;
          results.push(obj[name + "_path"] = createPathFn(path));
        }
        return results;
      };
      Routes = (function() {
        function Routes(routes1) {
          this.routes = routes1 != null ? routes1 : {};
        }

        return Routes;

      })();
      r = new Routes;
      r.url_for = function(name) {
        return this.routes[name];
      };
      r.create = function() {
        var args, path;
        path = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        return createPathFn(path).apply(this, args);
      };
      return r;
    })(_, Backbone);
  });

}).call(this);
; 
(function() {
  this.App.module("Views", function(Views, App, Backbone, Marionette, $, _) {
    var _mixinTemplateHelpers;
    _mixinTemplateHelpers = Marionette.View.prototype.mixinTemplateHelpers;
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
      },
      mixinTemplateHelpers: function(target) {
        target.env = App.config.env();
        target.debug = App.config.get("debug");
        return _mixinTemplateHelpers.call(this, target);
      },
      stopProp: function(e) {
        return e.stopPropagation();
      }
    });
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("Views", function(Views, App, Backbone, Marionette, $, _) {
    return Views.CollectionView = (function(superClass) {
      extend(CollectionView, superClass);

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
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("Views", function(Views, App, Backbone, Marionette, $, _) {
    return Views.CompositeView = (function(superClass) {
      extend(CompositeView, superClass);

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
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("Views", function(Views, App, Backbone, Marionette, $, _) {
    return Views.EmptyView = (function(superClass) {
      extend(EmptyView, superClass);

      EmptyView.prototype.template = "_empty";

      EmptyView.prototype.ui = {
        container: ":first"
      };

      function EmptyView() {
        EmptyView.__super__.constructor.apply(this, arguments);
        this.$el.addClass("empty");
      }

      EmptyView.prototype.serializeData = function() {
        var ref;
        return {
          containerTag: this.getContainerTag(),
          content: (ref = _.result(this, "content")) != null ? ref : "No items found."
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
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("Views", function(Views, App, Backbone, Marionette, $, _) {
    return Views.ItemView = (function(superClass) {
      extend(ItemView, superClass);

      function ItemView() {
        return ItemView.__super__.constructor.apply(this, arguments);
      }

      return ItemView;

    })(Marionette.ItemView);
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("Views", function(Views, App, Backbone, Marionette, $, _) {
    return Views.LayoutView = (function(superClass) {
      var regionRegex;

      extend(LayoutView, superClass);

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
          memo[_.str.camelize(region)] = "#" + region;
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
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("Controllers", function(Controllers, App, Backbone, Marionette, $, _) {
    return Controllers.Application = (function(superClass) {
      extend(Application, superClass);

      function Application(options) {
        var ref;
        if (options == null) {
          options = {};
        }
        this.region = (ref = options.region) != null ? ref : App.request("default:region");
        Application.__super__.constructor.apply(this, arguments);
      }

      Application.prototype.show = function(view, options) {
        var ref;
        if (options == null) {
          options = {};
        }
        view = view instanceof Controllers.Application ? view.getMainView() : view;
        if (!view) {
          throw new Error("getMainView() did not return a view instance or " + (view != null ? (ref = view.constructor) != null ? ref.name : void 0 : void 0) + " is not a view instance");
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
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("Components.Loading", function(Loading, App, Backbone, Marionette, $, _) {
    Loading.LoadingController = (function(superClass) {
      extend(LoadingController, superClass);

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
        var entity, i, len, ref, results;
        ref = _(entities).compact();
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          entity = ref[i];
          results.push(delete entity._fetch);
        }
        return results;
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
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("Components.Loading", function(Loading, App, Backbone, Marionette, $, _) {
    return Loading.LoadingView = (function(superClass) {
      extend(LoadingView, superClass);

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
  var slice = [].slice;

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
              orig = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
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
        var matches, params, queryParams, route, strings;
        route = action != null ? action.route : void 0;
        if (!route) {
          throw new Error("Routes must be defined on the action: " + key);
        }
        matches = route.match(routeParams);
        queryParams = this._getObjsFromArgs(args);
        strings = this._getStringsFromArgs(args);
        params = _.reduce(strings, function(memo, arg, i) {
          memo[matches[i].slice(1)] = arg;
          return memo;
        }, {});
        return _.extend({}, queryParams, params);
      };

      Application.prototype._getObjsFromArgs = function(args) {
        args = _(args).filter(_.isObject);
        return _.extend.apply(_, [{}].concat(slice.call(args)));
      };

      Application.prototype._getStringsFromArgs = function(args) {
        return _(args).filter(_.isString);
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
        options = _(options).reduce(function(memo, value, key) {
          if (!_.isObject(value) || _.isArray(value)) {
            memo[key] = value;
          }
          return memo;
        }, {});
        return Routes.create(action.route, options);
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
        return !_.isEmpty(args) && _.any(args, _.isString);
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
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    Entities.Config = (function(superClass) {
      extend(Config, superClass);

      function Config() {
        return Config.__super__.constructor.apply(this, arguments);
      }

      Config.prototype.env = function(str) {
        var env;
        env = this.get("env");
        switch (false) {
          case !_.isString(str):
            return env === str;
          default:
            return env;
        }
      };

      Config.prototype._getProp = function(prop) {
        var ref;
        return (function() {
          if ((ref = this.backend[prop]) != null) {
            return ref;
          } else {
            throw new Error("config#backend." + prop + " is not defined!");
          }
        }).call(this);
      };

      Config.prototype.getCache = function() {
        return this._getProp("cache");
      };

      Config.prototype.getBooter = function() {
        return this._getProp("Cypress");
      };

      Config.prototype.getManifest = function() {
        return this._getProp("manifest");
      };

      Config.prototype.getUpdater = function() {
        return this._getProp("updater");
      };

      Config.prototype.getLog = function() {
        return this._getProp("Log");
      };

      Config.prototype.getCli = function() {
        return this._getProp("cli");
      };

      Config.prototype.getUser = function() {
        return this.getCache().getUser();
      };

      Config.prototype.setUser = function(user) {
        return this.getCache().setUser(user);
      };

      Config.prototype.addProject = function(path) {
        return this.getCache().addProject(path);
      };

      Config.prototype.removeProject = function(path) {
        return this.getCache().removeProject(path);
      };

      Config.prototype.getProjectIdByPath = function(projectPath) {
        return this.getCache().getProjectIdByPath(projectPath);
      };

      Config.prototype.getProjectPaths = function() {
        return this.getCache().getProjectPaths();
      };

      Config.prototype.runProject = function(path, options) {
        if (options == null) {
          options = {};
        }
        this.project = this.getBooter()(path);
        return this.project.boot(options).get("settings");
      };

      Config.prototype.closeProject = function() {
        return this.project.close().bind(this).then(function() {
          return delete this.project;
        });
      };

      Config.prototype.logIn = function(code) {
        return this.getCache().logIn(code).bind(this).then(function(user) {
          return this.setUser(user)["return"](user);
        });
      };

      Config.prototype.logOut = function(user) {
        return this.getCache().logOut(user.get("session_token"));
      };

      Config.prototype.log = function(text, data) {
        if (data == null) {
          data = {};
        }
        data.type = "native";
        return this.getLog().log("info", text, data);
      };

      Config.prototype.getLogs = function() {
        return this.getLog().getLogs();
      };

      Config.prototype.onLog = function(fn) {
        return this.getLog().onLog(fn);
      };

      Config.prototype.clearLogs = function() {
        return this.getLog().clearLogs();
      };

      Config.prototype.offLog = function() {
        return this.getLog().off();
      };

      Config.prototype.cli = function(options) {
        var cli;
        cli = this.getCli();
        return cli(App, options);
      };

      Config.prototype.getToken = function(user) {
        return this.getCache().getToken(user.get("session_token"));
      };

      Config.prototype.generateToken = function(user) {
        return this.getCache().generateToken(user.get("session_token"));
      };

      Config.prototype.getProjectToken = function(user, project) {
        return this.getCache().getProjectToken(user.get("session_token"), project);
      };

      Config.prototype.generateProjectToken = function(user, project) {
        return this.getCache().generateProjectToken(user.get("session_token"), project);
      };

      Config.prototype.setErrorHandler = function() {
        return this.getLog().setErrorHandler((function(_this) {
          return function(err) {
            if (_this.env("production")) {
              return true;
            }
            console.error(err);
            if (_this.get("debug")) {
              debugger;
            }
          };
        })(this));
      };

      return Config;

    })(Entities.Model);
    return App.reqres.setHandler("config:entity", function(attrs) {
      var config, props, ref;
      if (attrs == null) {
        attrs = {};
      }
      props = ["backend"];
      config = new Entities.Config((ref = _(attrs)).omit.apply(ref, props));
      _.each(props, function(prop) {
        return config[prop] = attrs[prop];
      });
      config.setErrorHandler();
      return config;
    });
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    var API;
    Entities.Log = (function(superClass) {
      extend(Log, superClass);

      function Log() {
        return Log.__super__.constructor.apply(this, arguments);
      }

      Log.prototype.mutators = {
        dataFormatted: function() {
          var data;
          if (_.isEmpty(this.get("data"))) {
            return "";
          }
          try {
            data = JSON.stringify(this.get("data"));
            return _.str.truncate(data, 80);
          } catch (_error) {
            return "";
          }
        },
        timestampFormatted: function() {
          var date;
          if (date = this.get("timestamp")) {
            return moment(date).fromNow(true);
          }
        }
      };

      return Log;

    })(Entities.Model);
    Entities.LogsCollection = (function(superClass) {
      extend(LogsCollection, superClass);

      function LogsCollection() {
        return LogsCollection.__super__.constructor.apply(this, arguments);
      }

      LogsCollection.prototype.model = Entities.Log;

      LogsCollection.prototype.comparator = function(log) {
        var date;
        if (date = log.get("timestamp")) {
          return -moment(date).unix();
        }
      };

      LogsCollection.prototype.offLog = function() {
        return App.config.offLog();
      };

      LogsCollection.prototype.refresh = function() {
        this.reset();
        return _.defer((function(_this) {
          return function() {
            return _this.fetch();
          };
        })(this));
      };

      LogsCollection.prototype.fetch = function() {
        return App.config.getLogs().then((function(_this) {
          return function(array) {
            return _this.add(array);
          };
        })(this));
      };

      LogsCollection.prototype.clear = function() {
        return App.config.clearLogs().then((function(_this) {
          return function() {
            return _this.reset();
          };
        })(this));
      };

      return LogsCollection;

    })(Entities.Collection);
    API = {
      getLogs: function() {
        var logs;
        logs = new Entities.LogsCollection;
        logs.fetch();
        App.config.onLog(function(log) {
          return logs.add(log);
        });
        return logs;
      }
    };
    return App.reqres.setHandler("log:entities", function(transport) {
      return API.getLogs(transport);
    });
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    Entities.Preferences = (function(superClass) {
      extend(Preferences, superClass);

      function Preferences() {
        return Preferences.__super__.constructor.apply(this, arguments);
      }

      Preferences.prototype.defaults = function() {
        return {
          token: null,
          error: false,
          runOnStartup: false,
          generatingToken: false
        };
      };

      Preferences.prototype.setToken = function(token) {
        this.set("generatingToken", false);
        return this.set("token", token);
      };

      Preferences.prototype.generateToken = function() {
        return this.set("generatingToken", true);
      };

      Preferences.prototype.isGeneratingToken = function() {
        return this.get("generatingToken");
      };

      Preferences.prototype.setError = function() {
        return this.set("error", true);
      };

      return Preferences;

    })(Entities.Model);
    return App.reqres.setHandler("new:preferences:entity", function(attrs) {
      if (attrs == null) {
        attrs = {};
      }
      return new Entities.Preferences(attrs);
    });
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    var API;
    Entities.Project = (function(superClass) {
      extend(Project, superClass);

      function Project() {
        return Project.__super__.constructor.apply(this, arguments);
      }

      Project.prototype.initialize = function() {
        return this.setName();
      };

      Project.prototype.setName = function() {
        return this.set({
          name: this.getNameFromPath()
        });
      };

      Project.prototype.getNameFromPath = function() {
        return _(this.get("path").split("/")).last();
      };

      Project.prototype.setClientUrl = function(url, display) {
        return this.set({
          clientUrl: url,
          clientUrlDisplay: display
        });
      };

      Project.prototype.setError = function(err) {
        if (err.portInUse) {
          this.set("portInUse", true);
        }
        return this.set("error", err.toString());
      };

      Project.prototype.reset = function() {
        var props;
        props = {
          error: null,
          portInUse: null,
          clientUrl: null,
          clientUrlDisplay: null
        };
        this.set(props, {
          silent: true
        });
        return this.trigger("rebooted");
      };

      return Project;

    })(Entities.Model);
    Entities.ProjectsCollection = (function(superClass) {
      extend(ProjectsCollection, superClass);

      function ProjectsCollection() {
        return ProjectsCollection.__super__.constructor.apply(this, arguments);
      }

      ProjectsCollection.prototype.model = Entities.Project;

      ProjectsCollection.prototype.getProjectByPath = function(path) {
        return this.findWhere({
          path: path
        });
      };

      return ProjectsCollection;

    })(Entities.Collection);
    API = {
      getProjects: function() {
        var projects;
        projects = new Entities.ProjectsCollection;
        App.config.getProjectPaths().then(function(paths) {
          projects.add(_(paths).map(function(path) {
            return {
              path: path
            };
          }));
          return projects.trigger("fetched");
        });
        return projects;
      }
    };
    return App.reqres.setHandler("project:entities", function() {
      return API.getProjects();
    });
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    var API;
    Entities.Updater = (function(superClass) {
      extend(Updater, superClass);

      function Updater() {
        return Updater.__super__.constructor.apply(this, arguments);
      }

      Updater.prototype.defaults = function() {
        return {
          finished: false,
          updatesAvailable: false
        };
      };

      Updater.prototype.mutators = {
        stateFormatted: function() {
          switch (this.get("state")) {
            case "checking":
              return "Checking for updates...";
            case "downloading":
              return "Downloading updates...";
            case "applying":
              return "Applying updates...";
            case "done":
              return "Updates ready!";
            case "none":
              return "No updates available.";
            case "error":
              return "An error occurred updating.";
          }
        },
        buttonFormatted: function() {
          if (this.get("state") === "done") {
            return "Restart";
          } else {
            return "Close";
          }
        }
      };

      Updater.prototype.getUpdater = function() {
        var ref;
        return (function() {
          if ((ref = this.updater) != null) {
            return ref;
          } else {
            throw new Error("Updater object not found on model!");
          }
        }).call(this);
      };

      Updater.prototype.setUpdater = function(upd) {
        return this.updater = upd;
      };

      Updater.prototype.setState = function(state) {
        switch (state) {
          case "error":
          case "done":
          case "none":
            this.setFinished();
        }
        return this.set("state", state);
      };

      Updater.prototype.setNewVersion = function(newVersion) {
        return this.set("newVersion", newVersion);
      };

      Updater.prototype.setFinished = function() {
        return this.set("finished", true);
      };

      Updater.prototype.hasError = function() {
        return this.get("state") === "error";
      };

      Updater.prototype.isDone = function() {
        return this.get("state") === "done";
      };

      Updater.prototype.updatesAvailable = function(bool) {
        if (bool == null) {
          bool = true;
        }
        return this.set("updatesAvailable", bool);
      };

      Updater.prototype.check = function() {
        return this.getUpdater().check({
          onNewVersion: (function(_this) {
            return function() {
              return _this.updatesAvailable();
            };
          })(this),
          onNoNewVersion: (function(_this) {
            return function() {
              return _this.updatesAvailable(false);
            };
          })(this)
        });
      };

      Updater.prototype.run = function(options) {
        return this.getUpdater().run(options);
      };

      Updater.prototype.install = function(appPath, execPath) {
        return this.getUpdater().install(appPath, execPath);
      };

      Updater.prototype.setCoords = function(coords) {
        if (coords == null) {
          coords = {};
        }
        return this.getUpdater().setCoords(coords);
      };

      return Updater;

    })(Entities.Model);
    API = {
      newUpdater: function(attrs) {
        var manifest, updater;
        manifest = App.request("gui:manifest");
        updater = new Entities.Updater(_.extend(attrs, {
          version: manifest.version
        }));
        updater.setUpdater(App.config.getUpdater());
        return updater;
      }
    };
    return App.reqres.setHandler("new:updater:entity", function(attrs) {
      if (attrs == null) {
        attrs = {};
      }
      return API.newUpdater(attrs);
    });
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    Entities.User = (function(superClass) {
      extend(User, superClass);

      function User() {
        return User.__super__.constructor.apply(this, arguments);
      }

      User.prototype.defaults = function() {
        return {
          loggingIn: false
        };
      };

      User.prototype.loggingIn = function() {
        return this.set("loggingIn", true);
      };

      User.prototype.loggedIn = function(attrs) {
        this.set("loggingIn", false);
        return this.set(attrs);
      };

      User.prototype.setLoginError = function(err) {
        this.set("loggingIn", false, {
          silent: true
        });
        return this.set("error", err.message);
      };

      return User;

    })(Entities.Model);
    return App.reqres.setHandler("new:user:entity", function(attrs) {
      if (attrs == null) {
        attrs = {};
      }
      return new Entities.User(attrs);
    });
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("AboutApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    return Show.Controller = (function(superClass) {
      extend(Controller, superClass);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(options) {
        var aboutView, updater, window;
        if (options == null) {
          options = {};
        }
        window = options.window;
        updater = App.updater;
        aboutView = this.getAboutView(updater);
        this.listenTo(aboutView, "page:clicked", function() {
          return App.execute("gui:external:open", "http://www.cypress.io");
        });
        return this.show(aboutView);
      };

      Controller.prototype.getAboutView = function(updater) {
        return new Show.About({
          model: updater
        });
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("AboutApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    return Show.About = (function(superClass) {
      extend(About, superClass);

      function About() {
        return About.__super__.constructor.apply(this, arguments);
      }

      About.prototype.template = "about/show/_about";

      About.prototype.ui = {
        "page": "[data-page]"
      };

      About.prototype.triggers = {
        "click @ui.page": "page:clicked"
      };

      return About;

    })(App.Views.ItemView);
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("FooterApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    return Show.Controller = (function(superClass) {
      extend(Controller, superClass);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function() {
        var layoutView;
        layoutView = this.getLayoutView();
        this.listenTo(layoutView, "show", function() {
          this.updateRegion(layoutView.updateRegion);
          return this.bottomRegion(layoutView.bottomRegion);
        });
        return this.show(layoutView);
      };

      Controller.prototype.updateRegion = function(region) {
        var check, updateView, updater;
        updater = App.updater;
        check = function() {
          return updater.check();
        };
        updateView = this.getUpdateView(updater);
        this.listenTo(updateView, "show", function() {
          this.checkId = setInterval(check, 5 * 60 * 1000);
          return check();
        });
        this.listenTo(updateView, "strong:clicked", function() {
          return App.execute("gui:check:for:updates");
        });
        return this.show(updateView, {
          region: region
        });
      };

      Controller.prototype.onDestroy = function() {
        return clearInterval(this.checkId);
      };

      Controller.prototype.bottomRegion = function(region) {
        var bottomView;
        bottomView = this.getBottomView();
        this.listenTo(bottomView, "tests:clicked", function() {
          return App.execute("gui:tests");
        });
        this.listenTo(bottomView, "login:clicked", function(view, obj) {
          return App.execute("login:request");
        });
        this.listenTo(bottomView, "reload:clicked", function() {
          return App.execute("gui:reload");
        });
        this.listenTo(bottomView, "console:clicked", function() {
          return App.execute("gui:console");
        });
        this.listenTo(bottomView, "quit:clicked", function() {
          return App.execute("gui:quit");
        });
        this.listenTo(bottomView, "updates:clicked", function() {
          return App.execute("gui:check:for:updates");
        });
        this.listenTo(bottomView, "debug:clicked", function() {
          return App.execute("gui:debug");
        });
        this.listenTo(bottomView, "about:clicked", function() {
          return App.execute("gui:about");
        });
        this.listenTo(bottomView, "preferences:clicked", function() {
          return App.execute("gui:preferences");
        });
        return this.show(bottomView, {
          region: region
        });
      };

      Controller.prototype.getLayoutView = function() {
        return new Show.Layout;
      };

      Controller.prototype.getUpdateView = function(updater) {
        return new Show.Update({
          model: updater
        });
      };

      Controller.prototype.getBottomView = function() {
        return new Show.Bottom;
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("FooterApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    Show.Layout = (function(superClass) {
      extend(Layout, superClass);

      function Layout() {
        return Layout.__super__.constructor.apply(this, arguments);
      }

      Layout.prototype.template = "footer/show/layout";

      return Layout;

    })(App.Views.LayoutView);
    Show.Update = (function(superClass) {
      extend(Update, superClass);

      function Update() {
        return Update.__super__.constructor.apply(this, arguments);
      }

      Update.prototype.template = "footer/show/_update";

      Update.prototype.triggers = {
        "click strong": "strong:clicked"
      };

      Update.prototype.modelEvents = {
        "change:updatesAvailable": "render"
      };

      return Update;

    })(App.Views.ItemView);
    return Show.Bottom = (function(superClass) {
      extend(Bottom, superClass);

      function Bottom() {
        return Bottom.__super__.constructor.apply(this, arguments);
      }

      Bottom.prototype.template = "footer/show/_bottom";

      Bottom.prototype.ui = {
        reload: ".fa-repeat",
        console: ".fa-terminal",
        settings: ".fa-cog",
        quit: "[data-quit]",
        updates: "[data-updates]",
        debug: "[data-debug]",
        tests: "[data-tests]",
        about: "[data-about]",
        preferences: "[data-preferences]"
      };

      Bottom.prototype.triggers = {
        "click @ui.quit": "quit:clicked",
        "click @ui.reload": "reload:clicked",
        "click @ui.console": "console:clicked",
        "click @ui.settings": "settings:clicked",
        "click @ui.updates": "updates:clicked",
        "click @ui.debug": "debug:clicked",
        "click @ui.tests": "tests:clicked",
        "click @ui.about": "about:clicked",
        "click @ui.preferences": "preferences:clicked"
      };

      Bottom.prototype.events = {
        "click .dropdown-menu a": "aClicked"
      };

      Bottom.prototype.onRender = function() {
        return this.ui.settings.dropdown();
      };

      Bottom.prototype.aClicked = function() {
        return this.ui.settings.dropdown("toggle");
      };

      return Bottom;

    })(App.Views.ItemView);
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("DebugApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    return Show.Controller = (function(superClass) {
      extend(Controller, superClass);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(options) {
        var debugView, logs, window;
        if (options == null) {
          options = {};
        }
        window = options.window;
        this.logs = logs = App.request("log:entities");
        debugView = this.getDebugView(logs);
        this.listenTo(debugView, "clear:clicked", function() {
          return logs.clear();
        });
        this.listenTo(debugView, "refresh:clicked", function() {
          return logs.refresh();
        });
        return this.show(debugView);
      };

      Controller.prototype.onDestroy = function() {
        return this.logs.offLog();
      };

      Controller.prototype.getDebugView = function(logs) {
        return new Show.Debug({
          collection: logs
        });
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("DebugApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    Show.Log = (function(superClass) {
      extend(Log, superClass);

      function Log() {
        return Log.__super__.constructor.apply(this, arguments);
      }

      Log.prototype.template = "debug/show/_log";

      return Log;

    })(App.Views.ItemView);
    Show.Empty = (function(superClass) {
      extend(Empty, superClass);

      function Empty() {
        return Empty.__super__.constructor.apply(this, arguments);
      }

      Empty.prototype.content = "No Logs Found.";

      return Empty;

    })(App.Views.EmptyView);
    return Show.Debug = (function(superClass) {
      extend(Debug, superClass);

      function Debug() {
        return Debug.__super__.constructor.apply(this, arguments);
      }

      Debug.prototype.template = "debug/show/debug";

      Debug.prototype.emptyView = Show.Empty;

      Debug.prototype.childView = Show.Log;

      Debug.prototype.childViewContainer = "tbody";

      Debug.prototype.ui = {
        "clear": "[data-clear]",
        "refresh": "[data-refresh]"
      };

      Debug.prototype.triggers = {
        "click @ui.clear": "clear:clicked",
        "click @ui.refresh": "refresh:clicked"
      };

      return Debug;

    })(App.Views.CompositeView);
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("LoginApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    return Show.Controller = (function(superClass) {
      extend(Controller, superClass);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function() {
        var loginView, user;
        user = App.request("current:user");
        loginView = this.getLoginView(user);
        this.listenTo(loginView, "login:clicked", function(view, obj) {
          user.unset("error");
          return App.execute("login:request");
        });
        return this.show(loginView);
      };

      Controller.prototype.getLoginView = function(user) {
        return new Show.Login({
          model: user
        });
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("LoginApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    return Show.Login = (function(superClass) {
      extend(Login, superClass);

      function Login() {
        return Login.__super__.constructor.apply(this, arguments);
      }

      Login.prototype.template = "login/show/login";

      Login.prototype.ui = {
        login: "[data-login]",
        retry: "[data-retry]"
      };

      Login.prototype.triggers = {
        "click @ui.login": "login:clicked"
      };

      Login.prototype.modelEvents = {
        "change:loggingIn": "render",
        "change:error": "render"
      };

      Login.prototype.onRender = function() {
        var loggingIn;
        loggingIn = this.model.get("loggingIn");
        return this.ui.login.toggleClass("disabled", loggingIn).attr("disabled", loggingIn);
      };

      return Login;

    })(App.Views.ItemView);
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("PreferencesApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    return Show.Controller = (function(superClass) {
      extend(Controller, superClass);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(options) {
        var preferences, preferencesView, setError, setToken, user, window;
        if (options == null) {
          options = {};
        }
        window = options.window;
        user = App.request("current:user");
        preferences = App.request("new:preferences:entity");
        setToken = function(token) {
          return preferences.setToken(token);
        };
        setError = function(err) {
          return preferences.setError();
        };
        App.config.getToken(user).then(setToken)["catch"](setError);
        preferencesView = this.getPreferencesView(preferences);
        this.listenTo(preferencesView, "generate:clicked", function() {
          if (preferences.isGeneratingToken()) {
            return;
          }
          preferences.unset("error");
          preferences.generateToken();
          return App.config.generateToken(user).then(setToken)["catch"](setError);
        });
        return this.show(preferencesView);
      };

      Controller.prototype.getPreferencesView = function(preferences) {
        return new Show.Preferences({
          model: preferences
        });
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("PreferencesApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    return Show.Preferences = (function(superClass) {
      extend(Preferences, superClass);

      function Preferences() {
        return Preferences.__super__.constructor.apply(this, arguments);
      }

      Preferences.prototype.template = "preferences/show/preferences";

      Preferences.prototype.ui = {
        key: "#api-key",
        generate: "#generate-api-key",
        refresh: "i.fa-refresh"
      };

      Preferences.prototype.events = {
        "click @ui.key": "keyClicked"
      };

      Preferences.prototype.triggers = {
        "click @ui.generate": "generate:clicked"
      };

      Preferences.prototype.modelEvents = {
        "change:token": "render",
        "change:error": "render",
        "change:generatingToken": "generatingTokenChanged"
      };

      Preferences.prototype.generatingTokenChanged = function(model, value) {
        if (value) {
          this.ui.generate.attr("disabled", "disabled");
        } else {
          this.ui.generate.removeAttr("disabled");
        }
        return this.ui.refresh.toggleClass("fa-spin", value);
      };

      Preferences.prototype.keyClicked = function(e) {
        return this.ui.key.select();
      };

      return Preferences;

    })(App.Views.ItemView);
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("ProjectsApp.List", function(List, App, Backbone, Marionette, $, _) {
    return List.Controller = (function(superClass) {
      extend(Controller, superClass);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(params) {
        _.defaults(params, {
          projectPath: null,
          onProjectNotFound: function() {}
        });
        return this.displayProjects(params);
      };

      Controller.prototype.displayProjects = function(params) {
        var projectPath, projects, projectsView, startProject, user;
        projects = App.request("project:entities");
        user = App.request("current:user");
        projectsView = this.getProjectsView(projects, user);
        startProject = function(project, options) {
          if (options == null) {
            options = {};
          }
          return App.vent.trigger("project:clicked", project, options);
        };
        if (projectPath = params.projectPath) {
          this.listenTo(projectsView, "show", function() {
            var project;
            project = projects.getProjectByPath(projectPath);
            if (!project) {
              return params.onProjectNotFound(projectPath);
            }
            return startProject(project, params);
          });
        } else {
          this.listenTo(projectsView, "project:added", function(path) {
            return App.config.addProject(path).then(function() {
              return projects.add({
                path: path
              });
            })["catch"]((function(_this) {
              return function(err) {
                return _this.displayError(err.message, params);
              };
            })(this));
          });
          this.listenTo(projectsView, "sign:out:clicked", function() {
            return App.vent.trigger("log:out", user);
          });
          this.listenTo(projectsView, "childview:project:clicked", function(iv, obj) {
            return startProject(obj.model, params);
          });
          this.listenTo(projectsView, "childview:project:remove:clicked", function(iv, project) {
            App.config.removeProject(project.get("path"));
            return projects.remove(project);
          });
        }
        return this.listenTo(projects, "fetched", function() {
          return this.show(projectsView);
        });
      };

      Controller.prototype.displayError = function(msg, params) {
        var errorView;
        errorView = this.getErrorView(msg);
        this.show(errorView);
        return this.listenTo(errorView, "ok:clicked", function() {
          return this.displayProjects(params);
        });
      };

      Controller.prototype.getErrorView = function(msg) {
        return new List.Error({
          message: msg
        });
      };

      Controller.prototype.getProjectsView = function(projects, user) {
        return new List.Projects({
          collection: projects,
          model: user
        });
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("ProjectsApp.List", function(List, App, Backbone, Marionette, $, _) {
    List.Error = (function(superClass) {
      extend(Error, superClass);

      function Error() {
        return Error.__super__.constructor.apply(this, arguments);
      }

      Error.prototype.template = "projects/list/_error";

      Error.prototype.templateHelpers = function() {
        return {
          message: this.options.message
        };
      };

      Error.prototype.triggers = {
        "click [data-ok]": "ok:clicked"
      };

      return Error;

    })(App.Views.ItemView);
    List.Project = (function(superClass) {
      extend(Project, superClass);

      function Project() {
        return Project.__super__.constructor.apply(this, arguments);
      }

      Project.prototype.template = "projects/list/_project";

      Project.prototype.tagName = "li";

      Project.prototype.className = "project";

      Project.prototype.triggers = {
        "click": "project:clicked"
      };

      Project.prototype.onRender = function() {
        return this.$el.contextmenu({
          target: this.options.contextMenu,
          onItem: (function(_this) {
            return function() {
              return _.defer(function() {
                return _this.trigger("project:remove:clicked", _this.model);
              });
            };
          })(this)
        });
      };

      Project.prototype.onDestroy = function() {
        return this.$el.contextmenu("destroy");
      };

      return Project;

    })(App.Views.ItemView);
    List.Empty = (function(superClass) {
      extend(Empty, superClass);

      function Empty() {
        return Empty.__super__.constructor.apply(this, arguments);
      }

      Empty.prototype.template = "projects/list/_empty";

      Empty.prototype.tagName = "li";

      Empty.prototype.className = "empty";

      return Empty;

    })(App.Views.ItemView);
    return List.Projects = (function(superClass) {
      extend(Projects, superClass);

      function Projects() {
        return Projects.__super__.constructor.apply(this, arguments);
      }

      Projects.prototype.template = "projects/list/projects";

      Projects.prototype.childView = List.Project;

      Projects.prototype.emptyView = List.Empty;

      Projects.prototype.childViewContainer = "ul#projects-container";

      Projects.prototype.childViewOptions = {
        "contextMenu": "#context-menu"
      };

      Projects.prototype.ui = {
        "button": "button",
        "input": "input",
        "signout": "li[data-signout]"
      };

      Projects.prototype.events = {
        "mousedown @ui.signout": "signOutClicked",
        "click @ui.button": "buttonClicked",
        "change @ui.input": "inputChanged"
      };

      Projects.prototype.signOutClicked = function(e) {
        return this.trigger("sign:out:clicked");
      };

      Projects.prototype.buttonClicked = function(e) {
        App.fileDialogOpened = true;
        return this.ui.input.click();
      };

      Projects.prototype.inputChanged = function(e) {
        App.fileDialogOpened = null;
        return this.trigger("project:added", this.ui.input.val());
      };

      Projects.prototype.onRender = function() {
        return this.ui.signout.dropdown();
      };

      return Projects;

    })(App.Views.CompositeView);
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("ProjectsApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    return Show.Controller = (function(superClass) {
      extend(Controller, superClass);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(params) {
        var options, project, projectView;
        project = params.project, options = params.options;
        projectView = this.getProjectView(project);
        this.listenTo(projectView, "client:url:clicked", function() {
          return App.execute("gui:external:open", project.get("clientUrl"));
        });
        this.listenTo(projectView, "stop:clicked ok:clicked", function() {
          return App.config.closeProject().then(function() {
            return App.vent.trigger("start:projects:app");
          });
        });
        this.show(projectView);
        _.defaults(options, {
          onError: function() {},
          onProjectStart: function() {},
          onReboot: (function(_this) {
            return function() {
              project.reset();
              return App.config.closeProject().then(function() {
                return _this.runProject(project, options);
              });
            };
          })(this)
        });
        return _.defer((function(_this) {
          return function() {
            return _this.runProject(project, options);
          };
        })(this));
      };

      Controller.prototype.runProject = function(project, options) {
        return App.config.runProject(project.get("path"), options).then(function(config) {
          project.setClientUrl(config.clientUrl, config.clientUrlDisplay);
          if (config.idGenerator) {
            App.execute("start:id:generator", config.idGeneratorUrl);
          }
          return options.onProjectStart(config);
        })["catch"](function(err) {
          project.setError(err);
          return options.onError(err);
        });
      };

      Controller.prototype.getProjectView = function(project) {
        return new Show.Project({
          model: project
        });
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("ProjectsApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    return Show.Project = (function(superClass) {
      extend(Project, superClass);

      function Project() {
        return Project.__super__.constructor.apply(this, arguments);
      }

      Project.prototype.template = "projects/show/project";

      Project.prototype.modelEvents = {
        "rebooted": "render",
        "change:clientUrl": "render",
        "change:error": "render"
      };

      Project.prototype.triggers = {
        "click a": "client:url:clicked",
        "click [data-stop]": "stop:clicked",
        "click [data-ok]": "ok:clicked"
      };

      return Project;

    })(App.Views.ItemView);
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("UpdatesApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    return Show.Controller = (function(superClass) {
      extend(Controller, superClass);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(options) {
        var set, updater, updatesView, window;
        if (options == null) {
          options = {};
        }
        window = options.window;
        updater = App.updater;
        updatesView = this.getUpdatesView(updater);
        this.listenTo(updatesView, "button:clicked", function() {
          return window.close();
        });
        this.listenTo(updatesView, "changelog:clicked", function() {
          return App.execute("gui:external:open", "http://on.cypress.io/changelog");
        });
        set = function(state) {
          return updater.setState(state);
        };
        this.listenTo(updatesView, "show", function() {
          return updater.run({
            onStart: function() {
              return set("checking");
            },
            onApply: function() {
              return set("applying");
            },
            onError: function() {
              return set("error");
            },
            onDone: function() {
              return set("done");
            },
            onNone: function() {
              return set("none");
            },
            onDownload: function(version) {
              updater.setNewVersion(version);
              return set("downloading");
            }
          });
        });
        return this.show(updatesView);
      };

      Controller.prototype.getUpdatesView = function(updater) {
        return new Show.Updates({
          model: updater
        });
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("UpdatesApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    return Show.Updates = (function(superClass) {
      extend(Updates, superClass);

      function Updates() {
        return Updates.__super__.constructor.apply(this, arguments);
      }

      Updates.prototype.template = "updates/show/updates";

      Updates.prototype.ui = {
        "state": ".state",
        "button": "button",
        "changelog": "[data-changelog]"
      };

      Updates.prototype.triggers = {
        "click @ui.button": "button:clicked",
        "click @ui.changelog": "changelog:clicked"
      };

      Updates.prototype.modelEvents = {
        "change:state": "render"
      };

      Updates.prototype.onRender = function() {
        if (this.model.hasError()) {
          this.ui.state.addClass("text-danger");
        }
        if (this.model.isDone()) {
          return this.ui.state.addClass("text-success");
        }
      };

      return Updates;

    })(App.Views.ItemView);
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("UpdatesAppliedApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    return Show.Controller = (function(superClass) {
      extend(Controller, superClass);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(options) {
        var appPath, execPath, updatesView;
        appPath = options.appPath, execPath = options.execPath;
        updatesView = this.getUpdatesView();
        this.listenTo(updatesView, "show", function() {
          return App.updater.install(appPath, execPath);
        });
        return this.show(updatesView);
      };

      Controller.prototype.getUpdatesView = function() {
        return new Show.UpdatesApplied;
      };

      return Controller;

    })(App.Controllers.Application);
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("UpdatesAppliedApp.Show", function(Show, App, Backbone, Marionette, $, _) {
    return Show.UpdatesApplied = (function(superClass) {
      extend(UpdatesApplied, superClass);

      function UpdatesApplied() {
        return UpdatesApplied.__super__.constructor.apply(this, arguments);
      }

      UpdatesApplied.prototype.template = "updates_applied/show/_updates_applied";

      return UpdatesApplied;

    })(App.Views.ItemView);
  });

}).call(this);
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/about/show/templates/_about"] = function (__obj) {
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
      __out.push('<div id="about">\n  <img src="./img/cypress.iconset/icon_32x32@2x.png" />\n  <p>\n    <strong>Cypress</strong>\n  </p>\n  <p class="version">\n    <span>Version: ');
    
      __out.push(__sanitize(this.version));
    
      __out.push('</span>\n  </p>\n  <p>\n    <a data-page href="#">\n      www.cypress.io\n    </a>\n  </p>\n  <p class="copyright">\n    © ');
    
      __out.push(__sanitize(moment().year()));
    
      __out.push(' Cypress.io, LLC\n  </p>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/footer/show/templates/_bottom"] = function (__obj) {
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
      __out.push('<div id="footer">\n  ');
    
      if (this.debug) {
        __out.push('\n    <span class="pull-left">\n      <i class="fa fa-repeat"></i>\n    </span>\n    <span class="pull-left">\n      <i class="fa fa-terminal"></i>\n    </span>\n  ');
      }
    
      __out.push('\n  <span class="pull-right">\n    <div class="dropup">\n      <i class="fa fa-cog dropdown-toggle" data-toggle="dropdown"></i>\n      <ul class="dropdown-menu dropdown-menu-right">\n        ');
    
      if (this.debug) {
        __out.push('\n        <li data-tests>\n          <a href="#">Tests</a>\n        </li>\n        <li class="divider"></li>\n        ');
      }
    
      __out.push('\n        <li>\n        <li data-about>\n          <a href="#">About</a>\n        </li>\n        <li data-debug>\n          <a href="#">Debug Console</a>\n        </li>\n        <li data-updates>\n          <a href="#">Check for updates</a>\n        </li>\n        <!-- <li class="divider"></li>\n        <li data-preferences>\n          <a href="#">Preferences...</a>\n        </li> -->\n        <li class="divider"></li>\n        <li data-quit>\n          <a href="#">Quit</a>\n        </li>\n      </ul>\n    </div>\n  </span>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/footer/show/templates/_update"] = function (__obj) {
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
      if (this.updatesAvailable) {
        __out.push('\n  <div id="updates-available">\n    New updates are available.\n    <strong>\n      <i class="fa fa-download"></i>\n      Update\n    </strong>\n  </div>\n');
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
window.JST["backbone/apps/footer/show/templates/layout"] = function (__obj) {
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
      __out.push('<div id="update-region"></div>\n<div id="bottom-region"></div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/debug/show/templates/_empty"] = function (__obj) {
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
    
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/debug/show/templates/_log"] = function (__obj) {
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
      __out.push('<td>');
    
      __out.push(__sanitize(this.timestampFormatted));
    
      __out.push('</td>\n<td>');
    
      __out.push(__sanitize(this.type));
    
      __out.push('</td>\n<td>');
    
      __out.push(__sanitize(this.message));
    
      __out.push('</td>\n<td class="data">');
    
      __out.push(__sanitize(this.dataFormatted));
    
      __out.push('</td>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/debug/show/templates/debug"] = function (__obj) {
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
      __out.push('<div id="debug">\n  <div class="panel">\n    <button data-clear class="btn btn-sm btn-danger pull-right">\n      <i class="fa fa-minus-circle"></i>\n      Clear\n    </button>\n    <button data-refresh class="btn btn-sm btn-default pull-left">\n      <i class="fa fa-refresh"></i>\n      Refresh\n    </button>\n  </div>\n  <div id="code">\n    <table class="table table-bordered table-condensed">\n      <tbody></tbody>\n    </table>\n  </div>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/login/show/templates/login"] = function (__obj) {
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
      __out.push('<div id="login">\n  <h3>\n    <p>Cypress.io</p>\n  </h3>\n  <div class="well well-lg">\n    <button data-login class="btn btn-default">\n      <i class="fa fa-github"></i>\n      Login with Github\n    </button>\n  </div>\n  ');
    
      if (this.error) {
        __out.push('\n    <p class="text-danger">Could not log in!</p>\n    <p class="bg-danger">\n      <i class="fa fa-warning"></i>\n      ');
        __out.push(__sanitize(this.error));
        __out.push('\n    </p>\n  ');
      }
    
      __out.push('\n  ');
    
      if (this.loggingIn) {
        __out.push('\n    <span>\n      <i class="fa fa-spinner fa-spin"></i>\n      Logging in...\n    </span>\n  ');
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
window.JST["backbone/apps/preferences/show/templates/preferences"] = function (__obj) {
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
      var _ref;
    
      __out.push('<div id="preferences">\n  <section>\n    <div class="container">\n      <form class="form-inline">\n        <div class="form-group">\n          <label class="col-xs-4">General Settings:</label>\n          <div class="col-xs-8">\n            <div class="checkbox-inline">\n              <label>\n                <input type="checkbox"> Start Cypress at login\n              </label>\n            </div>\n          </div>\n        </div>\n      </form>\n    </div>\n  </section>\n  <section>\n    <div class="container">\n      <form class="form-inline">\n        <div class="form-group ');
    
      __out.push(__sanitize(this.error ? 'has-error' : ''));
    
      __out.push('">\n          <label class="col-xs-4 control-label">Your API Key:</label>\n          <div class="col-xs-8" id="api-key-container">\n            <input id="api-key" class="form-control col-xs-10 input-sm" type="text" value="');
    
      __out.push(__sanitize((_ref = this.token) != null ? _ref : 'Loading...'));
    
      __out.push('" readonly>\n            <button id="generate-api-key" type="button" class="btn btn-default btn-sm">\n              <i class="fa fa-refresh"></i>\n            </button>\n            ');
    
      if (this.error) {
        __out.push('\n              <p class="help-block">\n                <small>An error occured receiving token.</small>\n              </p>\n            ');
      }
    
      __out.push('\n          </div>\n        </div>\n      </form>\n    </div>\n  </section>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/projects/list/templates/_empty"] = function (__obj) {
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
      __out.push('<div class="well">\n  <p class="lead">No projects have been added.</p>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/projects/list/templates/_error"] = function (__obj) {
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
      __out.push('<div id="projects" class="error">\n  <h3>Error adding project!</h3>\n  <p class="bg-danger">\n    <i class="fa fa-warning"></i>\n    ');
    
      __out.push(this.message.replace("\n", "<br /><br />"));
    
      __out.push('\n  </p>\n  <button data-ok class="btn btn-info">Ok</button>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/projects/list/templates/_project"] = function (__obj) {
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
    
      __out.push('\n  <small>');
    
      __out.push(__sanitize(this.path));
    
      __out.push('</small>\n</h4>\n<i class="fa fa-angle-right"></i>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/projects/list/templates/projects"] = function (__obj) {
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
      __out.push('<div id="projects">\n  <header>\n    <p class="pull=left">\n      <i class="fa fa-user"></i>\n      Hi,\n    </p>\n    <div class="dropdown pull-left">\n      <a href="#" data-toggle="dropdown">\n        ');
    
      __out.push(__sanitize(this.name));
    
      __out.push('\n        <i class="fa fa-caret-down"></i>\n      </a>\n      <ul class="dropdown-menu">\n        <li data-signout>\n          <a href="#">Logout</a>\n        </li>\n      </ul>\n    </div>\n    <button class="btn btn-default pull-right">\n      <i class="fa fa-plus"></i>\n    </button>\n    <input type="file" nwdirectory class="hidden" />\n  </header>\n  <ul class="list-unstyled" id="projects-container"></ul>\n  <div id="context-menu">\n    <ul class="dropdown-menu">\n      <li data-remove>\n        <a href="#">Remove</a>\n      </li>\n    </ul>\n  </div>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/projects/show/templates/project"] = function (__obj) {
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
      __out.push('<div id="project">\n  <h3>\n    <p>');
    
      __out.push(__sanitize(this.name));
    
      __out.push('</p>\n  </h3>\n  ');
    
      if (this.error) {
        __out.push('\n    <p class="text-danger">Could not start server!</p>\n    <p class="bg-danger">\n      <i class="fa fa-warning"></i>\n      ');
        __out.push(this.error.replace("\n", "<br /><br />"));
        __out.push('\n    </p>\n    ');
        if (this.portInUse) {
          __out.push('\n      <div class="well well">\n        <p class="text-muted">To Fix:</p>\n        <ul class="text-left">\n          <li>Shut down the other running process</li>\n          <li>Or change your port number in the cypress.json file</li>\n        </ul>\n      </div>\n    ');
        }
        __out.push('\n    <button data-ok class="btn btn-info">Ok</button>\n  ');
      } else {
        __out.push('\n    ');
        if (this.clientUrl) {
          __out.push('\n      <div class="well well-lg">\n        <div>Server Running</div>\n        <div>\n          <a href="#">');
          __out.push(__sanitize(this.clientUrlDisplay));
          __out.push('</a>\n        </div>\n      </div>\n      <button data-stop class="btn btn-danger">Stop</button>\n    ');
        } else {
          __out.push('\n      <span>\n        <i class="fa fa-spinner fa-spin"></i>\n        Starting Server...\n      </span>\n    ');
        }
        __out.push('\n  ');
      }
    
      __out.push('\n</div>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/updates/show/templates/updates"] = function (__obj) {
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
      __out.push('<div id="updates">\n  <p>\n    <a data-changelog href="#">\n      View Changelog\n    </a>\n  </p>\n  ');
    
      if (this.version) {
        __out.push('\n    <p class="version">\n      <b>Current Version: </b>\n      <span>');
        __out.push(__sanitize(this.version));
        __out.push('</span>\n    </p>\n  ');
      }
    
      __out.push('\n  ');
    
      if (this.newVersion) {
        __out.push('\n    <p class="new-version">\n      <b>New Version: </b>\n      <span>');
        __out.push(__sanitize(this.newVersion));
        __out.push('</span>\n    </p>\n  ');
      }
    
      __out.push('\n  ');
    
      if (this.state) {
        __out.push('\n    <p class="state">\n      ');
        if (!this.finished) {
          __out.push('\n        <i class="fa fa-spinner fa-spin"></i>\n      ');
        }
        __out.push('\n      ');
        __out.push(__sanitize(this.stateFormatted));
        __out.push('\n    </p>\n    ');
        if (this.finished) {
          __out.push('\n      <div>\n        <button class="btn btn-default">');
          __out.push(__sanitize(this.buttonFormatted));
          __out.push('</button>\n      </div>\n    ');
        }
        __out.push('\n  ');
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
window.JST["backbone/apps/updates_applied/show/templates/_updates_applied"] = function (__obj) {
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
      __out.push('<div id="updates-applied">\n  <h3>\n    <p>Cypress.io</p>\n  </h3>\n  <div class="well well-lg">\n    <span>\n      <i class="fa fa-spinner fa-spin"></i>\n      Applying Updates and Restarting...\n    </span>\n  </div>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("AboutApp", function(AboutApp, App, Backbone, Marionette, $, _) {
    var Router, router;
    Router = (function(superClass) {
      extend(Router, superClass);

      function Router() {
        return Router.__super__.constructor.apply(this, arguments);
      }

      Router.prototype.module = AboutApp;

      Router.prototype.actions = {
        show: function() {}
      };

      return Router;

    })(App.Routers.Application);
    router = new Router;
    return App.vent.on("start:about:app", function(region, win) {
      return router.to("show", {
        region: region,
        window: win
      });
    });
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("FooterApp", function(FooterApp, App, Backbone, Marionette, $, _) {
    var Router, router;
    Router = (function(superClass) {
      extend(Router, superClass);

      function Router() {
        return Router.__super__.constructor.apply(this, arguments);
      }

      Router.prototype.module = FooterApp;

      Router.prototype.actions = {
        show: function() {
          return {
            defaultParams: function() {
              return {
                region: App.footerRegion
              };
            }
          };
        }
      };

      return Router;

    })(App.Routers.Application);
    router = new Router;
    return App.vent.on("start:footer:app", function() {
      return router.to("show");
    });
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("DebugApp", function(DebugApp, App, Backbone, Marionette, $, _) {
    var Router, router;
    Router = (function(superClass) {
      extend(Router, superClass);

      function Router() {
        return Router.__super__.constructor.apply(this, arguments);
      }

      Router.prototype.module = DebugApp;

      Router.prototype.actions = {
        show: function() {}
      };

      return Router;

    })(App.Routers.Application);
    router = new Router;
    return App.vent.on("start:debug:app", function(region, win) {
      return router.to("show", {
        region: region,
        window: win
      });
    });
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("LoginApp", function(LoginApp, App, Backbone, Marionette, $, _) {
    var Router, router;
    Router = (function(superClass) {
      extend(Router, superClass);

      function Router() {
        return Router.__super__.constructor.apply(this, arguments);
      }

      Router.prototype.module = LoginApp;

      Router.prototype.actions = {
        show: function() {}
      };

      return Router;

    })(App.Routers.Application);
    router = new Router;
    return App.vent.on("start:login:app", function() {
      return router.to("show");
    });
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("PreferencesApp", function(PreferencesApp, App, Backbone, Marionette, $, _) {
    var Router, router;
    Router = (function(superClass) {
      extend(Router, superClass);

      function Router() {
        return Router.__super__.constructor.apply(this, arguments);
      }

      Router.prototype.module = PreferencesApp;

      Router.prototype.actions = {
        show: function() {}
      };

      return Router;

    })(App.Routers.Application);
    router = new Router;
    return App.vent.on("start:preferences:app", function(region, win) {
      return router.to("show", {
        region: region,
        window: win
      });
    });
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("ProjectsApp", function(ProjectsApp, App, Backbone, Marionette, $, _) {
    var Router, router;
    Router = (function(superClass) {
      extend(Router, superClass);

      function Router() {
        return Router.__super__.constructor.apply(this, arguments);
      }

      Router.prototype.module = ProjectsApp;

      Router.prototype.actions = {
        list: function() {},
        show: function() {}
      };

      return Router;

    })(App.Routers.Application);
    router = new Router;
    App.vent.on("start:projects:app", function(options) {
      return router.to("list", options);
    });
    return App.vent.on("project:clicked", function(project, options) {
      return router.to("show", {
        project: project,
        options: options
      });
    });
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("UpdatesApp", function(UpdatesApp, App, Backbone, Marionette, $, _) {
    var Router, router;
    Router = (function(superClass) {
      extend(Router, superClass);

      function Router() {
        return Router.__super__.constructor.apply(this, arguments);
      }

      Router.prototype.module = UpdatesApp;

      Router.prototype.actions = {
        show: function() {}
      };

      return Router;

    })(App.Routers.Application);
    router = new Router;
    return App.vent.on("start:updates:app", function(region, win) {
      return router.to("show", {
        region: region,
        window: win
      });
    });
  });

}).call(this);
; 
(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  this.App.module("UpdatesAppliedApp", function(UpdatesAppliedApp, App, Backbone, Marionette, $, _) {
    var Router, router;
    Router = (function(superClass) {
      extend(Router, superClass);

      function Router() {
        return Router.__super__.constructor.apply(this, arguments);
      }

      Router.prototype.module = UpdatesAppliedApp;

      Router.prototype.actions = {
        show: function() {}
      };

      return Router;

    })(App.Routers.Application);
    router = new Router;
    return App.commands.setHandler("start:updates:applied:app", function(appPath, execPath) {
      return router.to("show", {
        appPath: appPath,
        execPath: execPath
      });
    });
  });

}).call(this);
