_  = require("lodash")
cp = require("child_process")

browserNotFoundErr = (browsers, name) ->
  available = _.map(browsers, "name").join(", ")

  err = new Error("Browser: '#{name}' not found. Available browsers are: [#{available}]")
  err.specificBrowserNotFound = true
  err

module.exports = {
  launch: (browsers, name, url, args = []) ->
    browser = _.find(browsers, {name: name})

    if not browser
      throw browserNotFoundErr(browsers, name)

    args.unshift(url) if url

    cp.spawn(browser.path, args, {stdio: "ignore"})

}