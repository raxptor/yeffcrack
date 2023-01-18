#!/bin/bash
rm -rf dist
mkdir -p dist
cp index.html dist
cp *.css dist
cp -R scripts dist
tar -cf dist.tar dist
rm -rf dist

