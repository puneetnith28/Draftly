# 📝 Draftly

Draftly is a **privacy-first, offline-capable** block editor and document organizer designed for seamless writer workflows. All your documents are stored directly in your browser — **no account, no server, no internet connection required for writing**. Your work remains on your device.

Behind its clean UI lies a rigorous implementation of **Clean Architecture**, **SOLID Principles**, and proven **Design Patterns** entirely decoupled from the React UI layer.

> **📥 Installable & Offline-Capable.** Look for the download icon in your browser's address bar to install Draftly. After the first visit, it works with or without an internet connection. All data is stored locally in your browser.

---

## 🏛️ Architecture & Engineering Depth

Instead of tightly coupling business logic to React components and hooks, Draftly employs a **Layered Clean Architecture** where dependencies point strictly inward toward the Domain.

### 🧩 1. The Four Layers
- **Presentation Layer (React):** Pure UI components and hooks (`useDraftlyEngine`). Zero business logic or storage calls exist here.
- **Application Layer (Services & Facade):** Orchestrates use cases (`DocumentService`, `EditorService`). Exposes a single `DraftlyEngine` Facade to the UI, hiding all system complexity.
- **Domain Layer (Entities & Business Rules):** The core of the application. Pure TypeScript classes (`Block`, `Document`, `Folder`) with absolutely no dependencies on React, Next.js, or LocalStorage.
- **Infrastructure Layer (Data & Integrations):** Handles external concerns. Implements the Domain's `DocumentRepository` interface using a `LocalStorageAdapter`. Can be trivially swapped to Firebase or Supabase without altering the core app.

### 🏗️ 2. Applied Design Patterns
- **Facade Pattern:** `DraftlyEngine` provides a unified, simplified interface for the React UI.
- **Strategy Pattern:** The Export pipeline uses `ExportStrategy` (implemented by `MarkdownExportStrategy`, `PdfExportStrategy`, etc.), allowing new formats to be added following the Open/Closed Principle.
- **Command Pattern:** Editor interactions (inserting, deleting, moving blocks) are encapsulated into `ICommand` objects (`InsertBlockCommand`), enabling robust Undo/Redo history stacks.
- **Factory Pattern:** `BlockFactory` dynamically instantiates the correct Block entity (`HeadingBlock`, `CodeBlock`, etc.) to eliminate massive switch statements.
- **Observer Pattern:** A `GlobalEventBus` handles reactivity. When the `EditorService` modifies a block, it publishes an event that the UI and `AutoSaveObserver` react to asynchronously.
- **Repository & Adapter Pattern:** The data layer is abstracted behind strict interfaces, ensuring the Domain never knows *how* data is saved.

### 📊 3. UML Documentation
We have generated comprehensive Mermaid UML diagrams documenting the system's structural and behavioral design:
👉 **[View the Architectural UML Diagrams in ARCHITECTURE.md](./ARCHITECTURE.md)**

---

## 🚀 Features

### 1. Nested File Explorer
* **Hierarchical Folders**: Create unlimited nested subdirectories (`Folder` inside `Folder`).
* **Visual Directory Tree**: Rendered recursively with vertical connection lines, indent levels, and smooth transitions.
* **Cycle-Safe Drag-and-Drop**: Safely move files and subfolders in/out of nested paths without creating dependency loops.

### 2. Touch Gesture Engine (Mobile UX)
* **Press & Hold to Delete**: A custom touch-gesture tracker designed to let mobile users press and hold any editor block to trigger visual delete overlays.
* **Haptic Feedback**: Integrates with mobile device vibration motors (`navigator.vibrate`) for satisfying physical confirmations.

### 3. Inline Slash Commands (`/`)
* **Contextual Menu**: Triggered by pressing `/` in any empty text block.
* **Block Conversion**: Easily switch block types to Headings, Bullet Lists, Code Blocks, or Quote Blocks instantly.

### 4. Offline-First & Zero Backend
* **LocalStorage Persistence**: All data is strictly persisted to the browser's `localStorage` via the Infrastructure Adapter.
* **PWA-Ready**: Registers a Service Worker in production mode, enabling full offline access after the first visit.

### 5. Multi-Format Export
* Export documents to clean **Markdown**, **PDF**, or **DOCX** with one click — all generated client-side through the Strategy pipeline.


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

### 3. Run the Unit Tests
Verify the Domain, Application, and Infrastructure layers using the Jest suite:
```bash
npm run test
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

[View Live Demo](https://draftlyy.vercel.app/)
