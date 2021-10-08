#!/bin/bash
set -e

# move tests and snapshots and projects from the server, in a reproducible way...

PKG_DIR=`dirname "$0"`/..
PKG_DIR=`realpath $PKG_DIR`

echo "⚠⚠⚠ This script will destroy existing imported server files in $PKG_DIR."
echo "Be careful, double-check this is what you want."
echo "This is your last chance to hit Ctrl+C."
echo "Press any other key to continue."
read -s -n 1

DEST_TEST_DIR=$PKG_DIR/test
DEST_SNAPSHOT_DIR=$PKG_DIR/__snapshots__
DEST_PROJECT_DIR=$PKG_DIR/projects

SERVER_DIR=`realpath ${SERVER_DIR:-"$PKG_DIR/../packages/server"}`
TEST_DIR=$SERVER_DIR/test/e2e
SNAPSHOT_DIR=$SERVER_DIR/__snapshots__
PROJECT_DIR=$SERVER_DIR/test/support/fixtures/projects

set -x

rm -rf $DEST_TEST_DIR
mv $TEST_DIR $DEST_TEST_DIR

rm -rf $DEST_PROJECT_DIR
mv $PROJECT_DIR $DEST_PROJECT_DIR

rm -rf $DEST_SNAPSHOT_DIR
mkdir -p $DEST_SNAPSHOT_DIR

set +e
# move snapshots for e2e test filenames only
for EXT in "js" "ts"; do
    # it's normal for many of these to fail, this is the shotgun-blast approach to copying these
    ls $DEST_TEST_DIR | xargs -I {} mv "$SNAPSHOT_DIR"/{}."$EXT" "$DEST_SNAPSHOT_DIR"
done
set -e