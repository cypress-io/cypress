module.exports = (onFn, config) ->
  onFn 'before:browser:launch', (browser = {}, args) ->
    { name } = browser

    switch name
      when "chrome"
        return [name, "foo", "bar", "baz"]
      when "electron"
        return {
          browser: "electron"
          foo: "bar"
        }
      else
        throw new Error("unrecognized browser name: '#{name}' for before:browser:launch")
