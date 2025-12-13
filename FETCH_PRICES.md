# Price Fetching Script

This script automatically scrapes ticket prices from TicketSwap and sends them to the API.

## Setup

1. Install dependencies:
```bash
npm install
```

## Usage

### Run locally (sends to production API):
```bash
npm run fetch-prices
```

### Run with local API:
```bash
API_URL=http://localhost:3000/api/prices npm run fetch-prices
```

## How it works

1. Uses Puppeteer with stealth plugin to avoid detection
2. Scrapes the cheapest ticket price from TicketSwap
3. Sends the price to the API endpoint via POST request
4. Data format:
   - `id`: Auto-generated UUID
   - `date`: Current timestamp in ISO format
   - `ticketType`: "4-day"
   - `price`: Cheapest price found
   - `notes`: "Auto-fetched from TicketSwap"

## Scheduling

### GitHub Actions (Recommended)

The repository includes a GitHub Actions workflow at `.github/workflows/fetch-prices.yml`.

**To enable automatic daily runs:**
1. Edit `.github/workflows/fetch-prices.yml`
2. Uncomment the `schedule` section at the top
3. Commit and push to GitHub

**To run manually:**
1. Go to your GitHub repository
2. Click "Actions" tab
3. Select "Fetch TicketSwap Prices" workflow
4. Click "Run workflow"

The workflow is already configured with all necessary dependencies for Puppeteer to run on Ubuntu.

### Other Options

- **macOS/Linux crontab**: Run locally on a schedule
  ```bash
  0 9 * * * cd /path/to/resurrection-tracker && npm run fetch-prices >> fetch-prices.log 2>&1
  ```
- **External service**: Services like cron-job.org, EasyCron, etc.
