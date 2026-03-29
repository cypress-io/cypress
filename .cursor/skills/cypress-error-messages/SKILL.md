---
name: cypress-error-messages
description: Write, review, and improve error messages and warnings for Cypress products. Use this skill whenever the user asks to write, draft, review, improve, or critique an error message or warning for any Cypress product, feature, or command — including CLI flags, test runner errors, configuration warnings, and cy.* command errors. Trigger on phrases like "help me write an error message", "write a warning for", "improve this error", "what should this error say", or any time error message copy needs to be created or evaluated for a Cypress context.
metadata:
  version: 1.0.0
---

# Cypress Error Message Writer

You help write, review, and improve error messages and warnings for Cypress products. These messages can appear anywhere a developer encounters Cypress: the Cypress app UI, Cypress Cloud, the CLI, and test output. They are often the first signal a developer gets that something is wrong — your job is to make sure they leave that moment with clarity, not confusion.

## Before you write

Ask the user for any missing context:

1. **What happened?** What went wrong, failed, or was misconfigured?
2. **Why did it happen?** Is the cause known? Is it user-controlled, a Cypress default, or an environment issue?
3. **What can the user do next?** Is there a fix, a workaround, or a configuration option?
4. **Is it transient?** Will this resolve on its own (e.g., rate limit reset, CI provider issue)?
5. **Are there interpreted values to show?** Did Cypress resolve arguments, flags, or config that the user should see back?
6. **Is the error being captured by a monitoring system?** If yes, and there is no user-actionable fix, the message may include "Our team has been notified." If no, that language must not appear.
7. **What's the `on.cypress.io` link?** See the [Links section](#links) below.

Do not write the final error message until you have enough information to answer all relevant questions. It's fine to write a draft and flag what's missing.

---

## Error message structure

Every error message should answer these questions in order:

1. **What happened** — in plain terms, no jargon
2. **Why it happened** — if known; skip if genuinely unknown rather than guessing
3. **What the user should do next** — specific steps or options
4. **What happens if they do nothing** — if relevant (e.g., deprecation, data risk)

If the user can't answer "I know what to do next" after reading the message, revise.

### Format pattern

```
[ErrorName or short summary line]

[One to two sentences: what happened and why, if known.]

[If values were interpreted from user input, print them here as a code block so the user can confirm what Cypress resolved.]

[Numbered steps for resolution, if multiple paths exist. Use a single sentence if only one action is needed.]

[Link: https://on.cypress.io/slug]
```

Not every message needs all sections. A simple command misuse error (Example 5 below) doesn't need a link or numbered steps. Use judgment based on complexity.

---

## Writing rules

### Plain language
- Write for the developer encountering this at 11pm during a CI failure.
- Use concrete, specific language. Avoid vague words like "an issue occurred."
- Active voice. Short sentences.

### Blame and tone
- Never blame the user. Frame errors as Cypress telling the user what it observed.
- Never use exclamation points in errors or warnings.
- Serious tone. This is not a place for wit or personality.

### Code references
- Wrap all command names, flag names, variable names, argument names, and config keys in backticks.
- Examples: `` `cy.prompt()` ``, `` `--ci-build-id` ``, `` `allowCypressEnv` ``, `` `{ multiple: true }` ``

### Transient errors
- If the error is temporary or outside the user's control, say so explicitly.
- Include when it will resolve, if known (e.g., "will reset in X minutes").
- Suggest the appropriate recovery action for the surface: use "refresh" for Cypress app UI and Cypress Cloud contexts; use "try again later" for CLI and test output contexts.
- If the surface is unknown or the message may appear in multiple places, prefer "try again later" as the more universally applicable option.

### Unidentified errors with monitoring capture
- If an error has no user-actionable fix and the error is being captured by a monitoring system (such as Sentry), tell the user the team has been notified and suggest they try again later or refresh, depending on the surface.
- Never include "our team has been notified" or equivalent language unless the error is confirmed to be captured and alerting the team. Using this language when no capture is in place is a trust violation.
- Ask the user to confirm that monitoring capture is in place before including this language in any message.

### Interpreted values
- When Cypress resolved or parsed values from user input (flags, config, arguments), print what was resolved in a code block. This confirms to the user what Cypress actually saw.
- See Example 4 for a model.

### Accessibility
- Meaning must not depend on color, icons, or formatting alone.
- Use descriptive links — never "click here" or "learn more" as standalone text. Link text should describe the destination.

---

## Links

**Always use `https://on.cypress.io/` links, not `https://docs.cypress.io/` links.**

`on.cypress.io` is a redirect layer that prevents broken links in the Cypress app, even when docs are reorganized. Hard-coded `docs.cypress.io` links in the app can break permanently if documentation moves.

### If the user doesn't have an `on.cypress.io` link yet

Ask them to create one. The process is:

1. Add a new entry to `data/links.yml` in the `cypress-services` repo:
   ```yaml
   - slug: your-slug-here
     redirect: https://docs.cypress.io/your/target/path
   ```
2. Open a pull request to the `develop` branch. [See an example PR](https://github.com/cypress-io/cypress-services/pull/5597/files).
3. Request a review in the `#team-cloud-foundations` Slack channel.
4. After approval, ask someone in `#team-cloud-foundations` to merge the PR (not everyone has merge access). Deployment happens automatically once the PR is merged.
5. Verify the link works at both:
   - `https://on-staging.cypress.io/your-slug` (staging)
   - `https://on.cypress.io/your-slug` (production)

Once the slug exists, the link format is: `https://on.cypress.io/your-slug`

If the user is mid-draft and doesn't have the link yet, write `https://on.cypress.io/[slug-tbd]` as a placeholder and remind them to complete the slug before shipping.

---

## Quality bar

After drafting, verify the user can honestly answer:

- I understand what happened
- I understand why Cypress is showing me this
- I know how this affects me
- I know what to do next
- I trust that Cypress is being truthful

If any answer is "no" or "unclear," revise before presenting as final.

---

## Reference examples

You MUST read `/references/examples.md` before proceeding. It contains annotated examples showing how these rules apply in practice.
