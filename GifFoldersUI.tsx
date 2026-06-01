/*
 * Vencord — GifFolders — GifFoldersUI.tsx
 * Renders folder tiles styled like Discord's own Favorites/Trending tiles,
 * pinned above them. Clicking a tile opens a GIF browser modal.
 */

import ErrorBoundary from "@components/ErrorBoundary";
import { openModal } from "@utils/modal";
import { Button, React, Text, TextInput, Tooltip, useState, useEffect, useCallback } from "@webpack/common";

import { FolderManager } from "./FolderManager";
import { GifFolder, GifItem, loadFolders, saveFolders } from ".";
import { CreateFolderModal } from "./modals/CreateFolderModal";
import { RenameFolderModal } from "./modals/RenameFolderModal";
import { SaveToFolderModal } from "./modals/SaveToFolderModal";

// ─── Default folder colors (matches Discord's premium purple/blue palette) ────
const DEFAULT_COLORS = [
    "#5865F2", // Discord blurple
    "#57F287", // green
    "#FEE75C", // yellow
    "#EB459E", // pink
    "#ED4245", // red
    "#9B59B6", // purple
    "#1ABC9C", // teal
    "#E67E22", // orange
];

// ─── GIF browser modal (shown when clicking a folder tile) ───────────────────

function GifBrowserModal({ folder, onClose, onGifSend, onReload }: {
    folder: GifFolder;
    onClose: () => void;
    onGifSend?: (gif: GifItem) => void;
    onReload: () => void;
}) {
    const [search, setSearch] = useState("");
    const [gifs, setGifs] = useState<GifItem[]>(folder.gifs);

    useEffect(() => { setGifs(folder.gifs); }, [folder]);

    const visible = gifs.filter(g =>
        !search || g.url.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (gifUrl: string) => {
        await FolderManager.removeGifFromFolder(folder.id, gifUrl);
        const updated = await loadFolders();
        setGifs(updated[folder.id]?.gifs ?? []);
        onReload();
    };

    return (
        <div
            onClick={e => e.stopPropagation()}
            style={{
                background: "var(--background-floating)",
                borderRadius: 8,
                padding: 16,
                width: 500,
                maxHeight: 560,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                boxShadow: "var(--elevation-high)",
            }}
        >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                    width: 12, height: 12, borderRadius: "50%",
                    background: folder.color ?? DEFAULT_COLORS[0], flexShrink: 0
                }} />
                <Text variant="heading-md/bold" style={{ flex: 1, color: "var(--header-primary)" }}>
                    {folder.name}
                    <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: 13, marginLeft: 6 }}>
                        ({gifs.length} GIFs)
                    </span>
                </Text>
                <button onClick={onClose} style={closeBtnStyle}>✕</button>
            </div>

            <TextInput
                placeholder="Search…"
                value={search}
                onChange={setSearch}
            />

            {/* GIF grid */}
            <div style={{ overflowY: "auto", flex: 1 }}>
                {visible.length === 0 ? (
                    <Text variant="text-sm/normal" style={{ color: "var(--text-muted)", textAlign: "center", padding: 20 }}>
                        {search ? "No results." : "No GIFs yet. Right-click a GIF in chat → Save to GIF Folder."}
                    </Text>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 4 }}>
                        {visible.map(gif => (
                            <GifTile
                                key={gif.url}
                                gif={gif}
                                onSend={() => { onGifSend?.(gif); onClose(); }}
                                onDelete={() => handleDelete(gif.url)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Individual GIF tile ──────────────────────────────────────────────────────

function GifTile({ gif, onSend, onDelete }: { gif: GifItem; onSend: () => void; onDelete: () => void; }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onSend}
            style={{ position: "relative", cursor: "pointer", borderRadius: 4, overflow: "hidden", background: "var(--background-secondary)" }}
        >
            <img src={gif.src} alt="" style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
            {hovered && (
                <button
                    onClick={e => { e.stopPropagation(); onDelete(); }}
                    style={{
                        position: "absolute", top: 2, right: 2,
                        background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%",
                        width: 20, height: 20, cursor: "pointer", color: "#fff",
                        fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    title="Remove"
                >✕</button>
            )}
        </div>
    );
}

// ─── Folder tile (styled like Discord's Favorites/Trending tile) ──────────────

function FolderTile({ folder, onClick, onReload }: {
    folder: GifFolder;
    onClick: () => void;
    onReload: () => void;
}) {
    const [hovered, setHovered] = useState(false);
    const color = folder.color ?? DEFAULT_COLORS[0];
    // Use the last GIF as a background preview, like Discord does with Favorites
    const previewGif = folder.gifs[folder.gifs.length - 1];

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
            style={{
                position: "relative",
                cursor: "pointer",
                borderRadius: 8,
                overflow: "hidden",
                height: 110,
                background: color,
                display: "flex",
                alignItems: "flex-end",
                transition: "filter 0.1s ease",
                filter: hovered ? "brightness(1.15)" : "brightness(1)",
            }}
        >
            {/* Background GIF preview (blurred, like Discord's favorites tile) */}
            {previewGif && (
                <img
                    src={previewGif.src}
                    alt=""
                    style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%",
                        objectFit: "cover",
                        opacity: 0.35,
                        filter: "blur(1px)",
                        pointerEvents: "none",
                    }}
                />
            )}

            {/* Name label at bottom, like Discord's tile labels */}
            <div style={{
                position: "relative",
                width: "100%",
                padding: "6px 8px",
                background: "linear-gradient(transparent, rgba(0,0,0,0.55))",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
            }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 14, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                    {folder.name}
                </span>
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>
                    {folder.gifs.length}
                </span>
            </div>

            {/* Color dot indicator */}
            <div style={{
                position: "absolute", top: 6, right: 6,
                width: 10, height: 10, borderRadius: "50%",
                background: "rgba(255,255,255,0.6)",
                boxShadow: "0 0 0 2px rgba(0,0,0,0.3)",
            }} />
        </div>
    );
}

// ─── Color picker modal ───────────────────────────────────────────────────────

function ColorPickerModal({ folder, onClose, onSaved }: { folder: GifFolder; onClose: () => void; onSaved: () => void; }) {
    const [selected, setSelected] = useState(folder.color ?? DEFAULT_COLORS[0]);

    const save = async () => {
        const folders = await loadFolders();
        if (folders[folder.id]) {
            folders[folder.id].color = selected;
            await saveFolders(folders);
        }
        onSaved();
        onClose();
    };

    return (
        <div style={{
            background: "var(--background-floating)",
            borderRadius: 8, padding: 16, width: 280,
            boxShadow: "var(--elevation-high)",
            display: "flex", flexDirection: "column", gap: 12,
        }}>
            <Text variant="heading-sm/bold" style={{ color: "var(--header-primary)" }}>
                Choose folder color
            </Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {DEFAULT_COLORS.map(c => (
                    <button
                        key={c}
                        onClick={() => setSelected(c)}
                        style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: c, border: "none", cursor: "pointer",
                            boxShadow: selected === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : "none",
                            transition: "box-shadow 0.15s",
                        }}
                    />
                ))}
            </div>
            {/* Custom hex input */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 28, height: 28, borderRadius: 4, background: selected, border: "1px solid var(--background-modifier-accent)" }} />
                <TextInput
                    value={selected}
                    onChange={v => setSelected(v)}
                    placeholder="#5865F2"
                    style={{ flex: 1 }}
                />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Button color={Button.Colors.TRANSPARENT} size={Button.Sizes.SMALL} onClick={onClose}>Cancel</Button>
                <Button color={Button.Colors.BRAND} size={Button.Sizes.SMALL} onClick={save}>Save</Button>
            </div>
        </div>
    );
}

