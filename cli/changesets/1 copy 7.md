---
type: fix
---

Fixed asset capture for Test Replay for requests that are routed through service workers. This addresses an issue where styles were not being applied properly in Test Replay and `cy.intercept` was not working properly for requests in this scenario.