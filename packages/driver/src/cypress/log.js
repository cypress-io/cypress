/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const $ = require("jquery");
const clone = require("clone");

const $Snapshots = require("../cy/snapshots");
const $Events = require("./events");
const $dom = require("../dom");
const $utils = require("./utils");

//# adds class methods for command, route, and agent logging
//# including the intermediate $Log interface
const CypressErrorRe  = /(AssertionError|CypressError)/;
const groupsOrTableRe = /^(groups|table)$/;
const parentOrChildRe = /parent|child/;
const ERROR_PROPS     = "message type name stack fileName lineNumber columnNumber host uncaught actual expected showDiff".split(" ");
const SNAPSHOT_PROPS  = "id snapshots $el url coords highlightAttr scrollBy viewportWidth viewportHeight".split(" ");
const DISPLAY_PROPS   = "id alias aliasType callCount displayName end err event functionName hookName instrument isStubbed message method name numElements numResponses referencesAlias renderProps state testId type url visible".split(" ");
const BLACKLIST_PROPS = "snapshots".split(" ");

let delay = null;
let counter = 0;

const { HIGHLIGHT_ATTR } = $Snapshots;

const reduceMemory = attrs =>
  //# mutate attrs by nulling out
  //# object properties
  _.each(attrs, function(value, key) {
    if (_.isObject(value)) {
      return attrs[key] = null;
    }
  })
;

const toSerializedJSON = function(attrs) {
  const { isDom }      = $dom;
  const { isWindow }   = $dom;
  const { isDocument } = $dom;
  const { isElement }  = $dom;

  var stringify = function(value, key) {
    if (BLACKLIST_PROPS.includes(key)) { return null; }

    switch (false) {
      case !_.isArray(value):
        return _.map(value, stringify);

      case !isDom(value):
        return $dom.stringify(value, "short");

      case !_.isFunction(value) || !groupsOrTableRe.test(key):
        return value();

      case !_.isFunction(value):
        return value.toString();

      case !_.isObject(value):
        //# clone to nuke circular references
        //# and blow away anything that throws
        try {
          return _.mapValues(clone(value), stringify);
        } catch (err) {
          return null;
        }

      default:
        return value;
    }
  };

  return _.mapValues(attrs, stringify);
};

const getDisplayProps = attrs => _.pick(attrs, DISPLAY_PROPS);

const getConsoleProps = attrs => attrs.consoleProps;

const getSnapshotProps = attrs => _.pick(attrs, SNAPSHOT_PROPS);

const countLogsByTests = function(tests = {}) {
  if (_.isEmpty(tests)) { return 0; }

  return _
  .chain(tests)
  .map((test, key) => [].concat(test.agents, test.routes, test.commands)).flatten()
  .compact()
  .union([{id: 0}])
  .map("id")
  .max()
  .value();
};

//# TODO: fix this
const setCounter = num => counter = num;

const setDelay = val => delay = val != null ? val : 4;

const defaults = function(state, config, obj) {
  const instrument = obj.instrument != null ? obj.instrument : "command";

  //# dont set any defaults if this
  //# is an agent or route because we
  //# may not even be inside of a command
  if (instrument === "command") {
    const current = state("current");

    //# we are logging a command instrument by default
    _.defaults(obj, current != null ? current.pick("name", "type") : undefined);

    //# force duals to become either parents or childs
    //# normally this would be handled by the command itself
    //# but in cases where the command purposely does not log
    //# then it could still be logged during a failure, which
    //# is why we normalize its type value
    if (!parentOrChildRe.test(obj.type)) {
      //# does this command have a previously linked command
      //# by chainer id
      obj.type = (current != null ? current.hasPreviouslyLinkedCommand() : undefined) ? "child" : "parent";
    }

    _.defaults(obj, {
      event: false,
      renderProps() { return {}; },
      consoleProps() {
        //# if we don't have a current command just bail
        if (!current) { return {}; }

        const ret = $dom.isElement(current.get("subject")) ?
          $dom.getElements(current.get("subject"))
        :
          current.get("subject");

        return { Yielded: ret };
      }
    });

    // if obj.isCurrent
      //# stringify the obj.message (if it exists) or current.get("args")
    obj.message = $utils.stringify(obj.message != null ? obj.message : (current != null ? current.get("args") : undefined));

    //# allow type to by a dynamic function
    //# so it can conditionally return either
    //# parent or child (useful in assertions)
    if (_.isFunction(obj.type)) {
      obj.type = obj.type(current, state("subject"));
    }
  }

  return _.defaults(obj, {
    id:               (counter += 1),
    state:            "pending",
    instrument:       "command",
    url:              state("url"),
    hookName:         state("hookName"),
    testId:           __guard__(state("runnable"), x => x.id),
    viewportWidth:    state("viewportWidth"),
    viewportHeight:   state("viewportHeight"),
    referencesAlias:  undefined,
    alias:            undefined,
    aliasType:        undefined,
    message:          undefined,
    renderProps() { return {}; },
    consoleProps() { return {}; }
  });
};

