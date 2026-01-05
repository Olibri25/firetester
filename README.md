# 🐟 AK FISH

**GPS-based mobile application for Alaska anglers** - combining real-time ADFG data with offline mapping capabilities.

[![React Native](https://img.shields.io/badge/React%20Native-0.73-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-50-black.svg)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://postgresql.org/)

## Overview

AK FISH aggregates publicly available Alaska Department of Fish and Game (ADFG) fishing data into a single, intuitive mobile interface optimized for Alaska's unique challenges: remote access, complex regulations, and dynamic salmon runs.

### Core Features

- 🎣 **Real-time Fish Counts** - Live data from 50+ ADFG sonar/weir stations
- ⚠️ **Emergency Orders** - Instant regulation change alerts pushed to your device
- 🗺️ **Offline Maps** - Topo & satellite maps for backcountry fishing
- 🏞️ **Alaska Lake Database** - Stocking schedules, depth maps, and species data
- 📊 **Run Timing Predictions** - AI-powered predictions based on historical data

## Project Structure

```
ak-fish/
├── mobile/                 # React Native mobile app (Expo)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── screens/       # App screens
│   │   ├── navigation/    # Navigation configuration
│   │   ├── services/      # API services
│   │   ├── store/         # Zustand state management
│   │   ├── hooks/         # Custom React hooks
│   │   └── config/        # App configuration
│   ├── App.tsx
│   └── package.json
│
├── backend/               # Node.js/Express API
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── services/     # Business logic
│   │   ├── scrapers/     # ADFG data scrapers
│   │   ├── middleware/   # Express middleware
│   │   └── utils/        # Utilities
│   ├── prisma/           # Database schema & migrations
│   └── package.json
│
└── shared/               # Shared types & utilities
    ├── types/
    ├── constants/
    └── utils/
```

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn or npm
- PostgreSQL 15+
- Redis (optional, for caching)
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/ak-fish.git
   cd ak-fish
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   yarn db:migrate
   yarn db:seed
   ```

5. **Start the development servers**
   ```bash
   # Terminal 1: Start backend
   yarn dev:backend

   # Terminal 2: Start mobile app
   yarn dev:mobile
   ```

## Technology Stack

### Mobile App
- **React Native** with Expo
- **React Navigation** for navigation
- **Zustand** for state management
- **React Query** for server state
- **React Native Maps** / Mapbox for mapping

### Backend
- **Node.js** with Express
- **PostgreSQL** with PostGIS for geospatial queries
- **Prisma** ORM
- **Redis** for caching
- **Firebase Cloud Messaging** for push notifications

### Data Sources
- ADFG Fish Counts (sonar/weir data)
- ADFG Emergency Orders & Regulations
- Alaska Lake Database (ALDAT)
- NOAA Tide Predictions
- USGS Water Services
- NWS Weather API

## API Endpoints

### Fish Counts
- `GET /api/v1/fish-counts/stations` - List all counting stations
- `GET /api/v1/fish-counts/latest` - Get latest counts
- `GET /api/v1/fish-counts/summary` - Get count summary for all stations
- `GET /api/v1/fish-counts/history/:stationId` - Get historical data

### Emergency Orders
- `GET /api/v1/emergency-orders` - List emergency orders
- `GET /api/v1/emergency-orders/location/:lat/:lng` - Get orders by location

### Lakes
- `GET /api/v1/lakes` - List lakes
- `GET /api/v1/lakes/nearby` - Get lakes near coordinates
- `GET /api/v1/lakes/:id` - Get lake details with species and stocking

### Weather & Tides
- `GET /api/v1/weather/current` - Current weather conditions
- `GET /api/v1/tides/predictions` - Tide predictions by station

## Design System

### Colors
- **Primary**: Deep Teal (`#0D4F4F`) - Evokes Alaska waters
- **Secondary**: Glacier Blue (`#A8D8E8`) - Fresh, clean accent
- **Accent**: Salmon Orange (`#E85D4C`) - Call-to-action, alerts

### Typography
- **Headers**: Bold sans-serif (Inter/SF Pro)
- **Body**: Regular weight with generous line spacing
- **Touch targets**: Minimum 48px for gloved/wet hand use

## Subscription Tiers

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Basic map, current fish counts, regulations |
| Premium | $29.99/yr | Offline maps, waypoints, catch log, stocking alerts |
| Elite | $79.99/yr | Run timing AI, historical data, group sharing |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Alaska Department of Fish and Game for providing public fishing data
- NOAA for tide and weather data
- USGS for river flow data
- The Alaska fishing community for inspiration

---

**Built with ❤️ for Alaska anglers**
