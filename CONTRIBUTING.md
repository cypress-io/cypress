# Contributing

## Contributing Bug Reports

Found a bug with Cypress? Let us know! This article describes how to open an effective bug report so we can get your issue fixed or help you work around it.

**The most important things to do are:**

- search existing [issues](https://github.com/cypress-io/cypress/issues) for your problem
- check the list of common fixes below
- make sure we support your setup
- gather debugging information
- explain how to reproduce the issue

If you have a feature request (not a bug), see [Contributing Feature Requests](#contributing-feature-requests).

### Common Fixes
Before you file a report, here are some common solutions to problems:

- Update Cypress: Your issue may have already been fixed. Updating may resolve your issue.
- Update cypress-cli: Your issue may have already been fixed. Updating may resolve your issue.

### Update Cypress

Before filing a bug, make sure you are up to date. Your issue may have already been fixed. Even if you do not see the issue described as resolved in a newer version, a newer version may help in the process of debugging your issue by giving more helpful error messages.

You can update Cypress by going to `Settings` > `Check for updates` in the desktop application or by running `cypress install` in your terminal.

**If you can not update** for some reason, please include the version of Cypress you are running when you file a report. You can find the version in `Settings` > `About` in the desktop application.

### Update cypress-cli

```bash
npm update -g cypress-cli
```

### Supported Issues

Before filing a bug, make sure you're filing an issue against something we support. See our [System Requirements](https://github.com/cypress-io/cypress/wiki/getting-started#system-requirements). If you're using an unsupported environment, file a Feature Request.

### Getting More Information

For some issues, there are places you can check for more information. This may help you resolve the issue yourself. Even if it doesn't, this information can help us figure out and resolve an issue.

- For issues in the web browser, check the JavaScript console and your Network tab.
- Click on any commands where the failure occurred, this will log more information about the error to the JavaScript console.
- Use Cypress' [`debug`](https://on.cypress.io/api/debug) or [`pause`](https://on.cypress.io/api/pause) commands to step through your commands.
- Ask other Cypress users for help in our [gitter channel](https://gitter.im/cypress-io/cypress).

### Reproducibility

The most important part of your issue is instructions on how to reproduce the issue. What did you do? If you do it again, does it still break? Does it depend on a specific order?

It is nearly impossible for us to resolve many issues if we can not reproduce them. We will generally make a reasonable effort to reproduce problems, but sometimes we will be unable to reproduce an issue.

Your best chance of getting a bug looked at quickly is to provide a repository with a reproducible bug that can be cloned and run.

### Open an Issue

If you're up to date, supported, have collected information about the problem, and have the best reproduction instructions you can come up with, you're ready to [open an issue](https://github.com/cypress-io/cypress/issues/new).

### Code of Conduct

All contributors are expecting to abide by our [Code of Conduct](../../wiki/code-of-conduct)

## Contributing Feature Requests

Have a feature you'd like to see in Cypress? This describes how to file an effective feature request.

**The most important things to do are:**

- understand our roadmap
- make sure your feature makes sense in the project
- align your expectations around timelines and priorities
- describe your problem, not your solution

If you have a bug report (not a feature request), see [Contributing Bug Reports](#contributing-bug-reports).

### Understand our Roadmap

We have a cohesive vision for the project in the long term and a general roadmap that extends for years into the future. While the specifics of how we get there are flexible, many milestones are well-established.

Although we set project direction, the community is also a critical part of Cypress. We aren't all-knowing, and we rely on feedback to help us identify issues, guide product direction, prioritize changes, and suggest features.

Feature requests are an important part of this, but we ultimately build only features which make sense as part of the long term plan.

Since it's hard to absorb a detailed understanding of that vision, describing a problem is often more effective than requesting a feature. We have the context to develop solutions which fit into our plans, address similar use cases, make sense with the available infrastructure, and work within the boundaries of our product vision.

### Setting Expectations

We have a lot of users and a small team. Even if your feature is something we're interested in and a good fit for where we want the product to go, it may take us a long time to get around to building it.

If you want a concrete timeline, you can work with us to pay for some control over our roadmap.

### Describe Problems

When you file a feature request, we need you to describe the problem you're facing first, not just your desired solution. Describing the problem you are facing is the most important part of a feature request.

Often, your problem may have a lot in common with other similar problems. If we understand your use case we can compare it to other use cases and sometimes find a more powerful or more general solution which solves several problems at once.

At other times, we'll have a planned solution to the problem that might be different from your desired solution but accomplish the same goal. Understanding the root issue can let us merge and contextualize things.

Sometimes there's already a way to solve your problem that might just not be obvious.

Finally, your proposed solution may not be compatible with the direction we want to take the product, but we may be able to come up with another solution which has approximately the same effect and does fit into the product direction.

### Open an Issue

If you think your feature might be a good fit for our roadmap, have reasonable expectations about it, and have a good description of the problem you're trying to solve, you're ready to [open a feature request](https://github.com/cypress-io/cypress/issues/new).

### Code of Conduct

All contributors are expecting to abide by our [Code of Conduct](../../wiki/code-of-conduct)

### Sign CLA

