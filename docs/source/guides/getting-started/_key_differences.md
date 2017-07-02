# Trade Offs

- **One Superdomain Per Test:** Cypress cannot navigate between multiple superdomains *inside a single test*.
- **One Browser Window Per Test:** Cypress cannot control multiple browsers simultaneously.
- **Not a Web Crawler:** Cypress is not intended to be a general automation tool.
- **Not Ideal for Live Apps:** Cypress is best when integrated during development, it isn't best for testing a live website.
- **Developer-focused:** Users of Cypress must understand (and probably should be able to modify) the app under test.
