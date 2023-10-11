#!/usr/bin/env sh

set -e

git config --global user.email "fkretschmar@googlemail.com"
git config --global user.name "floydkretschmar"
git fetch origin
git switch -c gh-pages origin/gh-pages
rm -r *
cp -r ../dist/* .
git add -A
git diff
git commit -m "new deployment"
git push