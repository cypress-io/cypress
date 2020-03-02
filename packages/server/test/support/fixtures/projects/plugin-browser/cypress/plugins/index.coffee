module.exports = (onFn, config) ->
  onFn 'before:browser:launch', (browser, options) ->
    { name } = browser

    switch name
      when "chrome"
        return [name, "foo", "bar", "baz"]
      when "electron"
        return {
          preferences: {
            browser: "electron"
            foo: "bar"
          }
        }
      else
        throw new Error("unrecognized browser name: '#{name}' for before:browser:launch")
