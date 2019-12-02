const path = require('path')

module.exports = {
  decaffeinateArgs: [
    '--use-cs2',
    '--loose',
  ],
  jscodeshiftScripts: [
    path.resolve('node_modules', 'js-codemod', 'transforms', 'arrow-function.js'),
    path.resolve('node_modules', 'js-codemod', 'transforms', 'arrow-function-arguments.js'),
    path.resolve('node_modules', 'js-codemod', 'transforms', 'no-vars.js'),
    path.resolve('node_modules', 'jscodemods', 'transforms', 'fix-class-assign-construct.js'),
    path.resolve('node_modules', 'jscodemods', 'decaffeinate', 'fix-multi-assign-class-export.js'),
    path.resolve('node_modules', 'jscodemods', 'decaffeinate', 'fix-implicit-return-assignment.js'),
    path.resolve('node_modules', 'jscodemods', 'decaffeinate', 'fix-existential-conditional-assignment.js'),
    './scripts/decaff/remove-comment-sharp.js',
    './scripts/decaff/switch-false.js',
    './scripts/decaff/empty-catch.js',
    './scripts/decaff/no-cond-assign.js',
    './scripts/decaff/arrow-comment.js',
  ],
}
