// src/components/NoteForm.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Note } from '@/types/note';

// react-quill must be loaded client-side only
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

type Props = {
  note: Note | null;        // null = create mode
  loading: boolean;         // disable buttons while saving
  onSave: (draft: Note) => void;
  onCancel: () => void;
  onDelete: (note: Note) => void;
};

const colorOptions = [
  { value: '#ffffff', label: 'White' },
  { value: '#f5f5f5', label: 'Light gray' },
  { value: '#d4e9f8ff', label: 'Soft blue' },
  { value: '#cff3f8ff', label: 'Light aqua'},
  { value: '#d9f3dbff', label: 'Soft green' },
  { value: '#faefd2ff', label: 'Cream' },
  { value: '#fddce7ff', label: 'Soft pink' },
  
  
];

export const NoteForm: React.FC<Props> = ({
  note,
  loading,
  onSave,
  onCancel,
  onDelete,
}) => {
  const [draft, setDraft] = useState<Note>({
    name: '',
    description: '',
    bg_color: '#ffffff',
  });

  const [titleError, setTitleError] = useState<string | null>(null);

  const isEditMode = !!note?.id;

  // sync incoming note into draft
  useEffect(() => {
    if (note) {
      setDraft({
        id: note.id,
        name: note.name,
        description: note.description ?? '',
        bg_color: note.bg_color ?? '#ffffff',
        created_at: note.created_at,
        updated_at: note.updated_at
      });
    } else {
      setDraft({
        name: '',
        description: '',
        bg_color: '#ffffff',
      });
    }
    setTitleError(null);
  }, [note]);

  const quillModules = useMemo(
    () => ({
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ header: [1, 2, 3, false] }],
        ['link'],
        ['clean'],
      ],
    }),
    []
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft((prev) => ({ ...prev, name: e.target.value }));
    if (titleError) {
      setTitleError(null);
    }
  };


  const handleDescriptionChange = (value: string) => {
    setDraft((prev) => ({ ...prev, description: value }));
  };

  const handleColorSelect = (value: string) => {
    setDraft((prev) => ({ ...prev, bg_color: value }));
  };

  const handleSubmit = () => {
    const trimmed = (draft.name ?? '').trim();
    if (!trimmed) {
      setTitleError('Title is required.');
      return;
    }

    const finalDraft: Note = {
      ...draft,
      name: trimmed,
    };

    onSave(finalDraft);
  };

  const handleDelete = () => {
    if (!note?.id) return;
    if (window.confirm('Delete this note?')) {
      onDelete(note);
    }
  };

  return (
    <div
      className="note-form-wrapper"
      style={{ backgroundColor: draft.bg_color ?? '#ffffff' }}
    >
      <div className="note-form-header">
        <h2>{isEditMode ? 'Edit note' : 'New note'}</h2>
      </div>

      <div className="note-form-body">
        {/* Title */}
        <div className="form-row">
          <label htmlFor="title">Title*</label>
          <div className={`title-wrapper ${titleError ? 'has-error' : ''}`}>
            <input
              id="title"
              type="text"
              name="title"
              value={draft.name}
              onChange={handleTitleChange}
              placeholder="Note title"
              disabled={loading}
              aria-invalid={!!titleError}
              aria-describedby={titleError ? 'title-error' : undefined}
            />
          </div>
          {titleError && (
            <div id="title-error" className="title-error">
              {titleError}
            </div>
          )}
        </div>


        {/* Color palette */}
        <div className="form-row">
          <label>Background color</label>
          <div className="palette-strip">
            <div className="palette-bg" />
            <div className="palette-colors">
              {colorOptions.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`color-pill ${
                    draft.bg_color === c.value ? 'active' : ''
                  }`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => handleColorSelect(c.value)}
                  disabled={loading}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Description (Quill) */}
        <div className="form-row">
          <label>Description</label>
          <div className="editor-wrapper">
            <ReactQuill
              theme="snow"
              value={draft.description ?? ''}
              onChange={handleDescriptionChange}
              modules={quillModules}
              readOnly={loading}
              className="quill-editor"
            />
          </div>
        </div>
      </div>

      <div className="note-form-footer">
        <div className="footer-left">
        </div>
        <div className="footer-right">
          <button
            type="button"
            className="primary-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {isEditMode ? 'Save changes' : 'Create note'}
          </button>
          {isEditMode && (
            <button
              type="button"
              className="danger-btn"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
