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

function openFolderBrowser() {
    openModal(props => (
        <div
            style={{
                background: "var(--background-floating)",
                borderRadius: 8,
                padding: 16,
                width: 480,
                maxHeight: 600,
                display: "flex",
                flexDirection: "column",
                boxShadow: "var(--elevation-high)",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: "var(--header-primary)" }}>📂 GIF Folders</span>
                <button onClick={props.onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
                <ErrorBoundary>
                    <GifFoldersUI />
                </ErrorBoundary>
            </div>
        </div>
    ));
}

export default definePlugin({
    name: "GifFolders",
    description: "Organize your GIFs into unlimited custom folders, no Discord favorites limit! :3",
    authors: [{ name: "viniiiiiiiiiiiiiiii", id: 530056363124981772n }],

    patches: [
        {
            find: "getFavoriteGIFs",
            replacement: {
                match: /(?<=children:\s*\[)(?=.{50,300}Favorites)/,
                replace: "$self.renderFavoritesTile(),"
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
                onClick={openFolderBrowser}
                style={{
                    background: "var(--brand-experiment)",
                    borderRadius: 8,
                    padding: "12px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "white",
                    height: 90,
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                📂 GIF Folders
            </div>
        );
    }
});
