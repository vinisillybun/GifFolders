/*
 * Vencord — GifFolders — GifFoldersUI.tsx
 */

import ErrorBoundary from "@components/ErrorBoundary";
import { openModal, ModalRoot, ModalHeader, ModalContent, ModalFooter, ModalCloseButton } from "@utils/modal";
import { Button, React, Text, TextInput, Tooltip, useState, useEffect, useCallback } from "@webpack/common";

import { FolderManager } from "./FolderManager";
import { GifFolder, GifItem, loadFolders, saveFolders } from ".";
import { CreateFolderModal } from "./modals/CreateFolderModal";
import { RenameFolderModal } from "./modals/RenameFolderModal";

const DEFAULT_COLORS = [
    "#5865F2", "#57F287", "#FEE75C", "#EB459E",
    "#ED4245", "#9B59B6", "#1ABC9C", "#E67E22",
];

// Solid dark background — never transparent
const MODAL_BG: React.CSSProperties = {
    background: "#1e1f22",
    borderRadius: 8,
    padding: 16,
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
};

const TEXT_NORMAL = "#dbdee1";
const TEXT_MUTED = "#949ba4";

// ─── Individual GIF tile ──────────────────────────────────────────────────────

function GifTile({ gif, onSend, onDelete }: {
    gif: GifItem;
    onSend: () => void;
    onDelete: () => void;
}) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onSend}
            style={{
                position: "relative", cursor: "pointer",
                borderRadius: 4, overflow: "hidden",
                background: "#2b2d31",
            }}
        >
            <img
                src={gif.src || gif.url}
                alt=""
                style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }}
            />
            {hovered && (
                <button
                    onClick={e => { e.stopPropagation(); onDelete(); }}
                    style={{
                        position: "absolute", top: 2, right: 2,
                        background: "rgba(0,0,0,0.75)", border: "none", borderRadius: "50%",
                        width: 20, height: 20, cursor: "pointer", color: "#fff",
                        fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    title="Remove"
                >✕</button>
            )}
        </div>
    );
}

// ─── GIF browser modal ────────────────────────────────────────────────────────

