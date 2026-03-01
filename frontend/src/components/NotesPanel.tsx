import { useEffect, useState } from "react";
import type { OrderNote } from "../types";
import { fetchNotes, addNote } from "../api/client";

interface Props {
  orderId: string;
}

export default function NotesPanel({ orderId }: Props) {
  const [notes, setNotes] = useState<OrderNote[]>([]);
  const [author, setAuthor] = useState("support-agent");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotes(orderId).then(setNotes).catch(console.error);
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const note = await addNote(orderId, author, content);
      setNotes((prev) => [...prev, note]);
      setContent("");
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notes-panel">
      <h3>Notes ({notes.length})</h3>

      {notes.length === 0 && (
        <p className="text-muted" style={{ fontSize: "0.875rem" }}>
          No notes yet.
        </p>
      )}

      {notes.map((n) => (
        <div key={n.id} className="note-item">
          <div className="note-meta">
            <strong>{n.author}</strong> ·{" "}
            {new Date(n.createdAt).toLocaleString()}
          </div>
          <div style={{ fontSize: "0.875rem", marginTop: 2 }}>{n.content}</div>
        </div>
      ))}

      <form className="note-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Author"
          style={{ maxWidth: 120 }}
        />
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a note…"
        />
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "…" : "Add"}
        </button>
      </form>
    </div>
  );
}
