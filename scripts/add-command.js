var colors = require('colors/safe');
var util = require('./lib/util');

var newCommandName = util.getCommandNameFromArgs();

util.getCommands(function (commands) {
  var commandNames = commands.map(function (command) { return command.name; }).join();
  if (commandNames.indexOf(newCommandName) > -1) {
    console.log(colors.red.bold('Command "' + newCommandName + '" already exists'));
    return;
  }

  var updatedCommands = commands.concat([{ name: newCommandName }]).sort(util.sortCommands);
  updatedCommands.forEach(function (command, index) {
    if (command.path) {
      util.updateCommand(command, index);
    } else {
      util.addCommand(command, index, commands);
    }
  });

  if (!util.isDryRun()) {
    console.log(colors.green('\nAdded file for command "' + newCommandName + '" and renamed files accordingly\n'));
  }
});
