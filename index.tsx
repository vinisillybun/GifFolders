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
    emoji?: string;
    gifs: GifItem[];
    createdAt: number;
}

export type FolderStore = Record<string, GifFolder>;

const STORE_KEY = "GifFolders_v1";

export async function loadFolders(): Promise<FolderStore> {
    return (await DataStore.get<FolderStore>(STORE_KEY)) ?? {};
}

export async function saveFolders(folders: FolderStore): Promise<void> {
    await DataStore.set(STORE_KEY, folders);
}

const gifContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
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

export default definePlugin({
    name: "GifFolders",
    description: "Organize your GIFs into unlimited custom folders, no Discord favorites limit! :3",
    authors: [{ name: "viniiiiiiiiiiiiiiii", id: 530056363124981772n }],

    patches: [
        {
            find: "GIF_PICKER_FAVORITES_SEARCH_PLACEHOLDER",
            replacement: {
                match: /(\i\.default\.Messages\.GIF_PICKER_FAVORITES_SEARCH_PLACEHOLDER)/,
                replace: "$1, gifFoldersUINode: $self.renderFoldersTab()",
            },
            predicate: () => false,
        },
    ],

    start() {
        addContextMenuPatch("gif-picker-gif-context-menu", gifContextMenuPatch);
    },

    stop() {
        removeContextMenuPatch("gif-picker-gif-context-menu", gifContextMenuPatch);
    },

    renderFoldersTab() {
        return (
            <ErrorBoundary>
                <GifFoldersUI />
            </ErrorBoundary>
        );
    },
});
