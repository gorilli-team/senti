#!/bin/bash

echo "=== Starting Python-only Senti App ==="

# Start a simple web server to handle PORT binding
echo "Starting web server on port $PORT..."
python3 -m http.server $PORT &
WEB_PID=$!

# Start the Signal Generator (Python)
echo "Starting Signal Generator..."
python signal-generator/main.py &
SIGNAL_PID=$!

# Function to handle shutdown
cleanup() {
    echo "Shutting down services..."
    kill $WEB_PID 2>/dev/null
    kill $SIGNAL_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Wait for all background processes
wait 