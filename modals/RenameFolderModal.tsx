import { ModalRoot, ModalHeader, ModalContent, ModalFooter } from "@utils/modal";
import { Button, Forms, React, Text, TextInput, useState } from "@webpack/common";
import { GifFolder } from "..";
import { FolderManager } from "../FolderManager";

interface RenameFolderModalProps {
    modalProps: any;
    folder: GifFolder;
    onRenamed: () => void;
}

export function RenameFolderModal({ modalProps, folder, onRenamed }: RenameFolderModalProps) {
    const [name, setName] = useState(folder.name);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setError("Folder name cannot be empty.");
            return;
        }
        setSaving(true);
        try {
            await FolderManager.renameFolder(folder.id, trimmed);
            modalProps.onClose();
            onRenamed();
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalRoot {...modalProps}>
            <ModalHeader>
                <Text variant="heading-lg/semibold" style={{ color: "var(--header-primary)" }}>
                    Rename Folder
                </Text>
            </ModalHeader>

            <ModalContent>
                <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
                    <Forms.FormSection>
                        <Forms.FormTitle style={{ color: "var(--header-secondary)" }}>
                            Folder Name
                        </Forms.FormTitle>
                        <TextInput
                            placeholder={folder.name}
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
                        onClick={() => modalProps.onClose()}
                        style={{ color: "var(--text-muted)" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        color={Button.Colors.BRAND}
                        disabled={saving}
                        onClick={handleSave}
                    >
                        {saving ? "Saving…" : "Save"}
                    </Button>
                </div>
            </ModalFooter>
        </ModalRoot>
    );
}
