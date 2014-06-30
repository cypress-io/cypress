window.App = (function($, _){

  var tmp = _.template(
    "<div id='page-container'>" +
      "<h1><%= title %></h1>" +
      "<ul>" +
        "<li>" +
          "<button id='red'>Red</button>" +
        "</li>" +
        "<li>" +
          "<button id='green'>Green</button>" +
        "</li>" +
        "<li>" +
          "<button id='blue'>Blue</button>" +
        "</li>" +
      "</ul>" +
    "</div>"
  );

  return {
    start: function(obj){
      var obj = obj || {};

      $("body").html(tmp(obj)).css("background-color", obj.color);

      $("#green").click(function(){
        $("body").css("background-color", "green")
      })
    }
  };

})($, _);