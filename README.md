# 🎵 Mume — Music Player

A full-featured, production-grade music streaming app built with React Native and Expo. Streams real songs from the JioSaavn API with offline download support, background playback, lock screen controls, playlists, favourites, and a persistent queue.

---

## ✨ Features

- 🔍 **Live search** — debounced song/artist/album search with auto-pagination
- 🎵 **Full player** — seek bar, repeat (off / all / one), shuffle, skip next/previous
- 📋 **Persistent queue** — add, remove, reorder, and clear songs; order is preserved across restarts
- 📥 **Offline downloads** — stream songs to local storage and play without internet
- 🔔 **Background playback** — music keeps playing when the app is minimized or the screen is locked
- 🔒 **Lock screen controls** — play/pause, skip, and album art on the iOS/Android notification shade
- ❤️ **Favourites** — save songs permanently; survive queue clears and app restarts
- 🎼 **Playlists** — create, rename, delete, and manage custom playlists
- 🖼️ **Suggested tab** — recently played history and trending artists
- 📁 **Folders tab** — all downloaded songs in one place for offline listening
- 🌗 **Dark / Light theme** — toggle live from Settings; entire app re-themes instantly
- 🎚️ **Audio quality** — choose 96 kbps, 160 kbps, or 320 kbps streaming quality
- 💾 **Full persistence** — queue, theme, downloads, favourites, playlists all survive app kills

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React Native + Expo | SDK 56 / RN 0.85 |
| Language | TypeScript (strict mode) | ~6.0.3 |
| State Management | Zustand | ^5.0.14 |
| Persistence | AsyncStorage | 2.2.0 |
| Audio Engine | expo-audio | ~56.0.11 |
| File System | expo-file-system | ~56.0.7 |
| Navigation | React Navigation (Native Stack + Bottom Tabs) | ^7.x |
| Gradients | expo-linear-gradient | ~56.0.4 |
| Icons | @expo/vector-icons (Ionicons) | ^15.0.2 |
| Seek Slider | @react-native-community/slider | 5.2.0 |
| Music Data | JioSaavn API (`saavn.sumit.co`) | — |
| Build & Distribution | EAS Build | — |

---

## 🏗️ Architecture

```
src/
├── api/
│   └── saavn.ts           # API wrapper — fetches & normalizes JioSaavn responses into typed Song/Artist/Album models
├── audio/
│   └── AudioProvider.tsx  # Single expo-audio player instance, wrapped in React Context
├── components/
│   ├── Artwork.tsx         # Image loader with fallback placeholder
│   ├── ArtistCard.tsx      # Circular artist avatar card
│   ├── HorizontalSongCard.tsx  # Card for horizontal scroll lists
│   ├── MiniPlayer.tsx      # Persistent floating mini player above the tab bar
│   ├── SongRow.tsx         # Full song list row with download, options menu, playlist picker
│   ├── CategoryTabs.tsx    # Suggested / Songs / Artists / Albums / Folders tab switcher
│   └── SortPicker.tsx      # Bottom sheet for sort order selection
├── navigation/
│   └── TabNavigator.tsx    # Bottom tab layout with custom tab bar
├── screens/
│   ├── HomeScreen.tsx      # Search, Suggested, Songs, Artists, Albums, Folders tabs
│   ├── PlayerScreen.tsx    # Full-screen player with artwork, seek, controls, menus
│   ├── QueueScreen.tsx     # Up-next queue list with reorder and remove
│   ├── FavoritesScreen.tsx # Saved favourites list
│   ├── PlaylistsScreen.tsx # Full playlist CRUD + song management
│   └── SettingsScreen.tsx  # Theme, audio quality, downloads, app info
├── services/
│   └── downloads.ts        # expo-file-system download logic; writes to app document directory
├── store/
│   ├── playerStore.ts      # Zustand — queue, playback state, downloads, favourites, theme
│   └── libraryStore.ts     # Zustand — playlists CRUD, separate from player state
├── types/
│   └── music.ts            # Song, Artist, Album, RepeatMode, SortOption type definitions
└── utils/
    └── music.ts            # pickImage, pickAudio, formatTime helpers
```

### How the layers connect

```
UI Screens / Components
        │  read & write via selectors
        ▼
  Zustand Stores  ──── persist() ────► AsyncStorage (disk)
  (playerStore,           ▲
   libraryStore)    hydrate() on launch
        │
        │  shouldPlay, currentSong, repeatMode
        ▼
  AudioProvider (React Context)
        │  player.replace(), player.play(), player.pause()
        ▼
  expo-audio (Native iOS / Android Engine)
        │  setActiveForLockScreen()
        ▼
  OS Lock Screen / Notification Shade
```

