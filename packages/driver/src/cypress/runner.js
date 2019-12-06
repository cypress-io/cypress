/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS203: Remove `|| {}` from converted for-own loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const moment = require("moment");
const Promise = require("bluebird");
const Pending = require("mocha/lib/pending");

const $Log = require("./log");
const $utils = require("./utils");

const defaultGrepRe   = /.*/;
const mochaCtxKeysRe  = /^(_runnable|test)$/;
const betweenQuotesRe = /\"(.+?)\"/;

const HOOKS = "beforeAll beforeEach afterEach afterAll".split(" ");
const TEST_BEFORE_RUN_EVENT = "runner:test:before:run";
const TEST_AFTER_RUN_EVENT = "runner:test:after:run";

const ERROR_PROPS      = "message type name stack fileName lineNumber columnNumber host uncaught actual expected showDiff isPending".split(" ");
const RUNNABLE_LOGS    = "routes agents commands".split(" ");
const RUNNABLE_PROPS   = "id title root hookName hookId err state failedFromHookId body speed type duration wallClockStartedAt wallClockDuration timings".split(" ");

// ## initial payload
// {
//   suites: [
//     {id: "r1"}, {id: "r4", suiteId: "r1"}
//   ]
//   tests: [
//     {id: "r2", title: "foo", suiteId: "r1"}
//   ]
// }

// ## normalized
// {
//   {
//     root: true
//     suites: []
//     tests: []
//   }
// }

// ## resetting state (get back from server)
// {
//   scrollTop: 100
//   tests: {
//     r2: {id: "r2", title: "foo", suiteId: "r1", state: "passed", err: "", routes: [
//         {}, {}
//       ]
//       agents: [
//       ]
//       commands: [
//         {}, {}, {}
//       ]
//     }}
//
//     r3: {id: "r3", title: "bar", suiteId: "r1", state: "failed", logs: {
//       routes: [
//         {}, {}
//       ]
//       spies: [
//       ]
//       commands: [
//         {}, {}, {}
//       ]
//     }}
//   ]
// }

const fire = function(event, runnable, Cypress) {
  if (runnable._fired == null) { runnable._fired = {}; }
  runnable._fired[event] = true;

  //# dont fire anything again if we are skipped
  if (runnable._ALREADY_RAN) { return; }

  return Cypress.action(event, wrap(runnable), runnable);
};

const fired = (event, runnable) => !!(runnable._fired && runnable._fired[event]);

const testBeforeRunAsync = (test, Cypress) =>
  Promise.try(function() {
    if (!fired("runner:test:before:run:async", test)) {
      return fire("runner:test:before:run:async", test, Cypress);
    }
  })
;

const runnableAfterRunAsync = function(runnable, Cypress) {
  runnable.clearTimeout();
  return Promise.try(function() {
    if (!fired("runner:runnable:after:run:async", runnable)) {
      return fire("runner:runnable:after:run:async", runnable, Cypress);
    }
  });
};

const testAfterRun = function(test, Cypress) {
  test.clearTimeout();
  if (!fired(TEST_AFTER_RUN_EVENT, test)) {
    setWallClockDuration(test);
    fire(TEST_AFTER_RUN_EVENT, test, Cypress);

    //# perf loop only through
    //# a tests OWN properties and not
    //# inherited properties from its shared ctx
    for (let key of Object.keys(test.ctx || {})) {
      const value = test.ctx[key];
      if (_.isObject(value) && !mochaCtxKeysRe.test(key)) {
        //# nuke any object properties that come from
        //# cy.as() aliases or anything set from 'this'
        //# so we aggressively perform GC and prevent obj
        //# ref's from building up
        test.ctx[key] = undefined;
      }
    }

    //# reset the fn to be empty function
    //# for GC to be aggressive and prevent
    //# closures from hold references
    test.fn = function() {};

    //# prevent loop comprehension
    return null;
  }
};

const setTestTimingsForHook = function(test, hookName, obj) {
  if (test.timings == null) { test.timings = {}; }
  if (test.timings[hookName] == null) { test.timings[hookName] = []; }
  return test.timings[hookName].push(obj);
};

const setTestTimings = function(test, name, obj) {
  if (test.timings == null) { test.timings = {}; }
  return test.timings[name] = obj;
};

