#!/bin/bash

file_list=$(ls ../projects/**/{package.json,yarn.lock} | sort -f)

echo $file_list