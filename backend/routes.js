const express = require('express');
const router = express.Router();
const pool = require('./db');

// Middleware to parse JSON bodies
router.use(express.json());

// Keep track of all connected SSE clients
const sseClients = new Set();

function broadcastNoteChange(eventData) {
  const data = `event: noteChange\ndata: ${JSON.stringify(eventData)}\n\n`;
  for (const res of sseClients) {
    res.write(data);
  }
}

// SSE endpoint for live note updates
router.get('/notes/events', (req, res) => {
  // Set required headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // If you’re behind a proxy/load balancer, this can help:
  // res.flushHeaders && res.flushHeaders();

  // Send an initial "connected" comment to keep things happy
  res.write(': connected\n\n');

  // Add this client connection to our set
  sseClients.add(res);

  // Optional: keep-alive ping every 25s
  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 25000);

  // When the client disconnects, clean up
  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});


// GET all notes
router.get('/notes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notes ORDER BY updated_at DESC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error getting notes', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET a single note
router.get('/notes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM notes WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error getting note', err);
    res.status(500).json({ error: 'Failed to get note' });
  }
});


// POST a new note
router.post('/notes', async (req, res) => {
  const { name, description, bg_color } = req.body;

  console.log(req.body)
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO notes (name, description, bg_color)
       VALUES ($1, $2, COALESCE($3, '#ffffff'))
       RETURNING id, name, description, bg_color, created_at, updated_at`,
      [name.trim(), description || '', bg_color || '#ffffff']
    );

    const newNote = result.rows[0];

    broadcastNoteChange({
      type: 'created',
      note: newNote,
      timestamp: Date.now()
    });

    res.status(201).json(newNote);
  } catch (err) {
    console.error('Error creating note', err);
     res.status(500).json({
      error: 'Failed to create note',
      details: err.message // <-- adds DB error message
    });
  }
});


// Update an existing note
router.put('/notes/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, bg_color } = req.body;

  try {
    const result = await pool.query(
      `UPDATE notes
       SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         bg_color = COALESCE($3, bg_color),
         updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, description, bg_color, created_at, updated_at`,
      [
        name !== undefined ? name.trim() : null,
        description,
        bg_color,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const updatedNote = result.rows[0];

    // 🔴 NEW: broadcast update
    broadcastNoteChange({
      type: 'updated',
      note: updatedNote,
      timestamp: Date.now()
    });

    res.status(200).json(updatedNote);
  } catch (err) {
    console.error('Error updating note', err);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE a note
router.delete('/notes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM notes WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // 🔴 NEW: broadcast deletion
    broadcastNoteChange({
      type: 'deleted',
      note: { id },
      timestamp: Date.now()
    });

    res.status(200).json({ message: 'Note deleted' });

  } catch (err) {
    console.error('Error deleting note', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});


module.exports = router;