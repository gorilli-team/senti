#!/bin/bash

# Set default PORT if not set
PORT=${PORT:-8000}

# Run debug information
echo "=== Starting Senti App ==="
./debug-buildpacks.sh

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not available. Check buildpack configuration."
    echo "Trying to install Node.js dependencies manually..."
    npm install || echo "npm install failed"
    exit 1
fi

# Start a simple web server to handle PORT binding
echo "Starting web server on port $PORT..."
python3 -m http.server $PORT &
WEB_PID=$!

# Start the Oracle service (Node.js)
echo "Starting Oracle service..."
node oracle/main.js &
ORACLE_PID=$!

# Wait a moment for Oracle to initialize
sleep 5

# Start the Signal Generator (Python)
echo "Starting Signal Generator..."
python3 signal-generator/main.py &
SIGNAL_PID=$!

# Function to handle shutdown
cleanup() {
    echo "Shutting down services..."
    kill $WEB_PID 2>/dev/null
    kill $ORACLE_PID 2>/dev/null
    kill $SIGNAL_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Wait for all background processes
wait 