(function() {
  var HOST, PATH, automation, client, fail, invoke,
    slice = [].slice;

  HOST = "http://localhost:2020";

  PATH = "/__socket.io";

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
