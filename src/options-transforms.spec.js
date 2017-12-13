const {
  filterCommits,
  mapNextReleaseVersion,
  mapLastReleaseVersionToLastReleaseGitTag,
  mapNextReleaseVersionToNextReleaseGitTag,
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
  describe('#filterCommits', () => {
    it('allows transforming the "commits" option', async () => {
      const fn = commits => commits.filter(even);

      expect(await filterCommits(fn)(OPTIONS)).toEqual({
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

  describe('#mapLastReleaseVersionToLastReleaseGitTag', () => {
    it('maps the lastRelease.version option to lastRelease.gitTag', async () => {
      const fn = mapLastReleaseVersionToLastReleaseGitTag(toTag);

      expect(await fn(OPTIONS)).toEqual({
        ...OPTIONS,
        lastRelease: {
          gitTag: 'tag-1.2.3',
          version: '1.2.3',
        },
      });
    });
  });

  describe('#mapNextReleaseVersionToNextReleaseGitTag', () => {
    it('maps the nextRelease.version option to nextRelease.gitTag', async () => {
      const fn = mapNextReleaseVersionToNextReleaseGitTag(toTag);

      expect(await fn(OPTIONS)).toEqual({
        ...OPTIONS,
        nextRelease: {
          gitTag: 'tag-4.5.6',
          version: '4.5.6',
        },
      });
    });
  });
});
