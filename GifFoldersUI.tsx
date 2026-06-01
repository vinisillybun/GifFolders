import { classes } from "@utils/misc";
import { openModal } from "@utils/modal";
import { useAwaiter } from "@utils/react";
import { Button, Menu, React, Text, TextInput, Tooltip, useState, useEffect, useCallback } from "@webpack/common";
import { FolderManager } from "./FolderManager";
import { GifFolder, GifItem, loadFolders, saveFolders } from ".";
import { CreateFolderModal } from "./modals/CreateFolderModal";
import { RenameFolderModal } from "./modals/RenameFolderModal";

function GifTile({
    gif,
    folderId,
    onSend,
    onDelete,
}: {
    gif: GifItem;
    folderId: string;
    onSend: (gif: GifItem) => void;
    onDelete: () => void;
}) {
    const [hovered, setHovered] = useState(false);

    // Use src for display; both .gif and .webp render fine in <img>
    const previewSrc = gif.src || gif.url;

    return (
        <div
            className="gif-folder-tile"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onSend(gif)}
            style={{
                position: "relative",
                cursor: "pointer",
                borderRadius: 4,
                overflow: "hidden",
                background: "var(--background-secondary)",
            }}
        >
            <img
                src={previewSrc}
                alt=""
                style={{
                    width: "100%",
                    height: 80,
                    objectFit: "cover",
                    display: "block",
                }}
            />
            {hovered && (
                <button
                    onClick={e => { e.stopPropagation(); onDelete(); }}
                    style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        background: "var(--background-floating)",
                        border: "none",
                        borderRadius: "50%",
                        width: 20,
                        height: 20,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        color: "var(--text-normal)",
                    }}
                    title="Remove from folder"
                >
                    ✕
                </button>
            )}
        </div>
    );
}

function FolderHeader({
    folder,
    onRename,
    onDelete,
    onColorChange,
}: {
    folder: GifFolder;
    onRename: () => void;
    onDelete: () => void;
    onColorChange: () => void;
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 0",
                borderBottom: "1px solid var(--background-modifier-accent)",
                marginBottom: 6,
            }}
        >
            <Text
                variant="text-sm/semibold"
                style={{ flex: 1, color: "var(--header-primary)" }}
            >
                {folder.name}
                <span
                    style={{ color: "var(--text-muted)", fontWeight: 400, marginLeft: 4 }}
                >
                    ({folder.gifs.length})
                </span>
            </Text>
            <button onClick={onRename} title="Rename folder" style={iconBtnStyle}>✏️</button>
            <button onClick={onColorChange} title="Change color" style={iconBtnStyle}>🎨</button>
            <button onClick={onDelete} title="Delete folder" style={iconBtnStyle}>🗑️</button>
        </div>
    );
}

const iconBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    padding: "0 2px",
    opacity: 0.7,
};

/** Returns a random GIF from the folder, or undefined if the folder is empty. */
function getRandomFolderPreview(folder: GifFolder): GifItem | undefined {
    if (!folder.gifs.length) return undefined;
    const idx = Math.floor(Math.random() * folder.gifs.length);
    return folder.gifs[idx];
}

