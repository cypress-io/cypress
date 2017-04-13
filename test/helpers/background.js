(function() {
  var HOST, PATH, automation, client, fail, invoke,
    slice = [].slice;

  HOST = "CHANGE_ME_HOST";

  PATH = "CHANGE_ME_PATH";

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
