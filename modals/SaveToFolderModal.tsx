import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot, openModal } from "@utils/modal";
import { Button, React, Text, useState, useEffect } from "@webpack/common";
import { FolderManager } from "../FolderManager";
import { GifFolder, GifItem, loadFolders } from "..";
import { CreateFolderModal } from "./CreateFolderModal";

interface SaveToFolderModalProps {
    modalProps: any;
    gif: GifItem;
}

export function SaveToFolderModal({ modalProps, gif }: SaveToFolderModalProps) {
    const [folders, setFolders] = useState<Record<string, GifFolder>>({});
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const reloadFolders = async () => {
        const data = await loadFolders();
        setFolders(data);
    };

    useEffect(() => { reloadFolders(); }, []);

    const folderList = Object.values(folders);

    const handleSave = async () => {
        if (!selectedFolderId) return;
        setSaving(true);
        try {
            await FolderManager.addGifToFolder(selectedFolderId, gif);
            setSaved(true);
            setTimeout(() => modalProps.onClose(), 800);
        } finally {
            setSaving(false);
        }
    };

    // Opens CreateFolderModal — just creates the folder, does NOT auto-save the GIF
    const handleNewFolder = () => {
        openModal(props => (
            <CreateFolderModal
                modalProps={props}
                onCreated={async id => {
                    await reloadFolders();
                    setSelectedFolderId(id);
                }}
                onCancel={() => { }}
            />
        ));
    };

    return (
        <ModalRoot {...modalProps}>
            <ModalHeader>
                <Text variant="heading-lg/semibold" style={{ flex: 1 }}>
                    Save GIF to Folder
                </Text>
                <ModalCloseButton onClick={modalProps.onClose} />
            </ModalHeader>

            <ModalContent>
                <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* GIF preview */}
                    <img
                        src={gif.src || gif.url}
                        alt=""
                        style={{
                            width: "100%",
                            maxHeight: 120,
                            objectFit: "contain",
                            borderRadius: 4,
                            marginBottom: 8,
                        }}
                    />

                    {folderList.length === 0 ? (
                        <Text variant="text-sm/normal" style={{ color: "var(--text-muted)" }}>
                            You have no folders yet. Click "New Folder" below to create one!
                        </Text>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
                            {folderList.map(f => {
                                const isSelected = selectedFolderId === f.id;
                                return (
                                    <button
                                        key={f.id}
                                        onClick={() => setSelectedFolderId(f.id)}
                                        className={isSelected ? "gif-folder-modal-item gif-folder-modal-item-selected" : "gif-folder-modal-item"}
                                        style={{
                                            background: isSelected
                                                ? (f.color ?? "var(--brand-experiment)")
                                                : "var(--background-secondary)",
                                            border: `1px solid ${isSelected ? "transparent" : "var(--background-modifier-accent)"}`,
                                            borderRadius: 6,
                                            padding: "8px 12px",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            fontSize: 14,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        <span>{f.name}</span>
                                        <span style={{ opacity: 0.7, fontSize: 12 }}>
                                            ({f.gifs.length} GIFs)
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {saved && (
                        <Text variant="text-sm/normal" style={{ color: "var(--status-positive)", textAlign: "center" }}>
                            ✅ Saved!
                        </Text>
                    )}
                </div>
            </ModalContent>

            <ModalFooter>
                <div style={{ display: "flex", gap: 8, width: "100%", justifyContent: "flex-end" }}>
                    <Button
                        look={Button.Looks.LINK}
                        color={Button.Colors.PRIMARY}
                        onClick={() => modalProps.onClose()}
                    >
                        Cancel
                    </Button>
                    <Button
                        color={Button.Colors.BRAND}
                        onClick={handleNewFolder}
                    >
                        New Folder
                    </Button>
                    <Button
                        color={Button.Colors.BRAND}
                        disabled={!selectedFolderId || saving || saved}
                        onClick={handleSave}
                    >
                        {saving ? "Saving…" : saved ? "Saved!" : "Save"}
                    </Button>
                </div>
            </ModalFooter>
        </ModalRoot>
    );
}
