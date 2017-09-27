inject = require("./inject")

headRe      = /(<head.*?>)/i
bodyRe      = /(<body.*?>)/i
htmlRe      = /(<html.*?>)/i

rewriteHtml = (html, domainName, wantsInjection) ->
  replace = (re, str) ->
    html.replace(re, str)

  htmlToInject = do =>
    switch wantsInjection
      when "full"
        inject.full(domainName)
      when "partial"
        inject.partial(domainName)

  switch
    when headRe.test(html)
      replace(headRe, "$1 #{htmlToInject}")

    when bodyRe.test(html)
      replace(bodyRe, "<head> #{htmlToInject} </head> $1")

    when htmlRe.test(html)
      replace(htmlRe, "$1 <head> #{htmlToInject} </head>")

    else
      "<head> #{htmlToInject} </head>" + html

module.exports = {
  html: rewriteHtml
}