var setWallClockDuration = test => test.wallClockDuration = new Date() - test.wallClockStartedAt;

const reduceProps = (obj, props) =>
  _.reduce(props, function(memo, prop) {
    if (_.has(obj, prop) || (obj[prop] !== undefined)) {
      memo[prop] = obj[prop];
    }
    return memo;
  }
  , {})
;

var wrap = runnable =>
  //# we need to optimize wrap by converting
  //# tests to an id-based object which prevents
  //# us from recursively iterating through every
  //# parent since we could just return the found test
  reduceProps(runnable, RUNNABLE_PROPS)
;

const wrapAll = runnable =>
  _.extend(
    {},
    reduceProps(runnable, RUNNABLE_PROPS),
    reduceProps(runnable, RUNNABLE_LOGS)
  )
;

const wrapErr = err => reduceProps(err, ERROR_PROPS);

const getHookName = function(hook) {
  //# find the name of the hook by parsing its
  //# title and pulling out whats between the quotes
  const name = hook.title.match(betweenQuotesRe);
  return name && name[1];
};

const forceGc = function(obj) {
  //# aggressively forces GC by purging
  //# references to ctx, and removes callback
  //# functions for closures
  for (let key of Object.keys(obj.ctx || {})) {
    const value = obj.ctx[key];
    obj.ctx[key] = undefined;
  }

  if (obj.fn) {
    return obj.fn = function() {};
  }
};

var anyTestInSuite = function(suite, fn) {
  for (let test of suite.tests) {
    if (fn(test) === true) { return true; }
  }

  for (suite of suite.suites) {
    if (anyTestInSuite(suite, fn) === true) { return true; }
  }

  //# else return false
  return false;
};

const eachHookInSuite = function(suite, fn) {
  for (let type of HOOKS) {
    for (let hook of suite[`_${type}`]) {
      fn(hook);
    }
  }

  //# prevent loop comprehension
  return null;
};

var onFirstTest = function(suite, fn) {
  let test;
  for (test of suite.tests) {
    if (fn(test)) { return test; }
  }

  for (suite of suite.suites) {
    if (test = onFirstTest(suite, fn)) { return test; }
  }
};

const getAllSiblingTests = function(suite, getTestById) {
  const tests = [];
  suite.eachTest(test => {
    //# iterate through each of our suites tests.
    //# this will iterate through all nested tests
    //# as well.  and then we add it only if its
    //# in our grepp'd tests array
    if (getTestById(test.id)) {
      return tests.push(test);
    }
  });

  return tests;
};

const getTestFromHook = function(hook, suite, getTestById) {
  //# if theres already a currentTest use that
  let found, test;
  if (test = hook != null ? hook.ctx.currentTest : undefined) { return test; }

  //# if we have a hook id then attempt
  //# to find the test by its id
  if (hook != null ? hook.id : undefined) {
    found = onFirstTest(suite, test => {
      return hook.id === test.id;
    });

    if (found) { return found; }
  }

  //# returns us the very first test
  //# which is in our grepped tests array
  //# based on walking down the current suite
  //# iterating through each test until it matches
  found = onFirstTest(suite, test => {
    return getTestById(test.id);
  });

  if (found) { return found; }

  //# have one last final fallback where
  //# we just return true on the very first
  //# test (used in testing)
  return onFirstTest(suite, test => true);
};

//# we have to see if this is the last suite amongst
//# its siblings.  but first we have to filter out
//# suites which dont have a grep'd test in them
const isLastSuite = function(suite, tests) {
  if (suite.root) { return false; }

  //# grab all of the suites from our grep'd tests
  //# including all of their ancestor suites!
  const suites = _.reduce(tests, function(memo, test) {
    let parent;
    while ((parent = test.parent)) {
      memo.push(parent);
      test = parent;
    }
    return memo;
  }
  , []);

  //# intersect them with our parent suites and see if the last one is us
  return _
  .chain(suites)
  .uniq()
  .intersection(suite.parent.suites)
  .last()
  .value() === suite;
};

//# we are the last test that will run in the suite
//# if we're the last test in the tests array or
//# if we failed from a hook and that hook was 'before'
//# since then mocha skips the remaining tests in the suite
const lastTestThatWillRunInSuite = (test, tests) => isLastTest(test, tests) || (test.failedFromHookId && (test.hookName === "before all"));

