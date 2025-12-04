// src/lib/api.ts
import { Note } from '@/types/note';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

if (!API_BASE) {
  console.warn(
    '[API] NEXT_PUBLIC_API_BASE is not set. Requests will fail until you configure it.'
  );
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchNotes(): Promise<Note[]> {
  const res = await fetch(`${API_BASE}/notes`, { cache: 'no-store' });
  return handleResponse<Note[]>(res);
}

export async function createNoteApi(note: Note): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
  return handleResponse<Note>(res);
}

export async function updateNoteApi(id: number, note: Note): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
  return handleResponse<Note>(res);
}

export async function deleteNoteApi(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<{ message: string }>(res);
}
