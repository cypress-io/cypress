(function(parent){
  // proxy the Ecl to the parent
  window.Ecl = parent.Ecl;

  // temporarily borrow jQuery from our parent
  var $ = parent.$

  window.Mocha = Object.create(parent.Mocha);
  window.mocha = Object.create(parent.mocha);

  // In order to isolate top-level before/beforeEach hooks,
  // the specs in each iframe are wrapped in an anonymous suite.
  mocha.suite = Mocha.Suite.create(mocha.suite);

  mocha.suite.path = document.documentElement.getAttribute("data-path");

  // Override mocha.ui so that the pre-require event is emitted
  // with the iframe's `window` reference, rather than the parent's.
  mocha.ui = function (name) {
    this._ui = Mocha.interfaces[name];
    if (!this._ui) throw new Error('invalid interface "' + name + '"');
    this._ui = this._ui(this.suite);
    this.suite.emit('pre-require', window, null, this);
    return this;
  };

  mocha.ui('bdd');

  console.info(mocha);

  //Show only the current iframe.
  mocha.suite.beforeAll(function () {
    var iframes = $(".iframe-spec");
    // console.warn(iframes);
    $.each(iframes, function(index, iframe){
      if (iframe.contentWindow == window){
        $(iframe).css("display", "block")
        $(iframe).attr("id", "current-iframe")
      } else {
        $(iframe).removeAttr("style")
        $(iframe).removeAttr("id")
      }
    });
  });

  window.chai = parent.chai;

  window.expect = chai.expect,
  window.should = chai.should(),
  window.assert = chai.assert;

})(window.parent)

// for some reason applying this to the parent is not bubbling whatsoever
// window.onerror = function() {
//   if (parent.onerror) {
//     return parent.onerror.apply(parent, arguments);
//   }
// };