var isLastTest = (test, tests) => test === _.last(tests);

const isRootSuite = suite => suite && suite.root;

const overrideRunnerHook = function(Cypress, _runner, getTestById, getTest, setTest, getTests) {
  //# bail if our _runner doesnt have a hook.
  //# useful in tests
  if (!_runner.hook) { return; }

  //# monkey patch the hook event so we can wrap
  //# 'test:after:run' around all of
  //# the hooks surrounding a test runnable
  const _runnerHook = _runner.hook;

  return _runner.hook = function(name, fn) {
    const hooks = this.suite[`_${name}`];

    const allTests = getTests();

    const changeFnToRunAfterHooks = function() {
      const originalFn = fn;

      const test = getTest();

      //# reset fn to invoke the hooks
      //# first but before calling next(err)
      //# we fire our events
      return fn = function() {
        setTest(null);

        testAfterRun(test, Cypress);

        //# and now invoke next(err)
        return originalFn.apply(window, arguments);
      };
    };

    switch (name) {
      case "afterEach":
        var t = getTest();

        //# find all of the grep'd _tests which share
        //# the same parent suite as our current _test
        var tests = getAllSiblingTests(t.parent, getTestById);

        //# make sure this test isnt the last test overall but also
        //# isnt the last test in our grep'd parent suite's tests array
        if (this.suite.root && (t !== _.last(allTests)) && (t !== _.last(tests))) {
          changeFnToRunAfterHooks();
        }
        break;

      case "afterAll":
        //# find all of the grep'd allTests which share
        //# the same parent suite as our current _test
        if (t = getTest()) {
          const siblings = getAllSiblingTests(t.parent, getTestById);

          //# 1. if we're the very last test in the entire allTests
          //#    we wait until the root suite fires
          //# 2. else we wait until the very last possible moment by waiting
          //#    until the root suite is the parent of the current suite
          //#    since that will bubble up IF we're the last nested suite
          //# 3. else if we arent the last nested suite we fire if we're
          //#    the last test that will run
          if (
              (isRootSuite(this.suite) && isLastTest(t, allTests)) ||
              (isRootSuite(this.suite.parent) && lastTestThatWillRunInSuite(t, siblings)) ||
              (!isLastSuite(this.suite, allTests) && lastTestThatWillRunInSuite(t, siblings))
            ) {
            changeFnToRunAfterHooks();
          }
        }
        break;
    }

    return _runnerHook.call(this, name, fn);
  };
};

const matchesGrep = function(runnable, grep) {
  //# we have optimized this iteration to the maximum.
  //# we memoize the existential matchesGrep property
  //# so we dont regex again needlessly when going
  //# through tests which have already been set earlier
  if (((runnable.matchesGrep == null)) || (!_.isEqual(runnable.grepRe, grep))) {
    runnable.grepRe      = grep;
    runnable.matchesGrep = grep.test(runnable.fullTitle());
  }

  return runnable.matchesGrep;
};

const getTestResults = tests =>
  _.map(tests, function(test) {
    const obj = _.pick(test, "id", "duration", "state");
    obj.title = test.originalTitle;
    //# TODO FIX THIS!
    if (!obj.state) {
      obj.state = "skipped";
    }
    return obj;
  })
;

const normalizeAll = function(suite, initialTests = {}, grep, setTestsById, setTests, onRunnable, onLogsById, getTestId) {
  let hasTests = false;

  //# only loop until we find the first test
  onFirstTest(suite, test => hasTests = true);

  //# if we dont have any tests then bail
  if (!hasTests) { return; }

  //# we are doing a super perf loop here where
  //# we hand back a normalized object but also
  //# create optimized lookups for the tests without
  //# traversing through it multiple times
  const tests         = {};
  const grepIsDefault = _.isEqual(grep, defaultGrepRe);

  const obj = normalize(suite, tests, initialTests, grep, grepIsDefault, onRunnable, onLogsById, getTestId);

  if (setTestsById) {
    //# use callback here to hand back
    //# the optimized tests
    setTestsById(tests);
  }

  if (setTests) {
    //# same pattern here
    setTests(_.values(tests));
  }

  return obj;
};

