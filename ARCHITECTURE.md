# Draftly v2 - System Architecture

This document contains the structural UML diagrams that describe the high-level design of the Draftly v2 application. The architecture strictly adheres to **Clean Architecture**, **SOLID principles**, and proven **Design Patterns** to ensure a decoupled, scalable, and maintainable codebase.

---

## 1. System Architecture Diagram

This diagram visualizes the layered architecture. Notice how dependencies always point **inwards** toward the Domain Layer (Dependency Inversion Principle).

```mermaid
graph TD
    %% Define Styles
    classDef presentation fill:#4FC3F7,stroke:#01579B,stroke-width:2px,color:#000;
    classDef application fill:#81C784,stroke:#1B5E20,stroke-width:2px,color:#000;
    classDef domain fill:#FFF59D,stroke:#F57F17,stroke-width:2px,color:#000;
    classDef infrastructure fill:#E0E0E0,stroke:#424242,stroke-width:2px,color:#000;

    subgraph Presentation Layer ["Presentation Layer (React UI)"]
        UI[Editor / Sidebar / Topbar]:::presentation
        Hooks[Custom Hooks (useDraftlyEngine)]:::presentation
    end

    subgraph Application Layer ["Application Layer (Services & Facade)"]
        Engine[DraftlyEngine Facade]:::application
        Services[Document, Folder, Editor Services]:::application
        Bus[Global Event Bus]:::application
    end

    subgraph Domain Layer ["Domain Layer (Business Logic)"]
        Entities[Entities: Document, Folder, Blocks]:::domain
        Repos[Repository Interfaces]:::domain
        Patterns[Commands, Factories, Strategies]:::domain
    end

    subgraph Infrastructure Layer ["Infrastructure Layer (Implementation)"]
        LocalStorage[Local Storage Adapter]:::infrastructure
        Mappers[Data Mappers]:::infrastructure
        DI[Dependency Injection Container]:::infrastructure
    end

    %% Dependencies
    UI -->|Uses| Hooks
    Hooks -->|Calls| Engine
    Engine -->|Delegates to| Services
    Services -->|Uses| Entities
    Services -->|Depends on| Repos
    Services -->|Emits Events| Bus
    
    %% Infrastructure Implements Domain
    LocalStorage -.->|Implements| Repos
    Mappers -.->|Serializes| Entities
    
    %% Dependency Injection
    DI -->|Wires| Engine
    DI -->|Injects| LocalStorage
```

---

## 2. Package Diagram

This diagram maps the physical `src/` directory structure to our logical architectural layers.

```mermaid
graph LR
    classDef dir fill:#FFCC80,stroke:#E65100,stroke-width:2px,color:#000;
    
    Root["src/"]:::dir
    
    App["app/ (Next.js Pages)"]:::dir
    Comp["components/ (React UI)"]:::dir
    Hooks["hooks/ (React Controllers)"]:::dir
    
    Application["application/ (Services)"]:::dir
    Domain["domain/ (Core)"]:::dir
    Infra["infrastructure/ (Data)"]:::dir
    Shared["shared/ (Constants/Types)"]:::dir

    Root --> App
    Root --> Comp
    Root --> Hooks
    Root --> Application
    Root --> Domain
    Root --> Infra
    Root --> Shared
    
    Hooks -.->|Imports| Application
    Application -.->|Imports| Domain
    Infra -.->|Imports| Domain
    Infra -.->|Injects via container| Application
```

---

## 3. Class Diagram (Design Patterns Showcase)

This class diagram highlights the primary design patterns used throughout the codebase: **Facade**, **Factory**, **Strategy**, **Command**, and **Repository**.

