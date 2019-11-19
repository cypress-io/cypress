/* global a, b, c, findThings, isBad, isAwesome, hi */

function f () {
  switch (false) {
    case !a.subject(a):
      let x = 30

      b.doSomething(x)
      break
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
