slug: clearcookies

### [cy.clearCookies()](#usage)

Clears all of the browser cookies.

Cypress automatically invokes this command **between** each test to prevent state from building up.

Therefore you won't need to invoke this command normally unless you're using it to clear cookies within a single test.

***

## Usage

> Clear cookies after logging in

[block:code]
{
    "codes": [
        {
            "code": "cy\n  .login(\"bob@example.com\", \"p@ssw0rd\") // example of custom command\n  .clearCookies()\n  .visit(\"/dashboard\") // we should be redirected back to login\n  .url().should(\"eq\", \"login\")\n",
            "language": "javascript"
        }
    ]
}
[/block]

In this example, when first login our server sends us back a `session cookie`. After invoking `cy.clearCookies` this would have cleared the session cookie, and upon navigating to a authorized page, our server should have redirected us back to login.