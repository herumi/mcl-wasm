#!/bin/sh

cd $(dirname ${0})

node -e "mcl = require('../src'); mcl.init().then(() => console.log(mcl))" > exported-fields.orig.dump
node -e "mcl = require('../src'); mcl.init().then(() => console.log(Object.keys(mcl).sort()))" > exported-field-names.orig.dump

for i in $(seq 1 3); do
  node ../test/bench.js > bench/js-${i}
done
