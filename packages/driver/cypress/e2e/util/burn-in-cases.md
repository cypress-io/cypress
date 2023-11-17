## burn-in with no retries

| Starting Score | Attempts | Outer Status             |
|----------------|----------|--------------------------|
| null           | PPP      | Pass+No Flake            |
| null           | PPF      | Fail+Flaky               |
| null           | PF       | Fail+Flaky               |
| null           | F        | Fail+Indeterminate Flake |
| 0              | PPP      | Pass+No Flake            |
| 0              | PPF      | Fail+Flaky               |
| 0              | PF       | Fail+Flaky               |
| 0              | F        | Fail+Indeterminate Flake |
| 1              | P        | Pass+Indeterminate Flake |
| 1              | F        | Fail+Indeterminate Flake |
| -1             | PPPPP    | Pass+No Flake            |
| -1             | PPPPF    | Fail+Flaky               |
| -1             | PPPF     | Fail+Flaky               |
| -1             | PPF      | Fail+Flaky               |
| -1             | PF       | Fail+Flaky               |
| -1             | F        | Fail+Indeterminate Flake |

## burn-in with retries

| Starting Score | Attempts | Outer Status             |
|----------------|----------|--------------------------|
| null           | PPP      | Pass+No Flake            |
| null           | PPF      | Pass+Flaky               |
| null           | PFP      | Pass+Flaky               |
| null           | PFF      | Fail+Flaky               |
| null           | FPP      | Pass+Flaky               |
| null           | FPF      | Fail+Flaky               |
| null           | FF       | Fail+No Flake            |
| 0              | PPP      | Pass+No Flake            |
| 0              | PPF      | Pass+Flaky               |
| 0              | PFP      | Pass+Flaky               |
| 0              | PFF      | Fail+Flaky               |
| 0              | FPP      | Pass+Flaky               |
| 0              | FPF      | Fail+Flaky               |
| 0              | FF       | Fail+No Flake            |
| 1              | P        | Pass+Indeterminate Flake |
| 1              | FPP      | Pass+Flaky               |
| 1              | FPF      | Fail+Flaky               |
| 1              | FF       | Fail+No Flake            |
| -1             | PPPPP    | Pass+No Flake            |
| -1             | PPPPF    | Pass+Flaky               |
| -1             | PPPF     | Pass+Flaky               |
| -1             | PPF      | Pass+Flaky               |
| -1             | PFP      | Pass+Flaky               |
| -1             | PFF      | Fail+Flaky               |
| -1             | FPP      | Pass+Flaky               |
| -1             | FPF      | Fail+Flaky               |
| -1             | FF       | Fail+No Flake            |
