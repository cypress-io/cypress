# rewriter

This package contains shared constants used when rewriting JS/HTML that flows through the Cypress proxy.

The rewriting itself is implemented in the `proxy` package (`lib/http/util/regex-rewriter.ts`), and the `server` and `proxy` packages contain integration tests that exercise it.
