# SmartPan

SmartPan is a React Native recipe management app that lets you save, organize, and cook recipes while connecting to a local smart home server for real-time syncing and control.

It supports offline caching, live updates via WebSockets, and configurable server connections (IP/Port).

Connects to my [Smarthome](https://github.com/Flosse02/SmartHomeV4) app that I am developing.

---

## Features

- Save and manage recipes
- Real-time sync
- Offline caching
- Custom theme support
- Clean mobile-first UI (React Native)

---

## Tech Stack

- React Native
- TypeScript
- Context API (state management)
- AsyncStorage (local persistence)
- WebSockets (real-time updates)

---

## Installation

Clone the repo:

```bash
git clone git@github.com:Flosse02/SmartPan.git
cd SmartPan
cd mobileApp
```

Install dependencies:

```bash
npm i
```

---

## ▶️ Running the App

### Start Metro bundler:

```bash
npm start
```

### Run Android:

```bash
npm run android
```

---

## Configuration

SmartPan connects the local smarthome that I have also developed.

You can configure this inside the app:

- IP Address (e.g. `192.168.1.100`)
- Port (e.g. `3000`)

These settings are persisted locally.

---

## 💡 Architecture Overview

- RecipesContext
  - Fetching recipes
  - Caching
  - Optimistic updates
  - Syncing

- ConfigContext
  - Server IP/port
  - Dynamic base URL
  - WebSocket URL updates

- ThemeContext
  - Light/dark/system mode
  - Persistent UI preferences

---

## Real-time Sync

SmartPan uses WebSockets to:
- instantly update recipes across local devices
- sync changes without refreshing
- reconnect automatically when server config changes

---

## Offline Support

- Recipes are cached.
- App loads cached data instantly on startup
- Syncs with server when connection is restored

---

## Screens

- Home / Recipe List
- Recipe Detail View
- Add / Edit Recipe
- Settings

---

## Future Improvements

- Get recipes from URL still has mutiple inconsitencies and bugs
- AI recipe suggestions
- Image scanning for recipes
- Auto LAN discovery
- Push notifications for sync updates

---

## 🧑‍💻 Author

Built by Ewan van de Nadort

---

## 📄 License

MIT License