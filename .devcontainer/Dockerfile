FROM mcr.microsoft.com/devcontainers/base:bookworm

# Prepare apt
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive && apt-get upgrade -y

# Install dependencies
RUN apt-get install -y python3 g++ make cmake libglib2.0-dev libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xvfb

# Install Node
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Install Yarn
RUN npm install --global yarn
