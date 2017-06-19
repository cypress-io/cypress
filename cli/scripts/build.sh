## clean out build
rm -rf build

## copy over binary
mkdir -p build/bin
cp bin/cypress build/bin/cypress

## copy readme
cp NPM_README.md build/README.md

## generate babel'd js index + lib
babel lib -d build/lib && babel index.js -o build/index.js
