var colors = require('colors/safe');
var util = require('./lib/util');

var commandToRemove = util.getCommandNameFromArgs();

util.getCommands(function (commands) {
  var commandNames = commands.map(function (command) { return command.name; }).join();
  if (commandNames.indexOf(commandToRemove) === -1) {
    console.log(colors.red.bold('Command "' + commandToRemove + '" does not exist'));
    return;
  }

  var updatedCommands = commands.filter(function (command) {
    return command.name !== commandToRemove;
  }).sort(util.sortCommands);

  util.removeCommand(commandToRemove, commands);
  updatedCommands.forEach(util.updateCommand);

  if (!util.isDryRun()) {
    console.log(colors.green('\nRemoved file for command "' + commandToRemove + '" and renamed files accordingly\n'));
  }
});
