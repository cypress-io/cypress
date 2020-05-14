exports['lib/tasks/cache .clear deletes cache folder and everything inside it 1'] = `
[no output]
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
