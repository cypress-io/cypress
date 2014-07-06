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
  this.Ecl = (function(Backbone, Marionette) {
    var App;
    App = new Marionette.Application;
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
      return App.module("NavApp").start();
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

  this.Ecl.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
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

  this.Ecl.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
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
  this.Ecl.module("Utilities", function(Utilities, App, Backbone, Marionette, $, _) {
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
  this.Ecl.module("Utilities", function(Utilities, App, Backbone, Marionette, $, _) {
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
  this.Ecl.module("Views", function(Views, App, Backbone, Marionette, $, _) {
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

  this.Ecl.module("Views", function(Views, App, Backbone, Marionette, $, _) {
    return Views.CollectionView = (function(_super) {
      __extends(CollectionView, _super);

      function CollectionView() {
        return CollectionView.__super__.constructor.apply(this, arguments);
      }

      CollectionView.prototype.itemViewOptions = function(model, index) {
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

  this.Ecl.module("Views", function(Views, App, Backbone, Marionette, $, _) {
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

      CompositeView.prototype.buildItemView = function(item, ItemViewType, childViewOptions) {
        if (this.isTbody()) {
          childViewOptions.tableColumns = this.$el.find("th").length;
        }
        return CompositeView.__super__.buildItemView.apply(this, arguments);
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

  this.Ecl.module("Views", function(Views, App, Backbone, Marionette, $, _) {
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

  this.Ecl.module("Views", function(Views, App, Backbone, Marionette, $, _) {
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

  this.Ecl.module("Views", function(Views, App, Backbone, Marionette, $, _) {
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

  this.Ecl.module("Controllers", function(Controllers, App, Backbone, Marionette, $, _) {
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
        return this.listenTo(view, "close", this.close);
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

  this.Ecl.module("Components.Loading", function(Loading, App, Backbone, Marionette, $, _) {
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
          this.listenTo(oldView, "close", (function(_this) {
            return function() {
              return _this.removeOpacity(oldView);
            };
          })(this));
        }
        $.when.apply($, xhrs).done((function(_this) {
          return function() {
            if (loadingView && (_this.region.currentView !== loadingView)) {
              return realView.close();
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
              return realView.close();
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
              loadingView.close();
            }
            _this.close();
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

  this.Ecl.module("Components.Loading", function(Loading, App, Backbone, Marionette, $, _) {
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

      LoadingView.prototype.onClose = function() {
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
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Ecl.module("Entities", function(Entities, App, Backbone, Marionette, $, _) {
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
            href: "#",
            icon: "fa fa-code"
          }, {
            name: "Organize",
            href: "#",
            icon: "fa fa-th"
          }, {
            name: "Analytics",
            href: "#",
            icon: "fa fa-bar-chart-o"
          }, {
            name: "Settings",
            href: "#",
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
  this.Ecl.module("NavApp", function(NavApp, App, Backbone, Marionette, $, _) {
    this.startWithParent = false;
    return NavApp.on("start", function() {
      console.warn("NavApp starting");
      return new NavApp.List.Controller;
    });
  });

}).call(this);
; 
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Ecl.module("NavApp.List", function(List, App, Backbone, Marionette, $, _) {
    return List.Controller = (function(_super) {
      __extends(Controller, _super);

      function Controller() {
        return Controller.__super__.constructor.apply(this, arguments);
      }

      Controller.prototype.initialize = function() {
        var navs, view;
        navs = App.request("nav:entities");
        view = this.getView(navs);
        return this.show(view, {
          region: App.navRegion
        });
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

  this.Ecl.module("NavApp.List", function(List, App, Backbone, Marionette, $, _) {
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
