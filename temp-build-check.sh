#!/bin/bash
cd /Users/aleksandrgrebeshok/CODEBASE/pm-dashboard-visual-test
npm run build 2>&1 > /tmp/build-output.log
echo "Build completed. Exit code: $?"
