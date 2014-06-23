// need to use window.onload here so all of
//our iframes and tests are loaded
(function(Mocha){

  // need to find an easy way to proxy the 'Test ID'
  // from each iframe child into each of these methods
  var Eclectus = function() {
    this.logs = [];
    this.xhrs = [];

    this.output = {
      add: function(obj) {
        addOutputLog(obj);
        this.logs.push(obj);
      }
    };
  };

  var eclMethods = {
    log: function(title, id, msg) {
      this.output.add({
        title: title,
        id: id,
        type: "log",
        msg: msg
      });
      return this;
    },

    info: function(title, id, msg) {
      this.output.add({
        title: title,
        id: id,
        type: "info",
        msg: msg
      });
      return this;
    },

    warn: function(title, id, msg) {
      return this;
    },

    xhr: function(title, id, req, res) {
      return this;
    },

    find: function(title, id, el) {
      this.output.add({
        title: title,
        id: id,
        type: "dom",
        msg: "Finding el: '" + $(el).prop("nodeName").toLowerCase() + "' => " + (el.length ? "Found" : "Not Found")
      })
      return this;
    }
  };

  _.extend(Eclectus.prototype, {
    patch: function(title, id) {
      var fns = _.functions(eclMethods)
      var _this = this;

      // bind title + id args to each function
      _.each(fns, function(fn){
        // must use a separate object for eclMethods since we're
        // using those as buffer and re-partialing them each time
        _this[fn] = _.partial(eclMethods[fn], title, id)
      });
    }
  });

  var iframes = ["foo", "bar"];

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
    console.log("runner is", runner)

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
      console.log("test end", test, test.state)

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
    return (/\[(.{3})\]$/).exec(test.title)[1]
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
    $("#ecl-panel ul").append($("<li />", {
      text: obj.msg
    }));
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
          // console.info("loaded!", iframe, this);
          // debugger
          suite         = this.contentWindow.mocha.suite
          suite.window  = this.contentWindow
          suite.id      = id || _.uniqueId("suite")

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
      iframe.appendTo($("#iframe-container"))
    }
  };

  var emit = Mocha.Runner.prototype.emit
  Mocha.Runner.prototype.emit = function() {
    // console.log("Child Runner Proto emit", window, this, arguments, emit);
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
        Ecl.patch(args[1].title, getSuiteId(args[1]))
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