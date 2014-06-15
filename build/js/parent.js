// need to use window.onload here so all of
//our iframes and tests are loaded
(function(Mocha){

  iframes = ["foo", "bar"];

  var ecl = function ecl(runner){
    console.log("runner is", runner)

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
      console.log("test end", test)
    });
  }

  var nextSuite = function nextSuite(runner){
    next = iframes.shift();
    // $LAB.script("/specs/" + next + "_spec.js").wait(function(){
    //   console.log("loaded", next);
    //   runner.run()
    // });
    console.log("next is", next);
    if(next){
      iframe = $("<iframe />", {
        src: "/iframes/" + next + ".html",
        load: function(){
          console.info("loaded!", iframe, this);
          // debugger

          // runner.run()
          // run each of the iframes suite independently
          runner.runSuite(this.contentWindow.mocha.suite, function(){
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