---
paths:
  - "cli/CHANGELOG.md"
---

# Validate the changelog after every change to it

A release can ship while your branch is open, which turns the version your entry sits
under into a released one. Run the changelog check after you edit this file, after you
resolve a merge conflict in it, and after you merge or pull `develop`:

```bash
GH_TOKEN="$(gh auth token)" node ./scripts/semantic-commits/validate-binary-changelog.js
```

- It needs history back to the last release tag. In a shallow clone, fetch it first.
- A rejected token exits 0 without checking anything. If the output says
  `0 pull requests have merged`, the run checked nothing.
- On a host that proxies outbound HTTPS, prefix the command with `NODE_USE_ENV_PROXY=1`.

Details: [Verifying Your Entry](../../guides/writing-the-cypress-changelog.md#verifying-your-entry)
and [Scripts that call the GitHub API](../../AGENTS.md#scripts-that-call-the-github-api).
