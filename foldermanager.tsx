/*
 * GifFolders – FolderManager.tsx
 * Provides imperative helpers to open modals and mutate folder state.
 */

import { openModal } from "@utils/modal";
import { React } from "@webpack/common";

import { GifItem, loadFolders, saveFolders } from ".";
import { CreateFolderModal } from "./modals/CreateFolderModal";
import { SaveToFolderModal } from "./modals/SaveToFolderModal";

export const FolderManager = {
    /** Open the "Save GIF to folder" modal. */
    openSaveModal(gif: { url: string; src?: string; width?: number; height?: number }) {
        openModal(props => (
            <SaveToFolderModal
                modalProps={props}
                gif={{
                    url: gif.url,
                    src: gif.src ?? gif.url,
                    width: gif.width ?? 0,
                    height: gif.height ?? 0,
                    addedAt: Date.now(),
                }}
            />
        ));
    },

    /** Open the "Create new folder" modal and return the new folder id. */
    openCreateModal(): Promise<string | null> {
        return new Promise(resolve => {
            openModal(props => (
                <CreateFolderModal
                    modalProps={props}
                    onCreated={id => resolve(id)}
                    onCancel={() => resolve(null)}
                />
            ));
        });
    },

    /** Add a gif to a folder, persisting to DataStore. */
    async addGifToFolder(folderId: string, gif: GifItem): Promise<void> {
        const folders = await loadFolders();
        const folder = folders[folderId];
        if (!folder) return;

        // Avoid duplicates by url
        if (folder.gifs.some(g => g.url === gif.url)) return;

        folder.gifs.push(gif);
        await saveFolders(folders);
    },

    /** Remove a gif from a folder by url. */
    async removeGifFromFolder(folderId: string, gifUrl: string): Promise<void> {
        const folders = await loadFolders();
        const folder = folders[folderId];
        if (!folder) return;
        folder.gifs = folder.gifs.filter(g => g.url !== gifUrl);
        await saveFolders(folders);
    },

    /** Delete an entire folder. */
    async deleteFolder(folderId: string): Promise<void> {
        const folders = await loadFolders();
        delete folders[folderId];
        await saveFolders(folders);
    },

    /** Rename a folder. */
    async renameFolder(folderId: string, newName: string, newEmoji?: string): Promise<void> {
        const folders = await loadFolders();
        const folder = folders[folderId];
        if (!folder) return;
        folder.name = newName.trim() || folder.name;
        if (newEmoji !== undefined) folder.emoji = newEmoji;
        await saveFolders(folders);
    },

    /** Export all folders to a JSON string for backup. */
    async exportFolders(): Promise<string> {
        const folders = await loadFolders();
        return JSON.stringify(folders, null, 2);
    },

    /** Import folders from a JSON string (merges, does not overwrite). */
    async importFolders(json: string): Promise<void> {
        const incoming = JSON.parse(json);
        const existing = await loadFolders();
        for (const [id, folder] of Object.entries(incoming as any)) {
            if (!existing[id]) {
                existing[id] = folder as any;
            }
        }
        await saveFolders(existing);
    },
};
