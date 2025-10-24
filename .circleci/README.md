# CircleCI Configuration

This directory contains CircleCI configuration files that use a dynamic workflow packing system for efficient CI development and execution.

## Prerequisites

### CircleCI Local CLI

The CircleCI Local CLI is required to pack the source configurations.

**Installation:**

- **macOS (Homebrew):**
  ```bash
  brew install circleci
  ```

- **Linux:**
  ```bash
  curl -fLSs https://raw.githubusercontent.com/CircleCI-Public/circleci-cli/master/install.sh | bash
  ```

- **Windows:**
  ```bash
  choco install circleci-cli
  ```

- **Manual installation:**
  Download from [CircleCI Local CLI releases](https://github.com/CircleCI-Public/circleci-cli/releases)

For more detailed installation instructions, see the [CircleCI Local CLI documentation](https://circleci.com/docs/2.0/local-cli/).

## Pre-commit Validation

When files in `.circleci/src/` are modified, the pre-commit hook automatically runs:

```bash
yarn pack-ci --verify
```

This command:
1. Scans all directories in `./.circleci/src/` for modifications
2. Packs only the modified directories (e.g., `workflows/` → `workflows.yml`)
3. Validates the packed configurations
4. Exits with error if validation fails

## File Structure

- `src/` - Source configuration directories (modify these)
- `packed/` - Generated configuration files (ignored by git)

## Development Workflow

1. Make changes to files in `src/` directories
2. Stage and commit changes - pre-commit hook automatically validates and packs configurations
3. The jobs defined in `config.yml` will pack these source directories on-the-fly when CI gets kicked off.

## `config.yml`

This is the main entrypoint to Cypress CI. It loads packed workflow files from cache, or builds them if necessary. Then it continues to the primary workflow. The main entrypoint to our CI must be available in source control and not packed on-the-fly.