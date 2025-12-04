// src/components/NotesGrid.tsx
'use client';

import React from 'react';
import { Note } from '@/types/note';

type Props = {
  notes: Note[];
  loading: boolean;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  onView: (note: Note) => void;
};

function computeShadow(color?: string): string {
  if (!color) return '0px 2px 6px rgba(0,0,0,0.15)';

  const hex = color.startsWith('#') ? color.substring(1) : color;
  if (hex.length !== 6) return '0px 2px 6px rgba(0,0,0,0.15)';

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  if (brightness < 140) {
    return '0px 4px 14px rgba(255,255,255,0.35)';
  }

  return '0px 4px 14px rgba(0,0,0,0.23)';
}

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function stripHtml(html?: string): string {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').trim();
}

function shouldShowReadMore(note: Note): boolean {
  const text = stripHtml(note.description);
  return text.length > 160;
}

export const NotesGrid: React.FC<Props> = ({
  notes,
  loading,
  onEdit,
  onDelete,
  onView,
}) => {
  return (
    <section className="notes-grid-section">
      <h2>Your notes</h2>

      {loading && (
        <div className="grid-loading">
          <div className="spinner" />
          <p>Loading notes...</p>
        </div>
      )}

      {!loading && notes.length > 0 && (
        <div className="notes-grid">
          {notes.map((note) => (
            <div
              key={note.id ?? note.name}
              className="note-card"
              style={{
                backgroundColor: note.bg_color ?? '#ffffff',
                boxShadow: computeShadow(note.bg_color),
              }}
              onClick={() => onView(note)}
            >
              <div className="note-card-header">
                <h3 className="note-card-title">
                  {note.name || '(Untitled note)'}
                </h3>
              </div>

              <div className="note-card-body">
                <div
                  className="note-card-content"
                  dangerouslySetInnerHTML={{
                    __html: note.description ?? '',
                  }}
                />

                {shouldShowReadMore(note) && (
                  <div className="note-card-readmore">
                    Read more…
                  </div>
                )}
              </div>

              <p className="note-card-date">
                {formatDate(note.updated_at ?? note.created_at)}
              </p>

              <div className="note-card-footer">
                <button
                  className="icon-btn"
                  title="Edit note"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(note);
                  }}
                >
                  ✏️
                </button>
                <button
                  className="icon-btn"
                  title="Delete note"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(note);
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && notes.length === 0 && (
        <div className="empty-state">
          No notes yet. Click &quot;New note&quot; to create one.
        </div>
      )}
    </section>
  );
};
