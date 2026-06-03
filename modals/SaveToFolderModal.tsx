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
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
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

    const handleNewFolder = async () => {
        const id = await FolderManager.openCreateModal();
        if (id) {
            const updated = await loadFolders();
            setFolders(Object.values(updated));
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
                                        onClick={() => !alreadySaved && setSelectedFolderId(f.id)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            padding: "8px 12px",
                                            background: wasSavedNow
                                                ? "var(--green-360)"
                                                : selectedFolderId === f.id
                                                    ? (f.color ?? "var(--brand-experiment)")
                                                    : "var(--background-secondary)",
                                            border: "1px solid var(--background-modifier-accent)",
                                            borderRadius: 6,
                                            cursor: alreadySaved ? "not-allowed" : "pointer",
                                            opacity: alreadySaved ? 0.5 : 1,
                                            textAlign: "left",
                                        }}
                                    >
                                        <span style={{ flex: 1, fontWeight: 500, color: (selectedFolderId === f.id && !wasSavedNow) ? "#fff" : "var(--text-normal)" }}>{f.name}</span>
                                        <span style={{ fontSize: 12, color: (selectedFolderId === f.id && !wasSavedNow) ? "rgba(255,255,255,0.75)" : "var(--text-muted)" }}>
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
                <div style={{ display: "flex", gap: 8, width: "100%", justifyContent: "flex-end" }}>
                    <Button
                        onClick={modalProps.onClose}
                        color={Button.Colors.TRANSPARENT}
                        size={Button.Sizes.SMALL}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleNewFolder}
                        color={Button.Colors.BRAND}
                        size={Button.Sizes.SMALL}
                    >
                        New Folder
                    </Button>
                    <Button
                        onClick={() => selectedFolderId && saveToFolder(selectedFolderId)}
                        color={Button.Colors.BRAND}
                        size={Button.Sizes.SMALL}
                        disabled={!selectedFolderId || saving || !!savedTo}
                    >
                        {savedTo ? "Saved!" : saving ? "Saving…" : "Save"}
                    </Button>
                </div>
            </ModalFooter>
        </ModalRoot>
    );
}
