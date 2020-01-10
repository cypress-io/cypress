exports['lib/util/terminal .table draws multiple specs summary table 1'] = `
    Spec                                             Tests   Passing   Failing   Pending   Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ foo.js                                 00:49         7         4         3         2         1 │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ bar.js                                 796ms         0         0         0         0        15 │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ fail/is/whale.js                       03:28        30        25         5       100         3 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    2 of 3 passed (66%)                  1:05:36        37        29         8       102        18  
`

exports['lib/util/terminal .table draws single spec summary table 1'] = `
  ┌──────────────────────────────┐
  │ Tests:        1              │
  │ Passing:      2              │
  │ Failing:      3              │
  │ Pending:      4              │
  │ Skipped:      5              │
  │ Duration:     6              │
  │ Screenshots:  7              │
  │ Video:        true           │
  │ Spec:         foo/bar/baz.js │
  └──────────────────────────────┘
`

exports['lib/util/terminal .table draws a page divider 1'] = `
────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running: foo/bar/baz.js...                                                           (100 of 200) 
`
