# Cloud dev environment for the Cypress monorepo (Cursor Cloud Agents).
#
# Mirrors the image the monorepo's own CI uses: the `cy-docker` executor in
# .circleci/src/pipeline/@pipeline.yml -> cypress/base-internal:22.19.0-trixie.
# This is the base for building/testing Cypress itself. (cypress/included and
# cypress/browsers are for end users running Cypress in their own CI, not for
# CI that runs *against* the Cypress source.)
#
# Node 22.19.0 matches .node-version. Browsers are NOT bundled in this image;
# CI installs them at runtime via the circleci/browser-tools orb, so a run that
# needs a real Chrome/Firefox should install it (or use the built-in Electron).
FROM cypress/base-internal:22.19.0-trixie

# Pin the package manager to the repo's Yarn 1 (see "packageManager" in package.json).
RUN npm install -g yarn@1.22.22

# Headless X display so the Electron GUI / browsers can render.
# The Xvfb server itself is launched by the `start` command in environment.json.
ENV DISPLAY=:1
