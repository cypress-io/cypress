## attach to Eclectus global

## this is our base command class the others will inherit from
Eclectus.Command = do ($, _) ->
  class Command

    $: (selector) ->
      new $.fn.init(selector, @document)

  return Command