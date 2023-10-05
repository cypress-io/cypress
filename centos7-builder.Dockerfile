FROM centos:7
# Install dependencies for re-building better-sqlite and setting devtoolset-8 as the default compiler
RUN yum -y install centos-release-scl curl python3 make atk-devel atk java-atk-wrapper at-spi2-atk gtk3 libXt libdrm mesa-libgbm Xvfb && yum -y install devtoolset-8-gcc devtoolset-8-gcc-c++
RUN echo >> /etc/profile.d/devtoolset-8.sh 'source scl_source enable devtoolset-8'
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
RUN echo >> /etc/profile.d/nvm.sh 'source ~/.nvm/nvm.sh'
# Node 16 is the most recent version that supports CentOS 7. We only need it to
# re-build better-sqlite, so there should be minimal risk of security issues.
RUN source ~/.nvm/nvm.sh && nvm install 16.20.2 && npm install -g yarn
