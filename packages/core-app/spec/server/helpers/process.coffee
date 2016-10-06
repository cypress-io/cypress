## a simple helper to detect when we're running
## under istanbul and automatically shift the
## cmd + arguments around so we continue to get
## test coverage

module.exports = (cmd, args) ->
  if process.env.running_under_istanbul
    "npm run test-cov-process -- #{cmd} -- -- #{args}"
  else
    "#{cmd} -- #{args}"
