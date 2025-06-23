#!/bin/bash

echo "=== Buildpack Debug Information ==="
echo "Current directory: $(pwd)"
echo "Node version: $(node --version 2>/dev/null || echo 'Node not found')"
echo "Python version: $(python3 --version 2>/dev/null || echo 'Python3 not found')"
echo "Available commands:"
echo "  node: $(which node 2>/dev/null || echo 'not found')"
echo "  python3: $(which python3 2>/dev/null || echo 'not found')"
echo "  npm: $(which npm 2>/dev/null || echo 'not found')"
echo "  pip: $(which pip 2>/dev/null || echo 'not found')"
echo ""
echo "Environment variables:"
echo "  PORT: $PORT"
echo "  NODE_ENV: $NODE_ENV"
echo "  PYTHONPATH: $PYTHONPATH"
echo ""
echo "Files in current directory:"
ls -la
echo ""
echo "Files in parent directory:"
ls -la ../ 