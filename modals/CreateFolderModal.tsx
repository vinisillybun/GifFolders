import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot } from "@utils/modal";
import { Button, Forms, React, Text, TextInput, useState } from "@webpack/common";
import { GifFolder, loadFolders, saveFolders } from "..";

interface CreateFolderModalProps {
    modalProps: any;
    onCreated: (id: string) => void;
    onCancel: () => void;
}

export function CreateFolderModal({ modalProps, onCreated, onCancel }: CreateFolderModalProps) {
    const [name, setName] = useState("");
    const [color, setColor] = useState("#5865F2");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    const handleCreate = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setError("Please enter a folder name.");
            return;
        }
        setCreating(true);
        try {
            const folders = await loadFolders();
            const id = `folder_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            const newFolder: GifFolder = {
                id,
                name: trimmed,
                color,
                gifs: [],
                createdAt: Date.now(),
            };
            folders[id] = newFolder;
            await saveFolders(folders);
            modalProps.onClose();
            onCreated(id);
        } finally {
            setCreating(false);
        }
    };

    return (
        <ModalRoot {...modalProps}>
            <ModalHeader>
                <Text variant="heading-lg/semibold" style={{ flex: 1 }}>
                    Create GIF Folder
                </Text>
                <ModalCloseButton onClick={modalProps.onClose} />
            </ModalHeader>

            <ModalContent>
                <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
                    <Forms.FormSection>
                        <Forms.FormTitle>Folder Name</Forms.FormTitle>
                        <TextInput
                            placeholder="My Folder"
                            value={name}
                            onChange={setName}
                            autoFocus
                        />
                    </Forms.FormSection>

                    <Forms.FormSection>
                        <Forms.FormTitle>Folder Color</Forms.FormTitle>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input
                                type="color"
                                value={color}
                                onChange={e => setColor(e.target.value)}
                                style={{
                                    width: 36,
                                    height: 36,
                                    border: "none",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                    background: "none",
                                    padding: 0,
                                }}
                            />
                            <Text variant="text-sm/normal" style={{ color: "var(--text-muted)" }}>
                                {color}
                            </Text>
                        </div>
                    </Forms.FormSection>

                    {error && (
                        <Text variant="text-sm/normal" style={{ color: "var(--status-danger)" }}>
                            {error}
                        </Text>
                    )}
                </div>
            </ModalContent>

            <ModalFooter>
                <div style={{ display: "flex", gap: 8, width: "100%", justifyContent: "flex-end" }}>
                    <Button
                        look={Button.Looks.LINK}
                        color={Button.Colors.PRIMARY}
                        onClick={() => { modalProps.onClose(); onCancel(); }}
                    >
                        Cancel
                    </Button>
                    <Button
                        color={Button.Colors.BRAND}
                        disabled={creating}
                        onClick={handleCreate}
                    >
                        {creating ? "Creating…" : "Create"}
                    </Button>
                </div>
            </ModalFooter>
        </ModalRoot>
    );
}
