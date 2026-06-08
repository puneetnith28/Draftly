# 📝 Draftly

Draftly is a **privacy-first, offline-capable** block editor and document organizer designed for seamless writer workflows. All your documents are stored directly in your browser — **no account, no server, no internet connection required for writing**. Your work remains on your device.

Positioned as a lightweight competitor to tools like Notion and Obsidian, Draftly combines a robust block-based editor with an advanced file explorer and rich multi-format export capability. As a **Progressive Web App (PWA)**, Draftly can be **installed on your device** to work just like a native app, available directly from your home screen or dock.

> **📥 Installable & Offline-Capable.** Look for the download icon in your browser's address bar to install Draftly. After the first visit, it works with or without an internet connection. All data is stored locally in your browser.

---

## 🚀 Features

### 1. Nested File Explorer
* **Hierarchical Folders**: Create unlimited nested subdirectories (`Folder` inside `Folder`).
* **Visual Directory Tree**: Rendered recursively with vertical connection lines, indent levels, and smooth transitions for expanding and collapsing items.
* **Drag-and-Drop Reorganization**: Fully cycle-safe drag-and-drop engine allowing you to move files and subfolders in/out of nested paths without creating dependency loops.
* **Safety deletions**: Deleting a parent folder automatically promotes (bubbles up) its child subfolders and documents to its parent level, preventing orphaned files.

### 2. Touch Gesture Engine (Mobile UX)
* **Press & Hold to Delete**: A custom touch-gesture tracker designed to let mobile users press and hold any editor block to trigger visual delete overlays.
* **Haptic Feedback**: Integrates with mobile device vibration motors (`navigator.vibrate`) to offer satisfying physical confirmations of gesture actions.

### 3. Inline Slash Commands (`/`)
* **Contextual Menu**: Triggered by pressing `/` in any empty text block.
* **Block Conversion**: Easily switch block types to Headings, Bullet Lists, Code Blocks, or Quote Blocks instantly from the popup menu.

### 4. Offline-First & Zero Backend
* **No Account Required**: Open the app and start writing. Zero sign-up, zero login flow.
* **LocalStorage Persistence**: All documents, folders, and preferences are stored directly in the browser's `localStorage`. Data persists across browser sessions and survives page refreshes.
* **No Network Dependency**: Draftly has no API calls, no remote database, and no cloud sync. It works perfectly with zero internet connection after the initial page load.
* **PWA-Ready**: The app registers a Service Worker in production mode, enabling full offline access after the first visit — even if you close and reopen the browser.

### 5. Robust Auto-Saving & Performance
* **Instant Auto-Save**: Every keystroke is debounced and automatically persisted to `localStorage`. The top bar shows a real-time `Saving...` → `Saved` indicator.
* **Stable Save Loop Prevention**: Uses a "latest-ref" pattern to prevent the auto-save effect from triggering unnecessary re-renders caused by prop recreation.
* **Responsive Layouts**: Designed using premium glassmorphism overlays and CSS variable styling, offering a seamless experience across desktop and mobile browsers.

### 6. Multi-Format Export
* Export documents to clean **Markdown**, **PDF**, or **DOCX** with one click — all generated client-side with no server involvement.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Core Framework** | [Next.js 16](https://nextjs.org) (App Router, React 19) |
| **Language** | TypeScript — type-safe schemas, interfaces, and component props |
| **Styling** | TailwindCSS + Custom CSS variables (dark mode, glassmorphism, micro-animations) |
| **Data Storage** | Browser `localStorage` — fully client-side, zero backend |
| **Offline Support** | Service Worker (PWA) registered in production builds |
| **Document Export** | `docx`, `jspdf`, `pdfkit` — all client-side file generation |
| **Icons** | `react-icons`, `lucide-react`, inline SVGs |
| **Markdown** | `markdown-it` — for parsing and rendering Markdown blocks |


---

## 💻 Running Locally

### Prerequisites
Make sure you have Node.js (version 18+) and npm installed on your system.

### 1. Clone the Repository
```bash
git clone https://github.com/puneetnith28/draftly.git
cd draftly
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start optimize the Draftly in your own way.

[View Live Demo](https://draftlyy.vercel.app/)

