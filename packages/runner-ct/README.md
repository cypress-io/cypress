# Runner CT

This is an old package, deprecated in favor of `@packages/app`. It has two remaining responsibilities before it can be entirely removed:

1. Bundles `@packages/reporter` and `@packages/driver` via webpack. Once those can be directly imported to `@packages/app`, we can remove this.
2. Bundles styles for `@packages/reporter`, loaded in `main.scss`. Ideally, reporter should import its own styles.