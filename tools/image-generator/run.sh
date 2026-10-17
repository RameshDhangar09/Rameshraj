#!/bin/sh
# Regenerate sample images. Usage: ./run.sh [--only name1,name2]
cd "$(dirname "$0")" && node render.js "$@"
