const {
  mapNextReleaseVersion,
  mapLastReleaseVersionToLastReleaseGitTag,
  mapNextReleaseVersionToNextReleaseGitTag,
  mapCommits,
} = require('./options-transforms');

const OPTIONS = {
  commits: [1, 2, 3, 4],
  lastRelease: {
    version: '1.2.3',
  },
  nextRelease: {
    version: '4.5.6',
  },
};

const even = n => n % 2 === 0;
const toTag = x => `tag-${x}`;

describe('semantic-release plugin options transforms', () => {
  describe('#mapCommits', () => {
    it('allows mapping the "commits" option', async () => {
      const fn = commits => commits.filter(even);

      expect(await mapCommits(fn)(OPTIONS)).toEqual({
        ...OPTIONS,
        commits: [2, 4],
      });
    });
  });

  describe('#mapNextReleaseVersion', () => {
    it('maps the nextRelease.version option', async () => {
      expect(await mapNextReleaseVersion(toTag)(OPTIONS)).toEqual({
        ...OPTIONS,
        nextRelease: {
          version: 'tag-4.5.6',
        },
      });
    });
  });
});
