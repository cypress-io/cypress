function get_process() {
  if (typeof process === 'undefined') return undefined
  return process
}
function get_document() {
  if (typeof document === 'undefined') return undefined
  return document
}

function get_global() {
  if (typeof global === 'undefined') return undefined
  return global
}

function get_window() {
  if (typeof window === 'undefined') return undefined
  return window
}

function get_console() {
  if (typeof console === 'undefined') return undefined
  return console
}

let __pathResolver = {}
Object.defineProperties(__pathResolver, {
  resolve: {
    value: function resolve(_local) {
      throw new Error(
        '[SNAPSHOT_CACHE_FAILURE] Cannot resolve path in the snapshot'
      )
    },
    enumerable: false,
  },
})

function __resolve_path(local) {
  __pathResolver.resolve(local)
}

var __commonJS = {};

// valid-module.js
__commonJS["./valid-module.js"] = function(exports, module2, __filename, __dirname, require) {
  function foo() {
    get_console().log("this console should be rewritten");
    return 2;
  }
  module2.exports = foo;
};

// invoke-not-function.js
__commonJS["./invoke-not-function.js"] = function(exports, module, __filename, __dirname, require) {
  var ref;
  exports.some = (ref = Array.prototype.some) != null ? ref : function(fn) {
    var e, i, len1, ref1;
    ref1 = this;
    for (i = 0, len1 = ref1.length; i < len1; i++) {
      e = ref1[i];
      if (fn(e)) {
        return true;
      }
    }
    return false;
  };
};

// invoke-undefined.js
__commonJS["./invoke-undefined.js"] = function(exports, module, __filename, __dirname, require) {
  module.exports = __defined_late__();
  var __defined_late__ = function() {
  };
};

// invoke-push-on-undefined.js
__commonJS["./invoke-push-on-undefined.js"] = function(exports, module2, __filename, __dirname, require) {
  if (!get_process().browser) {

let cwd;
function __get_cwd__() {
  return cwd = cwd || (get_process().cwd())
}
    module2.paths.push((__get_cwd__()), path.join((__get_cwd__()), "node_modules"));
  }
};

// entry.js
__commonJS["./entry.js"] = function(exports, module2, __filename, __dirname, require) {
  var valid = require("./valid-module", "./valid-module.js", (typeof __filename2 !== 'undefined' ? __filename2 : __filename), (typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname));

let invalid1;
function __get_invalid1__() {
  return invalid1 = invalid1 || (require("./invoke-not-function", "./invoke-not-function.js", (typeof __filename2 !== 'undefined' ? __filename2 : __filename), (typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname)))
}

let invalid2;
function __get_invalid2__() {
  return invalid2 = invalid2 || (require("./invoke-undefined", "./invoke-undefined.js", (typeof __filename2 !== 'undefined' ? __filename2 : __filename), (typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname)))
}

let invalid3;
function __get_invalid3__() {
  return invalid3 = invalid3 || (require("./invoke-push-on-undefined", "./invoke-push-on-undefined.js", (typeof __filename2 !== 'undefined' ? __filename2 : __filename), (typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname)))
}
  function entry() {
    return valid() + (__get_invalid1__())() + (__get_invalid2__())() + (__get_invalid3__())();
  }
  module2.exports = entry;
};


module.exports = __commonJS