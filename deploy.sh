#!/usr/bin/env sh

set -e

npm run build

cd  dist

git init
git add -A
git commit -m 'deployment'
git config --global user.email "fkretschmar@googlemail.com"
git config --global user.name "floydkretschmar"
git push -f git@github.com:floydkretschmar/portfolio.git master:gh-pages

cd -