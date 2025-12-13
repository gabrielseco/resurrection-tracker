# Resurrection Ticket Tracker

Track resale prices for Resurrection festival tickets with historical data and price charts.

## Features

- Add ticket prices with dates and notes
- Automated ticket price scraping from resale sites
- View price history with interactive charts
- Track both 4-day and 4-day VIP passes
- Shared database so everyone sees the same data
- Dark mode support

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Recharts for graphs
- TanStack React Query
- Upstash Redis for data storage
- Puppeteer for automated price scraping

## Getting Started

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Upstash Redis:
   - Create an Upstash account at https://upstash.com
   - Create a new Redis database (Global for better performance)
   - Copy your REST URL and REST Token
   - Create a `.env.local` file with:
     ```bash
     UPSTASH_REDIS_REST_URL=your_redis_url
     UPSTASH_REDIS_REST_TOKEN=your_redis_token
     ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Deployment

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel:
   - Go to your project settings
   - Navigate to **Environment Variables**
   - Add `UPSTASH_REDIS_REST_URL` with your Upstash Redis REST URL
   - Add `UPSTASH_REDIS_REST_TOKEN` with your Upstash Redis REST Token
4. Deploy

The app will automatically use Upstash Redis in production.

## Free Tier Limits

Upstash Redis Free Tier:
- 10,000 commands/day
- 256 MB max data size
- Perfect for this use case

## Usage

1. Select ticket type (4 Day or 4 Day VIP)
2. Enter the date and price
3. Optionally add notes (e.g., "Stubhub listing")
4. Click "Add Price Entry"
5. View the price chart and history below

All users will see the same data in real-time!
