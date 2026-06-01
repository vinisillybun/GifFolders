import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot } from "@utils/modal";
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
    const [color, setColor] = useState(folder.color ?? "#5865F2");
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
            await FolderManager.renameFolder(folder.id, trimmed, color);
            modalProps.onClose();
            onRenamed();
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalRoot {...modalProps}>
            <ModalHeader>
                <Text variant="heading-lg/semibold" style={{ flex: 1 }}>
                    Rename Folder
                </Text>
                <ModalCloseButton onClick={modalProps.onClose} />
            </ModalHeader>

            <ModalContent>
                <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
                    <Forms.FormSection>
                        <Forms.FormTitle>Folder Name</Forms.FormTitle>
                        <TextInput
                            placeholder={folder.name}
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
                <Button
                    color={Button.Colors.BRAND}
                    disabled={saving}
                    onClick={handleSave}
                >
                    {saving ? "Saving…" : "Save"}
                </Button>
                <Button
                    look={Button.Looks.LINK}
                    color={Button.Colors.PRIMARY}
                    onClick={() => modalProps.onClose()}
                >
                    Cancel
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}