**Key design decisions:**
- **UI never calls audio directly.** It writes intent to Zustand (`shouldPlay = true`). `AudioProvider` reacts to that and drives `expo-audio`.
- **Downloads are transparent.** `markDownloaded()` stores the local URI in the store. `pickAudio()` checks `song.localUri` first — no special "offline mode" needed.
- **One audio player instance** lives inside `AudioProvider`. Both the MiniPlayer and the full PlayerScreen read the same Zustand state, so they're always in sync.
- **Two Zustand stores.** `playerStore` owns playback. `libraryStore` owns playlists. They're kept separate so playlist writes never trigger audio re-renders.

---

## ⚖️ Trade-offs

| Decision | Reason |
|---|---|
| Unofficial JioSaavn API | No official public API exists. The wrapper at `saavn.sumit.co` provides a clean REST interface. Service availability and media licensing are outside the app's control. |
| No drag-to-reorder in queue | Avoids adding a heavy gesture library for one interaction. Up/down controls are accessible and deterministic. |
| No download progress indicator | Keeps scope focused. `expo-file-system`'s `downloadAsync` handles the transfer; a progress callback can be added later. |
| `expo-audio` over `react-native-track-player` | expo-audio is the Expo-native solution, deeply integrated with the SDK 56 ecosystem. RNTP offers more advanced features (gapless playback, full notification actions) but requires more native configuration. |
| AsyncStorage over SQLite/MMKV | State payload is small (queue + metadata). AsyncStorage is zero-config and sufficient. MMKV would be faster for high-frequency writes. |
| Zustand over Redux / Context | No boilerplate, fine-grained subscriptions (components only re-render when their selected slice changes), and trivial setup. |

---

## ⚙️ Requirements

Before running the project, make sure you have the following installed:

| Tool | Minimum Version | Check with |
|---|---|---|
| Node.js | 18.x or higher | `node --version` |
| npm | 9.x or higher | `npm --version` |
| Expo CLI | Latest | `npx expo --version` |
| Android Studio (for Android) | Latest stable | — |
| Xcode (for iOS, macOS only) | 15+ | — |
| Git | Any | `git --version` |

> **No physical device is required** — Android Emulator or iOS Simulator work fine for most features.  
> **Background playback and lock screen controls** require a real device or a development build (not Expo Go).

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Saksham0121/musicplayer.git
cd musicplayer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm start
# or
npx expo start
```

This opens the Expo Dev Tools in your browser. From there:
- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator (macOS only)
- Scan the QR code with the **Expo Go** app on a physical device

> ⚠️ **Expo Go limitation:** Background playback and lock screen controls require native configuration from the `expo-audio` plugin. Use a development build or the APK for the full experience.

### 4. Run on a specific platform

```bash
# Android emulator or connected device
npm run android

# iOS simulator (macOS only)
npm run ios
```

---

## 📦 Building an APK (Android)

To build an installable APK using EAS:

### Prerequisites
- An [Expo account](https://expo.dev/signup) (free)
- EAS CLI installed: `npm install -g eas-cli`
- Logged in: `eas login`

### Build command

```bash
# Production APK (downloadable, installable without Play Store)
eas build --platform android --profile preview
```

Once the build completes, EAS provides a download link for the `.apk` file. Install it directly on any Android device.

---

## ✅ Verification

Run the TypeScript type checker to confirm there are no type errors:

```bash
npm run typecheck
```

Inspect the resolved Expo config (native plugins, permissions):

```bash
npx expo config --type public
```

---

## 📡 API

Music data is sourced from the **JioSaavn API** via the community wrapper at `https://saavn.sumit.co`.

| Endpoint | Used for |
|---|---|
| `GET /api/search/songs` | Song search with pagination |
| `GET /api/search/artists` | Artist search |
| `GET /api/search/albums` | Album search |

All responses are normalized in [`src/api/saavn.ts`](src/api/saavn.ts) into typed `Song`, `Artist`, and `Album` models before reaching the UI. Image and audio URLs are forced to `https://` to ensure they load on Android.

> **Note:** This is an unofficial public API. No API key is required, but service availability is not guaranteed.

---

## 📁 Project Info

- **App name:** Mume
- **Version:** 1.0.0
- **Expo SDK:** 56
- **React Native:** 0.85.3
- **Language:** TypeScript (strict)
