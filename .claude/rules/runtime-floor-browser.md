---
paths:
  - "packages/driver/**"
  - "packages/app/**"
  - "packages/frontend-shared/**"
  - "packages/reporter/**"
  - "packages/runner/**"
---

# Runtime floor: shipped browsers

This code ships to a browser, so the floor is the **last 3 major versions of every
supported browser** (Chrome, Firefox, Edge, WebKit) — not the development Node and
not Electron's V8.

Safari ships majors roughly annually, so its last 3 majors reach back years. That
makes WebKit the binding constraint for nearly every modern JS or DOM API. Check
caniuse/MDN against that range before relying on one.

`@packages/driver` is the most conservative of these: it runs inside the **user's**
AUT browser, which Cypress does not control. For WebKit specifically, Cypress runs
the build bundled with the installed `playwright-webkit`, not the user's system
Safari — so the WebKit floor tracks that dependency's version.

Full context: [Runtime targets](../../AGENTS.md#runtime-targets).
