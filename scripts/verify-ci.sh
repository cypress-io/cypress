#!/bin/bash

set -e

if ! which circleci > /dev/null; then
  echo "❌ Warning: CircleCI CLI not found! Install the CircleCi CLI to edit the CircleCI configuration."
  exit 1
fi

echo "Verifying CircleCI configurations..."

src_dir="./.circleci/src"
outdir="./.circleci/packed"
base_config="./.circleci/config.yml"

# Create the base config if it doesn't exist
if [ ! -f "$base_config" ]; then
  echo "❌ Warning: Base config not found! Create a base config in ./.circleci/config.yml."
  exit 1
fi

# Validate the base config
if ! circleci config validate "$base_config"; then
  echo "❌ Warning: Base config is not valid! Fix the base config in ./.circleci/config.yml."
  exit 1
fi

# Create the output directory if it doesn't exist
mkdir -p "$outdir"

# Find directories in .circleci/src that contain modified files
modified_files=$(git diff --name-only HEAD)
modified_dirs=()

# Check which directories in .circleci/src contain modified files
for cfg_path in "${src_dir}"/*/; do
  if [ -d "$cfg_path" ]; then
    cfg_name=$(basename "$cfg_path")
    # Check if any modified files are in this directory
    if echo "$modified_files" | grep -q "^\.circleci/src/$cfg_name/"; then
      modified_dirs+=("$cfg_path")
    fi
  fi
done

# Process only directories with modified files
for cfg_path in "${modified_dirs[@]}"; do
  cfg_name=$(basename "$cfg_path")
  output_file="${outdir}/${cfg_name}.yml"

  echo "📦 Packing ${cfg_name}.yml configuration..."
  if ! circleci config pack "$cfg_path" > "$output_file"; then
    echo "  ❌ Failed to pack ${output_file}"
    exit 1
  fi
  echo "  ✅ Packed ${output_file}"

  echo "  🔍 Validating ${output_file}"
  if ! circleci config validate "$output_file"; then
    echo "    ❌ Validating ${output_file} failed"
    exit 1
  fi
  echo "    ✅ ${cfg_name}.yml configuration validated successfully"
done

echo "🎉 All CircleCI configurations verified successfully!"