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

// static-deferred.js
__commonJS["./static-deferred.js"] = function(exports, module2, __filename, __dirname, require) {
  var isBuffer = (function () { throw new Error("[SNAPSHOT_CACHE_FAILURE] Cannot probe 'Buffer' properties") })();
  module2.exports = isBuffer;
};

// loads-static-deferred.js
__commonJS["./loads-static-deferred.js"] = function(exports, module2, __filename, __dirname, require) {

let isBuffer;
function __get_isBuffer__() {
  return isBuffer = isBuffer || (require("./static-deferred", "./static-deferred.js", (typeof __filename2 !== 'undefined' ? __filename2 : __filename), (typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname)))
}
  module2.exports = (__get_isBuffer__())("not a buffer");
};

// lateuses-static-deferred.js
__commonJS["./lateuses-static-deferred.js"] = function(exports, module2, __filename, __dirname, require) {

let isBuffer;
function __get_isBuffer__() {
  return isBuffer = isBuffer || (require("./static-deferred", "./static-deferred.js", (typeof __filename2 !== 'undefined' ? __filename2 : __filename), (typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname)))
}
  function lateUse(x) {
    return (__get_isBuffer__())(x);
  }
  module2.exports = lateUse;
};

// uses-loads-static-deferred.js
__commonJS["./uses-loads-static-deferred.js"] = function(exports, module2, __filename, __dirname, require) {

let isStringBuffer;
function __get_isStringBuffer__() {
  return isStringBuffer = isStringBuffer || (require("./loads-static-deferred", "./loads-static-deferred.js", (typeof __filename2 !== 'undefined' ? __filename2 : __filename), (typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname)))
}
  module2.exports = (__get_isStringBuffer__());
};

// uses-lateuses-static-deferred.js
__commonJS["./uses-lateuses-static-deferred.js"] = function(exports, module2, __filename, __dirname, require) {
  var isBuffer = require("./lateuses-static-deferred", "./lateuses-static-deferred.js", (typeof __filename2 !== 'undefined' ? __filename2 : __filename), (typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname));
  module2.exports = function areBuffer(x, y) {
    return isBuffer(x) && isBuffer(y);
  };
};

// loads-lateuses-static-deferred.js
__commonJS["./loads-lateuses-static-deferred.js"] = function(exports, module2, __filename, __dirname, require) {
  var isBuffer = require("./lateuses-static-deferred", "./lateuses-static-deferred.js", (typeof __filename2 !== 'undefined' ? __filename2 : __filename), (typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname));
  module2.exports = isBuffer("not a buffer");
};

// entry.js
__commonJS["./entry.js"] = function(exports, module2, __filename, __dirname, require) {
  Object.defineProperty(exports, "loads", { get: () => require("./loads-static-deferred", "./loads-static-deferred.js", (typeof __filename2 !== 'undefined' ? __filename2 : __filename), (typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname)) });
  exports.uses = require("./lateuses-static-deferred", "./lateuses-static-deferred.js", (typeof __filename2 !== 'undefined' ? __filename2 : __filename), (typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname));
  Object.defineProperty(exports, "usesLoads", { get: () => require("./uses-loads-static-deferred", "./uses-loads-static-deferred.js", (typeof __filename2 !== 'undefined' ? __filename2 : __filename), (typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname)) });
  exports.usesLateUses = require("./uses-lateuses-static-deferred", "./uses-lateuses-static-deferred.js", (typeof __filename2 !== 'undefined' ? __filename2 : __filename), (typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname));
  Object.defineProperty(exports, "loadsLateUses", { get: () => require("./loads-lateuses-static-deferred", "./loads-lateuses-static-deferred.js", (typeof __filename2 !== 'undefined' ? __filename2 : __filename), (typeof __dirname2 !== 'undefined' ? __dirname2 : __dirname)) });
};


module.exports = __commonJS