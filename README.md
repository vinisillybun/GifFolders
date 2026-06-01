# GifFolders 

Organize your GIFs into unlimited custom folders, stored locally in IndexedDB via Vencord's DataStore, completely bypassing Discord's built-in favorites limit.

> ⚠️ **Disclaimer:** This project was built with the help of AI. If you don't like that, don't use it.

## Features

| Feature | Details |

| **Unlimited folders** | You can reate as many as you want |
| **Unlimited GIFs per folder** | Stored locally, not on Discord's servers (thus bypassing Discord's favorite limit) |
| **Custom icons** | Pick an emoji or type your own for each folder |
| **Search within folders** | Filter GIFs by URL inside any folder |
| **Right-click to save** | Right-click any GIF in the picker → "Save to GIF Folder…" |
| **Export / Import** | Backup your folders as JSON and restore them |
| **Duplicate protection** | Won't save the same GIF twice in one folder |

## Installation

This is a **userplugin**, you need Vencord built from source.

1. **Clone Vencord from source** (if you haven't already):
   ```bash
   git clone https://github.com/Vendicated/Vencord
   cd Vencord
   pnpm install
   pnpm build
   pnpm inject   # or the appropriate inject command for your OS
   ```

2. **Copy this folder** into Vencord's userplugins directory:
   ```
   Vencord/src/userplugins/GifFolders/
   ```

3. **Rebuild Vencord:**
   ```bash
   pnpm build
   ```

4. **Enable the plugin** in Discord:
   `Settings → Vencord → Plugins → search "GifFolders" → toggle on`

## Usage

### Saving a GIF
1. Open the GIF picker (the GIF button in the chat bar).
2. Get any GIF you want to save.
3. **Right-click** the GIF.
4. Click **"Save to GIF Folder…"**.
5. Pick an existing folder or click **"New folder & save"**.

### Browsing your folders
The plugin exposes `GifFoldersUI` as a React component you can integrate into any panel.  
In a future update this will be injected directly into the GIF picker's tab bar via a webpack patch.

For now, access your folders by opening the plugin's settings page (if configured).

### Keyboard shortcut (optional extension)
You can bind the folder browser to a key using Vencord's `KeybindHelper` API see `index.tsx` for how to extend this.

### Export / Import
In the `GifFoldersUI` toolbar:
- **⬇️** exports all your folders to a `.json` file great for backups or migrating to another PC.
- **⬆️** imports a `.json` backup. Existing folders are kept; only new ones are added (no overwrites).

## File structure

```
index.tsx               Plugin entry point, context menu patch, definePlugin()
FolderManager.tsx       Imperative helpers: addGif, removeGif, deleteFolder, renameFolder, export/import
GifFoldersUI.tsx        Main React component: folder list + GIF grid browser
style.css               Hover animation for GIF tiles
modals/
  CreateFolderModal.tsx   Dialog to create a new folder
  RenameFolderModal.tsx   Dialog to rename/re-icon an existing folder
  SaveToFolderModal.tsx   Dialog to pick a folder when saving a GIF
```

## Notes & caveats

- **Data is stored locally** in IndexedDB (`VencordData` → `VencordStore` → key `GifFolders_v1`).  
  This means folders are **per-device** and are not synced via Discord's account system.
- Vencord's cloud-settings sync does *not* include DataStore keys (only plugin settings).  
  Use the **Export** feature to back up your collection.
- Discord's minified code changes every update. The webpack patch in `index.tsx` is **disabled by default** (`predicate: false`) to avoid breakage. The context-menu injection works without any patch and is always active.
- If Discord renames the GIF context menu identifier, the right-click menu item may stop appearing. Check the `gif-picker-gif-context-menu` patch key against the current Discord build using Vencord's Patch Helper.

## License

GPL-3.0-or-later, same as Vencord.
