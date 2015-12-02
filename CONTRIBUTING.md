# Contributing

## Contributing Bug Reports

Found a bug with Cypress? Let us know! This article describes how to open an effective bug report so we can get your issue fixed or help you work around it.

The most important things to do are:

- search existing [issues](https://github.com/cypress-io/cypress/issues) for your problem
- check the list of common fixes below
- make sure we support your setup
- gather debugging information
- explain how to reproduce the issue
- ask other Cypress users for help in our [gitter channel](https://gitter.im/cypress-io/cypress).

If you have a feature request (not a bug), see (Contributing Feature Requests)[#contributing-feature-requests].

### Common Fixes
Before you file a report, here are some common solutions to problems:

- Update Cypress: Your issue may have already been fixed. Updating may resolve your issue.

### Update Cypress

Before filing a bug, make sure you are up to date. Your issue may have already been fixed. Even if you do not see the issue described as resolved in a newer version, a newer version may help in the process of debugging your issue by giving more helpful error messages.

You can update Cypress by going to `Settings` > `Check for updates` in the desktop application.

**If you can not update** for some reason, please include the version of Cypress you are running when you file a report. You can find the version in `Settings` > `About` in the desktop application.

### Supported Issues

Before filing a bug, make sure you're filing an issue against something we support. See our [System Requirements](https://github.com/cypress-io/cypress/wiki/getting-started#system-requirements). If you're using an unsupported environment, file a Feature Request.

### Getting More Information

For some issues, there are places you can check for more information. This may help you resolve the issue yourself. Even if it doesn't, this information can help us figure out and resolve an issue.

- For issues in the web browser, check the JavaScript console and your Network tab.
- Click on any commands where the failure occured, this will log more information about the error to the JavaScript console.
- Use Cypress' [`debug`](https://github.com/cypress-io/cypress/wiki/debug) or [`pause`](https://github.com/cypress-io/cypress/wiki/pause) commands to step through your commands.

### Reproducibility

The most important part of your issue is instructions on how to reproduce the issue. What did you do? If you do it again, does it still break? Does it depend on a specific order?

It is nearly impossible for us to resolve many issues if we can not reproduce them. We will generally make a reasonable effort to reproduce problems, but sometimes we will be unable to reproduce an issue.

### Open an Issue

If you're up to date, supported, have collected information about the problem, and have the best reproduction instructions you can come up with, you're ready to open an issue.

[Use this template to open your issue.](https://github.com/girldevelopit/gdi-new-site/issues/new?body=**Description**%0A*Include%20a%20high%20level%20description%20of%20the%20feature%20or%20error%20here%20including%20steps%20of%20how%20to%20recreate.%20Include%20any%20benefits%2C%20challenges%20or%20considerations.*%0A%0A**Code**%0A*Include%20the%20commands%20used*%0A%0A**Steps%20To%20Reproduce**%0A-%20%5B%20%5D%20Steps%0A-%20%5B%20%5D%20To%0A-%20%5B%20%5D%20Reproduce%2FFix%0A%0A**Additional%20Info**%0A*Include%20any%20images%2C%20notes%2C%20or%20whatever.*%0A)

## Contributing Feature Requests

