do (Cypress, _) ->

  ngPrefixes = ['ng-', 'ng_', 'data-ng-', 'x-ng-']

  Cypress.addParent
    ng: (type, selector, options = {}) ->
      @throwErr "Angular global was not found in your window! You cannot use .ng() methods without angular." if not @sync.window().angular

      switch type
        when "model"
          @_findByNgAttr("model", "model=", selector, options)
        when "repeater"
          @_findByNgAttr("repeater", "repeat*=", selector, options)
        when "binding"
          @_findByNgBinding(selector, options)

  Cypress.extend
    _findByNgBinding: (binding, options) ->
      selector = ".ng-binding"

      angular = @sync.window().angular

      options.error = "Could not find element for binding: '#{binding}'!"

      options.retry = ($elements) ->
        filtered = $elements.filter (index, el) ->
          dataBinding = angular.element(el).data("$binding")

          if dataBinding
            bindingName = dataBinding.exp or dataBinding[0].exp or dataBinding
            return binding in bindingName

        ## if we have items return
        ## those filtered items
        if filtered.length
          return filtered

        ## else return false
        return false

      @command("get", selector, options)

    _findByNgAttr: (name, attr, el, options) ->
      selectors = []
      error = "Could not find element for #{name}: '#{el}'.  Searched "

      finds = _.map ngPrefixes, (prefix) =>
        selector = "[#{prefix}#{attr}'#{el}']"
        selectors.push(selector)

        @command("get", selector, options)

      error += selectors.join(", ") + "."

      Promise
        .any(finds)
        .cancellable()
        .catch Promise.CancellationError, (err) =>
          _(finds).invoke("cancel")
          throw err
        .catch Promise.AggregateError, (err) =>
          @throwErr error