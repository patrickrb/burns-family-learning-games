# States Learning Game

An educational web-based game built with Next.js that helps kids learn US states, their capitals, and abbreviations through interactive gameplay.

## Features

- 🗺️ **Interactive Map**: SVG-based US map with clickable states
- 🎯 **Educational Focus**: Learn state names, locations, and abbreviations
- 👤 **User Authentication**: Simple login system to track progress
- 📊 **Progress Tracking**: Monitor scores, attempts, and accuracy
- 🏆 **Regional Learning**: Currently focuses on Northeast states
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Current Coverage

### Northeast States (11 states):
- Connecticut (CT)
- Delaware (DE)
- Maine (ME)
- Maryland (MD)
- Massachusetts (MA)
- New Hampshire (NH)
- New Jersey (NJ)
- New York (NY)
- Pennsylvania (PA)
- Rhode Island (RI)
- Vermont (VT)

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Authentication**: NextAuth.js
- **Database**: SQLite with Prisma ORM

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up the database**:
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Environment Variables

Create a `.env.local` file with:

```
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL="file:./dev.db"
```

## Game Flow

1. **Landing Page**: Introduction and game overview
2. **Sign In**: Simple authentication with name and email
3. **Game Page**: 
   - Interactive map shows highlighted state
   - Player clicks on the correct state name from a list
   - Real-time feedback and scoring
   - Progress tracking throughout the session
4. **Completion**: Final score and accuracy statistics

## Future Enhancements

- Additional US regions (Southeast, Midwest, West, Southwest)
- Multiple difficulty levels (capitals, abbreviations)
- Time-based challenges
- Leaderboards and achievements
- More detailed progress analytics

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── game/              # Main game page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── us-map.tsx        # Interactive map component
│   └── state-list.tsx    # State selection component
└── lib/                   # Utility functions and configurations
    ├── auth.ts           # NextAuth configuration
    └── utils.ts          # Utility functions
```