const Log = function(cy, state, config, obj) {
  obj = defaults(state, config, obj);

  //# private attributes of each log
  const attributes = {};

  return {
    get(attr) {
      if (attr) { return attributes[attr]; } else { return attributes; }
    },

    unset(key) {
      return this.set(key, undefined);
    },

    invoke(key) {
      let left;
      const invoke = () => {
        //# ensure this is a callable function
        //# and set its default to empty object literal
        const fn = this.get(key);

        if (_.isFunction(fn)) {
          return fn();
        } else {
          return fn;
        }
      };

      return (left = invoke()) != null ? left : {};
    },

    serializeError() {
      let err;
      if ((err = this.get("error"))) {
        return _.reduce(ERROR_PROPS, function(memo, prop) {
          if (_.has(err, prop) || err[prop]) {
            memo[prop] = err[prop];
          }

          return memo;
        }
        , {});
      } else {
        return null;
      }
    },

    toJSON() {
      return _
      .chain(attributes)
      .omit("error")
      .omitBy(_.isFunction)
      .extend({
        err:          this.serializeError(),
        consoleProps: this.invoke("consoleProps"),
        renderProps:  this.invoke("renderProps")
      })
      .value();
    },

    set(key, val) {
      let oc;
      if (_.isString(key)) {
        obj = {};
        obj[key] = val;
      } else {
        obj = key;
      }

      if ("url" in obj) {
        //# always stringify the url property
        obj.url = (obj.url != null ? obj.url : "").toString();
      }

      //# convert onConsole to consoleProps
      //# for backwards compatibility
      if (oc = obj.onConsole) {
        obj.consoleProps = oc;
      }

      //# if we have an alias automatically
      //# figure out what type of alias it is
      if (obj.alias) {
        _.defaults(obj, {aliasType: obj.$el ? "dom" : "primitive"});
      }

      //# dont ever allow existing id's to be mutated
      if (attributes.id) {
        delete obj.id;
      }

      _.extend(attributes, obj);

      //# if we have an consoleProps function
      //# then re-wrap it
      if (obj && _.isFunction(obj.consoleProps)) {
        this.wrapConsoleProps();
      }

      if (obj && obj.$el) {
        this.setElAttrs();
      }

      this.fireChangeEvent();

      return this;
    },

    pick(...args) {
      args.unshift(attributes);
      return _.pick.apply(_, args);
    },

    publicInterface() {
      return {
        get:        _.bind(this.get, this),
        on:         _.bind(this.on, this),
        off:        _.bind(this.off, this),
        pick:       _.bind(this.pick, this),
        attributes
      };
    },

    snapshot(name, options = {}) {
      //# bail early and don't snapshot if we're in headless mode
      //# or we're not storing tests
      let left, next;
      if (!config("isInteractive") || (config("numTestsKeptInMemory") === 0)) {
        return this;
      }

      _.defaults(options, {
        at: null,
        next: null
      }
      );

      const snapshot = cy.createSnapshot(name, this.get("$el"));

      const snapshots = (left = this.get("snapshots")) != null ? left : [];

      //# insert at index 'at' or whatever is the next position
      snapshots[options.at || snapshots.length] = snapshot;

      this.set("snapshots", snapshots);

      if (next = options.next) {
        const fn = this.snapshot;
        this.snapshot = function() {
          //# restore the fn
          this.snapshot = fn;

          //# call orig fn with next as name
          return fn.call(this, next);
        };
      }

      return this;
    },

    error(err) {
      this.set({
        ended: true,
        error: err,
        state: "failed"
      });

      return this;
    },

    end() {
      //# dont set back to passed
      //# if we've already ended
      if (this.get("ended")) { return; }

      this.set({
        ended: true,
        state: "passed"
      });

      return this;
    },

    getError(err) {
      //# dont log stack traces on cypress errors
      //# or assertion errors
      if (CypressErrorRe.test(err.name)) {
        return err.toString();
      } else {
        return err.stack;
      }
    },

    setElAttrs() {
      const $el = this.get("$el");

      if (!$el) { return; }

      if (_.isElement($el)) {
        //# wrap the element in jquery
        //# if its just a plain element
        return this.set("$el", $($el), {silent: true});
      }

      //# if we've passed something like
      //# <window> or <document> here or
      //# a primitive then unset $el
      if (!$dom.isJquery($el)) {
        return this.unset("$el");
      }

      //# make sure all $el elements are visible!
      obj = {
        highlightAttr: HIGHLIGHT_ATTR,
        numElements:   $el.length,
        visible:       $el.length === $el.filter(":visible").length
      };

      return this.set(obj, {silent: true});
    },

    merge(log) {
      //# merges another logs attributes into
      //# ours by also removing / adding any properties
      //# on the original

      //# 1. calculate which properties to unset
      const unsets = _.chain(attributes).keys().without(..._.keys(log.get())).value();

      _.each(unsets, unset => {
        return this.unset(unset);
      });

      //# 2. merge in any other properties
      return this.set(log.get());
    },

    _shouldAutoEnd() {
      //# must be autoEnd
      //# and not already ended
      //# and not an event
      //# and a command
      return (this.get("autoEnd") !== false) &&
        (this.get("ended") !== true) &&
          (this.get("event") === false) &&
            (this.get("instrument") === "command");
    },

    finish() {
      //# end our command since our subject
      //# has been resolved at this point
      //# unless its already been 'ended'
      //# or has been specifically told not to auto resolve
      if (this._shouldAutoEnd()) {
        return this.snapshot().end();
      }
    },

    wrapConsoleProps() {
      const _this = this;

      const { consoleProps } = attributes;

      //# re-wrap consoleProps to set Command + Error defaults
      return attributes.consoleProps = function() {
        let err;
        const key = _this.get("event") ? "Event" : "Command";

        const consoleObj = {};
        consoleObj[key] = _this.get("name");

        //# merge in the other properties from consoleProps
        _.extend(consoleObj, consoleProps.apply(this, arguments));

        //# TODO: right here we need to automatically
        //# merge in "Yielded + Element" if there is an $el

        //# and finally add error if one exists
        if (err = _this.get("error")) {
          _.defaults(consoleObj, {
            Error: _this.getError(err)
          });
        }

        //# add note if no snapshot exists on command instruments
        if ((_this.get("instrument") === "command") && !_this.get("snapshots")) {
          consoleObj.Snapshot = "The snapshot is missing. Displaying current state of the DOM.";
        } else {
          delete consoleObj.Snapshot;
        }

        return consoleObj;
      };
    }
  };
};

