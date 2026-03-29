# Cypress Error Message Examples

Annotated examples showing how the error message rules apply in practice.

---

## Example 1: Security warning with migration path

```
Warning: The `allowCypressEnv` configuration option is enabled. This allows any browser code to read values from `Cypress.env()`. This is insecure and will be removed in a future major version.
  1. Replace `Cypress.env()` calls with `cy.env()` (for sensitive values) or `Cypress.expose()` (for public configuration)
  2. Set `allowCypressEnv: false` in your Cypress configuration to disable `Cypress.env()`
Learn more: https://on.cypress.io/cypress-env-migration
```

**Why it works:**
- Names the config key in backticks so the user knows exactly what to change
- States the security risk plainly without minimizing or dramatizing
- Tells the user this is going away (future major version) so they can plan
- Numbered steps because there are two separate resolution paths
- Link uses `on.cypress.io`

---

## Example 2: Simple usage cap error

```
PromptLengthError

cy.prompt() exceeded the maximum allowed prompt length. Please use shorter text or fewer arguments.
```

**Why it works:**
- Named error type at the top helps developers search for it
- Single sentence covers what happened and what to do
- No link needed — the fix is self-contained and obvious

---

## Example 3: Transient rate limit

```
PromptUsageLimitError

`cy.prompt()` is temporarily disabled.

You've reached the maximum number of X (cy.prompt executions|step executions) this hour. The `cy.prompt` feature is temporarily disabled and will reset in X minutes.
```

**Why it works:**
- "Temporarily disabled" appears twice — once in summary, once in detail — so it's impossible to miss
- States the reset time so the user knows when to try again
- No blame; framed as a system-imposed limit, not a user mistake

---

## Example 4: CLI — flag error with interpreted values

```
You passed the `--group` or `--parallel` flag but we could not automatically determine or generate a `ciBuildId`.

    {
      group: '--group',
      parallel: '--parallel',
    }

In order to use either of these features a `ciBuildId` must be determined.

The `ciBuildId` is automatically detected if you are running Cypress in any of these CI providers:

[LIST_CI_PROVIDERS]

Because the `ciBuildId` could not be auto-detected you must pass the `--ci-build-id` flag manually.

https://on.cypress.io/indeterminate-ci-build-id
```

**Why it works:**
- Prints back the flags Cypress resolved so the user can confirm what it saw
- Explains the detection behavior (auto vs. manual) so the user understands what went wrong
- Points to a specific corrective flag (`--ci-build-id`) not just "fix it"
- Link for deeper context

---

## Example 5: Command misuse (no link needed)

```
`cy.click()` can only be called on a single element. Your subject contained 10 elements. Pass `{ multiple: true }` if you want to serially click each element.
```

**Why it works:**
- States the constraint clearly
- Echoes back the resolved count (10 elements) so the user can confirm what Cypress saw
- Offers the exact option to opt out of the constraint
- No link needed — everything required to resolve the error is in the message

---

## Example 6: Cloud UI — blocked destructive action

**Context:** Cypress Cloud, organization settings UI. The user has attempted to delete an organization that still has projects attached.

```
Deleting {org.name} requires that all of its projects be transferred or deleted first. This is done to avoid deleting any run data unexpectedly.
```

**Why it works:**
- Opens with the exact action the user took (`Deleting {org.name}`) so there is no ambiguity about what triggered this message
- States the prerequisite clearly and specifically — not "you must complete some steps first" but "transfer or delete all projects"
- Explains the reason for the restriction (protecting run data) so the user understands Cypress is acting in their interest, not arbitrarily blocking them
- No blame; framed as a safety constraint, not a user mistake
- No link needed — the path forward is self-contained and actionable from the UI
- Serious, plain tone appropriate for a destructive action

---

## Example 7: Cloud UI — unidentified error with monitoring capture

**Context:** Cypress Cloud, Cypress Studio. An unexpected error occurred with no user-actionable fix. The error is captured in Sentry and will alert the team.

```
There was a problem with Cypress Studio. Our team has been notified. If the problem persists, please try again later.
```

**Why it works:**
- Acknowledges the failure plainly without vague language like "an issue occurred"
- Tells the user the team is already aware, which removes the burden of filing a report and builds trust
- Suggests a next step ("try again later") even when there is no direct fix
- No blame; framed as a system-side problem

**Critical requirement:** Never use "our team has been notified" or equivalent language unless the error is confirmed to be captured by a monitoring system (such as Sentry) that will alert the team. If capture is not in place, remove that sentence entirely and tell the user to contact support if the problem persists instead.

---

## Example 8: Cloud UI — error boundary, unknown cause

**Context:** Cypress Cloud, any error boundary. An unexpected error occurred with no known cause and no user-actionable fix. The error is captured in Sentry and will alert the team.

```
Something went wrong.

We have been notified of this error. You may also refresh the page or try again later.
```

**Why it works:**
- Opens with a plain, calm statement of failure — no blame, no vague technical detail
- "We have been notified" removes the burden of reporting from the user
- Offers two recovery options appropriate for a Cloud UI context: refresh or try again later
- No exclamation points; tone matches the seriousness of an unknown failure

**Critical requirement:** "We have been notified" must only appear if the error boundary is confirmed to be captured by a monitoring system (such as Sentry) that will alert the team.

---

## Anti-patterns to avoid

- **"An unexpected error occurred."** — Why: Tells the user nothing actionable. Better: Describe what Cypress observed, even if the cause is unknown (see Examples 7, 8).
- **"You must configure X correctly."** — Why: Blames the user. Better: "Cypress could not resolve X from the provided configuration."
- **"Click here to learn more."** — Why: Non-descriptive link text. Better: Use descriptive link text or print the URL directly (see Example 4).
- **"Error! Something went wrong!"** — Why: Exclamation points are inappropriate in errors; vague. Better: Plain statement of what failed, no exclamation points (see Example 8).
- **`https://docs.cypress.io/...`** — Why: Can break permanently when docs move. Better: Use `https://on.cypress.io/slug` (see Examples 1, 4).
- **"This is a known issue."** — Why: Vague; gives the user nothing to act on. Better: "This behavior is under investigation. As a workaround, try X."
- **"Our team has been notified." (without monitoring capture)** — Why: False reassurance; a trust violation. Better: Only include this language when the error is confirmed to be captured by a monitoring system (see Examples 7, 8).
- **"Oops! Something went wrong!"** — Why: Casual tone is inappropriate for a failure state; exclamation points prohibited. Better: "Something went wrong." — plain, calm, no punctuation inflation (see Example 8).
- **Omitting interpreted values** — Why: Leaves the user guessing what Cypress actually resolved. Better: Print flags, arguments, or config values back in a code block (see Examples 4, 5).
- **Using "refresh" in CLI error messages** — Why: "Refresh" is a UI concept; meaningless in terminal output. Better: Use "try again later" for CLI and test output; use "refresh" for UI contexts (see Example 3).
- **Explaining a restriction without saying what to do next** — Why: Leaves the user informed but stuck. Better: Always pair the reason with a specific next step (see Example 6).
