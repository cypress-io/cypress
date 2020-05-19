# example: visual testing using Applitools

Shows how to use Applitools to visually check React charts made with [Victory](https://formidable.com/open-source/victory/) library.

![Screenshot](images/eyes.png)

See [src/Chart.spec.js](src/Chart.spec.js)

The `cy.eyes*` commands are ignored during local interactive run. On CI, the `cy.eyes*` send the snapshots to Applitools servers to be analyzed and compared against the baseline images.

![Test result](images/result.png)

For more information, see [Applitools tutorial](https://applitools.com/tutorials/cypress.html).

If there is a difference in visual output, Applitools catches it and fails the test run. The [Applitools Dashboard](https://applitools.com/) then allows you to review the changes, determine the root cause for the change, and maybe approve the visual changes to update the baseline images.

![Applitools difference view](images/applitools-diff.png)
