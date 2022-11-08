var ref
exports.some =
  (ref = Array.prototype.some) != null
    ? ref
    : function (fn) {
        var e, i, len1, ref1
        ref1 = this
        for (i = 0, len1 = ref1.length; i < len1; i++) {
          e = ref1[i]
          if (fn(e)) {
            return true
          }
        }
        return false
      }
