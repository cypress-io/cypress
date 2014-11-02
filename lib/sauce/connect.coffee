sauceConnectLauncher = require('sauce-connect-launcher')

options = {

  ## Sauce Labs username.  You can also pass this through the
  ## SAUCE_USERNAME environment variable
  username: 'brian-mann'

  ## Sauce Labs access key.  You can also pass this through the
  ## SAUCE_ACCESS_KEY environment variable
  accessKey: 'ab95ecc5-b788-482a-82f6-ea72e1b00b54'

  ## Log output from the `sc` process to stdout?
  verbose: true

  ## Enable verbose debugging (optional)
  verboseDebugging: true

  ## Port on which Sauce Connect's Selenium relay will listen for
  ## requests. Default 4445. (optional)
  port: null

  ## Proxy host and port that Sauce Connect should use to connect to
  ## the Sauce Labs cloud. e.g. "localhost:1234" (optional)
  proxy: null

  ## Change sauce connect logfile location (optional)
  logfile: null

  ## Period to log statistics about HTTP traffic in seconds (optional)
  logStats: null

  ## Maximum size before which the logfile is rotated (optional)
  maxLogsize: null

  ## Set to true to perform checks to detect possible misconfiguration or problems (optional)
  doctor: null

  ## Identity the tunnel for concurrent tunnels (optional)
  tunnelIdentifier: null

  ## an array or comma-separated list of regexes whose matches
  ## will not go through the tunnel. (optional)
  fastFailRexegps: null

  ## an array or comma-separated list of domains that will not go
  ## through the tunnel. (optional)
  directDomains: null

  ## A function to optionally write sauce-connect-launcher log messages.
  ## e.g. `console.log`.  (optional)
  logger: (message) ->
};

# module.exports = sauceConnectLauncher


sauceConnectLauncher options, (err, sauceConnectProcess) ->
  console.log("Started Sauce Connect Process");

  process.on "SIGINT", ->
    sauceConnectProcess.close ->
      console.log("Closed Sauce Connect process");
