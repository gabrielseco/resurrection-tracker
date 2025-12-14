#!/bin/bash

# Change to the project directory
cd /Users/gabriel/rogal/resurrection-tracker

# Set environment variables
export API_URL="https://resurrection-tracker.vercel.app/api/prices"
export PATH="/Users/gabriel/.asdf/shims:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# Create logs directory if it doesn't exist
mkdir -p logs

# Run the fetch-prices script and log output
echo "=== Fetch Prices Run: $(date) ===" >> logs/fetch-prices.log
npm run fetch-prices >> logs/fetch-prices.log 2>&1
echo "" >> logs/fetch-prices.log