const create = function(Cypress, cy, state, config) {
  counter = 0;
  const logs = {};

  //# give us the ability to change the delay for firing
  //# the change event, or default it to 4
  if (delay == null) { delay = setDelay(config("logAttrsDelay")); }

  const trigger = function(log, event) {
    //# bail if we never fired our initial log event
    if (!log._hasInitiallyLogged) { return; }

    //# bail if we've reset the logs due to a Cypress.abort
    if (!logs[log.get("id")]) { return; }

    const attrs = log.toJSON();

    //# only trigger this event if our last stored
    //# emitted attrs do not match the current toJSON
    if (!_.isEqual(log._emittedAttrs, attrs)) {
      log._emittedAttrs = attrs;

      log.emit(event, attrs);

      return Cypress.action(event, attrs, log);
    }
  };

  const triggerLog = function(log) {
    log._hasInitiallyLogged = true;

    return trigger(log, "command:log:added");
  };

  const addToLogs = function(log) {
    const id = log.get("id");

    return logs[id] = true;
  };

  const logFn = function(options = {}) {
    let err;
    if (!_.isObject(options)) {
      $utils.throwErrByPath("log.invalid_argument", {args: { arg: options }});
    }

    const attributes = {};

    const log = Log(cy, state, config, options);

    //# add event emitter interface
    $Events.extend(log);

    const triggerStateChanged = () => trigger(log, "command:log:changed");

    //# only fire the log:state:changed event
    //# as fast as every 4ms
    log.fireChangeEvent = _.debounce(triggerStateChanged, 4);

    log.set(options);

    //# if snapshot was passed
    //# in, go ahead and snapshot
    if (log.get("snapshot")) { log.snapshot(); }

    //# if end was passed in
    //# go ahead and end
    if (log.get("end")) { log.end({silent: true}); }

    if (err = log.get("error")) {
      log.error(err, {silent: true});
    }

    log.wrapConsoleProps();

    const onBeforeLog = state("onBeforeLog");

    //# dont trigger log if this function
    //# explicitly returns false
    if (_.isFunction(onBeforeLog)) {
      if (onBeforeLog.call(cy, log) === false) { return; }
    }

    //# set the log on the command
    __guard__(state("current"), x => x.log(log));

    addToLogs(log);

    triggerLog(log);

    //# if not current state then the log is being run
    //# with no command reference, so just end the log
    if (!state("current")) { log.end({silent: true}); }

    return log;
  };

  logFn._logs = logs;

  return logFn;
};

module.exports = {
  CypressErrorRe,
  
  reduceMemory,

  toSerializedJSON,

  getDisplayProps,

  getConsoleProps,

  getSnapshotProps,

  countLogsByTests,

  setCounter,

  create
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}