var normalize = function(runnable, tests, initialTests, grep, grepIsDefault, onRunnable, onLogsById, getTestId) {
  const normalizer = runnable => {
    let i;
    runnable.id = getTestId();

    //# tests have a type of 'test' whereas suites do not have a type property
    if (runnable.type == null) { runnable.type = "suite"; }

    if (onRunnable) {
      onRunnable(runnable);
    }

    //# if we have a runnable in the initial state
    //# then merge in existing properties into the runnable
    if (i = initialTests[runnable.id]) {
      _.each(RUNNABLE_LOGS, type => {
        return _.each(i[type], onLogsById);
      });

      _.extend(runnable, i);
    }

    //# reduce this runnable down to its props
    //# and collections
    return wrapAll(runnable);
  };

  const push = test => {
    return tests[test.id] != null ? tests[test.id] : (tests[test.id] = test);
  };

  const obj = normalizer(runnable);

  //# if we have a default grep then avoid
  //# grepping altogether and just push
  //# tests into the array of tests
  if (grepIsDefault) {
    if (runnable.type === "test") {
      push(runnable);
    }

    //# and recursively iterate and normalize all other _runnables
    _.each({tests: runnable.tests, suites: runnable.suites}, (_runnables, key) => {
      if (runnable[key]) {
        return obj[key] = _.map(_runnables, runnable => {
          return normalize(runnable, tests, initialTests, grep, grepIsDefault, onRunnable, onLogsById, getTestId);
        });
      }
    });
  } else {
    //# iterate through all tests and only push them in
    //# if they match the current grep
    obj.tests = _.reduce(runnable.tests != null ? runnable.tests : [], (memo, test) => {
      //# only push in the test if it matches
      //# our grep
      if (matchesGrep(test, grep)) {
        memo.push(normalizer(test));
        push(test);
      }
      return memo;
    }
    , []);

    //# and go through the suites
    obj.suites = _.reduce(runnable.suites != null ? runnable.suites : [], (memo, suite) => {
      //# but only add them if a single nested test
      //# actually matches the grep
      const any = anyTestInSuite(suite, test => {
        return matchesGrep(test, grep);
      });

      if (any) {
        memo.push(
          normalize(
            suite,
            tests,
            initialTests,
            grep,
            grepIsDefault,
            onRunnable,
            onLogsById,
            getTestId
          )
        );
      }

      return memo;
    }
    , []);
  }

  return obj;
};

const afterEachFailed = function(Cypress, test, err) {
  test.state = "failed";
  test.err = wrapErr(err);

  return Cypress.action("runner:test:end", wrap(test));
};

const hookFailed = function(hook, err, hookName, getTestById, getTest) {
  //# finds the test by returning the first test from
  //# the parent or looping through the suites until
  //# it finds the first test
  const test = getTest() || getTestFromHook(hook, hook.parent, getTestById);
  test.err = err;
  test.state = "failed";
  test.duration = hook.duration; //# TODO: nope (?)
  test.hookName = hookName; //# TODO: why are we doing this?
  test.failedFromHookId = hook.hookId;

  if (hook.alreadyEmittedMocha) {
    //# TODO: won't this always hit right here???
    //# when would the hook not be emitted at this point?
    return test.alreadyEmittedMocha = true;
  } else {
    return Cypress.action("runner:test:end", wrap(test));
  }
};

