module.exports = (onFn, config) ->
  onFn 'before:browser:launch', (browserName, args) ->
    switch browserName
      when "chrome"
        return [browserName, "foo", "bar", "baz"]
      when "electron"
        return {
          browser: "electron"
          foo: "bar"
        }
      else
        throw new Error("unrecognized 'browserName: #{browserName}' for before:browser:launch")
