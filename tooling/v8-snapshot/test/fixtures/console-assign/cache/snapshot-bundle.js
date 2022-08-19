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

// reassign-console.js
__commonJS["./reassign-console.js"] = function(exports, module2, __filename, __dirname, require) {
  function assign() {
    if (typeof get_console() == "undefined") {
      console = function() {
      };
    }
    get_console().log("this should also be rewritten");
    return 1;
  }
  module2.exports = assign;
};

// using-console.js
__commonJS["./using-console.js"] = function(exports, module2, __filename, __dirname, require) {
  function foo() {
    get_console().log("this console should be rewritten");
    return 2;
  }
  module2.exports = foo;
};

// entry.js
__commonJS["./entry.js"] = function(exports, module2, __filename, __dirname, require) {
  var invalid = require("./reassign-console", "./reassign-console.js", (typeof __filename2 !== 'undefined' ? __filename2 : __filename), (typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname));
  var valid = require("./using-console", "./using-console.js", (typeof __filename2 !== 'undefined' ? __filename2 : __filename), (typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname));
  function entry() {
    return valid() + invalid();
  }
  module2.exports = entry;
};


module.exports = __commonJS