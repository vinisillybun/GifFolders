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
    // Explicitly exclude mp4/video URLs
    if (/\.mp4($|\?)/i.test(url)) return false;
    return (
        /\.(gif|webp)($|\?)/i.test(url) ||
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
            // Exclude mp4/video content types explicitly
            const ct: string = att.content_type ?? "";
            if (ct.includes("mp4") || ct.includes("video")) continue;
            if (ct.includes("gif") || ct.includes("webp") || isGifUrl(att.url)) return att.url;
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

// Right-click a GIF inside the GIF picker
const gifPickerContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    const gif = props?.gif;
    if (!gif) return;
    const url: string = gif.url ?? gif.src ?? "";
    if (!url) return;

    children.push(
        <Menu.MenuSeparator />,
        <Menu.MenuItem
            id="gif-folders-save-picker"
            label="Save to GIF Folder"
            action={() => FolderManager.openSaveModal({
                url,
                src: gif.src ?? url,
                width: gif.width ?? 0,
                height: gif.height ?? 0,
            })}
        />
    );
};

export default definePlugin({
    name: "GifFolders",
    description: "Organize your GIFs into unlimited custom folders, no Discord favorites limit! :3",
    authors: [{ name: "viniiiiiiiiiiiiiiii", id: 530056363124981772n }],

    // This patch injects the folder UI into the GIF picker's favorites tab.
    // Discord's internal structure changes frequently; if it stops working,
    // the UI is still accessible via Settings → Vencord → Plugins → GifFolders.
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
        addContextMenuPatch("gif-picker-gif-context-menu", gifPickerContextMenuPatch);
    },

    stop() {
        removeContextMenuPatch("message", messageContextMenuPatch);
        removeContextMenuPatch("gif-picker-gif-context-menu", gifPickerContextMenuPatch);
    },

    // Shown in Settings → Vencord → Plugins → GifFolders — always accessible
    // even if the GIF picker patch doesn't match Discord's current build.
    settingsAboutComponent() {
        return (
            <ErrorBoundary>
                <GifFoldersUI />
            </ErrorBoundary>
        );
    },

    renderFolders() {
        return <ErrorBoundary><GifFoldersUI /></ErrorBoundary>;
    }
});
