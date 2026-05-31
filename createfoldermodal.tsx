/*
 * GifFolders – CreateFolderModal.tsx
 */

import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot } from "@utils/modal";
import { Button, React, Text, TextInput, useState } from "@webpack/common";

import { GifFolder, loadFolders, saveFolders } from "..";

function generateId(): string {
    return `folder_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Common emoji presets for quick picking
const EMOJI_PRESETS = ["😂", "😭", "🐱", "🐶", "🔥", "💯", "🤡", "👀", "💀", "🗿", "✨", "🎭", "🎮", "🌈", "💅"];

interface Props {
    modalProps: any;
    onCreated: (folderId: string) => void;
    onCancel: () => void;
}

export function CreateFolderModal({ modalProps, onCreated, onCancel }: Props) {
    const [name, setName] = useState("");
    const [emoji, setEmoji] = useState("📁");
    const [customEmoji, setCustomEmoji] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        const trimmed = name.trim();
        if (!trimmed) { setError("Folder name is required."); return; }
        if (trimmed.length > 50) { setError("Name too long (max 50 chars)."); return; }

        setSaving(true);
        const folders = await loadFolders();

        // Duplicate check
        if (Object.values(folders).some(f => f.name.toLowerCase() === trimmed.toLowerCase())) {
            setError("A folder with that name already exists.");
            setSaving(false);
            return;
        }

        const id = generateId();
        const newFolder: GifFolder = {
            id,
            name: trimmed,
            emoji: (customEmoji.trim() || emoji),
            gifs: [],
            createdAt: Date.now(),
        };

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

                    {/* Emoji picker */}
                    <div>
                        <Text variant="text-sm/semibold" style={{ marginBottom: 6 }}>Icon</Text>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                            {EMOJI_PRESETS.map(e => (
                                <button
                                    key={e}
                                    onClick={() => { setEmoji(e); setCustomEmoji(""); }}
                                    style={{
                                        fontSize: 20,
                                        background: emoji === e && !customEmoji
                                            ? "var(--brand-experiment)"
                                            : "var(--background-secondary)",
                                        border: "2px solid transparent",
                                        borderRadius: 6,
                                        padding: "2px 4px",
                                        cursor: "pointer",
                                    }}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                        <TextInput
                            placeholder="Or type a custom emoji / symbol…"
                            value={customEmoji}
                            onChange={v => setCustomEmoji(v)}
                            maxLength={4}
                        />
                    </div>

                    {/* Folder name */}
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
                            <Text
                                variant="text-xs/normal"
                                style={{ color: "var(--text-danger)", marginTop: 4 }}
                            >
                                {error}
                            </Text>
                        )}
                    </div>

                    {/* Preview */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)" }}>
                        <Text variant="text-sm/normal">Preview: </Text>
                        <span style={{ fontSize: 18 }}>{customEmoji || emoji}</span>
                        <Text variant="text-sm/semibold" style={{ color: "var(--header-primary)" }}>
                            {name || "My Folder"}
                        </Text>
                    </div>
                </div>
            </ModalContent>
            <ModalFooter>
                <Button
                    onClick={handleCreate}
                    color={Button.Colors.BRAND}
                    disabled={saving}
                >
                    {saving ? "Creating…" : "Create Folder"}
                </Button>
                <Button
                    onClick={() => { onCancel(); modalProps.onClose(); }}
                    color={Button.Colors.TRANSPARENT}
                    style={{ marginLeft: 8 }}
                >
                    Cancel
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}
