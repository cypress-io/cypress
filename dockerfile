# This dockerfile provides a docker image setup with zshell for developers to use as a common node development environment.
# This image copies no code in and can be used directly with a volume mount to add code to the /opt/module directory.
FROM cypress/base:latest

# Open up port 9229 for node debugging
EXPOSE 9229
EXPOSE 5566

WORKDIR /opt/cypress

RUN apt-get update \
  && apt-get install --no-install-recommends -y \
    ca-certificates \
    python3 \


# Run a custom command to start zsh. Check to see if a package env has been setup and cd to that directory before starting the shell.
CMD /bin/bash
