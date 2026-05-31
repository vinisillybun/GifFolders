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
    const [emoji, setEmoji] = useState(folder.emoji ?? "📁");
    const [customEmoji, setCustomEmoji] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await FolderManager.renameFolder(folder.id, name, customEmoji.trim() || emoji);
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
                        <Text variant="text-sm/semibold" style={{ marginBottom: 6 }}>Icon</Text>
                        <TextInput
                            placeholder="Type an emoji or symbol…"
                            value={customEmoji}
                            onChange={v => setCustomEmoji(v)}
                            maxLength={4}
                        />
                    </div>

                    <div>
                        <Text variant="text-sm/semibold" style={{ marginBottom: 6 }}>Name</Text>
                        <TextInput
                            value={name}
                            onChange={setName}
                            maxLength={50}
                            autoFocus
                        />
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
