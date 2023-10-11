#!/usr/bin/env sh

set -e

cd  dist
git config --global user.email "fkretschmar@googlemail.com"
git config --global user.name "floydkretschmar"
git init 
echo $GITHUB_REPOSITORY
echo $GITHUB_REPOSITORY_OWNER
# git remote set-url origin https://$GITHUB_REPOSITORY_OWNER:$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY.git
git remote set-url origin https://github.com/floydkretschmar/portfolio.git
git checkout -b gh-pages
git add -A
git commit -m "new deployment"
git push
cd -