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
    color?: string;
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
        /\.(gif|webp|mp4|png|jpg|jpeg)($|\?)/i.test(url) ||
        url.includes("tenor.com") ||
        url.includes("giphy.com") ||
        url.includes("media.discordapp") ||
        url.includes("cdn.discordapp.com") ||
        url.includes("media.tenor.com") ||
        url.includes("media.giphy.com")
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
            // Module 622142, class z.
            // renderContent() returns either the front page (H) or the gif grid (L.Ay).
            // We patch the div wrapper that holds the content (className:q.Qs) to call
            // our method instead of renderContent() directly, so we can prepend folder tiles.
            //
            // From source:
            //   (0,s.jsx)("div",{className:q.Qs,children:this.renderContent()})
            //
            // We change renderContent to renderContentWithFolders which calls the original
            // and wraps it when in FAVORITES mode.
            find: "renderHeaderContent()",
            replacement: {
                match: /(\(0,\i\.jsx\)\("div",\{className:\i\.\i,children:)(this\.renderContent\(\))/,
                replace: "$1$self.wrapContent($2,this)",
            },
        },
    ],

    start() {
        addContextMenuPatch("message", messageContextMenuPatch);
    },

    stop() {
        removeContextMenuPatch("message", messageContextMenuPatch);
    },

    wrapContent(content: React.ReactNode, instance: any) {
        // Only inject when viewing favorites (resultType === "Favorites")
        const isFavorites = instance?.state?.resultType === "Favorites";
        if (!isFavorites) return content;

        // onSelectGIF is the prop that actually sends the GIF to the chat input
        const onSelectGIF = instance?.props?.onSelectGIF;

        return (
            <>
                <ErrorBoundary noop>
                    <FolderTiles onSelectGIF={onSelectGIF} />
                </ErrorBoundary>
                {content}
            </>
        );
    },
});
