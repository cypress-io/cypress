# CircleCI Configuration

This directory contains CircleCI configuration files that are automatically generated and updated.

## Prerequisites

### CircleCI Local CLI

The CircleCI Local CLI is required to generate the `pull-request.yml` file from the source configuration.

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

## Lint-Staged Rules

When files in this directory are modified, the following lint-staged rule will automatically run:

```bash
circleci config pack .circleci/workflows-src > .circleci/workflows.yml
```

This command:
1. Takes the source configuration from `./.circleci/workflows-src/`
2. Packs it into a single YAML file
3. Outputs the result to `./circleci/workflows.yml`

## File Structure

- `workflows-src/` - Source configuration files (modify these)
- `workflows.yml` - Generated configuration file (auto-generated, do not edit manually)

## Development Workflow

1. Make changes to files in `workflows-src/`
2. The lint-staged hook will automatically regenerate `workflows.yml` and stage it
3. Commit both the source changes and the generated file

**Note:** Always commit both the source files and the generated `workflows.yml` file together to ensure the CircleCI configuration stays in sync. 