// need to use window.onload here so all of
//our iframes and tests are loaded
(function(Mocha){

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

  var ecl = function ecl(runner){
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
    while (obj.parent) {
      if (obj.id) {
        return obj.id
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
          suite = this.contentWindow.mocha.suite

          suite.id = id || _.uniqueId("suite")

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

  window.mocha = new Mocha({reporter: ecl})

  // var addIframe = function addIframe(){
  //   iframe = iframes.shift()

  //   if(iframe){

  //   }
  // }

})(Mocha);

window.onload = function () {
  console.log("onload!");
  mocha.run();
};