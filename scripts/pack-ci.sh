#!/bin/bash

set -e

# Parse command line arguments
PACK_ALL=false
VALIDATE=false
PACK=true

for arg in "$@"; do
  case $arg in
    --all)
      PACK_ALL=true
      ;;
    --validate)
      VALIDATE=true
      ;;
    --pack=false)
      PACK=false
      ;;
    --pack=true)
      PACK=true
      ;;
  esac
done

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

# Validate the base config (only if --validate flag is set)
if [ "$VALIDATE" = true ]; then
  echo "🔍 Validating base configuration..."
  if ! circleci config validate "$base_config"; then
    echo "❌ Warning: Base config is not valid! Fix the base config in ./.circleci/config.yml."
    exit 1
  fi
  echo "✅ Base configuration validated successfully"
fi

# Create the output directory if it doesn't exist
mkdir -p "$outdir"

# Find directories to process
if [ "$PACK" = true ]; then
  if [ "$PACK_ALL" = true ]; then
    echo "📦 Packing all configurations"
    # Process all directories in .circleci/src
    dirs_to_process=()
    for cfg_path in "${src_dir}"/*/; do
      if [ -d "$cfg_path" ]; then
        dirs_to_process+=("$cfg_path")
      fi
    done
  else
    echo "📦 Packing staged configurations"
    # Find directories in .circleci/src that contain modified files
    # Only check staged changes (for pre-commit hooks)
    modified_files=$(git diff --name-only --cached 2>/dev/null || echo "")
    dirs_to_process=()

    # Check which directories in .circleci/src contain modified files
    for cfg_path in "${src_dir}"/*/; do
      if [ -d "$cfg_path" ]; then
        cfg_name=$(basename "$cfg_path")
        # Check if any modified files are in this directory
        if echo "$modified_files" | grep -q "^\.circleci/src/$cfg_name/"; then
          dirs_to_process+=("$cfg_path")
        fi
      fi
    done
  fi
else
  echo "🔍 Validating existing packed configurations (skipping pack)"
  # Find existing packed files to validate
  dirs_to_process=()
  for packed_file in "${outdir}"/*.yml; do
    if [ -f "$packed_file" ]; then
      # Extract the directory name from the packed file
      cfg_name=$(basename "$packed_file" .yml)
      cfg_path="${src_dir}/${cfg_name}"
      if [ -d "$cfg_path" ]; then
        dirs_to_process+=("$cfg_path")
      fi
    fi
  done
fi

# Process directories
for cfg_path in "${dirs_to_process[@]}"; do
  cfg_name=$(basename "$cfg_path")
  output_file="${outdir}/${cfg_name}.yml"

  # Pack the configuration (only if --pack is true)
  if [ "$PACK" = true ]; then
    echo "📦 Packing ${cfg_name}.yml configuration..."
    if ! circleci config pack "$cfg_path" > "$output_file"; then
      echo "  ❌ Failed to pack ${output_file}"
      exit 1
    fi
    echo "  ✅ Packed ${output_file}"
  fi

  # Validate the packed configuration (only if --validate flag is set)
  if [ "$VALIDATE" = true ]; then
    if [ ! -f "$output_file" ]; then
      echo "  ❌ Packed file ${output_file} not found for validation"
      exit 1
    fi
    echo "  🔍 Validating ${output_file}"
    if ! circleci config validate "$output_file"; then
      echo "    ❌ Validating ${output_file} failed"
      exit 1
    fi
    echo "    ✅ ${cfg_name}.yml configuration validated successfully"
  fi
done

if [ ${#dirs_to_process[@]} -eq 0 ]; then
  echo "ℹ️  No configurations to process"
else
  if [ "$PACK" = true ] && [ "$VALIDATE" = true ]; then
    echo "🎉 All CircleCI configurations packed and validated successfully!"
  elif [ "$PACK" = true ]; then
    echo "🎉 All CircleCI configurations packed successfully!"
  elif [ "$VALIDATE" = true ]; then
    echo "🎉 All CircleCI configurations validated successfully!"
  fi
fi
