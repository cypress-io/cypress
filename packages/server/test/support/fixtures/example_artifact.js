(function e (t, n, r) {
  function s (o, u) {
    if (!n[o]) {
      if (!t[o]) {
        let a = typeof require === 'function' && require

        if (!u && a) return a(o, !0)

        if (i) return i(o, !0)

        let f = new Error(`Cannot find module '${o}'`)

        throw f.code = 'MODULE_NOT_FOUND', f
      }

      let l = n[o] = { exports: {} }

      t[o][0].call(l.exports, function (e) {
        let n = t[o][1][e]

        return s(n ? n : e)
      }, l, l.exports, e, t, n, r)
    }

    return n[o].exports
  } var i = typeof require === 'function' && require

  for (let o = 0; o < r.length; o++)s(r[o])

  return s
})({ 1: [function (require, module, exports) {
  'use strict'

  it('is pretty simple', function () {
    expect(true).to.be.true
    expect(true).to.be.false
    expect(false).to.be.false
  })

}, {}] }, {}, [1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjeXByZXNzL2ludGVncmF0aW9uL3NvdXJjZV9tYXBfc3BlYy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsRUFBRSxDQUFDLGtCQUFELEVBQXFCLFlBQU07QUFDM0IsRUFBQSxNQUFNLENBQUMsSUFBRCxDQUFOLENBQWEsRUFBYixDQUFnQixFQUFoQixDQUFtQixJQUFuQjtBQUNBLEVBQUEsTUFBTSxDQUFDLElBQUQsQ0FBTixDQUFhLEVBQWIsQ0FBZ0IsRUFBaEIsQ0FBbUIsS0FBbkI7QUFDQSxFQUFBLE1BQU0sQ0FBQyxLQUFELENBQU4sQ0FBYyxFQUFkLENBQWlCLEVBQWpCLENBQW9CLEtBQXBCO0FBQ0QsQ0FKQyxDQUFGIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIml0KCdpcyBwcmV0dHkgc2ltcGxlJywgKCkgPT4ge1xuICBleHBlY3QodHJ1ZSkudG8uYmUudHJ1ZVxuICBleHBlY3QodHJ1ZSkudG8uYmUuZmFsc2VcbiAgZXhwZWN0KGZhbHNlKS50by5iZS5mYWxzZVxufSlcbiJdfQ==
