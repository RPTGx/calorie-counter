# Calorie Counter App

An AI-powered calorie tracking application that helps users maintain their calorie goals through easy meal logging and personalized insights.

## Features

- 🤖 AI-powered meal analysis for accurate calorie and macro tracking
- 🎯 Personalized calorie targets based on user profile and goals
- 📊 Visual progress tracking with weight history and achievements
- 🏆 Gamification with achievements and milestones
- 📱 Responsive design for both desktop and mobile use

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **AI Integration**: OpenAI GPT-3.5
- **Charts**: Chart.js
- **Forms**: React Hook Form
- **Data Validation**: Zod

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- Supabase account
- OpenAI API key

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
```

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/calorie-counter.git
   cd calorie-counter
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql` in the Supabase SQL editor
   - Enable Email Auth in Authentication settings
   - Copy the project URL and anon key to your `.env.local` file

4. Get an OpenAI API key:
   - Sign up at https://platform.openai.com
   - Create an API key
   - Add it to your `.env.local` file

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/
│   ├── (auth)/             # Authentication pages
│   ├── (dashboard)/        # Dashboard pages
│   ├── api/                # API routes
│   ├── components/         # Shared components
│   ├── lib/                # Utility functions
│   ├── hooks/             # Custom hooks
│   └── types/             # TypeScript types
├── public/                # Static assets
└── supabase/             # Database schema
```

## Features in Detail

### AI-Powered Meal Logging
- Natural language meal descriptions
- Automatic calorie and macro estimation
- Real-time analysis using OpenAI

### Progress Tracking
- Weight history visualization
- Calorie intake tracking
- Macro breakdown analysis

### Achievements System
- Milestone tracking
- Automatic achievement unlocking
- Progress motivation

### Profile Management
- BMR calculation
- TDEE estimation
- Personalized calorie targets

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the GPT-3.5 API
- Supabase for the amazing backend platform
- Vercel for Next.js and hosting
- All contributors and users of the app