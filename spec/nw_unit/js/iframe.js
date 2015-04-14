(function(parent){
  var $ = parent.$
  var mocha = parent.mocha

  var iframe = $("<iframe />", {
    src: "../../nw/public/index.html",
    load: function() {
      mocha.run()
    }
  })

  $("body").append(iframe)

})(window.parent)