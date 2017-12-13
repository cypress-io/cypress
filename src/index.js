const analyzeCommits = require('./analyze-commits');
const generateNotes = require('./generate-notes');
const getLastRelease = require('./get-last-release');

module.exports = {
  analyzeCommits,
  generateNotes,
  getLastRelease,
};
