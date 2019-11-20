function f () {
  if (a.subject(a)) {
    // Comment should be reserved
    let x = 30;

    b.doSomething(x)
  } else if (!c.isGood) {
    // Multi line comment
    // should be reserved
    c.checkThisOut();
    findThings()
  } else if (!isBad) {
    c.neverCheck();
  } else if (isAwesome) {
    a.subject(a);
  } else if (!hi) {
    // This should be reserved, too
    return 3
  } else if (!you) // This comment is preserved
  {} else {
    b.goToNext();
  }
}

f()
