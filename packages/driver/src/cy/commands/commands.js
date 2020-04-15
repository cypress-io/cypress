/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");

const $Chainer = require("../../cypress/chainer");
const $errUtils = require("../../cypress/error_utils");

const command = function(ctx, name, ...args) {
  if (!ctx[name]) {
    const cmds = `\`${_.keys($Chainer.prototype).join("`, `")}\``;
    $errUtils.throwErrByPath("miscellaneous.invalid_command", {
      args: { name, cmds }
    });
  }

  return ctx[name].apply(ctx, args);
};

module.exports = function(Commands, Cypress, cy, state, config) {
  Commands.addChainer({
    command(chainer, args) {
      return command(chainer, ...args);
    }
  });

  return Commands.addAllSync({
    command(...args) {
      args.unshift(cy);

      return command.apply(window, args);
    }
  });
};
