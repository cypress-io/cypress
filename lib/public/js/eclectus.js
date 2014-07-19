(function() {
  window.Eclectus = (function($, _, Mocha) {
    var Eclectus;
    Eclectus = (function() {
      function Eclectus(logs, xhrs) {
        this.logs = logs != null ? logs : [];
        this.xhrs = xhrs != null ? xhrs : [];
      }

      return Eclectus;

    })();
    return Eclectus;
  })($, _, Mocha);

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
    App.rootRoute = "/tests";
    App.addRegions({
      navRegion: "#nav-region",
      mainRegion: "#main-region"
    });
    App.reqres.setHandler("default:region", function() {
      return App.mainRegion;
    });
    App.on("before:start", function(options) {
      if (options == null) {
        options = {};
      }
      return console.warn("before:start");
    });
    App.on("start", function(options) {
      if (options == null) {
        options = {};
      }
      App.module("NavApp").start();
      App.startHistory();
      if (!App.currentRoute()) {
        return App.visit(App.rootRoute);
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
    return Entities.Model = (function(_super) {
      __extends(Model, _super);

      function Model() {
        return Model.__super__.constructor.apply(this, arguments);
      }

      return Model;

    })(Backbone.Model);
  });

}).call(this);
; 
(function() {
  this.App.module("Utilities", function(Utilities, App, Backbone, Marionette, $, _) {
    var API, Reporter, df;
    df = null;
    Reporter = (function() {
      function Reporter(runner) {
        df.resolve(App.request("runner:entity", runner));
      }

      return Reporter;

    })();
    API = {
      start: function() {
        df = $.Deferred();
        window.Ecl = new Eclectus;
        window.mocha = new Mocha({
          reporter: Reporter
        });
        Mocha.Runnable.prototype.emit = _.wrap(Mocha.Runner.prototype.emit, function(orig, event, err) {
          if (event === "error") {
            throw err;
          }
          return orig.call(this, event, err);
        });
        Mocha.Runner.prototype.uncaught = _.wrap(Mocha.Runner.prototype.uncaught, function(orig, err) {
          throw err;
          return orig.call(this, err);
        });
        mocha.run();
        return df;
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
      visit: function(route) {
        return Backbone.history.navigate(route);
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
        return Routes.create(action.route, _(options).omit("region"));
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
    var API;
    Entities.Nav = (function(_super) {
      __extends(Nav, _super);

      function Nav() {
        return Nav.__super__.constructor.apply(this, arguments);
      }

      return Nav;

    })(Entities.Model);
    Entities.NavsCollection = (function(_super) {
      __extends(NavsCollection, _super);

      function NavsCollection() {
        return NavsCollection.__super__.constructor.apply(this, arguments);
      }

      NavsCollection.prototype.model = Entities.Nav;

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
    Entities.Runner = (function(_super) {
      __extends(Runner, _super);

      function Runner() {
        return Runner.__super__.constructor.apply(this, arguments);
      }

      Runner.prototype.defaults = function() {
        return {
          total: 0,
          failed: 0,
          passed: 0,
          iframes: []
        };
      };

      Runner.prototype.setTestRunner = function(runner) {
        return this.runner = runner;
      };

      Runner.prototype.startListening = function() {
        this.runner.on("start", (function(_this) {
          return function() {};
        })(this));
        this.runner.on("suite", (function(_this) {
          return function(suite) {
            console.warn("suite", suite);
            suite.cid = _.uniqueId("suite");
            return _this.trigger("suite:start", suite);
          };
        })(this));
        this.runner.on("fail", (function(_this) {
          return function(test, err) {
            console.warn("runner has failed", test, err);
            return test.err = err;
          };
        })(this));
        this.runner.on("test", (function(_this) {
          return function(test) {
            test.cid = _.uniqueId("test");
            return _this.trigger("test", test);
          };
        })(this));
        return this.runner.on("test end", (function(_this) {
          return function(test) {
            console.warn("test end", test);
            return _this.trigger("test:end", test);
          };
        })(this));
      };

      Runner.prototype.stop = function() {
        this.runner.removeAllListeners();
        return delete this.runner;
      };

      Runner.prototype.start = function(iframe) {
        console.warn("starting", iframe);
        return this.trigger("load:iframe", iframe);
      };

      Runner.prototype.runIframeSuite = function(contentWindow) {
        console.info("runIframeSuite", contentWindow.mocha.suite);
        return this.runner.runSuite(contentWindow.mocha.suite, function() {
          return console.log("finished running the iframes suite!");
        });
      };

      return Runner;

    })(Entities.Model);
    API = {
      getRunner: function(testRunner) {
        var runner;
        runner = new Entities.Runner;
        runner.setTestRunner(testRunner);
        runner.startListening();
        return runner;
      }
    };
    return App.reqres.setHandler("runner:entity", function(testRunner) {
      return API.getRunner(testRunner);
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    var API;
    Entities.Suite = (function(_super) {
      __extends(Suite, _super);

      function Suite() {
        return Suite.__super__.constructor.apply(this, arguments);
      }

      Suite.prototype.addTest = function(test) {
        return this.get("tests").addTest(test);
      };

      Suite.prototype.getTest = function(test) {
        return this.get("tests").get(test.cid);
      };

      return Suite;

    })(Entities.Model);
    Entities.SuitesCollection = (function(_super) {
      __extends(SuitesCollection, _super);

      function SuitesCollection() {
        return SuitesCollection.__super__.constructor.apply(this, arguments);
      }

      SuitesCollection.prototype.model = Entities.Suite;

      SuitesCollection.prototype.addSuite = function(suite) {
        return this.add({
          title: suite.title,
          id: suite.cid,
          tests: App.request("new:test:entities")
        });
      };

      SuitesCollection.prototype.getSuiteByTest = function(test) {
        return this.get(test.parent.cid);
      };

      SuitesCollection.prototype.addTest = function(test) {
        var suite;
        suite = this.getSuiteByTest(test);
        return suite.addTest(test);
      };

      SuitesCollection.prototype.getTest = function(test) {
        var suite;
        suite = this.getSuiteByTest(test);
        return suite.getTest(test);
      };

      return SuitesCollection;

    })(Entities.Collection);
    API = {
      getNewSuites: function(suites) {
        return new Entities.SuitesCollection(suites);
      }
    };
    return App.reqres.setHandler("new:suite:entities", function(suites) {
      if (suites == null) {
        suites = [];
      }
      return API.getNewSuites(suites);
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
    var API;
    Entities.Test = (function(_super) {
      __extends(Test, _super);

      function Test() {
        return Test.__super__.constructor.apply(this, arguments);
      }

      Test.prototype.defaults = function() {
        return {
          state: "pending"
        };
      };

      Test.prototype.getResults = function(test) {
        var attrs;
        attrs = {
          state: test.state
        };
        if (test.err) {
          console.error(test.err);
          this.originalError = test.err;
          attrs.error = test.err.stack || test.err.toString();
        }
        return this.set(attrs);
      };

      return Test;

    })(Entities.Model);
    Entities.TestsCollection = (function(_super) {
      __extends(TestsCollection, _super);

      function TestsCollection() {
        return TestsCollection.__super__.constructor.apply(this, arguments);
      }

      TestsCollection.prototype.model = Entities.Test;

      TestsCollection.prototype.addTest = function(test) {
        return this.add({
          title: test.title,
          id: test.cid
        });
      };

      return TestsCollection;

    })(Entities.Collection);
    API = {
      getNewTests: function(tests) {
        return new Entities.TestsCollection(tests);
      }
    };
    return App.reqres.setHandler("new:test:entities", function(tests) {
      if (tests == null) {
        tests = [];
      }
      return API.getNewTests(tests);
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

      return File;

    })(Entities.Model);
    Entities.FilesCollection = (function(_super) {
      __extends(FilesCollection, _super);

      function FilesCollection() {
        return FilesCollection.__super__.constructor.apply(this, arguments);
      }

      FilesCollection.prototype.model = Entities.File;

      FilesCollection.prototype.url = "/files";

      return FilesCollection;

    })(Entities.Collection);
    API = {
      getFiles: function() {
        var files;
        files = new Entities.FilesCollection;
        files.fetch();
        return files;
      }
    };
    return App.reqres.setHandler("file:entities", function() {
      return API.getFiles();
    });
  });

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
    return NavApp.on("start", function() {
      return router.to("list");
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

  this.App.module("TestsApp", function(TestsApp, App, Backbone, Marionette, $, _) {
    var Router, router;
    Router = (function(_super) {
      __extends(Router, _super);

      function Router() {
        return Router.__super__.constructor.apply(this, arguments);
      }

      Router.prototype.module = TestsApp;

      Router.prototype.actions = {
        list: function() {
          return {
            route: "tests"
          };
        },
        show: function() {
          return {
            route: "tests/:id"
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

      Controller.prototype.initialize = function() {
        var navs, view;
        navs = App.request("nav:entities");
        view = this.getView(navs);
        return this.show(view);
      };

      Controller.prototype.getView = function(navs) {
        return new List.Navs({
          collection: navs
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

  this.App.module("NavApp.List", function(List, App, Backbone, Marionette, $, _) {
    List.Nav = (function(_super) {
      __extends(Nav, _super);

      function Nav() {
        return Nav.__super__.constructor.apply(this, arguments);
      }

      Nav.prototype.template = "nav/list/_nav";

      Nav.prototype.className = "parent";

      return Nav;

    })(App.Views.ItemView);
    return List.Navs = (function(_super) {
      __extends(Navs, _super);

      function Navs() {
        return Navs.__super__.constructor.apply(this, arguments);
      }

      Navs.prototype.template = "nav/list/navs";

      Navs.prototype.childView = List.Nav;

      Navs.prototype.childViewContainer = "ul";

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
        this.listenTo(this.layout, "show", (function(_this) {
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

      File.prototype.template = "organize/list/_file";

      return File;

    })(App.Views.ItemView);
    return List.Files = (function(_super) {
      __extends(Files, _super);

      function Files() {
        return Files.__super__.constructor.apply(this, arguments);
      }

      Files.prototype.childView = List.File;

      Files.prototype.tagName = "ul";

      return Files;

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
        this.listenTo(runner, "load:iframe", (function(_this) {
          return function(iframe) {
            return view.loadIframe(iframe, function(contentWindow) {
              return runner.runIframeSuite(contentWindow);
            });
          };
        })(this));
        view = this.getView();
        return this.show(view);
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
        header: "header",
        expand: ".fa-expand",
        compress: ".fa-compress"
      };

      Iframe.prototype.events = {
        "click @ui.expand": "expandClicked",
        "click @ui.compress": "compressClicked"
      };

      Iframe.prototype.onShow = function() {
        this.ui.header.hide();
        return this.ui.compress.hide();
      };

      Iframe.prototype.loadIframe = function(src, fn) {
        var iframe, view;
        view = this;
        this.src = "/iframes/" + src;
        this.fn = fn;
        iframe = $("<iframe />", {
          src: this.src,
          "class": "iframe-spec",
          load: function() {
            console.info("loaded!", iframe, this.contentWindow);
            fn(this.contentWindow);
            return view.ui.header.show();
          }
        });
        return iframe.appendTo(this.$el);
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

  this.App.module("TestSpecsApp.List", function(List, App, Backbone, Marionette, $, _) {
    return List.Controller = (function(_super) {
      __extends(Controller, _super);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(options) {
        var runner, suites, suitesView;
        runner = options.runner;
        suites = App.request("new:suite:entities");
        this.listenTo(runner, "all", function(e) {
          return console.info(e);
        });
        this.listenTo(runner, "suite:start", function(suite) {
          if (suite.root) {
            return;
          }
          console.log("suite start", suite, suite.cid, suites);
          return suites.addSuite(suite);
        });
        this.listenTo(runner, "test", function(test) {
          return suites.addTest(test);
        });
        this.listenTo(runner, "test:end", function(test) {
          console.log("test:end", test);
          return suites.getTest(test).getResults(test);
        });
        suitesView = this.getSuitesView(suites);
        return this.show(suitesView);
      };

      Controller.prototype.getSuitesView = function(suites) {
        return new List.Suites({
          collection: suites
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
    List.Layout = (function(_super) {
      __extends(Layout, _super);

      function Layout() {
        return Layout.__super__.constructor.apply(this, arguments);
      }

      Layout.prototype.template = "test_specs/list/list_layout";

      return Layout;

    })(App.Views.LayoutView);
    List.Test = (function(_super) {
      __extends(Test, _super);

      function Test() {
        return Test.__super__.constructor.apply(this, arguments);
      }

      Test.prototype.template = "test_specs/list/_test";

      Test.prototype.ui = {
        pre: "pre"
      };

      Test.prototype.events = {
        "click @ui.pre": "preClicked"
      };

      Test.prototype.modelEvents = {
        "change:state": "stateChanged",
        "change:error": "errorChanged"
      };

      Test.prototype.onBeforeRender = function() {
        return this.$el.addClass(this.model.get("state"));
      };

      Test.prototype.stateChanged = function(model, value, options) {
        return this.$el.removeClass().addClass(value);
      };

      Test.prototype.errorChanged = function(model, value, options) {
        return this.ui.pre.text(value);
      };

      Test.prototype.preClicked = function(e) {
        var error;
        if (!(error = this.model.originalError)) {
          return;
        }
        return console.error(error);
      };

      return Test;

    })(App.Views.ItemView);
    List.Suite = (function(_super) {
      __extends(Suite, _super);

      function Suite() {
        return Suite.__super__.constructor.apply(this, arguments);
      }

      Suite.prototype.template = "test_specs/list/_suite";

      Suite.prototype.className = "suite";

      Suite.prototype.childView = List.Test;

      Suite.prototype.childViewContainer = "ul";

      Suite.prototype.initialize = function() {
        return this.collection = this.model.get("tests");
      };

      return Suite;

    })(App.Views.CompositeView);
    return List.Suites = (function(_super) {
      __extends(Suites, _super);

      function Suites() {
        return Suites.__super__.constructor.apply(this, arguments);
      }

      Suites.prototype.tagName = "ul";

      Suites.prototype.id = "specs-container";

      Suites.prototype.className = "suite";

      Suites.prototype.childView = List.Suite;

      return Suites;

    })(App.Views.CollectionView);
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
        return App.request("start:test:runner").done((function(_this) {
          return function(runner) {
            _this.runner = runner;
            _this.layout = _this.getTestView();
            _this.listenTo(_this.layout, "show", function() {
              _this.iframeRegion(runner);
              _this.specsRegion(runner);
              return runner.start(options.id);
            });
            return _this.show(_this.layout);
          };
        })(this));
      };

      Controller.prototype.iframeRegion = function(runner) {
        return App.execute("show:test:iframe", this.layout.iframeRegion, runner);
      };

      Controller.prototype.specsRegion = function(runner) {
        return App.execute("list:test:specs", this.layout.specsRegion, runner);
      };

      Controller.prototype.onDestroy = function() {
        return App.request("stop:test:runner", this.runner);
      };

      Controller.prototype.getTestView = function() {
        return new Show.Test;
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
    return Show.Test = (function(_super) {
      __extends(Test, _super);

      function Test() {
        return Test.__super__.constructor.apply(this, arguments);
      }

      Test.prototype.template = "tests/show/test";

      return Test;

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
    
      __out.push('"></i>\n  ');
    
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
window.JST["backbone/apps/nav/list/templates/navs"] = function (__obj) {
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
      __out.push('<div class="ecl-sidebar">\n  <div class="ecl-toggle">\n    <i class="fa fa-reorder"></i>\n  </div>\n  <div class="ecl-navblock">\n    <div class="collapse-button">\n      <div class="pull-left logo">Eclectus</div>\n      <div class="pull-right">\n        <button class="btn btn-default" id="sidebar-collapse">\n          <i class="fa fa-angle-left"></i>\n        </button>\n      </div>\n    </div>\n    <ul class="ecl-vnavigation"></ul>\n  </div>\n</div>');
    
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
    
      __out.push(__sanitize(this.name));
    
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
      __out.push('<div class="ecl-main-content">\n  <h2>Test Files</h2>\n  <div id="files-region" class="block-panel"></div>\n</div>');
    
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
      __out.push('<header>\n  <div id="url-container" class="pull-left">\n    <i class="fa fa-arrow-left"></i>\n    <i class="fa fa-arrow-right"></i>\n    <input class="url" />\n  </div>\n  <div class="pull-right">\n    <i class="fa fa-cog">\n      <span class="fa fa-caret-down"></span>\n    </i>\n    <i class="fa fa-compress"></i>\n    <i class="fa fa-expand"></i>\n  </div>\n</header>');
    
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
      __out.push(__sanitize(this.title));
    
      __out.push('\n<ul class="test"></ul>');
    
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
      __out.push('<span class="test-state">\n  <i class="fa fa-circle"></i>\n</span>\n<span class="test-title">\n  ');
    
      __out.push(__sanitize(this.title));
    
      __out.push('\n</span>\n<pre class="test-error"></pre>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/test_specs/list/templates/list_layout"] = function (__obj) {
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
      __out.push('<div id="specs-container"></div>');
    
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
      __out.push('<div id="header-container">\n  <div id="header-content">\n    <ul id="test-tabs">\n      <li class="active">\n        <a href="#">\n          <i class="fa fa-spin fa-circle-o-notch"></i>\n          1/1\n        </a>\n      </li>\n    </ul>\n  </div>\n</div>\n<div class="ecl-main-content">\n  <div id="test-page">\n    <ul id="stats-container">\n      <li id="tests-passed">\n        <span class="num"></span>\n        <span class="name">Passed</span>\n      </li>\n      <li id="tests-failed">\n        <span class="num"></span>\n        <span class="name">Failed</span>\n      </li>\n      <li id="tests-pending">\n        <span class="num"></span>\n        <span class="name">Pending</span>\n      </li>\n      <li id="tests-duration">0s</li>\n    </ul>\n    <div id="iframe-wrapper">\n      <div id="iframe-container">\n        <div id="iframe-region"></div>\n      </div>\n    </div>\n    <div id="specs-region"></div>\n    <div id="ecl-panel-container">\n      <div id="ecl-panel" class="block-panel">\n        <ul></ul>\n      </div>\n      <div id="ecl-xhr-panel" class="block-panel">\n        <div id="xhr-header">\n          <span>Request</span>\n          <span>Response</span>\n        </div>\n        <ul></ul>\n      </div>\n    </div>\n  </div>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