export function GifFoldersUI({ onGifClick }: { onGifClick?: (gif: GifItem) => void }) {
    const [folders, setFolders] = useState<Record<string, GifFolder>>({});
    const [search, setSearch] = useState("");
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Cache random preview picks per folder so they don't re-randomize on every render
    const [folderPreviews, setFolderPreviews] = useState<Record<string, string>>({});

    const reload = useCallback(async () => {
        const data = await loadFolders();
        setFolders(data);

        // Pick a random preview for any folder that doesn't have one cached yet
        setFolderPreviews(prev => {
            const next = { ...prev };
            for (const folder of Object.values(data)) {
                if (!next[folder.id] && folder.gifs.length > 0) {
                    const pick = getRandomFolderPreview(folder);
                    if (pick) next[folder.id] = pick.src || pick.url;
                }
                // If GIFs were added/removed, refresh the preview
                if (folder.gifs.length === 0) {
                    delete next[folder.id];
                }
            }
            return next;
        });

        setLoading(false);
    }, []);

    useEffect(() => { reload(); }, []);

    const folderList = Object.values(folders);
    const selectedFolder = selectedFolderId ? folders[selectedFolderId] : null;

    const visibleGifs = selectedFolder
        ? selectedFolder.gifs.filter(g =>
            !search || g.url.toLowerCase().includes(search.toLowerCase())
        )
        : [];

    const handleCreateFolder = () => {
        openModal(props => (
            <CreateFolderModal
                modalProps={props}
                onCreated={async id => { await reload(); setSelectedFolderId(id); }}
                onCancel={() => { }}
            />
        ));
    };

    const handleRenameFolder = (folderId: string) => {
        const folder = folders[folderId];
        if (!folder) return;
        openModal(props => (
            <RenameFolderModal
                modalProps={props}
                folder={folder}
                onRenamed={async () => reload()}
            />
        ));
    };

    const handleDeleteFolder = async (folderId: string) => {
        await FolderManager.deleteFolder(folderId);
        if (selectedFolderId === folderId) setSelectedFolderId(null);
        await reload();
    };

    const handleDeleteGif = async (folderId: string, gifUrl: string) => {
        await FolderManager.removeGifFromFolder(folderId, gifUrl);
        // Invalidate cached preview so it picks a new random one
        setFolderPreviews(prev => {
            const next = { ...prev };
            delete next[folderId];
            return next;
        });
        await reload();
    };

    const handleColorChange = (folderId: string) => {
        const folder = folders[folderId];
        if (!folder) return;
        const input = document.createElement("input");
        input.type = "color";
        input.value = folder.color ?? "#5865F2";
        input.onchange = async () => {
            const folders = await loadFolders();
            if (folders[folderId]) {
                folders[folderId].color = input.value;
                await saveFolders(folders);
                await reload();
            }
        };
        input.click();
    };

    const handleSend = (gif: GifItem) => {
        onGifClick?.(gif);
    };

    const handleExport = async () => {
        const json = await FolderManager.exportFolders();
        const blob = new Blob([json], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "gif-folders-backup.json";
        a.click();
    };

    const handleImport = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            const text = await file.text();
            try {
                await FolderManager.importFolders(text);
                await reload();
            } catch { }
        };
        input.click();
    };

    if (loading) return <Text>Loading folders…</Text>;

    return (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 12 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", paddingBottom: 12 }}>
                <Text variant="heading-sm/bold" style={{ flex: 1, color: "var(--header-primary)" }}>
                    📂 GIF Folders
                </Text>
                <Tooltip text="New folder">
                    {({ onMouseEnter, onMouseLeave }) => (
                        <button
                            onMouseEnter={onMouseEnter}
                            onMouseLeave={onMouseLeave}
                            onClick={handleCreateFolder}
                            style={{ ...iconBtnStyle, fontSize: 18 }}
                        >➕</button>
                    )}
                </Tooltip>
                <Tooltip text="Export backup">
                    {({ onMouseEnter, onMouseLeave }) => (
                        <button
                            onMouseEnter={onMouseEnter}
                            onMouseLeave={onMouseLeave}
                            onClick={handleExport}
                            style={{ ...iconBtnStyle, fontSize: 16 }}
                        >⬇️</button>
                    )}
                </Tooltip>
                <Tooltip text="Import backup">
                    {({ onMouseEnter, onMouseLeave }) => (
                        <button
                            onMouseEnter={onMouseEnter}
                            onMouseLeave={onMouseLeave}
                            onClick={handleImport}
                            style={{ ...iconBtnStyle, fontSize: 16 }}
                        >⬆️</button>
                    )}
                </Tooltip>
            </div>

            {folderList.length === 0 ? (
                <Text
                    variant="text-sm/normal"
                    style={{ color: "var(--text-muted)", textAlign: "center", padding: "12px 0" }}
                >
                    No folders yet. Click ➕ to create one!<br />
                    Right-click any GIF to save it to a folder.
                </Text>
            ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                    {folderList.map(f => {
                        const isSelected = f.id === selectedFolderId;
                        const previewSrc = folderPreviews[f.id];
                        return (
                            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <button
                                    onClick={() => setSelectedFolderId(isSelected ? null : f.id)}
                                    style={{
                                        position: "relative",
                                        background: isSelected
                                            ? (f.color ?? "var(--brand-experiment)")
                                            : "var(--background-secondary)",
                                        color: "var(--text-normal)",
                                        border: "none",
                                        borderRadius: 20,
                                        padding: "4px 12px",
                                        cursor: "pointer",
                                        fontSize: 13,
                                        overflow: "hidden",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        minHeight: 32,
                                    }}
                                >
                                    {/* Random GIF preview thumbnail inside the folder pill */}
                                    {previewSrc && (
                                        <img
                                            src={previewSrc}
                                            alt=""
                                            style={{
                                                width: 22,
                                                height: 22,
                                                objectFit: "cover",
                                                borderRadius: "50%",
                                                flexShrink: 0,
                                            }}
                                        />
                                    )}
                                    <span style={{ color: "var(--text-normal)" }}>
                                        {f.name}
                                    </span>
                                    <span style={{ opacity: 0.7, color: "var(--text-muted)" }}>
                                        ({f.gifs.length})
                                    </span>
                                </button>
                                <button
                                    onClick={() => handleColorChange(f.id)}
                                    title="Change folder color"
                                    style={{
                                        background: "none",
                                        border: "1px solid var(--background-modifier-accent)",
                                        borderRadius: 4,
                                        width: 24,
                                        height: 24,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: 0,
                                        fontSize: 12,
                                    }}
                                >
                                    🎨
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedFolder && (
                <div style={{ flex: 1, overflowY: "auto" }}>
                    <FolderHeader
                        folder={selectedFolder}
                        onRename={() => handleRenameFolder(selectedFolder.id)}
                        onDelete={() => handleDeleteFolder(selectedFolder.id)}
                        onColorChange={() => handleColorChange(selectedFolder.id)}
                    />
                    <TextInput
                        placeholder="Search GIFs in this folder…"
                        value={search}
                        onChange={setSearch}
                        style={{ marginBottom: 8 }}
                    />
                    {visibleGifs.length === 0 ? (
                        <Text
                            variant="text-sm/normal"
                            style={{ color: "var(--text-muted)", textAlign: "center", padding: 12 }}
                        >
                            {search ? "No results." : "Folder is empty. Right-click a GIF and choose 'Save to GIF Folder…'."}
                        </Text>
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                                gap: 4,
                            }}
                        >
                            {visibleGifs.map(gif => (
                                <GifTile
                                    key={gif.url}
                                    gif={gif}
                                    folderId={selectedFolder.id}
                                    onSend={handleSend}
                                    onDelete={() => handleDeleteGif(selectedFolder.id, gif.url)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
