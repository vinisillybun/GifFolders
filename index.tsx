import { addContextMenuPatch, findGroupChildrenByChildId, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import { DataStore } from "@api/index";
import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin from "@utils/types";
import { Menu, React } from "@webpack/common";
import { openModal } from "@utils/modal";
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
    color?: string;
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
        const saveImageIndex = saveImageGroup.findIndex((c: any) => c?.props?.id === "save-image");
        saveImageGroup.splice(saveImageIndex + 1, 0, menuItem);
    } else {
        children.push(<Menu.MenuSeparator />, menuItem);
    }
};

export default definePlugin({
    name: "GifFolders",
    description: "Organize your GIFs into unlimited custom folders, no Discord favorites limit! :3",
    authors: [{ name: "viniiiiiiiiiiiiiiii", id: 530056363124981772n }],

    patches: [
        {
            find: "getFavoriteGIFs",
            replacement: {
                match: /(?<=children:\s*\[)(?=.+?renderFavorite)/s,
                replace: "$self.renderFolders(),"
            }
        }
    ],

    start() {
        addContextMenuPatch("message", messageContextMenuPatch);
    },
    stop() {
        removeContextMenuPatch("message", messageContextMenuPatch);
    },

    renderFavoritesTile() {
        return (
            <div
                style={{
                    background: "var(--background-floating)",
                    borderRadius: 8,
                    padding: "12px 16px",
                    display: "flex",
                    flexDirection: "column",
                    height: "auto",
                    position: "relative",
                    overflow: "visible",
                    marginBottom: 16,
                    borderBottom: "2px solid var(--background-modifier-accent)",
                }}
            >
                <ErrorBoundary>
                    <GifFoldersUI />
                </ErrorBoundary>
            </div>
        );
    },

    renderFolders() {
        return <ErrorBoundary><GifFoldersUI /></ErrorBoundary>;
    }
});
