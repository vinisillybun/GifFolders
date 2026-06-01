/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addContextMenuPatch, findGroupChildrenByChildId, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import { DataStore } from "@api/index";
import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin from "@utils/types";
import { Menu, React } from "@webpack/common";

import { FolderManager } from "./FolderManager";
import { FolderTiles } from "./GifFoldersUI";

// ─── Types ────────────────────────────────────────────────────────────────────

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
    color?: string; // hex color for the tile background, like Discord's blue Favorites tile
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    if (message?.embeds?.length > 0) {
        for (const embed of message.embeds) {
            const url = embed.url ?? embed.image?.url ?? embed.thumbnail?.url;
            if (url && isGifUrl(url)) return url;
        }
    }
    if (message?.attachments?.length > 0) {
        for (const att of message.attachments) {
            if (att.content_type?.includes("gif") || isGifUrl(att.url)) return att.url;
        }
    }
    if (message?.content && isGifUrl(message.content.trim())) {
        return message.content.trim();
    }
    return null;
}

// ─── Message context menu patch ───────────────────────────────────────────────

const messageContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    const gifUrl = getGifUrlFromMessage(props?.message);
    if (!gifUrl) return;

    const saveImageGroup = findGroupChildrenByChildId("save-image", children);
    const menuItem = (
        <Menu.MenuItem
            id="gif-folders-save-chat"
            label="Save to GIF Folder"
            action={() => FolderManager.openSaveModal({
                url: gifUrl,
                src: gifUrl,
                width: 0,
                height: 0,
            })}
        />
    );

    if (saveImageGroup) {
        const idx = saveImageGroup.findIndex((c: any) => c?.props?.id === "save-image");
        saveImageGroup.splice(idx + 1, 0, menuItem);
    } else {
        children.push(<Menu.MenuSeparator />, menuItem);
    }
};

// ─── Plugin ───────────────────────────────────────────────────────────────────

export default definePlugin({
    name: "GifFolders",
    description: "Organize your GIFs into unlimited custom folders, no Discord favorites limit! :3",
    authors: [{ name: "viniiiiiiiiiiiiiiii", id: 530056363124981772n }],

    patches: [
        {
            // Module 622142 — GIF picker, class W (the categories/front page grid).
            // We patch renderContent so when the front page is shown (resultType === null),
            // we render our folder tiles ABOVE the normal category masonry grid.
            // Anchor: "hideFavoritesTile" is unique to this component's props.
            find: "hideFavoritesTile",
            replacement: {
                // Match the render method's return of the front page component H
                // Original: return (0,s.jsx)(H,{className:e,hideFavoritesTile:u,onSelectItem:this.handleSelectItem})
                match: /return\s*\(0,\i\.jsx\)\((\i),\{className:\i,hideFavoritesTile:\i,onSelectItem:this\.handleSelectItem\}\)/,
                replace: "return $self.renderWithFolders($1, arguments[0], this.handleSelectItem.bind(this))",
            },
        },
    ],

    start() {
        addContextMenuPatch("message", messageContextMenuPatch);
    },

    stop() {
        removeContextMenuPatch("message", messageContextMenuPatch);
    },

    renderWithFolders(OriginalComponent: any, renderArgs: any, onSelectItem: any) {
        const { className, hideFavoritesTile } = renderArgs;
        return (
            <>
                <ErrorBoundary noop>
                    <FolderTiles onSelectItem={onSelectItem} />
                </ErrorBoundary>
                <OriginalComponent
                    className={className}
                    hideFavoritesTile={hideFavoritesTile}
                    onSelectItem={onSelectItem}
                />
            </>
        );
    },
});
