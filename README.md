# mdParse

A lightweight, cross-platform Markdown reader and editor built with Electron.

## Features

- Open and read `.md` files with rich rendering (headings, lists, links, images, code blocks, tables, blockquotes)
- Built-in editor with live preview
- Syntax highlighting for code blocks
- File association support — double-click `.md` files to open directly
- Native menus with keyboard shortcuts (Ctrl/Cmd+O, Ctrl/Cmd+S, Ctrl/Cmd+N)
- Clean, responsive UI
- Cross-platform: Windows, macOS, Linux

## Installation

Download the latest release for your platform from the [Releases](../../releases) page:

| Platform | File |
|----------|------|
| Windows  | `mdParse-Setup-x.x.x.exe` |
| macOS (Intel) | `mdParse-x.x.x-x64.dmg` |
| macOS (Apple Silicon) | `mdParse-x.x.x-arm64.dmg` |
| Linux | `mdParse-x.x.x.AppImage` / `.deb` |

### macOS Note

Since the app is not signed with an Apple Developer certificate, macOS will block it on first launch. To open:

1. Open the `.dmg` and drag the app to Applications
2. Right-click (or Control-click) the app and select **Open**
3. In the dialog that appears, click **Open** to confirm
4. Alternatively, go to **System Settings → Privacy & Security**, scroll down and click **Open Anyway**

The app only needs this approval once.

## Development

### Prerequisites

- Node.js >= 18
- npm >= 9

### Setup

```bash
git clone https://github.com/EvilJul/mdParse.git
cd mdParse
npm install
```

### Run in development

```bash
# Start Vite dev server
npm run dev

# In another terminal, start Electron
npm run electron:dev
```

### Build

```bash
# Build for current platform
npm run build
npm run electron:build
```

## Tech Stack

- Electron
- React 19
- TypeScript
- Vite
- Tailwind CSS
- react-markdown
- react-syntax-highlighter

## License

MIT
