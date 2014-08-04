(function() {
  window.Eclectus = (function($, _) {
    var Eclectus, methods;
    methods = {
      find: function(obj, el) {
        var dom;
        dom = new Eclectus.Dom(obj.contentWindow.document, obj.channel, obj.runnable);
        return dom.find(el);
      }
    };
    Eclectus = (function() {
      function Eclectus(logs, xhrs) {
        this.logs = logs != null ? logs : [];
        this.xhrs = xhrs != null ? xhrs : [];
      }

      Eclectus.patch = function(args) {
        return _.each(methods, function(fn, key, obj) {
          return Eclectus.prototype[key] = _.partial(fn, args);
        });
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
  Eclectus.Dom = (function($, _) {
    var Dom;
    Dom = (function() {
      function Dom(document, channel, runnable) {
        this.document = document;
        this.channel = channel;
        this.runnable = runnable;
      }

      Dom.prototype.$ = function(selector) {
        return new $.fn.init(selector, this.document);
      };

      Dom.prototype.find = function(el) {
        var body;
        this.selector = el;
        this.$el = this.$(el);
        body = this.$("body").clone(true, true);
        body.find("script").remove();
        this.channel.trigger("dom", this.runnable, {
          selector: this.selector,
          el: this.$(this.selector),
          dom: body,
          method: "find"
        });
        return this;
      };

      Dom.prototype.type = function(sequence, options) {
        var body;
        if (options == null) {
          options = {};
        }
        _.extend(options, {
          sequence: sequence
        });
        this.$el.simulate("key-sequence", options);
        body = this.$("body").clone(true, true);
        body.find("script").remove();
        this.channel.trigger("dom", this.runnable, {
          selector: this.selector,
          el: this.$(this.selector),
          dom: body,
          method: "type"
        });
        return this;
      };

      return Dom;

    })();
    return Dom;
  })($, _);

}).call(this);
; 
(function() {


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
  this.App.module("Utilities", function(Utilities, App, Backbone, Marionette, $, _) {
    var API, Reporter, df;
    df = null;
    Reporter = (function() {
      function Reporter(runner) {
        var patch;
        patch = Eclectus.patch;
        df.resolve(App.request("runner:entity", runner, patch));
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
        attrs = _(attrs).pick("method", "selector");
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
    Entities.Runnable = (function(_super) {
      __extends(Runnable, _super);

      function Runnable() {
        return Runnable.__super__.constructor.apply(this, arguments);
      }

      Runnable.prototype.defaults = function() {
        return {
          children: new Entities.RunnableCollection,
          state: "processing"
        };
      };

      Runnable.prototype.initialize = function() {
        return new Backbone.Chooser(this);
      };

      Runnable.prototype.addRunnable = function(runnable, type) {
        return this.get("children").addRunnable(runnable, type);
      };

      Runnable.prototype.isSlow = function() {
        return this.get("duration") > this._slow;
      };

      Runnable.prototype.timedOut = function() {
        return this.get("duration") > this._timeout;
      };

      Runnable.prototype.reset = function() {
        if (this.get("type") === "test") {
          return this.resetTest();
        }
        return this.resetSuite();
      };

      Runnable.prototype.resetSuite = function() {
        return this.get("children").invoke("reset");
      };

      Runnable.prototype.resetTest = function() {
        this.removeOriginalError();
        _.each(["state", "duration", "error"], (function(_this) {
          return function(key) {
            return _this.unset(key);
          };
        })(this));
        return this.set(_.result(this, "defaults"));
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
          console.error(test.err);
          this.originalError = test.err;
          attrs.error = test.err.stack || test.err.toString();
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

      RunnableCollection.prototype.addRunnable = function(runnable, type) {
        var attrs;
        attrs = {
          title: runnable.originalTitle(),
          id: runnable.cid,
          type: type
        };
        return runnable.model = this.add(attrs, {
          merge: true
        });
      };

      return RunnableCollection;

    })(Entities.Collection);
    return App.reqres.setHandler("new:root:runnable:entity", function() {
      return new Entities.Runnable;
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

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
        ({
          iframes: []
        });
        return this.doms = App.request("dom:entities");
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

      Runner.prototype.revertDom = function(dom) {
        console.warn(dom);
        return this.trigger("revert:dom", dom.getDom(), {
          highlight: dom.get("highlight"),
          el: dom.getEl()
        });
      };

      Runner.prototype.setTestRunner = function(runner) {
        var socket, _this;
        this.runner = runner;
        socket = App.request("socket:entity");
        this.listenTo(socket, "test:changed", this.triggerLoadIframe);
        _this = this;
        return this.runner.runSuite = _.wrap(this.runner.runSuite, function(runSuite, suite, fn) {
          var generatedIds;
          generatedIds = [];
          suite.eachTest(function(test) {
            return _.each([test, test.parent], function(type) {
              var data, df;
              if (type.root) {
                return;
              }
              type.originalTitle = function() {
                return this.title.replace(_this.getIdToAppend(type.cid), "");
              };
              if (type.cid == null) {
                type.cid = _this.getTestCid(type);
              }
              if (!type.cid) {
                type.fullTitle = _.wrap(type.fullTitle, function(origTitle) {
                  var title;
                  title = origTitle.apply(this);
                  return title + _this.getIdToAppend(type.cid);
                });
                df = $.Deferred();
                generatedIds.push(df);
                data = {
                  title: type.title,
                  spec: _this.iframe
                };
                return socket.emit("generate:test:id", data, function(id) {
                  type.cid = id;
                  return df.resolve(id);
                });
              }
            });
          });
          return $.when.apply($, generatedIds).done((function(_this) {
            return function() {
              return runSuite.call(_this, suite, fn);
            };
          })(this));
        });
      };

      Runner.prototype.getEntitiesByEvent = function(event) {
        var obj;
        obj = {
          dom: this.doms,
          xhr: this.xhrs,
          log: this.logs
        };
        return obj[event || (function() {
          throw new Error("Cannot find entities by event: " + event);
        })()];
      };

      Runner.prototype.startListening = function() {
        this.listenTo(runnerChannel, "all", function(event, runnable, attrs) {
          var entities;
          entities = this.getEntitiesByEvent(event);
          return entities.add(attrs, runnable);
        });
        this.runner.on("start", (function(_this) {
          return function() {
            console.warn("RUNNER HAS STARTED");
            return _this.trigger("runner:start");
          };
        })(this));
        this.runner.on("end", (function(_this) {
          return function() {
            console.warn("RUNNER HAS ENDED");
            return _this.trigger("runner:end");
          };
        })(this));
        this.runner.on("suite", (function(_this) {
          return function(suite) {
            console.warn("suite", suite);
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
        delete this.runner;
        delete this.contentWindow;
        delete this.iframe;
        delete this.doms;
        delete this.xhrs;
        delete this.logs;
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
        _([this.doms]).invoke("reset");
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
        if (iframe !== this.iframe) {
          return;
        }
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

      Runner.prototype.getGrep = function() {
        var chosen;
        if (chosen = this.get("chosen")) {
          return new RegExp(this.escapeId("[" + chosen.id + "]"));
        } else {
          return /.*/;
        }
      };

      Runner.prototype.escapeId = function(id) {
        return id.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      };

      Runner.prototype.runIframeSuite = function(iframe, contentWindow) {
        console.info("runIframeSuite", this.runner, iframe, contentWindow.mocha.suite);
        this.setIframe(iframe);
        this.setContentWindow(contentWindow);
        this.runner.grep(this.getGrep());
        return this.runner.runSuite(contentWindow.mocha.suite, function() {
          return console.log("finished running the iframes suite!");
        });
      };

      return Runner;

    })(Entities.Model);
    API = {
      getRunner: function(testRunner, patch) {
        var runner;
        runner = new Entities.Runner;
        runner.setTestRunner(testRunner);
        runner.setEclPatch(patch);
        runner.startListening();
        return runner;
      }
    };
    return App.reqres.setHandler("runner:entity", function(testRunner, patch) {
      return API.getRunner(testRunner, patch);
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
        compress: ".fa-compress"
      };

      Iframe.prototype.events = {
        "click @ui.expand": "expandClicked",
        "click @ui.compress": "compressClicked"
      };

      Iframe.prototype.revertToDom = function(dom, options) {
        dom.replaceAll(this.$el.find("iframe").contents().find("body"));
        if (!options.highlight) {
          return;
        }
        return this.highlight(dom, options.el);
      };

      Iframe.prototype.getZIndex = function(el) {
        if (/^(auto|0)$/.test(el.css("zIndex"))) {
          return 1000;
        } else {
          return Number(el.css("zIndex"));
        }
      };

      Iframe.prototype.highlight = function(dom, el) {
        var dimensions;
        el = dom.find(el.selector);
        dimensions = this.getDimensions(el);
        console.warn(el, dimensions);
        return $("<div>").appendTo(dom).css({
          width: dimensions.width - 6,
          height: dimensions.height - 6,
          top: dimensions.offset.top,
          left: dimensions.offset.left,
          position: "absolute",
          zIndex: this.getZIndex(el),
          border: "3px solid #E94B3B"
        });
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

      Iframe.prototype.loadIframe = function(src, fn) {
        var iframe, view;
        this.$el.find("iframe").remove();
        this.$el.hide();
        view = this;
        this.src = "/iframes/" + src;
        this.fn = fn;
        iframe = $("<iframe />", {
          src: this.src,
          "class": "iframe-spec",
          load: function() {
            console.info("loaded!", iframe, this.contentWindow);
            fn(this.contentWindow);
            return view.$el.show();
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

  this.App.module("TestPanelsApp.DOM", function(DOM, App, Backbone, Marionette, $, _) {
    return DOM.Controller = (function(_super) {
      __extends(Controller, _super);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(options) {
        var doms, panel, runner;
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
        return this.ui.icon.removeClass().addClass("fa fa-chevron-" + klass);
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
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  this.App.module("TestSpecsApp.List", function(List, App, Backbone, Marionette, $, _) {
    return List.Controller = (function(_super) {
      __extends(Controller, _super);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function(options) {
        var root, runnableView, runnables, runner, suites;
        runner = options.runner;
        runnables = [];
        runnables.eachModel = function(fn) {
          return _.each(this, function(runnable) {
            return fn(runnable.model);
          });
        };
        root = App.request("new:root:runnable:entity");
        suites = App.request("new:suite:entities");
        this.addRunnable = _.partial(this.addRunnable, root, runnables);
        this.createRunnableListeners = _.partial(this.createRunnableListeners, runner, runnables);
        this.listenTo(runner, "all", function(e) {
          return console.info(e);
        });
        this.listenTo(runner, "suite:start", function(suite) {
          return this.addRunnable(suite, "suite");
        });
        this.listenTo(runner, "suite:stop", function(suite) {
          if (suite.root || suite.stopped) {
            return;
          }
          return suite.model.updateState();
        });
        this.listenTo(runner, "test", function(test) {
          return this.addRunnable(test, "test");
        });
        this.listenTo(runner, "test:end", function(test) {
          if (test.stopped || !test.model) {
            return;
          }
          test.model.setResults(test);
          return runner.logResults(test.model);
        });
        this.listenTo(runner, "load:iframe", function(iframe, options) {
          if (runner.hasChosen()) {
            return runnables.eachModel((function(_this) {
              return function(model, runnable) {
                if (!model.isChosen()) {
                  return;
                }
                model.reset();
                return _this.resetRunnables(runnables, runnable);
              };
            })(this));
          } else {
            root.reset();
            return this.resetRunnables(runnables);
          }
        });
        runnableView = this.getRunnableView(root);
        return this.show(runnableView);
      };

      Controller.prototype.resetRunnables = function(runnables, runnable) {
        var index, _results;
        if (runnable) {
          index = _(runnables).indexOf(runnable);
          return runnables.splice(index, 1);
        } else {
          _results = [];
          while (runnables.length) {
            _results.push(runnables.pop());
          }
          return _results;
        }
      };

      Controller.prototype.addRunnable = function(root, runnables, runnable, type) {
        var _ref;
        if (runnable.root || runnable.stopped) {
          return;
        }
        if (_ref = runnable.parent, __indexOf.call(runnables, _ref) >= 0) {
          runnable.parent.model.addRunnable(runnable, type);
        } else {
          if (!runnable.parent.root) {
            return;
          }
          root.addRunnable(runnable, type);
        }
        runnables.push(runnable);
        return this.createRunnableListeners(runnable.model);
      };

      Controller.prototype.createRunnableListeners = function(runner, runnables, model) {
        this.stopListening(model);
        return this.listenTo(model, "model:clicked", (function(_this) {
          return function() {
            runnables.eachModel(function(runnable) {
              return runnable.unchoose();
            });
            model.choose();
            return runner.setChosen(model);
          };
        })(this));
      };

      Controller.prototype.getRunnableView = function(root) {
        return new List.Root({
          model: root
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
    List.Runnable = (function(_super) {
      __extends(Runnable, _super);

      function Runnable() {
        return Runnable.__super__.constructor.apply(this, arguments);
      }

      Runnable.prototype.childViewContainer = "ul";

      Runnable.prototype.getTemplate = function() {
        switch (this.model.get("type")) {
          case "test":
            return "test_specs/list/_test";
          case "suite":
            return "test_specs/list/_suite";
        }
      };

      Runnable.prototype.attributes = function() {
        return {
          "class": this.model.get("type")
        };
      };

      Runnable.prototype.ui = {
        pre: "pre",
        label: "label"
      };

      Runnable.prototype.events = {
        "mouseover": "mouseover",
        "mouseout": "mouseout",
        "click @ui.pre": "preClicked",
        "click": "clicked"
      };

      Runnable.prototype.modelEvents = {
        "change:title": "render",
        "change:state": "stateChanged",
        "change:error": "errorChanged",
        "change:chosen": "chosenChanged"
      };

      Runnable.prototype.initialize = function() {
        return this.collection = this.model.get("children");
      };

      Runnable.prototype._renderChildren = function() {
        if (this.model.get("type") === "test") {
          return;
        }
        return Runnable.__super__._renderChildren.apply(this, arguments);
      };

      Runnable.prototype.clicked = function(e) {
        e.stopPropagation();
        return this.model.trigger("model:clicked");
      };

      Runnable.prototype.mouseover = function(e) {
        e.stopPropagation();
        return this.$el.addClass("hover");
      };

      Runnable.prototype.mouseout = function(e) {
        e.stopPropagation();
        return this.$el.removeClass("hover");
      };

      Runnable.prototype.chosenChanged = function(model, value, options) {
        return this.$el.toggleClass("active", value);
      };

      Runnable.prototype.onBeforeRender = function() {
        return this.$el.addClass(this.model.get("state"));
      };

      Runnable.prototype.stateChanged = function(model, value, options) {
        this.$el.removeClass("processing pending failed passed").addClass(value);
        if (this.model.get("type") === "test") {
          if (value === "passed") {
            this.checkDuration();
          }
          if (value === "failed") {
            return this.checkTimeout();
          }
        }
      };

      Runnable.prototype.errorChanged = function(model, value, options) {
        value || (value = "");
        return this.ui.pre.text(value);
      };

      Runnable.prototype.checkDuration = function() {
        if (!this.model.isSlow()) {
          return;
        }
        return this.ui.label.addClass("label-primary").text(this.model.get("duration") + "ms");
      };

      Runnable.prototype.checkTimeout = function() {
        if (!this.model.timedOut()) {
          return;
        }
        return this.ui.label.addClass("label-danger").text("Timed Out");
      };

      Runnable.prototype.preClicked = function(e) {
        var error;
        if (!(error = this.model.originalError)) {
          return;
        }
        return console.error(error);
      };

      return Runnable;

    })(App.Views.CompositeView);
    return List.Root = (function(_super) {
      __extends(Root, _super);

      function Root() {
        return Root.__super__.constructor.apply(this, arguments);
      }

      Root.prototype.tagName = "ul";

      Root.prototype.id = "specs-container";

      Root.prototype.childView = List.Runnable;

      Root.prototype.initialize = function() {
        return this.collection = this.model.get("children");
      };

      return Root;

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
        var config;
        config = App.request("app:config:entity");
        this.listenTo(config, "change:panels", function() {
          return this.layout.resizePanels();
        });
        this.onDestroy = _.partial(this.onDestroy, config);
        return App.request("start:test:runner").done((function(_this) {
          return function(runner) {
            _this.runner = runner;
            _this.layout = _this.getLayoutView(config);
            _this.listenTo(_this.layout, "show", function() {
              _this.statsRegion(runner);
              _this.iframeRegion(runner);
              _this.specsRegion(runner);
              _this.panelsRegion(runner, config);
              runner.start(options.id);
              return _this.layout.resizePanels();
            });
            return _this.show(_this.layout);
          };
        })(this));
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
        stats = App.request("stats:entity");
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
      __out.push('<span class="suite-state">\n  <i class="fa"></i>\n  ');
    
      __out.push(__sanitize(this.title));
    
      __out.push('\n</span>\n<ul class="runnables"></ul>');
    
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
      __out.push('<span class="test-state">\n  <i class="fa"></i>\n</span>\n<span class="test-title">\n  ');
    
      __out.push(__sanitize(this.title));
    
      __out.push('\n  <label class="label"></span>\n</span>\n<pre class="test-error"></pre>');
    
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
      __out.push('<div id="specs-container">\n  <div id="runnable-region"></div>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
};
; 
if (!window.JST) {
  window.JST = {};
}
window.JST["backbone/apps/test_specs/list/templates/runnable"] = function (__obj) {
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
      __out.push('<div id="specs-container">\n\n</div>');
    
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
      __out.push('<div id="header-container">\n  <div id="stats-region"></div>\n</div>\n<div class="ecl-main-content">\n  <div id="test-page">\n    <div id="specs-region"></div>\n  </div>\n</div>\n<div id="iframe-wrapper">\n  <div id="iframe-container">\n    <div id="iframe-region"></div>\n  </div>\n</div>\n<ul id="panel-wrapper">\n  <li id="dom-region"></li>\n  <li id="xhr-region"></li>\n  <li id="log-region"></li>\n</ul>');
    
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
      __out.push('<ul id="stats-container">\n  <li id="tests-passed">\n    <span class="num">');
    
      __out.push(__sanitize(this.count(this.passed)));
    
      __out.push('</span>\n    <span class="name">\n      <i class="fa fa-check"></i>\n      Passed\n    </span>\n  </li>\n  <li id="tests-failed">\n    <span class="num">');
    
      __out.push(__sanitize(this.count(this.failed)));
    
      __out.push('</span>\n    <span class="name">\n      <i class="fa fa-times"></i>\n      Failed\n    </span>\n  </li>\n  <li id="tests-pending">\n    <span class="num">');
    
      __out.push(__sanitize(this.count(this.pending)));
    
      __out.push('</span>\n    <span class="name">\n      <i class="fa fa-circle-o-notch"></i>\n      Pending\n    </span>\n  </li>\n  <li id="tests-duration">\n    <span class="num">');
    
      __out.push(__sanitize(this.count(this.duration)));
    
      __out.push('</span>\n    <span class="name">secs</span>\n  </li>\n</ul>');
    
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
