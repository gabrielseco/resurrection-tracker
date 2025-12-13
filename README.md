# Resurrection Ticket Tracker

Track resale prices for Resurrection festival tickets with historical data and price charts.

## Features

- Add ticket prices with dates and notes
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
- Vercel Blob for data storage

## Getting Started

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Vercel Blob:
   - Create a Vercel account if you don't have one
   - Create a new project and link it:
     ```bash
     vercel link
     ```
   - Add Vercel Blob storage to your project (Storage → Blob → Create)
   - Pull environment variables:
     ```bash
     vercel env pull
     ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add Vercel Blob storage:
   - Go to your project settings
   - Navigate to **Storage** tab
   - Click **Create Database**
   - Select **Blob**
   - Click **Create** (free tier available)
4. Deploy

The app will automatically use Vercel Blob in production at $0 cost (within free tier limits).

## Free Tier Limits

Vercel Blob Free Tier:
- 500 MB storage
- 5 GB bandwidth/month
- Perfect for this use case

## Usage

1. Select ticket type (4 Day or 4 Day VIP)
2. Enter the date and price
3. Optionally add notes (e.g., "Stubhub listing")
4. Click "Add Price Entry"
5. View the price chart and history below

All users will see the same data in real-time!
