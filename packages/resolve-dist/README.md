# Resolve Dist

This package centralizes the resolution of paths to compiled/static assets from server-side code.

### CommonJS / ESM bundles

Currently, `@packages/resolve-dist` is only used in a server-side Node.js context via CommonJS. This package has ESM configured, but does NOT emit the bundle to help save on the binary size. 