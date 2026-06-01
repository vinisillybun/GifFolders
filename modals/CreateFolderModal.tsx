import { ModalRoot, ModalHeader, ModalContent, ModalFooter } from "@utils/modal";
import { Button, Forms, React, Text, TextInput, useState } from "@webpack/common";
import { GifFolder, FolderStore, loadFolders, saveFolders } from "..";

interface CreateFolderModalProps {
    modalProps: any;
    onCreated: (id: string) => void;
    onCancel: () => void;
}

export function CreateFolderModal({ modalProps, onCreated, onCancel }: CreateFolderModalProps) {
    const [name, setName] = useState("");
    const [icon, setIcon] = useState("📁");
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
                <Text variant="heading-lg/semibold" style={{ color: "var(--header-primary)" }}>
                    Create GIF Folder
                </Text>
            </ModalHeader>

            <ModalContent>
                <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
                    <Forms.FormSection>
                        <Forms.FormTitle style={{ color: "var(--header-secondary)" }}>
                            Folder Name
                        </Forms.FormTitle>
                        <TextInput
                            placeholder="My Folder"
                            value={name}
                            onChange={setName}
                            autoFocus
                        />
                    </Forms.FormSection>

                    {error && (
                        <Text variant="text-sm/normal" style={{ color: "var(--status-danger)" }}>
                            {error}
                        </Text>
                    )}
                </div>
            </ModalContent>

            <ModalFooter>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", width: "100%" }}>
                    <Button
                        look={Button.Looks.LINK}
                        color={Button.Colors.PRIMARY}
                        onClick={() => { modalProps.onClose(); onCancel(); }}
                        style={{ color: "var(--text-muted)" }}
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
