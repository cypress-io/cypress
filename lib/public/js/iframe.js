(function() {
  (function(parent) {
    var $;
    window.Ecl = parent.Ecl;
    $ = parent.$;
    window.chai = parent.chai;
    window.expect = chai.expect;
    window.should = chai.should();
    window.assert = chai.assert;
    window.Mocha = Object.create(parent.Mocha);
    window.mocha = Object.create(parent.mocha);
    mocha.suite = Mocha.Suite.create(mocha.suite);
    mocha.ui = function(name) {
      this._ui = Mocha.interfaces[name];
      if (!this._ui) {
        throw new Error('invalid interface "' + name + '"');
      }
      this._ui = this._ui(this.suite);
      this.suite.emit('pre-require', window, null, this);
      return this;
    };
    return mocha.ui("bdd");
  })(window.opener || window.parent);

}).call(this);
