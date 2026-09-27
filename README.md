# QuickDrop — Production-Grade Browser-to-Browser File Sharing

> **Transfer files. Directly. Privately.**  
> Send files, photos, videos, and text directly between your devices without uploading them to a cloud server using WebRTC peer-to-peer technology.

---

## 🌟 Key Highlights

* **Zero Cloud Storage**: Files are transferred directly between device browsers using WebRTC RTCDataChannels. No files are stored or cached on intermediate servers.
* **Instant Multi-Tab & Multi-Window Local Testing**: Features an intelligent `BroadcastChannelSignalingAdapter` allowing instant P2P transfers across two browser tabs or windows out of the box with zero external backend needed!
* **Cross-Device & Cross-Network Ready**: Supports WebSocket-based signaling via `WebSocketSignalingAdapter` and includes a standalone signaling server script.
* **Binary File Chunking & Backpressure**: Streams files in safe 64KB binary chunks with automatic buffer monitoring (`bufferedAmount` & `bufferedAmountLowThreshold`), eliminating memory pressure and data channel saturation.
* **Integrity Verification**: Employs Web Crypto SHA-256 checksums to verify payload consistency before sending and upon assembly.
* **Mobile-First & Fully Responsive**: Tailored for screens from 320px smartphones to 1920px 4K displays.
* **PWA Enabled**: Installable on iOS, Android, and Desktop with offline shell caching.
* **Dark / Light / System Mode**: Intentionally designed color themes with contrast compliance.
* **IndexedDB Local History**: Retains transfer metadata (file names, sizes, timestamps, peer identity) solely in the local browser.

---

## 🏗️ Architecture

```text
src/
├── components/
│   ├── common/           # Button, IconButton, Modal, ConfirmDialog, ProgressBar, Toast, etc.
│   └── navigation/       # Navbar, MobileNav, Footer
├── pages/
│   ├── LandingPage.tsx   # Hero, How It Works, Supported formats, Privacy guarantee
│   ├── TransferPage.tsx  # P2P connection, dropzone, live metrics, cancel & download
│   ├── HistoryPage.tsx   # Local IndexedDB transfer log & details modal
│   ├── HowItWorksPage.tsx# Deep-dive WebRTC architecture & security explanation
│   ├── SettingsPage.tsx  # Device name, chunk size, signaling mode & diagnostics
│   └── NotFoundPage.tsx  # 404 handler
├── layouts/
│   └── RootLayout.tsx    # Shell with global ToastContainer & IncomingTransferModal
├── features/
│   ├── room/             # CreateRoomCard, JoinRoomCard, QRCodeCard, RoomCode, ScannerModal
│   ├── transfer/         # FileDropzone, FileCard, FileList, TransferProgress, TextTransferModal
│   ├── device/           # DeviceCard, ConnectionStatus, ConnectionVisualizer
│   └── history/          # HistoryList, HistoryCard, HistoryDetailsModal
├── hooks/
│   ├── useTheme.ts       # Theme management & meta theme-color sync
│   ├── useWebRTC.ts      # WebRTC service event bindings to Zustand
│   ├── usePWA.ts         # PWA install prompt lifecycle
│   └── useSound.ts       # Web Audio API chimes
├── stores/
│   ├── connectionStore.ts# Connection state, devices, latency
│   ├── roomStore.ts      # Active room session
│   ├── transferStore.ts  # Selected files & active progress state
│   ├── settingsStore.ts  # Persisted user settings
│   ├── historyStore.ts   # Persisted transfer logs
│   └── toastStore.ts     # Ephemeral toast queue
├── services/
│   ├── webrtc/           # WebRTCService (PeerConnection, DataChannel, backpressure)
│   ├── signaling/        # SignalingService, BroadcastChannelAdapter, WebSocketAdapter
│   ├── file/             # File processing, MIME categorizing, Blob downloads
│   ├── crypto/           # Room code generation & SHA-256 calculation
│   └── storage/          # IndexedDB service with localStorage fallback
├── utils/                # formatters, platform detection, validators
├── types/                # Strict TypeScript domain types
└── constants/            # STUN servers, chunk sizes, buffer limits
```

---

## 🚀 Getting Started

### 1. Installation

```bash
git clone https://github.com/pareesh/quick-drop.git
cd quick-drop
npm install
```

### 2. Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

### 3. Testing Local Peer-to-Peer Transfer (2 Tabs)

1. Open `http://localhost:5173` in Tab A and click **Create Transfer**.
2. Copy the room code (e.g., `QK-4829`) or click **Share Link**.
3. Open `http://localhost:5173` in Tab B (or an incognito window), click **Join Transfer**, and enter the code.
4. The two tabs will automatically establish a direct WebRTC peer connection!
5. Select or drop files in either tab and click **Send**. The receiving tab will prompt with an explicit **Accept Transfer** dialog.
6. Watch real-time transfer progress, speed in MB/s, remaining ETA, and download the assembled files!

### 4. Cross-Device Setup (Over WiFi / LAN / Internet)

To transfer files across two separate devices (e.g., phone and laptop):
1. Start the signaling server:
   ```bash
   node server/signaling-server.js
   ```
2. In QuickDrop, open **Settings** ➔ Toggle **Signaling Mode** to `WebSocket` (or set `ws://YOUR_COMPUTER_IP:4000`).
3. Create room on one device and join from the other!

### 5. Production Build

```bash
npm run build
npm run preview
```

---

## 🔒 Security & Privacy Principles

1. **Direct Communication**: Binary files travel directly over encrypted DTLS/SCTP channels between peers.
2. **Explicit Consent**: Incoming files are never downloaded automatically. The recipient must confirm the file names and sizes.
3. **Safe Memory Assembly**: Chunks are streamed and held in typed arrays during transfer and converted to Blobs on finish, avoiding file lock contention.
4. **No Identity Tracking**: Device IDs and names are stored locally in the browser with no tracking cookies or user accounts.

---

## 🛠️ Browser Compatibility

QuickDrop utilizes modern Web standards supported by all major browsers:
* Chrome / Edge / Brave: Full support
* Firefox: Full support
* Safari (iOS & macOS): Full support
* Mobile browsers: Responsive touch layouts, camera QR scanner, and Web Share API integration.

---

## 📄 License

MIT License. Built with passion for privacy and seamless P2P engineering.
