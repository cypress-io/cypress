var colors = require('colors');
var glob = require('glob');
var fs = require('fs');

var commandNameRe = /\d{1,2}-(\w+)\.md$/;
var indexRe = /(\d{1,2})(-\w+\.md)$/;

var dryRun = isDryRun();

if (dryRun) {
  console.log(colors.cyan('Dry Run\n'));
}

function getCommandNameFromArgs () {
  return process.argv[2];
}

function isDryRun () {
  return process.argv[3] === '--dry-run';
}

function getCommands (callback) {
  glob('cypress/v1.0/documentation/*Commands/*.md', {}, function (err, filePaths) {
    if (err) throw err;

    var commands = filePaths.map(function (filePath) {
      return {
        path: filePath,
        name: getCommandNameFromPath(filePath),
      };
    });
    callback(commands);
  });
}

function getCommandNameFromPath (filePath) {
  var match = filePath.match(commandNameRe);
  return match[1];
}

function replaceCommandIndex (filePath, index) {
  return filePath.replace(indexRe, index + '$2');
}

function sortCommands (a, b) {
  if(a.name < b.name) return -1;
  if(a.name > b.name) return 1;
  return 0;
}

function commandsBasePath (commands) {
  var exampleCommandPath = commands[0].path;
  return exampleCommandPath.replace(/\d{1,2}(-\w+\.md)$/, '');
}

function updateCommand (command, index) {
  var newPath = replaceCommandIndex(command.path, index);
  if (command.path === newPath) return;
  if (dryRun) {
    console.log(command.path + ' -> ' + newPath);
    return;
  }

  fs.rename(command.path, newPath, function (err) {
    if (err) console.log(colors.red.bold('Error occurred while renaming file: ' + err));
  });
}

function addCommand (command, index, commands) {
  var newPath = commandsBasePath(commands) + index + '-' + command.name + '.md';
  if (dryRun) {
    console.log(colors.green('Add file: ', newPath));
    return;
  }

  fs.writeFile(newPath, '', function (err) {
    if (err) console.log(colors.red.bold('Error occurred while creating file: ' + err));
  });
}

function removeCommand (commandName, commands) {
  var command = commands.filter(function (command) { return command.name === commandName; })[0];
  if (dryRun) {
    console.log(colors.red('Remove file: ', command.path));
    return;
  }

  fs.unlink(command.path, function (err) {
    if (err) console.log(colors.red.bold('Error occurred while removing file: ' + err));
  })
}

module.exports = {
  addCommand: addCommand,
  getCommandNameFromArgs: getCommandNameFromArgs,
  getCommands: getCommands,
  isDryRun: isDryRun,
  removeCommand: removeCommand,
  sortCommands: sortCommands,
  updateCommand: updateCommand,
};
