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
import { findGroupChildrenByChildId } from "@api/ContextMenu";
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isGifUrl(url: string): boolean {
    if (!url) return false;
    return (
        /\.gif($|\?)/i.test(url) ||
        url.includes("tenor.com") ||
        url.includes("giphy.com") ||
        url.includes("media.discordapp") ||
        url.includes("cdn.discordapp.com")
    );
}

function getGifUrlFromMessage(message: any): string | null {
    // Check embeds first (linked GIFs)
    if (message?.embeds?.length > 0) {
        for (const embed of message.embeds) {
            const url = embed.url ?? embed.image?.url ?? embed.thumbnail?.url;
            if (url && isGifUrl(url)) return url;
        }
    }
    // Check attachments
    if (message?.attachments?.length > 0) {
        for (const att of message.attachments) {
            if (att.content_type?.includes("gif") || isGifUrl(att.url)) return att.url;
        }
    }
    // Check message content (plain URL)
    if (message?.content && isGifUrl(message.content.trim())) {
        return message.content.trim();
    }
    return null;
}

// ─── Message context menu patch ───────────────────────────────────────────────

const messageContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    const gifUrl = getGifUrlFromMessage(props?.message);
    if (!gifUrl) return;

    // Insert below "save-image" group if it exists, otherwise just push
    const saveImageGroup = findGroupChildrenByChildId("save-image", children);
    const menuItem = (
        <Menu.MenuItem
            id="gif-folders-save-chat"
            label="Save to GIF Folder…"
            action={() => FolderManager.openSaveModal({
                url: gifUrl,
                src: gifUrl,
                width: 0,
                height: 0,
            })}
        />
    );

    if (saveImageGroup) {
        const saveImageIndex = saveImageGroup.findIndex((c: any) => c?.props?.id === "save-image");
        saveImageGroup.splice(saveImageIndex + 1, 0, menuItem);
    } else {
        children.push(<Menu.MenuSeparator />, menuItem);
    }
};

// ─── Plugin ───────────────────────────────────────────────────────────────────

export default definePlugin({
    name: "GifFolders",
    description: "Organize your GIFs into unlimited custom folders — no Discord favorites limit!",
    authors: [{ name: "viniiiiiiiiiiiiiiii", id: 530056363124981772n }],

    patches: [
        {
            // Module 285961 — GIF results list renderItem.
            // Intercepts renderExtras on each GIF tile to add our 📁 save button.
            find: "renderEmptyFavorites()",
            replacement: {
                match: /renderExtras:\(\)=>\(0,\i\.jsx\)\(\i\.\i,\{className:\i\.\i,\.\.\.(\i)\}\)/,
                replace: "renderExtras:()=>$self.renderGifExtras($1)",
            },
        },
    ],

    start() {
        addContextMenuPatch("message", messageContextMenuPatch);
    },

    stop() {
        removeContextMenuPatch("message", messageContextMenuPatch);
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
