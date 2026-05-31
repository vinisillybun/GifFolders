/*
 * GifFolders – SaveToFolderModal.tsx
 * Modal for picking (or creating) a folder to save a GIF into.
 */

import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot } from "@utils/modal";
import { Button, React, Text, useState, useEffect } from "@webpack/common";

import { FolderManager } from "../FolderManager";
import { GifFolder, GifItem, loadFolders } from "..";

interface Props {
    modalProps: any;
    gif: GifItem;
}

export function SaveToFolderModal({ modalProps, gif }: Props) {
    const [folders, setFolders] = useState<GifFolder[]>([]);
    const [saving, setSaving] = useState(false);
    const [savedTo, setSavedTo] = useState<string | null>(null);

    useEffect(() => {
        loadFolders().then(f => setFolders(Object.values(f)));
    }, []);

    const saveToFolder = async (folderId: string) => {
        setSaving(true);
        await FolderManager.addGifToFolder(folderId, gif);
        setSavedTo(folderId);
        setSaving(false);
        setTimeout(() => modalProps.onClose(), 700);
    };

    const createAndSave = async () => {
        const id = await FolderManager.openCreateModal();
        if (id) {
            // Reload folders then save
            const updated = await loadFolders();
            setFolders(Object.values(updated));
            await saveToFolder(id);
        }
    };

    return (
        <ModalRoot {...modalProps} size="small">
            <ModalHeader>
                <Text variant="heading-md/bold">Save GIF to folder</Text>
                <ModalCloseButton />
            </ModalHeader>
            <ModalContent>
                <div style={{ padding: "12px 0" }}>
                    {/* GIF preview */}
                    <img
                        src={gif.src}
                        alt=""
                        style={{
                            width: "100%",
                            maxHeight: 120,
                            objectFit: "contain",
                            borderRadius: 4,
                            marginBottom: 12,
                            background: "var(--background-secondary)",
                        }}
                    />

                    {folders.length === 0 ? (
                        <Text
                            variant="text-sm/normal"
                            style={{ color: "var(--text-muted)", textAlign: "center", marginBottom: 10 }}
                        >
                            You don't have any folders yet.
                        </Text>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {folders.map(f => {
                                const alreadySaved = f.gifs.some(g => g.url === gif.url);
                                const wasSavedNow = savedTo === f.id;
                                return (
                                    <button
                                        key={f.id}
                                        disabled={saving || alreadySaved}
                                        onClick={() => saveToFolder(f.id)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            padding: "8px 12px",
                                            background: wasSavedNow
                                                ? "var(--green-360)"
                                                : "var(--background-secondary)",
                                            border: "1px solid var(--background-modifier-accent)",
                                            borderRadius: 6,
                                            cursor: alreadySaved ? "not-allowed" : "pointer",
                                            color: "var(--text-normal)",
                                            opacity: alreadySaved ? 0.5 : 1,
                                            textAlign: "left",
                                        }}
                                    >
                                        <span style={{ fontSize: 18 }}>{f.emoji ?? "📁"}</span>
                                        <span style={{ flex: 1, fontWeight: 500 }}>{f.name}</span>
                                        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                                            {alreadySaved ? "Already saved" : `${f.gifs.length} GIFs`}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </ModalContent>
            <ModalFooter>
                <Button
                    onClick={createAndSave}
                    color={Button.Colors.BRAND}
                    size={Button.Sizes.SMALL}
                >
                    ➕ New folder & save
                </Button>
                <Button
                    onClick={modalProps.onClose}
                    color={Button.Colors.TRANSPARENT}
                    size={Button.Sizes.SMALL}
                    style={{ marginLeft: "auto" }}
                >
                    Cancel
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}
