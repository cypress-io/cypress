function f () {
  switch (false) {
    // Comment should be reserved
    case !a.subject(a):
      let x = 30

      b.doSomething(x)
      break
    // Multi line comment
    // should be reserved
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
      // This should be reserved, too
      return 3
    case you:
      // This comment is preserved
      break
    default:
      b.goToNext()
      break
  }
}

f()
