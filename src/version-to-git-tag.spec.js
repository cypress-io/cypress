const versionToGitTag = require('./version-to-git-tag');

describe('#versionToGitTag', () => {
  describe('if passed a falsy version', () => {
    it('returns null rather than creating a bad git-tag', async done => {
      expect(await versionToGitTag('')).toBe(null);
      expect(await versionToGitTag(undefined)).toBe(null);
      expect(await versionToGitTag(null)).toBe(null);
      done();
    });
  });
});
