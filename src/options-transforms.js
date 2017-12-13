const { compose, lensProp } = require('ramda');
const { overA, overFromA } = require('./lens-utils');

const commits = lensProp('commits');
const lastRelease = lensProp('lastRelease');
const nextRelease = lensProp('nextRelease');
const gitTag = lensProp('gitTag');
const version = lensProp('version');

const filterCommits = fn => overA(commits, async commits => await fn(commits));

const mapNextReleaseVersion = overA(compose(nextRelease, version));

const mapLastReleaseVersionToLastReleaseGitTag = overFromA(
  compose(lastRelease, gitTag),
  compose(lastRelease, version)
);

const mapNextReleaseVersionToNextReleaseGitTag = overFromA(
  compose(nextRelease, gitTag),
  compose(nextRelease, version)
);

module.exports = {
  filterCommits,
  mapNextReleaseVersion,
  mapLastReleaseVersionToLastReleaseGitTag,
  mapNextReleaseVersionToNextReleaseGitTag,
};
