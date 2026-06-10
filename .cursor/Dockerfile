# Cloud dev environment for the Cypress monorepo (Cursor Cloud Agents).
#
# Base image ships Node 22.19.0 (matches .node-version) plus Chrome/Firefox/Edge
# and every OS dependency Cypress needs to launch browsers and the Electron app.
# NOTE: Chrome/Edge are amd64-only in this base image; run the cloud agent on amd64.
FROM cypress/browsers:22.19.0

# Pin the package manager to the repo's Yarn 1 (see "packageManager" in package.json).
RUN npm install -g yarn@1.22.22

# Headless X display so `yarn cypress:run` / the Electron GUI can render.
# The Xvfb server itself is launched by the `start` command in environment.json.
ENV DISPLAY=:1
