#!/usr/bin/env sh

set -e

cd  dist
git config --global user.email "fkretschmar@googlemail.com"
git config --global user.name "floydkretschmar"
git init 
echo $GITHUB_REPOSITORY
echo $GITHUB_REPOSITORY_OWNER
git remote add gh-pages https://$GITHUB_REPOSITORY_OWNER:$GITHUB_TOKEN@github.com/$GITHUB_REPOSITORY.git
git add -A
git commit -m "new deployment"
git push
cd -