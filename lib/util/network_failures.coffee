convertNewLinesToBr = (text) ->
  text.split("\n").join("<br />")

module.exports = {
  http: (err, url) ->
    """
    Cypress errored attempting to make an http request to this url:

    #{url}


    The error was:

    #{err.message}


    The stack trace was:

    #{err.stack}
    """

  file: (err, url, status) ->
    """
    Cypress errored trying to serve this file from your system:

    #{url}

    #{if status is 404 then "The file was not found." else ""}
    """

  get: (err, url, status, strategy) ->
    switch strategy
      when "http" then @http(err, url)
      when "file" then @file(err, url, status)
}