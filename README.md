# ✨ Modern Todo App

A sleek, feature-rich todo application built with plain HTML, CSS, and JavaScript. No frameworks required!

## ✨ Features

### Core Functionality
- ✏️ **Add/Edit Todos** - Double-click to edit inline
- 🔄 **Drag & Drop** - Reorder tasks by dragging
- 📅 **Due Dates** - With overdue/today/tomorrow indicators
- 🎯 **Priority Levels** - High 🔴, Medium 🟡, Low 🟢

### Task Management
- 📋 **Subtasks** - Nested checklists with progress tracking
- 🔒 **Subtask Completion Required** - Main task can't complete until subtasks done
- ✏️ **Edit Subtasks** - Double-click to edit subtask text
- 🔄 **Recurring Tasks** - Daily, weekly, or monthly
- ⏰ **Reminders** - Browser notifications at set times

### Organization
- 🏷️ **Categories** - Tag tasks and filter by category
- 🔍 **Search** - Real-time filtering across tasks
- 📊 **Sort Options** - By date, priority, or alphabetically
- 📦 **Archive** - Store completed tasks for later reference
- 🗑️ **Trash** - Delete with 30-day recovery

### UX & Mobile
- ↩️ **Undo Delete** - Toast notification with 5-second undo
- ⌨️ **Keyboard Shortcuts** - Ctrl+F, Ctrl+N, ?
- 🔊 **Sound Effects** - Toggleable audio feedback
- 👆 **Touch Gestures** - Swipe to complete/delete on mobile
- 📱 **Responsive** - Optimized for all screen sizes

### Design
- 🌗 **Auto Theme** - Follows system preference (or manual toggle)
- 🎨 **Glassmorphism UI** - Modern design with backdrop blur
- ✨ **Animations** - Smooth micro-interactions

### Data
- 📤 **Export/Import** - Backup and restore as JSON
- 📲 **PWA Support** - Install as app, works offline

## 🚀 Getting Started

1. Clone or download this repository
2. Open `index.html` in your browser
3. Start adding tasks!

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Add new todo |
| `Escape` | Cancel edit / close modals |
| `Ctrl + F` | Focus search |
| `Ctrl + N` | New todo input |
| `?` | Show shortcuts |

## 📁 File Structure

```
Antigravity/
├── index.html      # Main HTML
├── style.css       # Styles & themes
├── script.js       # App logic
├── manifest.json   # PWA manifest
├── sw.js          # Service worker
└── README.md      # This file
```

## 🌐 Browser Support

Works in all modern browsers: Chrome, Firefox, Safari, Edge

## 📄 License

MIT License