const _runnerListeners = function(_runner, Cypress, _emissions, getTestById, getTest, setTest, getHookId) {
  _runner.on("start", () =>
    Cypress.action("runner:start", {
      start: new Date()
    })
  );

  _runner.on("end", () =>
    Cypress.action("runner:end", {
      end: new Date()
    })
  );

  _runner.on("suite", function(suite) {
    if (_emissions.started[suite.id]) { return; }

    _emissions.started[suite.id] = true;

    return Cypress.action("runner:suite:start", wrap(suite));
  });

  _runner.on("suite end", function(suite) {
    //# cleanup our suite + its hooks
    forceGc(suite);
    eachHookInSuite(suite, forceGc);

    if (_emissions.ended[suite.id]) { return; }

    _emissions.ended[suite.id] = true;

    return Cypress.action("runner:suite:end", wrap(suite));
  });

  _runner.on("hook", function(hook) {
    if (hook.hookId == null) { hook.hookId = getHookId(); }
    if (hook.hookName == null) { hook.hookName = getHookName(hook); }

    //# mocha incorrectly sets currentTest on before all's.
    //# if there is a nested suite with a before, then
    //# currentTest will refer to the previous test run
    //# and not our current
    if ((hook.hookName === "before all") && hook.ctx.currentTest) {
      delete hook.ctx.currentTest;
    }

    //# set the hook's id from the test because
    //# hooks do not have their own id, their
    //# commands need to grouped with the test
    //# and we can only associate them by this id
    const test = getTest() || getTestFromHook(hook, hook.parent, getTestById);
    hook.id = test.id;
    hook.ctx.currentTest = test;

    //# make sure we set this test as the current now
    //# else its possible that our TEST_AFTER_RUN_EVENT
    //# will never fire if this failed in a before hook
    setTest(test);

    return Cypress.action("runner:hook:start", wrap(hook));
  });

  _runner.on("hook end", hook => Cypress.action("runner:hook:end", wrap(hook)));

  _runner.on("test", function(test) {
    setTest(test);

    if (_emissions.started[test.id]) { return; }

    _emissions.started[test.id] = true;

    return Cypress.action("runner:test:start", wrap(test));
  });

  _runner.on("test end", function(test) {
    if (_emissions.ended[test.id]) { return; }

    _emissions.ended[test.id] = true;

    return Cypress.action("runner:test:end", wrap(test));
  });

  _runner.on("pass", test => Cypress.action("runner:pass", wrap(test)));

  //# if a test is pending mocha will only
  //# emit the pending event instead of the test
  //# so we normalize the pending / test events
  _runner.on("pending", function(test) {
    //# do nothing if our test is skipped
    if (test._ALREADY_RAN) { return; }

    if (!fired(TEST_BEFORE_RUN_EVENT, test)) {
      fire(TEST_BEFORE_RUN_EVENT, test, Cypress);
    }

    test.state = "pending";

    if (!test.alreadyEmittedMocha) {
      //# do not double emit this event
      test.alreadyEmittedMocha = true;

      Cypress.action("runner:pending", wrap(test));
    }

    this.emit("test", test);

    //# if this is not the last test amongst its siblings
    //# then go ahead and fire its test:after:run event
    //# else this will not get called
    const tests = getAllSiblingTests(test.parent, getTestById);

    if (_.last(tests) !== test) {
      return fire(TEST_AFTER_RUN_EVENT, test, Cypress);
    }
  });

  return _runner.on("fail", function(runnable, err) {
    let hookName;
    const isHook = runnable.type === "hook";

    if (isHook) {
      const parentTitle = runnable.parent.title;
      hookName    = getHookName(runnable);

      //# append a friendly message to the error indicating
      //# we're skipping the remaining tests in this suite
      err = $utils.appendErrMsg(
        err,
        $utils.errMessageByPath("uncaught.error_in_hook", {
          parentTitle,
          hookName
        })
      );
    }

    //# always set runnable err so we can tap into
    //# taking a screenshot on error
    runnable.err = wrapErr(err);

    if (!runnable.alreadyEmittedMocha) {
      //# do not double emit this event
      runnable.alreadyEmittedMocha = true;

      Cypress.action("runner:fail", wrap(runnable), runnable.err);
    }

    //# if we've already fired the test after run event
    //# it means that this runnable likely failed due to
    //# a double done(err) callback, and we need to fire
    //# this again!
    if (fired(TEST_AFTER_RUN_EVENT, runnable)) {
      fire(TEST_AFTER_RUN_EVENT, runnable, Cypress);
    }

    if (isHook) {
      //# if a hook fails (such as a before) then the test will never
      //# get run and we'll need to make sure we set the test so that
      //# the TEST_AFTER_RUN_EVENT fires correctly
      return hookFailed(runnable, runnable.err, hookName, getTestById, getTest);
    }
  });
};

