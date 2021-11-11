#!/bin/sh

cd $(dirname ${0})

CASE_NAME=${1}
mkdir -p ${CASE_NAME}/bench

node -e "mcl = require('../src'); mcl.init().then(() => console.log(mcl))" > ${CASE_NAME}/exported-fields.dump
node -e "mcl = require('../src'); mcl.init().then(() => console.log(Object.keys(mcl).sort()))" > ${CASE_NAME}/exported-field-names.dump

diff -u {00-original,${CASE_NAME}}/exported-fields.dump > ${CASE_NAME}/exported-fields.diff
diff -u {00-original,${CASE_NAME}}/exported-field-names.dump > ${CASE_NAME}/exported-field-names.diff

for i in $(seq 1 3); do
  node ../test/bench.js > ${CASE_NAME}/bench/${i}
done
