import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot } from "@utils/modal";
import { Button, React, Text, TextInput, useState } from "@webpack/common";
import { FolderManager } from "../FolderManager";
import { GifFolder } from "..";

interface Props {
    modalProps: any;
    folder: GifFolder;
    onRenamed: () => void;
}

export function RenameFolderModal({ modalProps, folder, onRenamed }: Props) {
    const [name, setName] = useState(folder.name);
    const [color, setColor] = useState(folder.color ?? "#5865F2");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await FolderManager.renameFolder(folder.id, name, color);
        onRenamed();
        modalProps.onClose();
    };

    return (
        <ModalRoot {...modalProps} size="small">
            <ModalHeader>
                <Text variant="heading-md/bold">Rename Folder</Text>
                <ModalCloseButton />
            </ModalHeader>
            <ModalContent>
                <div style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                        <Text variant="text-sm/semibold" style={{ marginBottom: 6 }}>Name</Text>
                        <TextInput
                            value={name}
                            onChange={setName}
                            maxLength={50}
                            autoFocus
                        />
                    </div>

                    <div>
                        <Text variant="text-sm/semibold" style={{ marginBottom: 6 }}>Color</Text>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <input
                                type="color"
                                value={color}
                                onChange={e => setColor(e.currentTarget.value)}
                                style={{
                                    width: 50,
                                    height: 40,
                                    border: "1px solid var(--background-modifier-accent)",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                }}
                            />
                            <Text variant="text-sm/normal" style={{ color: "var(--text-muted)" }}>
                                {color}
                            </Text>
                        </div>
                    </div>
                </div>
            </ModalContent>
            <ModalFooter>
                <Button
                    onClick={handleSave}
                    color={Button.Colors.BRAND}
                    disabled={saving || !name.trim()}
                >
                    Save
                </Button>
                <Button
                    onClick={modalProps.onClose}
                    color={Button.Colors.TRANSPARENT}
                    style={{ marginLeft: 8 }}
                >
                    Cancel
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}
