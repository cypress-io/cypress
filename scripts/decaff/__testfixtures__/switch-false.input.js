/* global a, b, c, findThings, isBad, isAwesome, hi */

function f () {
  switch (false) {
    // Comment should be reserved
    case !a.subject(a):
      let x = 30

      b.doSomething(x)
      break
    // Comment should be reserved 2
    case c.isGood:
      c.checkThisOut()
      findThings()
      break
    case isBad:
      c.neverCheck()
      break
    case !isAwesome:
      a.subject(a)
      break
    case hi:
      return 3
    default:
      b.goToNext()
      break
  }
}

f()
