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

// using-dirname-delayed.js
__commonJS["./using-dirname-delayed.js"] = function(exports, module2, __filename, __dirname, require) {
  function delayed() {
    return __resolve_path(typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname).length;
  }
  module2.exports = delayed;
};

// using-filename-init.js
__commonJS["./using-filename-init.js"] = function(exports, module2, __filename, __dirname, require) {
  module2.exports = "file://" + __resolve_path(typeof __filename2 !== 'undefined' ? __filename2 : __filename);
};

// entry.js
__commonJS["./entry.js"] = function(exports, module2, __filename, __dirname, require) {
  var valid = require("./valid-module", "./valid-module.js", (typeof __filename2 !== 'undefined' ? __filename2 : __filename), (typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname));
  var dirname = require("./using-dirname-delayed", "./using-dirname-delayed.js", (typeof __filename2 !== 'undefined' ? __filename2 : __filename), (typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname));

let filename;
function __get_filename__() {
  return filename = filename || (require("./using-filename-init", "./using-filename-init.js", (typeof __filename2 !== 'undefined' ? __filename2 : __filename), (typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname)))
}
  function entry() {
    return valid() + dirname() + (__get_filename__());
  }
  module2.exports = entry;
};


module.exports = __commonJS