// Extracted the code that causes the problem in signin.simple.com
// The cause was overriding the Event class.

(function() {
  this.Event = function(n, i) {
    const r = n.type

    if (r.indexOf("key")) {
      // do something 
    }
  }
})()
