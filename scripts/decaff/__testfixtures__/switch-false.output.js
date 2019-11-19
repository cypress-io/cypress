/* global a, b, c, findThings, isBad, isAwesome, hi */

function f () {
  if (a.subject(a)) {
    // Comment should be reserved
    let x = 30;

    b.doSomething(x)
  } else if (!c.isGood) {
    // Comment should be reserved 2
    c.checkThisOut();
    findThings()
  } else if (!isBad) {
    c.neverCheck();
  } else if (isAwesome) {
    a.subject(a);
  } else if (!hi) {
    return 3;
  } else {
    b.goToNext();
  }
}

f()
