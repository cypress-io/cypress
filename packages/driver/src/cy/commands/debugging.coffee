_ = require("lodash")

$utils = require("../../cypress/utils")

resume = (state, resumeAll = true) ->
  onResume = state("onResume")

  ## dont do anything if this isnt a fn
  return if not _.isFunction(onResume)

  ## nuke this out so it can only
  ## be called a maximum of 1 time
  state("onResume", null)

  ## call the fn
  onResume(resumeAll)

getNextQueuedCommand = (state, queue) ->
  ## gets the next command which
  ## isnt skipped
  search = (i) =>
    cmd = queue.at(i)

    if cmd and cmd.get("skip")
      search(i + 1)
    else
      return cmd

  search(state("index"))

module.exports = (Commands, Cypress, cy, state, config) ->
  Cypress.on "resume:next", ->
    resume(state, false)

  Cypress.on "resume:all", ->
    resume(state)

  Commands.addAll({ type: "utility", prevSubject: "optional" }, {
    ## pause should indefinitely pause until the user
    ## presses a key or clicks in the UI to continue
    pause: (subject, options = {}) ->
      ## bail if we're headless
      return subject if not config("isInteractive")

      _.defaults options, {log: true}

      if options.log
        options._log = Cypress.log({
          snapshot: true
          autoEnd: false
        })

      onResume = (fn, timeout) ->
        state "onResume", (resumeAll) ->
          if resumeAll
            ## nuke onPause only if
            ## we've been told to resume
            ## all the commands, else
            ## pause on the very next one
            state("onPaused", null)

            if options.log
              options._log.end()

          ## restore timeout
          cy.timeout(timeout)

          ## invoke callback fn
          fn()

      state "onPaused", (fn) ->
        next = getNextQueuedCommand(state, cy.queue)

        ## backup the current timeout
        timeout = cy.timeout()

        ## clear out the current timeout
        cy.clearTimeout()

        ## set onResume function
        onResume(fn, timeout)

        Cypress.action("cy:paused", next and next.get("name"))

      return subject

    debug: (subject, options = {}) ->
      _.defaults(options, {
        log: true
      })

      if options.log
        options._log = Cypress.log({
          snapshot: true
          end: true
        })

      previous = state("current").get("prev")

      $utils.log("\n%c------------------------ Debug Info ------------------------", "font-weight: bold;")
      $utils.log("Command Name:    ", previous and previous.get("name"))
      $utils.log("Command Args:    ", previous and previous.get("args"))
      $utils.log("Current Subject: ", subject)

      `
        ////// HOVER OVER TO INSPECT THE CURRENT SUBJECT //////
        subject
        ///////////////////////////////////////////////////////

        debugger`

      return subject
  })
