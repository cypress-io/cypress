### project-fixtures

Rather than having a million different little projects in each system-test directory, this project acts as a fixture directory for a system test, minus the package.json. This allows us to more consistently test different versions of libraries, etc.

To make this work, all you need to do is add:

```
"projectFixtureDirectory": "react"
```

to the `package.json` of the project you're looking to copy over before the test runs.