let slowDown = function (n) {
  let arr = []

  for (let i = n; i >= 0; i--) {
    arr.push(i)
  }
  arr.sort(function (a, b) {
    return a - b
  })

  return arr
}

module.exports = {
  slowArray: slowDown(40000000),
}
