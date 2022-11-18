#!/bin/bash

# Grab the latest commit i.e the one used to trigger
GIT_COMMIT_MSG=$(git log --pretty=oneline -n 1)

# Create empty file then set to variable
touch /tmp/pipeline-parameters.json
PARAM_FILE="/tmp/pipeline-parameters.json"

# Loop through lines in PARAM and for each match with
# GIT_COMMIT_MSG write JSON object to file
while IFS= read -r line; do
  if [[ $GIT_COMMIT_MSG == *"[$line]"* ]]; then
    echo "Continuation Requested!"
    echo '{"'"$line"'":true}' >> $PARAM_FILE
  else
    echo "No Continuation Requested!"
  fi
done <<< "$PARAM"

# Create variables for word count and lines in file
filesize=$(wc -c <"$PARAM_FILE" | xargs)
linesinfile=$(wc -l <"$PARAM_FILE" | xargs)

# If the file contains more than 3 chars then
# IS_TRIGGERED will be set to true
if [ "$filesize" -gt 3 ]; then
  IS_TRIGGERED=true
else
  IS_TRIGGERED=false
fi

# If the param file contains more than one line, thus
# containing more than one JSON object, then use this
# logic to transform into one JSON object
if [ "$linesinfile" -gt 1 ]; then
  #add logic to recreate file
  sed -i 's/:/: /g' "$PARAM_FILE" # add whitespace after colon
  sed -i 's/[{}]//g' "$PARAM_FILE" # remove all braces
  sed -i s/$/,/ "$PARAM_FILE"; sed -i '$ s/.$//' "$PARAM_FILE" # add , to end of files then remove from last
  sed -i '1s/^/{\n/' "$PARAM_FILE"; echo "}" >> "$PARAM_FILE" # add braces around object
fi

# If IS_TRIGGERED is false then write the default {}
# to the parm file
if [ "$IS_TRIGGERED" = false ]; then
  echo '{}' > /tmp/pipeline-parameters.json
fi