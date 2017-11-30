const readPkg = require('read-pkg');

module.exports = async version => {
  const { name } = await readPkg();
  return `${name}-v${version}`;
};
