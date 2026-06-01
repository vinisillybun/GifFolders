/*
 * GifFolders – CreateFolderModal.tsx
 */

import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot } from "@utils/modal";
import { Button, React, Text, TextInput, useState } from "@webpack/common";

import { GifFolder, loadFolders, saveFolders } from "..";

function generateId(): string {
    return `folder_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const DEFAULT_COLORS = [
    "#5865F2", "#57F287", "#FEE75C", "#EB459E",
    "#ED4245", "#9B59B6", "#1ABC9C", "#E67E22",
];

interface Props {
    modalProps: any;
    onCreated: (folderId: string) => void;
    onCancel: () => void;
}

export function CreateFolderModal({ modalProps, onCreated, onCancel }: Props) {
    const [name, setName] = useState("");
    const [color, setColor] = useState(DEFAULT_COLORS[0]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        const trimmed = name.trim();
        if (!trimmed) { setError("Folder name is required."); return; }
        if (trimmed.length > 50) { setError("Name too long (max 50 chars)."); return; }

        setSaving(true);
        const folders = await loadFolders();

        if (Object.values(folders).some(f => f.name.toLowerCase() === trimmed.toLowerCase())) {
            setError("A folder with that name already exists.");
            setSaving(false);
            return;
        }

        const id = generateId();
        const newFolder: GifFolder = { id, name: trimmed, color, gifs: [], createdAt: Date.now() };
        folders[id] = newFolder;
        await saveFolders(folders);
        onCreated(id);
        modalProps.onClose();
    };

    return (
        <ModalRoot {...modalProps} size="small">
            <ModalHeader>
                <Text variant="heading-md/bold">Create GIF Folder</Text>
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
                        <TextInput
                            placeholder="e.g. Reaction GIFs, Cat Memes…"
                            value={name}
                            onChange={v => { setName(v); setError(null); }}
                            maxLength={50}
                            autoFocus
                        />
                        {error && (
                            <Text variant="text-xs/normal" style={{ color: "var(--text-danger)", marginTop: 4 }}>
                                {error}
                            </Text>
                        )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: color }} />
                        <Text variant="text-sm/semibold" style={{ color: "var(--header-primary)" }}>
                            {name || "My Folder"}
                        </Text>
                    </div>
                </div>
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleCreate} color={Button.Colors.BRAND} disabled={saving}>
                    {saving ? "Creating…" : "Create Folder"}
                </Button>
                <Button onClick={() => { onCancel(); modalProps.onClose(); }} color={Button.Colors.TRANSPARENT} style={{ marginLeft: 8 }}>
                    Cancel
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}
