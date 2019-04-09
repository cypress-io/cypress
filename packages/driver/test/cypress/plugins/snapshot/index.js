"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var snapshotCore = require("snap-shot-core");
var _ = require("lodash");
var Snapshot = /** @class */ (function () {
    function Snapshot(on) {
        var _this = this;
        this.on = on;
        this.snapshotIndex = {};
        this.snapshotRestore = function () {
            // snapshotCore.restore()
            _this.snapshotIndex = {};
            return null;
        };
        // export function
        this.getSnapshot = function (opts) {
            var result = null;
            _this.snapshotIndex[opts.specName] = (_this.snapshotIndex[opts.specName] || 0) + 1;
            opts = _.defaults(opts, {
                what: 'aaaaa',
                exactSpecName: opts.specName + " #" + _this.snapshotIndex[opts.specName]
            });
            opts = _.assign(opts, {
                compare: function (_a) {
                    var expected = _a.expected, value = _a.value;
                    result = expected;
                    throw new Error('bail');
                },
                opts: {
                    update: false,
                    ci: true
                }
            });
            try {
                snapshotCore.core(__assign({}, opts));
            }
            catch (e) {
            }
            return result;
        };
        this.saveSnapshot = function (opts) {
            opts = _.defaults(opts, {
                exactSpecName: opts.specName + " #" + _this.snapshotIndex[opts.specName]
            });
            return snapshotCore.core(__assign({}, opts, { opts: {
                    update: true
                } }));
        };
    }
    return Snapshot;
}());
exports.Snapshot = Snapshot;
