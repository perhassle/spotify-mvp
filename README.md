# Spotify MVP - Music Streaming Platform

A modern, responsive music streaming platform built with Next.js 15, TypeScript, and Tailwind CSS. This MVP provides the foundational features for a Spotify-like music streaming experience.

## 🚀 Features

### ✅ Implemented
- **Modern UI/UX**: Spotify-inspired dark theme with responsive design
- **Music Player**: Fully functional player with play/pause, skip, volume controls
- **Queue Management**: Add tracks to queue, manage playback order
- **Navigation**: Sidebar navigation with Home, Search, Library sections
- **State Management**: Zustand-powered global state for player and UI
- **TypeScript**: Full type safety throughout the application
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Demo Content**: Sample tracks for testing functionality

### 🚧 Coming Next
- Authentication system
- Real music API integration
- Search functionality
- Playlist management
- User profiles
- Premium features

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **UI Components**: Custom components with Radix UI primitives
- **Icons**: Heroicons
- **Code Quality**: ESLint + Prettier

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd spotify-mvp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗 Project Structure

```
src/
  app/                 # Next.js App Router pages
    globals.css        # Global styles and Tailwind imports
    layout.tsx         # Root layout component
    page.tsx           # Home page
  components/
    layout/            # Layout components
      app-layout.tsx   # Main application layout
      sidebar.tsx      # Navigation sidebar
      music-player.tsx # Bottom music player
    ui/                # Reusable UI components
      button.tsx       # Button component with variants
      input.tsx        # Input component with validation
  lib/                 # Utility functions
    utils.ts           # Common utilities (cn, formatters, etc.)
  stores/              # Zustand state stores
    player-store.ts    # Music player state management
  types/               # TypeScript type definitions
    index.ts           # Global type definitions
```

## 🎵 Music Player Features

- **Playback Controls**: Play, pause, next, previous
- **Progress Bar**: Interactive seek functionality
- **Volume Control**: Adjustable volume with mute toggle
- **Repeat Modes**: Off, repeat all, repeat one
- **Shuffle**: Random track playback
- **Queue Management**: Dynamic track queue
- **Real-time Updates**: Live progress tracking

## 🎨 Design System

The application uses a Spotify-inspired design system with:

- **Colors**: Dark theme with Spotify green (#1ed760) accents
- **Typography**: Inter font family for clean readability
- **Components**: Consistent component variants and sizes
- **Animations**: Smooth transitions and hover effects
- **Accessibility**: Focus management and ARIA labels

## 🧪 Development

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run type-check # Run TypeScript type checking
```

### Code Quality

- **ESLint**: Configured with Next.js and TypeScript rules
- **Prettier**: Code formatting with Tailwind CSS plugin
- **TypeScript**: Strict mode enabled for type safety
- **Git Hooks**: Recommended pre-commit hooks setup

## 🚀 Deployment

The project is optimized for deployment on:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Railway**

Simply connect your repository to your preferred platform for automatic deployments.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Next Steps

To continue development:

1. **Authentication**: Implement user login/registration
2. **Music API**: Integrate with Spotify Web API or similar service
3. **Search**: Build comprehensive search functionality
4. **Playlists**: User-created playlist management
5. **Social Features**: Following, sharing, recommendations
6. **Premium Features**: Subscription tiers and gated content
7. **Mobile App**: React Native or PWA implementation

---

Built with ❤️ using modern web technologies