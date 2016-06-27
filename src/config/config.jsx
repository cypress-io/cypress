import React from 'react'

export default () => {
  return (
    <div id='config'>
      <h5>Configuration</h5>
      <pre className='config-vars'>
        {`{`}
          <div className='line'>
            <span className='key'>port</span>
            <span className='colon'>:</span>{' '}
            <span className='default'>2020</span>
            <span className='comma'>,</span>
          </div>
          <div className='line'>
            <span className='key'>reporter</span>
            <span className='colon'>:</span>{' '}
            <span className='default'>'spec'</span>
            <span className='comma'>,</span>
          </div>
          <div className='line'>
            <span className='key'>baseUrl</span>
            <span className='colon'>:</span>{' '}
            <span className='default'>'http://localhost:8000'</span>
            <span className='comma'>,</span>
          </div>
          <div className='line'>
            <span className='key'>port</span>
            <span className='colon'>:</span>{' '}
            <span className='default'>2020</span>
            <span className='comma'>,</span>
          </div>
          <div className='line'>
            <span className='key'>port</span>
            <span className='colon'>:</span>{' '}
            <span className='default'>2020</span>
            <span className='comma'>,</span>
          </div>
          <div className='line'>
            <span className='key'>port</span>
            <span className='colon'>:</span>{' '}
            <span className='default'>2020</span>
            <span className='comma'>,</span>
          </div>
          <div className='line'>
            <span className='key'>port</span>
            <span className='colon'>:</span>{' '}
            <span className='default'>2020</span>
            <span className='comma'>,</span>
          </div>
        {`}`}
      </pre>
    </div>

    // getSpan: (key, obj, comma) ->
    //   "<div class='line'><span class='key'>#{key}</span><span class='colon'>:</span> <span class='#{obj.from}' data-toggle='tooltip' title='\"#{obj.from}\"'>#{@getString(obj.value)}#{obj.value}#{@getString(obj.value)}</span>#{@getComma(comma)}</div>"

    // getString: (val) ->
    //   if _.isString(val)
    //     "'"
    //   else
    //     ""

    // getComma: (bool) ->
    //   if bool then "<span class='comma'>,</span>" else ""

    // need to set resolved config on project
    // resolved = @options.config.get("resolved")

    // config  = _.omit resolved, "environmentVariables"
    // envVars = resolved.environmentVariables

    // {
    //   length: @collection.length
    //   config: config
    //   envVars: envVars
    //   displayResolved: (obj, opts = {}) =>
    //     keys = _.keys(obj)
    //     last = _.last(keys)

    //     _.reduce keys, (memo, key) =>
    //       val      = obj[key]
    //       hasComma = opts.comma ? last isnt key

    //       memo += (@getSpan(key, val, hasComma))

    //     , ""
    // }
  )
}