// ─── Folder management modal (create / rename / delete / reorder) ─────────────

function ManageFoldersModal({ folders, onClose, onReload }: {
    folders: GifFolder[];
    onClose: () => void;
    onReload: () => void;
}) {
    const handleCreate = () => {
        openModal(props => (
            <CreateFolderModal
                modalProps={props}
                onCreated={async () => { await onReload(); }}
                onCancel={() => { }}
            />
        ));
    };

    const handleRename = (folder: GifFolder) => {
        openModal(props => (
            <RenameFolderModal
                modalProps={props}
                folder={folder}
                onRenamed={async () => onReload()}
            />
        ));
    };

    const handleDelete = async (folderId: string) => {
        await FolderManager.deleteFolder(folderId);
        onReload();
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
            try { await FolderManager.importFolders(text); onReload(); } catch { }
        };
        input.click();
    };

    return (
        <div style={{
            background: "var(--background-floating)",
            borderRadius: 8, padding: 16, width: 360, maxHeight: 500,
            display: "flex", flexDirection: "column", gap: 10,
            boxShadow: "var(--elevation-high)",
        }}>
            <div style={{ display: "flex", alignItems: "center" }}>
                <Text variant="heading-md/bold" style={{ flex: 1, color: "var(--header-primary)" }}>Manage Folders</Text>
                <button onClick={onClose} style={closeBtnStyle}>✕</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                {folders.length === 0 && (
                    <Text variant="text-sm/normal" style={{ color: "var(--text-muted)", textAlign: "center", padding: 12 }}>
                        No folders yet.
                    </Text>
                )}
                {folders.map(f => (
                    <div key={f.id} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "6px 8px", borderRadius: 6,
                        background: "var(--background-secondary)",
                    }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", background: f.color ?? DEFAULT_COLORS[0], flexShrink: 0 }} />
                        <Text variant="text-sm/semibold" style={{ flex: 1, color: "var(--header-primary)" }}>
                            {f.name} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({f.gifs.length})</span>
                        </Text>
                        <button onClick={() => handleRename(f)} style={iconBtnStyle} title="Rename">✏️</button>
                        <button onClick={() => handleDelete(f.id)} style={iconBtnStyle} title="Delete">🗑️</button>
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Button color={Button.Colors.BRAND} size={Button.Sizes.SMALL} onClick={handleCreate}>+ New folder</Button>
                <Button color={Button.Colors.TRANSPARENT} size={Button.Sizes.SMALL} onClick={handleExport}>⬇️ Export</Button>
                <Button color={Button.Colors.TRANSPARENT} size={Button.Sizes.SMALL} onClick={handleImport}>⬆️ Import</Button>
            </div>
        </div>
    );
}

// ─── Main export: FolderTiles (pinned above Discord's favorites grid) ─────────

export function FolderTiles({ onSelectItem }: { onSelectItem?: (type: any, name: string) => void; }) {
    const [folders, setFolders] = useState<GifFolder[]>([]);
    const [loading, setLoading] = useState(true);
    const [browserFolder, setBrowserFolder] = useState<GifFolder | null>(null);
    const [colorFolder, setColorFolder] = useState<GifFolder | null>(null);
    const [showManage, setShowManage] = useState(false);

    const reload = useCallback(async () => {
        const data = await loadFolders();
        setFolders(Object.values(data).sort((a, b) => a.createdAt - b.createdAt));
        setLoading(false);
    }, []);

    useEffect(() => { reload(); }, []);

    if (loading || folders.length === 0) return null;

    return (
        <>
            {/* Folder tiles grid — same 2-column masonry-ish layout as Discord's categories */}
            <div style={{ width: "100%", marginBottom: 8 }}>
                {/* Section header */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: 6, gap: 6 }}>
                    <Text variant="eyebrow" style={{ color: "var(--text-muted)", flex: 1, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.06em" }}>
                        My Folders
                    </Text>
                    <button
                        onClick={() => setShowManage(true)}
                        style={{ ...iconBtnStyle, fontSize: 13 }}
                        title="Manage folders"
                    >⚙️</button>
                </div>

                {/* 2-column grid matching Discord's category tile layout */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    {folders.map(f => (
                        <FolderTile
                            key={f.id}
                            folder={f}
                            onClick={() => setBrowserFolder(f)}
                            onReload={reload}
                        />
                    ))}
                    {/* "New folder" tile to keep things accessible */}
                    <button
                        onClick={() => openModal(props => (
                            <CreateFolderModal modalProps={props} onCreated={async () => reload()} onCancel={() => {}} />
                        ))}
                        style={{
                            height: 110, borderRadius: 8, border: "2px dashed var(--background-modifier-accent)",
                            background: "var(--background-secondary)", cursor: "pointer",
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            gap: 4, color: "var(--text-muted)", fontSize: 13,
                        }}
                    >
                        <span style={{ fontSize: 22 }}>+</span>
                        New folder
                    </button>
                </div>

                {/* Divider before Discord's own Favorites tile */}
                <div style={{ height: 1, background: "var(--background-modifier-accent)", margin: "4px 0 10px" }} />
            </div>

            {/* GIF browser modal */}
            {browserFolder && (
                <div
                    onClick={() => setBrowserFolder(null)}
                    style={{
                        position: "fixed", inset: 0, zIndex: 1000,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "rgba(0,0,0,0.6)",
                    }}
                >
                    <ErrorBoundary>
                        <GifBrowserModal
                            folder={browserFolder}
                            onClose={() => setBrowserFolder(null)}
                            onReload={reload}
                        />
                    </ErrorBoundary>
                </div>
            )}

            {/* Color picker modal */}
            {colorFolder && (
                <div
                    onClick={() => setColorFolder(null)}
                    style={{
                        position: "fixed", inset: 0, zIndex: 1000,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "rgba(0,0,0,0.6)",
                    }}
                >
                    <ErrorBoundary>
                        <ColorPickerModal
                            folder={colorFolder}
                            onClose={() => setColorFolder(null)}
                            onSaved={reload}
                        />
                    </ErrorBoundary>
                </div>
            )}

            {/* Manage folders modal */}
            {showManage && (
                <div
                    onClick={() => setShowManage(false)}
                    style={{
                        position: "fixed", inset: 0, zIndex: 1000,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "rgba(0,0,0,0.6)",
                    }}
                >
                    <ErrorBoundary>
                        <ManageFoldersModal
                            folders={folders}
                            onClose={() => setShowManage(false)}
                            onReload={reload}
                        />
                    </ErrorBoundary>
                </div>
            )}
        </>
    );
}

const closeBtnStyle: React.CSSProperties = {
    background: "none", border: "none", cursor: "pointer",
    color: "var(--text-muted)", fontSize: 16, lineHeight: 1, padding: 2,
};

const iconBtnStyle: React.CSSProperties = {
    background: "none", border: "none", cursor: "pointer",
    fontSize: 14, padding: "0 2px", opacity: 0.7,
};
