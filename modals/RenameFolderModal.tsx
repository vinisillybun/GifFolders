/*
 * GifFolders – RenameFolderModal.tsx
 */

import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot } from "@utils/modal";
import { Button, React, Text, TextInput, useState } from "@webpack/common";

import { FolderManager } from "../FolderManager";
import { GifFolder } from "..";

const DEFAULT_COLORS = [
    "#5865F2", "#57F287", "#FEE75C", "#EB459E",
    "#ED4245", "#9B59B6", "#1ABC9C", "#E67E22",
];

interface Props {
    modalProps: any;
    folder: GifFolder;
    onRenamed: () => void;
}

export function RenameFolderModal({ modalProps, folder, onRenamed }: Props) {
    const [name, setName] = useState(folder.name);
    const [color, setColor] = useState(folder.color ?? DEFAULT_COLORS[0]);
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
                <Text variant="heading-md/bold">Edit Folder</Text>
                <ModalCloseButton />
            </ModalHeader>
            <ModalContent>
                <div style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                        <Text variant="text-sm/semibold" style={{ marginBottom: 6 }}>Color</Text>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {DEFAULT_COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    style={{
                                        width: 32, height: 32, borderRadius: "50%",
                                        background: c, border: "none", cursor: "pointer",
                                        boxShadow: color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : "none",
                                        transition: "box-shadow 0.15s",
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <Text variant="text-sm/semibold" style={{ marginBottom: 6 }}>Name</Text>
                        <TextInput value={name} onChange={setName} maxLength={50} autoFocus />
                    </div>
                </div>
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleSave} color={Button.Colors.BRAND} disabled={saving || !name.trim()}>
                    Save
                </Button>
                <Button onClick={modalProps.onClose} color={Button.Colors.TRANSPARENT} style={{ marginLeft: 8 }}>
                    Cancel
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}
