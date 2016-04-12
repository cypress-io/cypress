(function() {
  var HOST, PATH, automation, client, fail, invoke,
    slice = [].slice;

  HOST = "http://dev.local:8080";

  PATH = "/__foo";

  client = io.connect(HOST, {
    path: PATH
  });

  automation = {
    getAllCookies: function(filter, fn) {
      if (filter == null) {
        filter = {};
      }
      return chrome.cookies.getAll(filter, fn);
    }
  };

}).call(this);
