do (Cypress, _) ->

  proxies    = "each map".split(" ")

  _.each proxies, (proxy) ->
    Cypress.addChildCommand proxy, (subject, args...) ->
      @ensureDom(subject)

      $el = subject[proxy].apply(subject, args)

      ## these commands cannot possibly fail so
      ## let them go through using the old interface
      Cypress.command
        $el: $el
        end: true
        snapshot: true
        onConsole: ->
          obj = {}
          obj.Selector = args.join(", ") if not _(args).any(_.isFunction)

          _.extend obj,
            "Applied To":   subject
            "Returned":     $el
            "Elements":     $el.length

      return $el