const create = function(specWindow, mocha, Cypress, cy) {
  let _id = 0;
  let _hookId = 0;
  let _uncaughtFn = null;

  const _runner = mocha.getRunner();
  _runner.suite = mocha.getRootSuite();

  specWindow.onerror = function() {
    let err = cy.onSpecWindowUncaughtException.apply(cy, arguments);

    //# err will not be returned if cy can associate this
    //# uncaught exception to an existing runnable
    if (!err) { return true; }

    const todoMsg = function() {
      if (!Cypress.config("isTextTerminal")) {
        return "Check your console for the stack trace or click this message to see where it originated from.";
      }
    };

    const append = () =>
      _.chain([
        "Cypress could not associate this error to any specific test.",
        "We dynamically generated a new test to display this failure.",
        todoMsg()
      ])
      .compact()
      .join("\n\n")
    ;

    //# else  do the same thing as mocha here
    err = $utils.appendErrMsg(err, append());

    const throwErr = function() {
      throw err;
    };

    //# we could not associate this error
    //# and shouldn't ever start our run
    _uncaughtFn = throwErr;

    //# return undefined so the browser does its default
    //# uncaught exception behavior (logging to console)
    return undefined;
  };

  //# hold onto the _runnables for faster lookup later
  let _stopped = false;
  let _test = null;
  let _tests = [];
  let _testsById = {};
  const _testsQueue = [];
  const _testsQueueById = {};
  const _runnables = [];
  const _logsById = {};
  let _emissions = {
    started: {},
    ended:   {}
  };
  let _startTime = null;

  const getTestId = () =>
    //# increment the id counter
    `r${_id += 1}`
  ;

  const getHookId = () => `h${_hookId += 1}`;

  const setTestsById = tbid => _testsById = tbid;

  const setTests = t => _tests = t;

  const getTests = () => _tests;

  const onRunnable = r => _runnables.push(r);

  const onLogsById = l => _logsById[l.id] = l;

  const getTest = () => _test;

  const setTest = t => _test = t;

  const getTestById = function(id) {
    //# perf short circuit
    if (!id) { return; }

    return _testsById[id];
  };

  overrideRunnerHook(Cypress, _runner, getTestById, getTest, setTest, getTests);

  return {
    grep(re) {
      if (arguments.length) {
        return _runner._grep = re;
      } else {
        //# grab grep from the mocha _runner
        //# or just set it to all in case
        //# there is a mocha regression
        return _runner._grep != null ? _runner._grep : (_runner._grep = defaultGrepRe);
      }
    },

    options(options = {}) {
      //# TODO
      //# need to handle
      //# ignoreLeaks, asyncOnly, globals

      let re;
      if (re = options.grep) {
        return this.grep(re);
      }
    },

    normalizeAll(tests) {
      //# if we have an uncaught error then slice out
      //# all of the tests and suites and just generate
      //# a single test since we received an uncaught
      //# error prior to processing any of mocha's tests
      //# which could have occurred in a separate support file
      if (_uncaughtFn) {
        _runner.suite.suites = [];
        _runner.suite.tests = [];

        //# create a runnable to associate for the failure
        mocha.createRootTest("An uncaught error was detected outside of a test", _uncaughtFn);
      }

      return normalizeAll(
        _runner.suite,
        tests,
        this.grep(),
        setTestsById,
        setTests,
        onRunnable,
        onLogsById,
        getTestId
      );
    },

    run(fn) {
      if (_startTime == null) { _startTime = moment().toJSON(); }

      _runnerListeners(_runner, Cypress, _emissions, getTestById, getTest, setTest, getHookId);

      return _runner.run(function(failures) {
        //# if we happen to make it all the way through
        //# the run, then just set _stopped to true here
        _stopped = true;

        //# TODO this functions is not correctly
        //# synchronized with the 'end' event that
        //# we manage because of uncaught hook errors
        if (fn) {
          return fn(failures, getTestResults(_tests));
        }
      });
    },

    onRunnableRun(runnableRun, runnable, args) {
      let lifecycleStart, test;
      if (!runnable.id) {
        throw new Error("runnable must have an id", runnable.id);
      }

      switch (runnable.type) {
        case "hook":
          test = getTest() || getTestFromHook(runnable, runnable.parent, getTestById);
          break;

        case "test":
          test = runnable;
          break;
      }

      //# closure for calculating the actual
      //# runtime of a runnables fn exection duration
      //# and also the run of the runnable:after:run:async event
      let wallClockStartedAt = null;
      let wallClockEnd = null;
      let fnDurationStart = null;
      let fnDurationEnd = null;
      let afterFnDurationStart = null;
      let afterFnDurationEnd = null;

      //# when this is a hook, capture the real start
      //# date so we can calculate our test's duration
      //# including all of its hooks
      wallClockStartedAt = new Date();

      if (!test.wallClockStartedAt) {
        //# if we don't have lifecycle timings yet
        lifecycleStart = wallClockStartedAt;
      }

      if (test.wallClockStartedAt == null) { test.wallClockStartedAt = wallClockStartedAt; }

      //# if this isnt a hook, then the name is 'test'
      const hookName = runnable.type === "hook" ? getHookName(runnable) : "test";

      //# if we haven't yet fired this event for this test
      //# that means that we need to reset the previous state
      //# of cy - since we now have a new 'test' and all of the
      //# associated _runnables will share this state
      if (!fired(TEST_BEFORE_RUN_EVENT, test)) {
        fire(TEST_BEFORE_RUN_EVENT, test, Cypress);
      }

      //# extract out the next(fn) which mocha uses to
      //# move to the next runnable - this will be our async seam
      const _next = args[0];

      const next = function(err) {
        //# now set the duration of the after runnable run async event
        afterFnDurationEnd = (wallClockEnd = new Date());

        switch (runnable.type) {
          case "hook":
            //# reset runnable duration to include lifecycle
            //# and afterFn timings purely for the mocha runner.
            //# this is what it 'feels' like to the user
            runnable.duration = wallClockEnd - wallClockStartedAt;

            setTestTimingsForHook(test, hookName, {
              hookId: runnable.hookId,
              fnDuration: fnDurationEnd - fnDurationStart,
              afterFnDuration: afterFnDurationEnd - afterFnDurationStart
            });
            break;

          case "test":
            //# if we are currently on a test then
            //# recalculate its duration to be based
            //# against that (purely for the mocha reporter)
            test.duration = wallClockEnd - test.wallClockStartedAt;

            //# but still preserve its actual function
            //# body duration for timings
            setTestTimings(test, "test", {
              fnDuration: fnDurationEnd - fnDurationStart,
              afterFnDuration: afterFnDurationEnd - afterFnDurationStart
            });
            break;
        }

        return _next(err);
      };

      const onNext = function(err) {
        //# when done with the function set that to end
        fnDurationEnd = new Date();

        //# and also set the afterFnDuration to this same date
        afterFnDurationStart = fnDurationEnd;

        //# attach error right now
        //# if we have one
        if (err) {
          if (err instanceof Pending) {
            err.isPending = true;
          }

          runnable.err = wrapErr(err);
        }

        return runnableAfterRunAsync(runnable, Cypress)
        .then(function() {
          //# once we complete callback with the
          //# original err
          next(err);

          //# return null here to signal to bluebird
          //# that we did not forget to return a promise
          //# because mocha internally does not return
          //# the test.run(fn)
          return null;}).catch(function(err) {
          next(err);

          //# return null here to signal to bluebird
          //# that we did not forget to return a promise
          //# because mocha internally does not return
          //# the test.run(fn)
          return null;
        });
      };

      //# our runnable is about to run, so let cy know. this enables
      //# us to always have a correct runnable set even when we are
      //# running lifecycle events
      //# and also get back a function result handler that we use as
      //# an async seam
      cy.setRunnable(runnable, hookName);

      //# TODO: handle promise timeouts here!
      //# whenever any runnable is about to run
      //# we figure out what test its associated to
      //# if its a hook, and then we fire the
      //# test:before:run:async action if its not
      //# been fired before for this test
      return testBeforeRunAsync(test, Cypress)
      .catch(function(err) {
        //# TODO: if our async tasks fail
        //# then allow us to cause the test
        //# to fail here by blowing up its fn
        //# callback
        const { fn } = runnable;

        const restore = () => runnable.fn = fn;

        return runnable.fn = function() {
          restore();

          throw err;
        };}).finally(function() {
        if (lifecycleStart) {
          //# capture how long the lifecycle took as part
          //# of the overall wallClockDuration of our test
          setTestTimings(test, "lifecycle", new Date() - lifecycleStart);
        }

        //# capture the moment we're about to invoke
        //# the runnable's callback function
        fnDurationStart = new Date();

        //# call the original method with our
        //# custom onNext function
        return runnableRun.call(runnable, onNext);
      });
    },

    getStartTime() {
      return _startTime;
    },

    setStartTime(iso) {
      return _startTime = iso;
    },

    countByTestState(tests, state) {
      const count = _.filter(tests, (test, key) => test.state === state);

      return count.length;
    },

    setNumLogs(num) {
      return $Log.setCounter(num);
    },

    getEmissions() {
      return _emissions;
    },

    getTestsState() {
      const id    = _test != null ? _test.id : undefined;
      const tests = {};

      //# bail if we dont have a current test
      if (!id) { return {}; }

      //# search through all of the tests
      //# until we find the current test
      //# and break then
      for (var test of _tests) {
        if (test.id === id) {
          break;
        } else {
          test = wrapAll(test);

          _.each(RUNNABLE_LOGS, function(type) {
            let logs;
            if (logs = test[type]) {
              return test[type] = _.map(logs, $Log.toSerializedJSON);
            }
          });

          tests[test.id] = test;
        }
      }

      return tests;
    },

    stop() {
      if (_stopped) {
        return;
      }

      _stopped = true;

      //# abort the run
      _runner.abort();

      //# emit the final 'end' event
      //# since our reporter depends on this event
      //# and mocha may never fire this becuase our
      //# runnable may never finish
      _runner.emit("end");

      //# remove all the listeners
      //# so no more events fire
      return _runner.removeAllListeners();
    },

    getDisplayPropsForLog: $Log.getDisplayProps,

    getConsolePropsForLogById(logId) {
      let attrs;
      if (attrs = _logsById[logId]) {
        return $Log.getConsoleProps(attrs);
      }
    },

    getSnapshotPropsForLogById(logId) {
      let attrs;
      if (attrs = _logsById[logId]) {
        return $Log.getSnapshotProps(attrs);
      }
    },

    getErrorByTestId(testId) {
      let test;
      if (test = getTestById(testId)) {
        return wrapErr(test.err);
      }
    },

    resumeAtTest(id, emissions = {}) {
      Cypress._RESUMED_AT_TEST = id;

      _emissions = emissions;

      for (let test of _tests) {
        if (test.id !== id) {
          test._ALREADY_RAN = true;
          test.pending = true;
        } else {
          //# bail so we can stop now
          return;
        }
      }
    },

    cleanupQueue(numTestsKeptInMemory) {
      var cleanup = function(queue) {
        if (queue.length > numTestsKeptInMemory) {
          const test = queue.shift();

          delete _testsQueueById[test.id];

          _.each(RUNNABLE_LOGS, logs =>
            _.each(test[logs], function(attrs) {
              //# we know our attrs have been cleaned
              //# now, so lets store that
              attrs._hasBeenCleanedUp = true;

              return $Log.reduceMemory(attrs);
            })
          );

          return cleanup(queue);
        }
      };

      return cleanup(_testsQueue);
    },

    addLog(attrs, isInteractive) {
      //# we dont need to hold a log reference
      //# to anything in memory when we're headless
      //# because you cannot inspect any logs
      let existing;
      if (!isInteractive) { return; }

      let test = getTestById(attrs.testId);

      //# bail if for whatever reason we
      //# cannot associate this log to a test
      if (!test) { return; }

      //# if this test isnt in the current queue
      //# then go ahead and add it
      if (!_testsQueueById[test.id]) {
        _testsQueueById[test.id] = true;
        _testsQueue.push(test);
      }

      if (existing = _logsById[attrs.id]) {
        //# because log:state:changed may
        //# fire at a later time, its possible
        //# we've already cleaned up these attrs
        //# and in that case we don't want to do
        //# anything at all
        if (existing._hasBeenCleanedUp) { return; }

        //# mutate the existing object
        return _.extend(existing, attrs);
      } else {
        _logsById[attrs.id] = attrs;

        const { testId, instrument } = attrs;

        if (test = getTestById(testId)) {
          //# pluralize the instrument
          //# as a property on the runnable
          let name;
          const logs = test[name = instrument + "s"] != null ? test[name] : (test[name] = []);

          //# else push it onto the logs
          return logs.push(attrs);
        }
      }
    }
  };
};

module.exports = {
  overrideRunnerHook,

  normalize,

  normalizeAll,

  create
};
