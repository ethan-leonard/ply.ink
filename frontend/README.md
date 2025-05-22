# ply.ink - Lightning-Fast PDF Viewer

A minimal, lightning-fast PDF viewer with Apple-esque design built with React, TypeScript, and PDF.js.

## Features

✅ **Import PDF** - Local file picker for PDF documents  
✅ **Export PDF** - Download currently loaded PDF file  
✅ **Fixed Toolbar** - Clean, intuitive controls with tooltips  
✅ **Zoom Controls** - Zoom in/out with mouse wheel or keyboard  
✅ **Page Navigation** - Arrow keys, page input, and navigation buttons  
✅ **Drag & Drop** - Drop PDF files directly onto the viewer  
✅ **Keyboard Shortcuts** - Full keyboard navigation support  
✅ **Progressive Web App** - PWA-ready with offline capabilities  
✅ **Apple-esque Design** - Clean, minimal UI with subtle shadows and gradients  

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + SWC
- **Styling**: TailwindCSS + shadcn/ui components
- **PDF Processing**: pdfjs-dist 4.x with dedicated worker
- **PWA**: vite-plugin-pwa for service worker and manifest

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Manual Testing Script

### Prerequisites
1. Have a PDF file ready for testing (any PDF will work)
2. Modern browser with ES2020+ support

### Test Procedure

#### 1. Basic Import/Export Test
```bash
# Start the dev server
npm run dev

# Open http://localhost:5173 in your browser
# Expected: Clean welcome screen with "ply.ink" branding

# Test file import:
# 1. Click the "Import" button (upload icon) in toolbar
# 2. Select any PDF file from your system
# Expected: PDF loads and first page displays in viewer

# Test file export:
# 1. Click the "Export" button (download icon) in toolbar
# Expected: PDF downloads to your default download folder
```

#### 2. Navigation Test
```bash
# With a multi-page PDF loaded:

# Test page navigation:
# 1. Use arrow keys (← → ↑ ↓) to navigate pages
# Expected: Pages change smoothly

# 2. Click page input field, type a page number, press Enter
# Expected: Jumps to specified page

# 3. Use previous/next buttons in toolbar
# Expected: Pages change with button clicks
```

#### 3. Zoom Test
```bash
# Test zoom functionality:

# 1. Hold Ctrl and scroll mouse wheel up/down
# Expected: PDF zooms in/out smoothly

# 2. Press + and - keys
# Expected: PDF zooms in/out

# 3. Use zoom buttons in toolbar
# Expected: Zoom controls work, percentage updates
```

#### 4. Drag & Drop Test
```bash
# Test drag and drop:

# 1. Drag a PDF file from your file manager
# 2. Drop it anywhere on the ply.ink window
# Expected: PDF loads automatically
```

#### 5. Sidebar Test
```bash
# Test sidebar functionality:

# 1. Click the "Sidebar" button (sidebar icon) in toolbar
# Expected: Sidebar dialog opens showing page list

# 2. Click on any page in the sidebar
# Expected: Viewer jumps to selected page
```

#### 6. Keyboard Shortcuts Test
```bash
# Test all keyboard shortcuts:
# - Arrow keys: Navigate pages
# - +/=: Zoom in
# - -: Zoom out
# - Ctrl + scroll: Zoom with mouse
```

### Success Criteria

✅ **Import**: File picker opens and accepts PDF files  
✅ **Export**: Downloads work without errors  
✅ **Rendering**: PDF pages display clearly and crisp  
✅ **Navigation**: All navigation methods work smoothly  
✅ **Zoom**: Zoom controls respond and update percentage  
✅ **Responsive**: UI adapts to different window sizes  
✅ **Performance**: No lag when switching pages or zooming  
✅ **Error Handling**: Graceful error messages for invalid files  

### Performance Targets

- **Bundle Size**: ≤ 350 KB gzip (verify with `npm run build`)
- **First Paint**: < 200ms on modern hardware
- **Page Switch**: < 100ms response time
- **Zoom Response**: < 50ms zoom operation

## Development

### Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   └── pdf/         # PDF-specific components
│   ├── lib/             # Utilities and PDF worker setup
│   ├── types/           # TypeScript type definitions
│   └── App.tsx          # Main application component
├── public/              # Static assets
└── package.json         # Dependencies and scripts
```

### Key Components

- **PDFViewer**: Core PDF rendering with canvas
- **PDFToolbar**: Navigation and tool controls
- **PDFSidebar**: Document outline (placeholder for thumbnails/TOC)

### Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

## License

MIT - Built as an MVP for rapid PDF viewing needs.
