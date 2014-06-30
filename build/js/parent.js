// need to use window.onload here so all of
//our iframes and tests are loaded
;(function(Mocha){

  // need to find an easy way to proxy the 'Test ID'
  // from each iframe child into each of these methods
  var Eclectus = function() {
    this.logs = [];
    this.xhrs = [];

    _this = this;

    this.output = {
      add: function(obj) {
        addOutputLog(obj);
        _this.logs.push(obj);
      }
    };

    this.error = function(test, msg, obj) {
      this.output.add({
        title: getTestTitle(test),
        id: getTestId(test),
        type: "error",
        msg: msg,
        obj: obj
      });
      return this;
    }
  };

  var eclMethods = {
    log: function(test, msg) {
      this.output.add({
        title: getTestTitle(test),
        id: getTestId(test),
        type: "log",
        msg: msg
      });
      return this;
    },

    info: function(test, msg) {
      this.output.add({
        title: getTestTitle(test),
        id: getTestId(test),
        type: "info",
        msg: msg
      });
      return this;
    },

    warn: function(test, msg) {
      return this;
    },

    xhr: function(test, msg) {
      this.output.add({
        title: getTestTitle(test),
        id: getTestId(test),
        type: "info",
        msg: msg
      });
      return this;
    },

    find: function(test, el) {
      // need to instantiate a new finder Ecl class here
      // so we can return that in order to do things with
      // the el

      var $ = getSuiteWindow(test).$

      var el = $(el)

      var _this = this;

      this.output.add({
        title: getTestTitle(test),
        id: getTestId(test),
        type: "dom",
        msg: "Finding el: '" + el.prop("nodeName").toLowerCase() + "' => " + (el.length ? "Found" : "Not Found"),
        dom: $("body").clone(true, true)
      })

      // hack here just for proof of concept
      var click = el.click;

      el.click = function() {
        console.warn("el clicked!", this);

        click.apply(this, arguments)

        _this.output.add({
          title: getTestTitle(test),
          id: getTestId(test),
          type: "dom",
          msg: "clicking el: '" + el.prop("nodeName").toLowerCase() + "'",
          dom: $("body").clone(true, true)
        })
      };

      return el;
    }
  };

  _.extend(Eclectus.prototype, {
    patch: function(test) {
      var fns = _.functions(eclMethods)
      var _this = this;

      // bind title + id args to each function
      _.each(fns, function(fn){
        // must use a separate object for eclMethods since we're
        // using those as buffer and re-partialing them each time
        _this[fn] = _.partial(eclMethods[fn],test)
      });
    },

    beforeAll: function(){
      // need to run the patch stuff here because we dont want to expose
      // a sandbox property to our tests.  instead we want to go through Ecl
      console.info("suite beforeAll", this)
      this.sandbox = new Eclectus.Sandbox(this)
    },

    afterEach: function(){
      console.info("suite afterEach", this)
      this.sandbox.restore()
    }
  });

  Eclectus.Sandbox = function(ctx){
    // hold reference to iframe window
    this._window = getSuiteWindow(ctx.test)

    // hold the actual sinon sandbox
    this._sandbox = this._window.sinon.sandbox.create()

    this.requests = []
    this.responses = []
  };

  _.extend(Eclectus.Sandbox.prototype, {
    get: function(){
      return this._sandbox
    },

    restore: function(){
      this._server && this._server.restore && this._server.restore()
      this._xhr && this._xhr.restore && this._xhr.restore()

      return this;
    },

    server: function(){
      this._server = this._window.sinon.fakeServer.create()

      this._server.addRequest = _.wrap(this._server.addRequest, function(orig, xhrObj){

        //call the original addRequest method
        orig.call(this, xhrObj)

        //overload the xhrObj's onsend method so we log out when the request happens
        xhrObj.onSend = _.wrap(xhrObj.onSend, function(orig){
          Ecl.xhr("Request: " + xhrObj.method + " " + xhrObj.url)
          orig.call(orig)
        });

      });


      this.server.mock = _.bind(mock, this, this._server)

      this.server.respond = function(){}

      return this;
    },

    xhr: function(){
      this._xhr = this._window.sinon.useFakeXMLHttpRequest()
      return this;
    }
  });

  Eclectus.Sandbox.prototype.server.mock = function(){
    throw new Error("You can't apply mocks without first patching xhr by running: Ecl.server()")
  }

  var mock = function mock(server, options){
    var options = options || {}

    console.log("mock", arguments)

    _.defaults(options, {
      url: /.*/,
      method: "GET",
      status: 200,
      contentType: "application/json",
      response: "",
      headers: {}
    });

    server.respondWith(function(request){
      if (request.readyState === 4) return

      if (requestMatchesResponse(request, options)){
        var headers = _.extend(options.headers, { "Content-Type": options.contentType });

        return request.respond(options.status, headers, parseResponse(options));
      }
    });
  };

  var requestMatchesResponse = function requestMatchesResponse(request, options){
    return request.method === options.method &&
      (_.isRegExp(options.url) ? options.url.test(request.url) : options.url === request.url)
  };

  var parseResponse = function parseResponse(options){
    var response = _.result(options, "response")

    if (!_.isString(response)){
      return JSON.stringify(response)
    }

    return response
  };

  var iframes = ["foo", "bar"];

  var testIdRegExp = /\[(.{3})\]$/

  window.activeId = null;

  window.stats = stats = {
    suites: {},
    total: function(){
      return this.get("total");
    },
    failed: function(){
      return this.get("failed");
    },
    passed: function(){
      return this.get("passed");
    },
    get: function(attr){
      return _.reduce(this.suites, function(memo, suite){
        val = _.isFunction(suite[attr]) ? suite[attr]() : suite[attr];
        return memo + (val || 0);
      }, 0);
    }
  };

  Eclectus.Reporter = function ecl(runner){
    console.info("runner is", runner.suite)

    // runner.suite.beforeEach(function(){
      // console.info("beforeEach", this)
    // });

    window.addIframe = function (iframe) {
      iframes.push(iframe);
      nextSuite(runner)
    };

    // runner.suite.addSuite
    nextSuite(runner)

    // oldRunSuite = runner.runSuite

    // runner.runSuite = function(suite, fn){
    //   if(suite.root){
    //     return oldRunSuite.apply(this, arguments);
    //   }

    //   if(suite._hasRun){
    //     console.warn("suite has run", suite, suite.suites)
    //     return
    //   }

    //   suite._hasRun = suite._hasRun || true

    //   // call the original runSuite
    //   oldRunSuite.apply(this, arguments);
    // };

    // runner.on("start", function(){
    //   console.log("runner has started", arguments, this)
    // });

    // runner.on("end", function(){
    //   console.log("runner has ended", arguments, this)
    // });

    runner.on("suite", function(suite){
      if (suite.root) return

      var id = getSuiteId(suite)

      var found = $("#" + id).length

      if (!found) {
        $("<li />", {
          text: suite.title,
          id: getSuiteId(suite)
        }).appendTo("#mocha").wrap("<ul class='suite'></ul>")
      }

    });

    runner.on("suite end", function(suite){
      if (suite.root) return;
      // suite._hasRun = true
      console.log("suite end", suite);
      // iframe = iframes.shift()
      // runner.runSuite
      nextSuite(runner);
    });

    runner.on("test", function(test){
      console.log("test from runner", test, getSuiteWindow(test))
    });

    runner.on("test end", function(test){
      console.log("test end", test, test.state, test.err)

      // need to reduce until we're at the top parent
      // test.suite.parents: mocha.js 4704
      var klass
      var id = getSuiteId(test)

      var stat = stats.suites[id];
      console.warn("stat is", stat);
      if(test.state == "passed"){
        klass = "passed"
        stat.passed += 1
        updateStats("passed", stats.passed())
      } else {
        klass = "failed"
        stat.failed += 1
        updateStats("failed", stats.failed())
      }

      console.log(stat, id, test.title, "#" + id)

      var testId = getTestId(test)

      var li = $("<li />", {
        text: test.title,
        "class": klass,
        id: testId,
        click: function() {
          activeId = $(this).prop("id")

          // create regex to .only the active id
          re = new RegExp("\\[" + activeId + "\\]$")
          runner.grep(re)

          $(".active").removeClass("active")
          $(this).addClass("active")
        }
      })

      // if the test id is the active id
      // append into its parent test container
      if (testId === activeId) {
        $("#test-" + testId).append(li.addClass("active"))
      } else {
        // append to the suite id and wrap with a ul
        li.appendTo("#" + id).wrap("<ul class='test'></ul>")
      }
    });
  }

  var getSuiteId = function getSuiteId(obj){
    return getParentSuiteBy(obj, "id")
  };

  var getSuiteWindow = function getSuiteWindow(obj){
    return getParentSuiteBy(obj, "window")
  };

  var getParentSuiteBy = function(obj, prop){
    while (obj.parent) {
      if (obj[prop]) {
        return obj[prop]
      }
      var obj = obj.parent
    }
  };

  var getTestId = function getTestId(test){
    // returns the capture'd part of the test id
    return (testIdRegExp).exec(test.title)[1]
  };

  var getTestTitle = function getTestTitle(test){
    return test.title.replace(testIdRegExp, "")
  };

  var updateStats = function updateStats(type, num){
    var el
    switch(type){
      case "passed":
        el = $("#tests-passed")
        break;
      case "failed":
        el = $("#test-failed")
        break;
    }

    el.find("span.num").text(num)
  };

  var addOutputLog = function addOutputLog(obj){
    tmpl = _.template(
      "<li>" +
        "<span class='pull-left'>" +
          "<span class='test'><%= title %></span>" +
          "<span class='msg'><%= msg %></span>" +
        "</span>" +
        "<span class='pull-right'>" +
          "<span class='id'><%= id %></span>" +
          "<i class='fa fa-chevron-right'></i>" +
        "</span>" +
      "</li>"
    );
    $("#ecl-panel ul").append( tmpl(obj) );
  }

  var nextSuite = function nextSuite(runner){
    var next = iframes.shift();
    // $LAB.script("/specs/" + next + "_spec.js").wait(function(){
    //   console.log("loaded", next);
    //   runner.run()
    // });

    if(next){
      // find any existing iframes
      var found = $("iframe[src='/iframes/" + next + ".html']")

      if(found){
        // store its old data id
        var id = found.data("id")

        // remove the suite from our stats
        stats.suites[id] = {};

        // remove the iframe DOM
        found.remove()

        // if we have an active global id
        // dont remove the children tests
        // instead just nuke this single
        // test
        if (activeId) {
          $("#" + activeId).parent().prop("id", "test-" + activeId).empty()

        } else {
          // remove the existing test html
          $("#" + id).empty()
        }
      }

      // create the new one
      var iframe = $("<iframe />", {
        src: "/iframes/" + next + ".html",
        "class": "iframe-spec",
        load: function(){
          console.info("loaded!", iframe, this);
          // debugger
          suite         = this.contentWindow.mocha.suite
          suite.window  = this.contentWindow
          suite.id      = id || _.uniqueId("suite")

          suite.beforeAll(Ecl.beforeAll)

          suite.afterEach(Ecl.afterEach)

          // add the suite to the stats
          stats.suites[suite.id] = {
            suite: suite,
            passed: 0,
            failed: 0,
            total: suite.total()
          }

          $(this).data("id", suite.id)

          // runner.run()
          // run each of the iframes suite independently
          runner.runSuite(suite, function(){
            console.log("runSuite finished", arguments, this)
          });
        }
      });

      console.warn("iframe", iframe, iframe[0], iframe[0].contentWindow)

      // _.extend(iframe[0].contentWindow, {
      //   expect: chai.expect,
      //   should: chai.should(),
      //   assert: chai.assert
      // });

      iframe.appendTo($("#iframe-container"))
    }
  };

  // Mocha.process.on = function(e, fn){
  //   console.warn("MOCHA PROCESS ON", fn, this)
  // };

  // handle failing when its not a test
  // look at the parent title?
  var fail = Mocha.Runner.prototype.fail
  Mocha.Runner.prototype.fail = function(test, err) {
    console.warn("MOCHA RUNNER FAIL", test, err);
    Ecl.error(test, err.message, {err: err})
    // window.onerror.call(this, err)
    // console.warn(err.lineNumber)
    // throw new Error(err)
    console.error(err)
    // throw err
  }

  var emit = Mocha.Runner.prototype.emit
  Mocha.Runner.prototype.emit = function() {
    console.log("Child Runner Proto emit", window, this, arguments, emit);
    var args = [].slice.apply(arguments);

    switch(args[0]){
      case "suite":
        // dont return here, just log something special since its the root suite
        if(args[1].root) return;

        // proxy the Ecl methods here with the suite's title + id
        console.log("suite title is", args[1].title);
        break;
      case "test":
        // proxy all of the Ecl methods here with the test's title + id
        console.log("test title is:", args[1].title, args[1], getSuiteId(args[1]))
        Ecl.patch(args[1])
        break;

    };

    emit.apply(this, arguments);
  };

  window.Ecl = new Eclectus()
  window.mocha = new Mocha({reporter: Eclectus.Reporter})

})(Mocha);

window.onload = function () {
  console.log("onload!");
  mocha.run();
};