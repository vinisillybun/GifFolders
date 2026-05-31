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
import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin from "@utils/types";
import { Menu, React } from "@webpack/common";

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
    emoji?: string;
    gifs: GifItem[];
    createdAt: number;
}

export type FolderStore = Record<string, GifFolder>;

// ─── DataStore ────────────────────────────────────────────────────────────────

const STORE_KEY = "GifFolders_v1";

export async function loadFolders(): Promise<FolderStore> {
    return (await DataStore.get<FolderStore>(STORE_KEY)) ?? {};
}

export async function saveFolders(folders: FolderStore): Promise<void> {
    await DataStore.set(STORE_KEY, folders);
}

// ─── Image context menu patch (right-click GIF in chat) ──────────────────────

const imageContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    // props.src is the image/gif URL when right-clicking media in chat
    const src = props?.src ?? props?.href;
    if (!src) return;

    // Only add for GIFs (tenor, giphy, media.discordapp.net, etc.)
    const isGif = /\.(gif)$/i.test(src) || src.includes("tenor.com") || src.includes("giphy.com") || src.includes("media.discordapp");
    if (!isGif) return;

    children.push(
        <Menu.MenuSeparator />,
        <Menu.MenuItem
            id="gif-folders-save-image"
            label="Save to GIF Folder…"
            action={() => FolderManager.openSaveModal({
                url: src,
                src,
                width: props?.width ?? 0,
                height: props?.height ?? 0,
            })}
        />
    );
};

// ─── Plugin ───────────────────────────────────────────────────────────────────

export default definePlugin({
    name: "GifFolders",
    description: "Organize your GIFs into unlimited custom folders — no Discord favorites limit!",
    authors: [{ name: "viniiiiiiiiiiiiiiii", id: 530056363124981772n }],

    patches: [
        {
            // Found in module 285961 - the GIF results list renderItem function.
            // Intercepts the renderExtras prop on each GIF tile to add our 📁 button.
            find: "renderEmptyFavorites()",
            replacement: {
                match: /renderExtras:\(\)=>\(0,\i\.jsx\)\(\i\.\i,\{className:\i\.\i,\.\.\.(\i)\}\)/,
                replace: "renderExtras:()=>$self.renderGifExtras($1)",
            },
        },
    ],

    start() {
        addContextMenuPatch("image-context", imageContextMenuPatch);
    },

    stop() {
        removeContextMenuPatch("image-context", imageContextMenuPatch);
    },

    renderGifExtras(gif: any) {
        return (
            <ErrorBoundary noop>
                <div
                    style={{
                        position: "absolute",
                        bottom: 4,
                        right: 4,
                        zIndex: 10,
                        background: "rgba(0,0,0,0.6)",
                        borderRadius: "50%",
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: 13,
                        userSelect: "none" as const,
                    }}
                    onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        e.preventDefault();
                        FolderManager.openSaveModal({
                            url: gif.url,
                            src: gif.src,
                            width: gif.width ?? 0,
                            height: gif.height ?? 0,
                        });
                    }}
                    title="Save to GIF Folder"
                >
                    📁
                </div>
            </ErrorBoundary>
        );
    },

    renderFoldersTab() {
        return (
            <ErrorBoundary>
                <GifFoldersUI />
            </ErrorBoundary>
        );
    },
});
