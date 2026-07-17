# SmartPan

SmartPan is a React Native recipe management app that lets you save, organize, and cook recipes while connecting to a local smart home server for real-time syncing and control.

It supports offline caching, live updates via WebSockets, and configurable server connections (IP/Port).

Connects to my [Smarthome](https://github.com/Flosse02/SmartHomeV4) app that I am developing.

---

## Features

- Save and manage recipes
- Search recipes by name, ingredient, or tag, plus quick category filter chips (Breakfast, Quick, Vegetarian, etc.)
- Favourite recipes — starred from a card or the recipe detail screen, with a dedicated Favourites tab and a Favourites row on Home
- Shopping list — add a recipe's ingredients (scaled to your chosen servings) to a running, checkable shopping list; matching ingredients from different recipes are merged instead of duplicated
- Real-time sync
- Offline caching, including offline-created *and* offline-edited recipes, which sync automatically once reconnected
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

## Architecture Overview

- RecipesContext
  - Fetching recipes
  - Caching
  - Optimistic updates
  - Syncing, including retrying offline-created and offline-edited recipes (with backoff) once the connection comes back
  - Favourite state — stored locally on-device and merged onto recipes; not synced to the server

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
- New recipes saved offline, and edits made offline, both sync with the server automatically once the connection is restored — a "Pending sync" badge shows on any recipe still waiting to sync

---

## Screens

- Home — featured recipe, favourites row, recently added
- Recipes — searchable, filterable recipe grid
- Favourites — your starred recipes
- Shopping List — checkable list built from recipes' ingredients
- Recipe Detail View
- Add / Edit Recipe — requires at least one tag/category, either picked from the presets or typed manually
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