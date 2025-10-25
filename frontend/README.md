# PowerPrompts Frontend

Beautiful, high-tech AI-inspired dark mode interface for the PowerPrompts AI Prompt Optimizer.

## Features

- **Dark Mode Only**: Beautiful dark slate theme with neon green accents
- **Glassmorphism UI**: Modern glass-effect cards with backdrop blur
- **Real-Time Updates**: Server-Sent Events (SSE) for live optimization progress
- **State Management**: Zustand with localStorage persistence
- **Type-Safe**: Full TypeScript support with strict type checking
- **Responsive**: Mobile-first responsive design
- **Neon Effects**: Glowing borders, scan-line animations, and shimmer effects

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.6
- **Styling**: Tailwind CSS 3.4
- **State**: Zustand 5.0
- **Charts**: Recharts 2.12
- **Icons**: Lucide React
- **Fonts**: Inter, Space Grotesk, JetBrains Mono

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PowerPrompts backend running on http://localhost:8000

### Installation

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Configure Environment**:

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and set:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_API_KEY=your-backend-api-key
   ```

3. **Start Development Server**:

   ```bash
   npm run dev
   ```

4. **Open Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout with fonts
│   ├── page.tsx             # Main optimizer page
│   └── globals.css          # Global styles with Tailwind
├── components/
│   ├── ui/                  # Base UI components
│   │   ├── button.tsx       # Neon button with variants
│   │   └── card.tsx         # Glassmorphism cards
│   └── optimizer/           # Feature components
│       ├── prompt-input.tsx         # Prompt input with counter
│       ├── framework-selector.tsx   # Framework selection
│       ├── technique-toggles.tsx    # Technique toggles
│       └── optimization-progress.tsx # Live progress display
├── lib/
│   ├── types.ts             # TypeScript type definitions
│   ├── api-client.ts        # Backend API client
│   ├── streaming.ts         # SSE client
│   └── utils.ts             # Utility functions
├── stores/
│   └── optimization-store.ts # Zustand state management
└── hooks/
    └── use-optimization.ts   # Optimization orchestration hook
```

## Design System

### Colors

- **Background**: `#020617` (slate-950)
- **Surface**: `#0f172a` (slate-900)
- **Elevated**: `#1e293b` (slate-800)
- **Primary**: `#00ff9f` (neon green)
- **Accent Cyan**: `#06b6d4`
- **Accent Purple**: `#a855f7`

### Effects

- **Glassmorphism**: `glass` and `glass-elevated` classes
- **Neon Glow**: `neon-text`, `neon-border` classes
- **Grid Background**: `grid-bg` class
- **Animations**: `pulse-glow`, `scan-line`, `shimmer`

### Typography

- **Headings**: Space Grotesk (bold, tight tracking)
- **Body**: Inter (clean, readable)
- **Code**: JetBrains Mono (monospace)

## Available Scripts

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Production
npm run build        # Build for production
npm run start        # Start production server

# Quality
npm run lint         # Run ESLint
```

## State Management

The application uses Zustand for state management with localStorage persistence:

```typescript
// Access store in components
const prompt = useOptimizationStore((state) => state.prompt);
const setPrompt = useOptimizationStore((state) => state.setPrompt);

// Start optimization
const { startOptimization, isOptimizing } = useOptimization();
```

## SSE Integration

Real-time updates via Server-Sent Events:

```typescript
// Handled automatically by useOptimization hook
const { startOptimization, stopOptimization, isOptimizing } = useOptimization();

// Events received:
// - dataset_generated
// - iteration_start
// - applying_framework
// - framework_applied
// - executing_tests
// - metrics_calculated
// - prompt_improved
// - iteration_complete
// - optimization_complete
// - error
```

## Customization

### Adding Custom Colors

Edit `tailwind.config.ts`:

```typescript
colors: {
  customColor: {
    DEFAULT: "#hexvalue",
    light: "#hexvalue",
  },
}
```

### Adding Custom Animations

Add to `tailwind.config.ts`:

```typescript
animation: {
  "custom-animation": "custom-animation 2s ease-in-out infinite",
},
keyframes: {
  "custom-animation": {
    "0%": { /* styles */ },
    "100%": { /* styles */ },
  },
}
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000 (Windows)
npx kill-port 3000

# Or use a different port
PORT=3001 npm run dev
```

### Backend Connection Issues

1. Verify backend is running on http://localhost:8000
2. Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
3. Verify API key matches backend configuration
4. Check browser console for CORS errors

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Create feature branch
2. Make changes with proper TypeScript types
3. Test thoroughly
4. Ensure no linting errors: `npm run lint`
5. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please refer to the main PowerPrompts documentation in the project root.

---

**Built with ❤️ using Next.js 15, React 19, and TypeScript**
