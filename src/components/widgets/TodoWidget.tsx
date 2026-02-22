import React, { useEffect, useState } from 'react';

interface NoteItem {
    id: number;
    name: string;
    text: string;
}

const NOTE_KEY = 'tui-note';
const ITEMS_KEY = 'tui-note-items';
const MAX_ITEMS = 12;

interface TodoWidgetProps {
    tasks: any[];
    setTasks: (tasks: any[]) => void;
    todoistConfig: any;
}

export const TodoWidget: React.FC<TodoWidgetProps> = ({ tasks: _tasks, setTasks: _setTasks, todoistConfig: _todoistConfig }) => {
    const [noteText, setNoteText] = useState('');
    const [items, setItems] = useState<NoteItem[]>([]);

    useEffect(() => {
        try {
            const v = localStorage.getItem(NOTE_KEY) || '';
            setNoteText(v);
            const raw = localStorage.getItem(ITEMS_KEY);
            if (raw) setItems(JSON.parse(raw));
        } catch (e) {}
    }, []);

    const persistItems = (next: NoteItem[]) => {
        setItems(next);
        try { localStorage.setItem(ITEMS_KEY, JSON.stringify(next)); } catch (e) {}
    };

    const handleSave = () => {
        try { localStorage.setItem(NOTE_KEY, noteText); } catch (e) {}
        const rawName = noteText.split('\n')[0].trim();
        const name = rawName.slice(0, 18) || 'note';
        const newItem: NoteItem = { id: Date.now(), name, text: noteText };
        let next = [...items, newItem];
        if (next.length > MAX_ITEMS) next = next.slice(next.length - MAX_ITEMS);
        persistItems(next);
    };

    const loadItem = (item: NoteItem) => setNoteText(item.text);

    const deleteItem = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        persistItems(items.filter(i => i.id !== id));
    };

    return (
        <div className="h-full flex flex-col">
            {/* textarea fills available space and scrolls internally */}
            <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="write a quick note..."
                className="flex-1 min-h-0 w-full bg-transparent p-2 text-sm text-[var(--color-fg)] placeholder-[var(--color-muted)] resize-none outline-none overflow-y-auto custom-scrollbar"
                autoComplete="off"
                spellCheck="false"
            />

            {/* bottom bar: Save + horizontal items row */}
            <div className="mt-2 pt-2 border-t border-[var(--color-border)] flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                <button
                    onClick={handleSave}
                    className="text-[var(--color-muted)] hover:text-[var(--color-fg)] text-xs font-mono shrink-0"
                >
                    [SAVE]
                </button>
                {items.map(item => (
                    <div
                        key={item.id}
                        onClick={() => loadItem(item)}
                        className="flex items-center gap-1 border border-[var(--color-border)] hover:border-[var(--color-accent)] px-2 py-1 text-xs text-[var(--color-muted)] cursor-pointer shrink-0 max-w-[120px] transition-colors duration-150"
                    >
                        <span className="truncate">{item.name}</span>
                        <button
                            onClick={(e) => deleteItem(e, item.id)}
                            className="text-[var(--color-muted)] hover:text-[var(--color-accent)] ml-1 shrink-0 leading-none"
                        >
                            x
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
