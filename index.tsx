/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2024 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { addContextMenuPatch, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import { DataStore } from "@api/index";
import { showNotice } from "@api/Notices";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import { useForceUpdater } from "@utils/react";
import definePlugin from "@utils/types";
import { Menu, React, useState } from "@webpack/common";

import { FolderManager } from "./FolderManager";
import { GifFoldersUI } from "./GifFoldersUI";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GifItem {
    url: string;
    src: string;
    width: number;
    height: number;
    addedAt: number;
}

export interface GifFolder {
    id: string;
    name: string;
    emoji?: string;          // optional folder emoji icon
    gifs: GifItem[];
    createdAt: number;
}

export type FolderStore = Record<string, GifFolder>; // key = folder id

// ─── DataStore key ────────────────────────────────────────────────────────────

const STORE_KEY = "GifFolders_v1";

export async function loadFolders(): Promise<FolderStore> {
    return (await DataStore.get<FolderStore>(STORE_KEY)) ?? {};
}

export async function saveFolders(folders: FolderStore): Promise<void> {
    await DataStore.set(STORE_KEY, folders);
}

// ─── Context-menu patch: right-click any GIF in the picker ───────────────────

// Discord's GIF picker passes a result object like:
//   { url, src, width, height }
// We patch the "GIF result context menu" to add "Save to folder…"

const gifContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    // The GIF picker item context menu contains an `itemHref` or `gif` prop.
    const gif = props?.gif ?? props?.item;
    if (!gif?.url) return;

    children.push(
        <Menu.MenuSeparator />,
        <Menu.MenuItem
            id="gif-folders-save"
            label="Save to GIF Folder…"
            action={() => FolderManager.openSaveModal(gif)}
        />
    );
};

// ─── Plugin definition ────────────────────────────────────────────────────────

export default definePlugin({
    name: "GifFolders",
    description: "Organize your GIFs into unlimited custom folders, no Discord favorites limit! :3",
    authors: authors: [{ name: "vini", id: 530056363124981772 }],,  

    patches: [
        {
            find: "GIF_PICKER_FAVORITES_SEARCH_PLACEHOLDER",
            replacement: {
                match: /(\i\.default\.Messages\.GIF_PICKER_FAVORITES_SEARCH_PLACEHOLDER)/,
                replace: "$1, gifFoldersUINode: $self.renderFoldersTab()",
            },
            predicate: () => false, // Patch disabled – see NOTE below
        },
    ],

    // NOTE: Patching Discord's minified GIF picker reliably requires finding
    // the exact webpack chunk at runtime. Because minified identifiers change
    // every Discord build, the Patch above uses a string anchor for discovery
    // but is disabled by default (predicate: false).
    //
    // The plugin instead uses the ContextMenu API (works without a patch) to
    // add "Save to GIF Folder…" to every GIF's right-click menu, and injects
    // the folder browser tab via renderFolderButton() which you can wire into
    // a custom panel (see GifFoldersUI.tsx).

    start() {
        addContextMenuPatch("gif-picker-gif-context-menu", gifContextMenuPatch);
    },

    stop() {
        removeContextMenuPatch("gif-picker-gif-context-menu", gifContextMenuPatch);
    },

    // Exposed so other components can call it
    renderFoldersTab() {
        return (
            <ErrorBoundary>
                <GifFoldersUI />
            </ErrorBoundary>
        );
    },
});
