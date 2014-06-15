// need to use window.onload here so all of
//our iframes and tests are loaded
(function(Mocha){

  iframes = ["foo", "bar"];

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
        return memo + val;
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

    // runner.on("suite", function(suite){
    //   if (suite.root) return;
    //   console.log("suite", suite);
    // });

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
      suite = test.parent.parent;

      stat = stats.suites[suite.id];
      console.warn("stat is", suite, stat);
      if(test.state == "passed"){
        stat.passed += 1
      } else {
        stat.failed += 1
      }
    });
  }

  var nextSuite = function nextSuite(runner){
    next = iframes.shift();
    // $LAB.script("/specs/" + next + "_spec.js").wait(function(){
    //   console.log("loaded", next);
    //   runner.run()
    // });

    if(next){
      // find any existing iframes
      found = $("iframe[src='/iframes/" + next + ".html']")

      if(found){
        // store its old data id
        id = found.data("id")

        // remove the suite from our stats
        delete stats.suites[id]

        // remove the iframe DOM
        found.remove()
      }

      // create the new one
      iframe = $("<iframe />", {
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

  mocha = new Mocha({reporter: ecl})

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