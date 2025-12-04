'use client';

import React, { useEffect, useState } from 'react';
import { Note } from '@/types/note';
import {
  fetchNotes,
  createNoteApi,
  updateNoteApi,
  deleteNoteApi,
} from '@/lib/api';
import { NoteForm } from '@/components/NoteForm';
import { NotesGrid } from '@/components/NotesGrid';

type ToastType = 'success' | 'error';

interface Toast {
  type: ToastType;
  message: string;
}

interface NoteChangeEvent {
  type: 'created' | 'updated' | 'deleted';
  note: Partial<Note> & { id?: number };
  timestamp: number;
}

function getSortTimestamp(note: Note): number {
  const ds = note.updated_at || note.created_at;
  if (!ds) return 0;
  const t = new Date(ds).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function sortNotesByLatestUpdated(notes: Note[]): Note[] {
  return [...notes].sort(
    (a, b) => getSortTimestamp(b) - getSortTimestamp(a)
  );
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function Page() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [viewNote, setViewNote] = useState<Note | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);

  // ---------- initial load ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchNotes();
        if (!cancelled) {
          setNotes(sortNotesByLatestUpdated(data));
          setLoading(false);
        }
      } catch (err) {
        console.error('[Next] Failed to load notes', err);
        if (!cancelled) {
          setLoading(false);
          setErrorMessage('Failed to load notes');
          showToast('error', 'Failed to load notes');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- SSE connection ----------
  useEffect(() => {
    if (!API_BASE) {
      console.warn('[Next] NEXT_PUBLIC_API_BASE not set, SSE disabled');
      return;
    }
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      console.warn('[Next] SSE not supported in this environment');
      return;
    }

    const url = `${API_BASE}/notes/events`;
    console.log('[Next] Connecting SSE to', url);

    const es = new EventSource(url);

    es.onopen = () => {
      console.log('[Next] SSE connection opened');
    };

    es.onmessage = (event) => {
      let data: NoteChangeEvent;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        console.error('[Next] Failed to parse SSE data', e, event.data);
        return;
      }

      // apply backend change to current list
      setNotes((current) => applyChange(current, data));
    };

    es.onerror = (err) => {
      console.error('[Next] SSE error', err);
      // optional: es.close();
    };

    return () => {
      es.close();
      console.log('[Next] SSE connection closed');
    };
  }, []);

  // ---------- helper: apply change to notes ----------
  function applyChange(current: Note[], change: NoteChangeEvent): Note[] {
    let next = current;

    if (change.type === 'created' && change.note.id != null) {
      const exists = current.some((n) => n.id === change.note.id);
      if (!exists) {
        next = [...current, change.note as Note];
      }
      // if it already exists, we just keep current
    } else if (change.type === 'updated' && change.note.id != null) {
      const idx = current.findIndex((n) => n.id === change.note.id);
      if (idx === -1) {
        next = [...current, change.note as Note];
      } else {
        const updated = current.slice();
        updated[idx] = change.note as Note;
        next = updated;
      }
    } else if (change.type === 'deleted' && change.note.id != null) {
      // for deletes we don't need to re-sort; just remove it
      return current.filter((n) => n.id !== change.note.id);
    }

    // For create/update: always return sorted by latest updated_at / created_at
    if (change.type === 'created' || change.type === 'updated') {
      return sortNotesByLatestUpdated(next);
    }

    return next;
  }


  function showToast(type: ToastType, message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  }

  // ---------- handlers from form / grid ----------

  const handleNewNote = () => {
    setSelectedNote(null);
  };

  const handleSaveNote = async (draft: Note) => {
    try {
      setSaving(true);
      setErrorMessage(null);

      const hasId = !!draft.id;
      const payload: Note = {
        id: draft.id,
        name: draft.name.trim(),
        description: draft.description ?? '',
        bg_color: draft.bg_color ?? '#ffffff',
        created_at: draft.created_at,
        updated_at: draft.updated_at,
      };

      if (hasId && draft.id != null) {
        // UPDATE
        const updated = await updateNoteApi(draft.id, payload);

        // ✅ optimistic local update (keeps latest-first ordering via applyChange)
        setNotes((current) =>
          applyChange(current, {
            type: 'updated',
            note: updated,
            timestamp: Date.now(),
          })
        );

        // ✅ reset form after update
        setSelectedNote(null);
        setFormResetKey((k) => k + 1);
        showToast('success', 'Note updated');
      } else {
        // CREATE
        const created = await createNoteApi(payload);

        // ✅ optimistic local update
        setNotes((current) =>
          applyChange(current, {
            type: 'created',
            note: created,
            timestamp: Date.now(),
          })
        );

        // ✅ reset form after create
        setSelectedNote(null);
        setFormResetKey((k) => k + 1);
        showToast('success', 'Note created');
      }
    } catch (err) {
      console.error('[Next] Failed to save note', err);
      setErrorMessage('Failed to save note');
      showToast('error', 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };


  const handleDeleteNote = async (note: Note) => {
    if (!note.id) return;
    if (!window.confirm('Delete this note?')) return;

    try {
      setSaving(true);
      setErrorMessage(null);
      await deleteNoteApi(note.id);

      // ✅ optimistic local removal
      setNotes((current) =>
        applyChange(current, {
          type: 'deleted',
          note: { id: note.id },
          timestamp: Date.now(),
        })
      );

      if (selectedNote?.id === note.id) setSelectedNote(null);
      if (viewNote?.id === note.id) setViewNote(null);
      showToast('success', 'Note deleted');
    } catch (err) {
      console.error('[Next] Failed to delete note', err);
      setErrorMessage('Failed to delete note');
      showToast('error', 'Failed to delete note');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelForm = () => {
    setSelectedNote(null);
  };

  const handleEditFromGrid = (note: Note) => {
    setSelectedNote(note);
  };

  const handleViewFromGrid = (note: Note) => {
    setViewNote(note);
  };

  // ---------- render ----------
  return (
    <div className="app-background">
      {/* Toast */}
      {toast && (
        <div className={`toast-container ${toast.type}`}>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}

      <div className="app-container">
        <header className="app-header">
          <h1>NoteX</h1>
        </header>

        <section className="app-content">
          {/* Left: form */}
          <div className="left-pane">
            <NoteForm
              key={formResetKey}
              note={selectedNote}
              loading={saving}
              onSave={handleSaveNote}
              onCancel={handleCancelForm}
              onDelete={handleDeleteNote}
            />

          </div>

          {/* Right: grid */}
          <div className="right-pane">
            {errorMessage && <div className="error-box">{errorMessage}</div>}

            <div className="grid-scroll-wrapper">
              <NotesGrid
                notes={notes}
                loading={loading}
                onEdit={handleEditFromGrid}
                onDelete={handleDeleteNote}
                onView={handleViewFromGrid}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Simple view dialog */}
      {viewNote && (
    <div
      className="view-dialog-backdrop"
      onClick={() => setViewNote(null)}
      >
        <div
          className="view-dialog"
          onClick={(e) => e.stopPropagation()}
          style={{ backgroundColor: viewNote.bg_color ?? '#ffffff' }}
        >
          <h2>{viewNote.name || '(Untitled note)'}</h2>
          <div
            className="view-dialog-content"
            dangerouslySetInnerHTML={{
              __html: viewNote.description ?? '',
            }}
          />
          <button
            className="secondary-btn"
            onClick={() => setViewNote(null)}
          >
            Close
          </button>
        </div>
      </div>
    )}
    </div>
  );
}