function GifBrowserModalInner({ folder, modalProps, onSelectGIF, onReload }: {
    folder: GifFolder;
    modalProps: any;
    onSelectGIF?: (gif: any) => void;
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
        <ModalRoot {...modalProps} size="medium">
            <ModalHeader>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                    <div style={{
                        width: 12, height: 12, borderRadius: "50%",
                        background: folder.color ?? DEFAULT_COLORS[0], flexShrink: 0,
                    }} />
                    <Text variant="heading-md/bold" style={{ color: TEXT_NORMAL }}>
                        {folder.name}
                        <span style={{ color: TEXT_MUTED, fontWeight: 400, fontSize: 13, marginLeft: 6 }}>
                            ({gifs.length} GIFs)
                        </span>
                    </Text>
                </div>
                <ModalCloseButton />
            </ModalHeader>
            <ModalContent>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
                    <TextInput
                        placeholder="Search…"
                        value={search}
                        onChange={setSearch}
                    />
                    {visible.length === 0 ? (
                        <Text variant="text-sm/normal" style={{ color: TEXT_MUTED, textAlign: "center", padding: 20 }}>
                            {search ? "No results." : "No GIFs yet. Right-click a GIF in chat → Save to GIF Folder."}
                        </Text>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 4 }}>
                            {visible.map(gif => (
                                <GifTile
                                    key={gif.url}
                                    gif={gif}
                                    onSend={() => {
                                        onSelectGIF?.({
                                            url: gif.url,
                                            src: gif.src,
                                            width: gif.width,
                                            height: gif.height,
                                            format: "IMAGE",
                                        });
                                        modalProps.onClose();
                                    }}
                                    onDelete={() => handleDelete(gif.url)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </ModalContent>
        </ModalRoot>
    );
}

// ─── Manage folders modal ─────────────────────────────────────────────────────

function ManageFoldersModalInner({ folders, modalProps, onReload }: {
    folders: GifFolder[];
    modalProps: any;
    onReload: () => void;
}) {
    const handleCreate = () => {
        openModal(props => (
            <CreateFolderModal modalProps={props} onCreated={async () => onReload()} onCancel={() => {}} />
        ));
    };

    const handleRename = (folder: GifFolder) => {
        openModal(props => (
            <RenameFolderModal modalProps={props} folder={folder} onRenamed={async () => onReload()} />
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
            try { await FolderManager.importFolders(await file.text()); onReload(); } catch { }
        };
        input.click();
    };

    return (
        <ModalRoot {...modalProps} size="small">
            <ModalHeader>
                <Text variant="heading-md/bold" style={{ color: TEXT_NORMAL, flex: 1 }}>Manage Folders</Text>
                <ModalCloseButton />
            </ModalHeader>
            <ModalContent>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 8, paddingBottom: 8 }}>
                    {folders.length === 0 && (
                        <Text variant="text-sm/normal" style={{ color: TEXT_MUTED, textAlign: "center", padding: 12 }}>
                            No folders yet.
                        </Text>
                    )}
                    {folders.map(f => (
                        <div key={f.id} style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "6px 8px", borderRadius: 6,
                            background: "#2b2d31",
                        }}>
                            <div style={{ width: 14, height: 14, borderRadius: "50%", background: f.color ?? DEFAULT_COLORS[0], flexShrink: 0 }} />
                            <Text variant="text-sm/semibold" style={{ flex: 1, color: TEXT_NORMAL }}>
                                {f.name} <span style={{ color: TEXT_MUTED, fontWeight: 400 }}>({f.gifs.length})</span>
                            </Text>
                            <button onClick={() => handleRename(f)} style={iconBtnStyle} title="Rename">✏️</button>
                            <button onClick={() => handleDelete(f.id)} style={iconBtnStyle} title="Delete">🗑️</button>
                        </div>
                    ))}
                </div>
            </ModalContent>
            <ModalFooter>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Button color={Button.Colors.BRAND} size={Button.Sizes.SMALL} onClick={handleCreate}>New folder</Button>
                    <Button color={Button.Colors.TRANSPARENT} size={Button.Sizes.SMALL} onClick={handleExport}>Export</Button>
                    <Button color={Button.Colors.TRANSPARENT} size={Button.Sizes.SMALL} onClick={handleImport}>Import</Button>
                </div>
            </ModalFooter>
        </ModalRoot>
    );
}

// ─── Folder tile ──────────────────────────────────────────────────────────────

function FolderTile({ folder, onClick }: { folder: GifFolder; onClick: () => void; }) {
    const [hovered, setHovered] = useState(false);
    const color = folder.color ?? DEFAULT_COLORS[0];
    const previewGif = folder.gifs.length > 0 ? folder.gifs[Math.floor(Math.random() * folder.gifs.length)] : undefined;

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
            style={{
                position: "relative", cursor: "pointer",
                borderRadius: 8, overflow: "hidden",
                height: 110, background: color,
                display: "flex", alignItems: "flex-end",
                transition: "filter 0.1s ease",
                filter: hovered ? "brightness(1.15)" : "brightness(1)",
            }}
        >
            {previewGif && (
                <img
                    src={previewGif.src || previewGif.url}
                    alt=""
                    style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%",
                        objectFit: "cover", opacity: 0.35,
                        filter: "blur(1px)", pointerEvents: "none",
                    }}
                />
            )}
            <div style={{
                position: "relative", width: "100%",
                padding: "6px 8px",
                background: "linear-gradient(transparent, rgba(0,0,0,0.55))",
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 14, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                    {folder.name}
                </span>
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>
                    {folder.gifs.length}
                </span>
            </div>
        </div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function FolderTiles({ onSelectItem, onSelectGIF }: { onSelectItem?: (gif: any) => void; onSelectGIF?: (gif: any) => void; }) {
    const [folders, setFolders] = useState<GifFolder[]>([]);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(async () => {
        const data = await loadFolders();
        setFolders(Object.values(data).sort((a, b) => a.createdAt - b.createdAt));
        setLoading(false);
    }, []);

    useEffect(() => { reload(); }, []);

    if (loading || folders.length === 0) return null;

    const openBrowser = (folder: GifFolder) => {
        // Reload folder from store to get latest gifs
        loadFolders().then(all => {
            const fresh = all[folder.id] ?? folder;
            openModal(props => (
                <GifBrowserModalInner
                    folder={fresh}
                    modalProps={props}
                    onSelectGIF={onSelectGIF ?? onSelectItem}
                    onReload={reload}
                />
            ));
        });
    };

    const openManage = () => {
        openModal(props => (
            <ManageFoldersModalInner
                folders={folders}
                modalProps={props}
                onReload={reload}
            />
        ));
    };

    return (
        <div style={{ width: "100%", marginBottom: 8 }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 6, gap: 6 }}>
                <Text variant="eyebrow" style={{
                    color: TEXT_MUTED, flex: 1,
                    textTransform: "uppercase", fontSize: 11, letterSpacing: "0.06em",
                }}>
                    My Folders
                </Text>
                <button onClick={openManage} style={iconBtnStyle} title="Manage folders">⚙️</button>
            </div>

            {/* 2-column grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                {folders.map(f => (
                    <FolderTile key={f.id} folder={f} onClick={() => openBrowser(f)} />
                ))}
                <button
                    onClick={() => openModal(props => (
                        <CreateFolderModal modalProps={props} onCreated={async () => reload()} onCancel={() => {}} />
                    ))}
                    style={{
                        height: 110, borderRadius: 8,
                        border: "2px dashed #3f4147",
                        background: "#2b2d31", cursor: "pointer",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        gap: 4, color: TEXT_MUTED, fontSize: 13,
                    }}
                >
                    <span style={{ fontSize: 22 }}>+</span>
                    New folder
                </button>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "#3f4147", margin: "4px 0 10px" }} />
        </div>
    );
}

const iconBtnStyle: React.CSSProperties = {
    background: "none", border: "none", cursor: "pointer",
    fontSize: 14, padding: "0 2px", opacity: 0.7,
    color: TEXT_NORMAL,
};
