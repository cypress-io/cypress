exports['lib/tasks/cache .clear deletes cache folder and everything inside it 1'] = `
[no output]
`

exports['lib/tasks/cache .prune deletes cache binaries for all version but the current one 1'] = `
Deleted all binary caches except for the 1.2.3 binary cache.
`

exports['lib/tasks/cache .prune doesn\'t delete any cache binaries 1'] = `
No binary caches found to prune.
`

exports['lib/tasks/cache .prune exits cleanly if cache dir DNE 1'] = `
No Cypress cache was found at /.cache/Cypress. Nothing to prune.
`

exports['lib/tasks/cache .list lists all versions of cached binary 1'] = `
┌─────────┬───────────┐
│ version │ last used │
├─────────┼───────────┤
│ 1.2.3   │ unknown   │
├─────────┼───────────┤
│ 2.3.4   │ unknown   │
└─────────┴───────────┘
`

exports['lib/tasks/cache .path lists path to cache 1'] = `
/.cache/Cypress
`

exports['lib/tasks/cache .list lists all versions of cached binary with last access 1'] = `
┌─────────┬──────────────┐
│ version │ last used    │
├─────────┼──────────────┤
│ 1.2.3   │ 3 months ago │
├─────────┼──────────────┤
│ 2.3.4   │ 5 days ago   │
└─────────┴──────────────┘
`

exports['lib/tasks/cache .list some versions have never been opened 1'] = `
┌─────────┬──────────────┐
│ version │ last used    │
├─────────┼──────────────┤
│ 1.2.3   │ 3 months ago │
├─────────┼──────────────┤
│ 2.3.4   │ unknown      │
└─────────┴──────────────┘
`

exports['cache list with silent log level'] = `
┌─────────┬───────────┐
│ version │ last used │
├─────────┼───────────┤
│ 1.2.3   │ unknown   │
├─────────┼───────────┤
│ 2.3.4   │ unknown   │
└─────────┴───────────┘
`

exports['cache list with warn log level'] = `
┌─────────┬───────────┐
│ version │ last used │
├─────────┼───────────┤
│ 1.2.3   │ unknown   │
├─────────┼───────────┤
│ 2.3.4   │ unknown   │
└─────────┴───────────┘
`

exports['lib/tasks/cache .list shows sizes 1'] = `
┌─────────┬──────────────┬───────┐
│ version │ last used    │ size  │
├─────────┼──────────────┼───────┤
│ 1.2.3   │ 3 months ago │ 0.2MB │
├─────────┼──────────────┼───────┤
│ 2.3.4   │ unknown      │ 0.2MB │
└─────────┴──────────────┴───────┘
`
