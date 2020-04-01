/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");

const $utils = require("../../cypress/utils");

const resume = function(state, resumeAll = true) {
  const onResume = state("onResume");

  //# dont do anything if this isnt a fn
  if (!_.isFunction(onResume)) { return; }

  //# nuke this out so it can only
  //# be called a maximum of 1 time
  state("onResume", null);

  //# call the fn
  return onResume(resumeAll);
};

const getNextQueuedCommand = function(state, queue) {
  //# gets the next command which
  //# isnt skipped
  var search = i => {
    const cmd = queue.at(i);

    if (cmd && cmd.get("skip")) {
      return search(i + 1);
    } else {
      return cmd;
    }
  };

  return search(state("index"));
};

module.exports = function(Commands, Cypress, cy, state, config) {
  Cypress.on("resume:next", () => resume(state, false));

  Cypress.on("resume:all", () => resume(state));

  return Commands.addAll({ type: "utility", prevSubject: "optional" }, {
    //# pause should indefinitely pause until the user
    //# presses a key or clicks in the UI to continue
    pause(subject, options = {}) {
      //# bail if we're headless
      if (!config("isInteractive")) { return subject; }

      _.defaults(options, {log: true});

      if (options.log) {
        options._log = Cypress.log({
          snapshot: true,
          autoEnd: false
        });
      }

      const onResume = (fn, timeout) => state("onResume", function(resumeAll) {
        if (resumeAll) {
          //# nuke onPause only if
          //# we've been told to resume
          //# all the commands, else
          //# pause on the very next one
          state("onPaused", null);

          if (options.log) {
            options._log.end();
          }
        }

        //# restore timeout
        cy.timeout(timeout);

        //# invoke callback fn
        return fn();
      });

      state("onPaused", function(fn) {
        const next = getNextQueuedCommand(state, cy.queue);

        //# backup the current timeout
        const timeout = cy.timeout();

        //# clear out the current timeout
        cy.clearTimeout();

        //# set onResume function
        onResume(fn, timeout);

        return Cypress.action("cy:paused", next && next.get("name"));
      });

      return subject;
    },

    debug(subject, options = {}) {
      _.defaults(options, {
        log: true
      });

      if (options.log) {
        options._log = Cypress.log({
          snapshot: true,
          end: true
        });
      }

      const previous = state("current").get("prev");

      $utils.log("\n%c------------------------ Debug Info ------------------------", "font-weight: bold;");
      $utils.log("Command Name:    ", previous && previous.get("name"));
      $utils.log("Command Args:    ", previous && previous.get("args"));
      $utils.log("Current Subject: ", subject);

      
        ////// HOVER OVER TO INSPECT THE CURRENT SUBJECT //////
        subject;
        ///////////////////////////////////////////////////////

        debugger;

      return subject;
    }
  });
};