```mermaid
classDiagram
    %% FACADE PATTERN
    class DraftlyEngine {
        +DocumentService documents
        +FolderService folders
        +EditorService editor
        +ExportService export
        +SearchService search
        +IEventBus events
    }
    
    %% FACTORY PATTERN & ENTITIES
    class BlockFactory {
        <<Factory>>
        +createBlock(type, text) Block
    }
    class Block {
        <<Abstract>>
        +id: string
        +type: BlockType
        +text: string
    }
    class ParagraphBlock
    class HeadingBlock
    class CodeBlock
    
    Block <|-- ParagraphBlock
    Block <|-- HeadingBlock
    Block <|-- CodeBlock
    BlockFactory ..> Block : Creates

    %% STRATEGY PATTERN
    class ExportStrategy {
        <<Interface>>
        +export(document, content) void
    }
    class MarkdownExportStrategy
    class PdfExportStrategy
    class DocxExportStrategy
    
    ExportStrategy <|.. MarkdownExportStrategy
    ExportStrategy <|.. PdfExportStrategy
    ExportStrategy <|.. DocxExportStrategy

    %% COMMAND PATTERN
    class ICommand {
        <<Interface>>
        +execute() void
        +undo() void
        +redo() void
    }
    class InsertBlockCommand
    class DeleteBlockCommand
    
    ICommand <|.. InsertBlockCommand
    ICommand <|.. DeleteBlockCommand

    %% REPOSITORY PATTERN
    class DocumentRepository {
        <<Interface>>
        +findById(id) Document
        +findAll() Document[]
        +save(document) void
        +delete(id) void
    }
    class LocalStorageDocumentRepository
    class StorageAdapter {
        <<Interface>>
        +getItem(key)
        +setItem(key, value)
    }
    
    DocumentRepository <|.. LocalStorageDocumentRepository
    LocalStorageDocumentRepository --> StorageAdapter : Uses

    %% RELATIONSHIPS TO FACADE
    DraftlyEngine --> BlockFactory : Uses (via EditorService)
    DraftlyEngine --> ExportStrategy : Uses (via ExportService)
    DraftlyEngine --> ICommand : Uses (via HistoryManager)
    DraftlyEngine --> DocumentRepository : Uses (via DocumentService)
```

---

## 4. Sequence Diagram (AutoSave Flow)

This sequence diagram illustrates the reactive flow of data from a user typing in the Editor all the way down to the LocalStorage infrastructure, demonstrating the Observer pattern via the Event Bus.

```mermaid
sequenceDiagram
    actor User
    participant Editor (UI)
    participant DraftlyEngine
    participant EditorService
    participant EventBus
    participant AutoSaveObserver
    participant DocumentService
    participant Repository

    User->>Editor (UI): Types text
    Editor (UI)->>DraftlyEngine: engine.editor.executeUpdateBlock()
    DraftlyEngine->>EditorService: executeUpdateBlock()
    
    %% Command Execution & State Update
    Note over EditorService: Updates internal state
    EditorService->>EventBus: publish(EDITOR_STATE_CHANGED)
    
    %% Reactivity
    EventBus-->>Editor (UI): (Hook receives state update)
    Editor (UI)->>User: Re-renders UI
    
    %% AutoSave Background Task
    EventBus-->>AutoSaveObserver: receives event
    Note over AutoSaveObserver: Debounces (1000ms)
    AutoSaveObserver->>DraftlyEngine: engine.documents.updateDocument()
    DraftlyEngine->>DocumentService: updateDocument()
    DocumentService->>Repository: save(document)
    Note over Repository: Persists to LocalStorage
```

---

## 5. State Diagram (Document Lifecycle)

This state diagram maps out the various states a `Document` entity can exist in during a user session.

```mermaid
stateDiagram-v2
    [*] --> Initialized: App Loads
    
    Initialized --> Draft: User creates New Document
    Initialized --> Loaded: User opens Existing Document
    
    state Editing {
        Draft --> Modified: User types
        Loaded --> Modified: User types
        Modified --> Modified: Continues typing
    }
    
    Modified --> Saved: AutoSave Observer triggers
    Saved --> Exporting: User clicks Export
    
    Exporting --> Saved: Export Completes
    
    Saved --> Deleted: User deletes Document
    Deleted --> [*]
```
