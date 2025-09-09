const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./spikes.db');

db.serialize(() => {
  // Create note table
  db.run(`
    CREATE TABLE IF NOT EXISTS note (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      isFavorite INTEGER DEFAULT 0,
      folderId VARCHAR(255),
      userId INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating note table:', err);
    } else {
      console.log('✅ Note table created successfully');
    }
  });

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_note_userId ON note(userId)`, (err) => {
    if (err) {
      console.error('Error creating userId index:', err);
    } else {
      console.log('✅ userId index created');
    }
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_note_folderId ON note(folderId)`, (err) => {
    if (err) {
      console.error('Error creating folderId index:', err);
    } else {
      console.log('✅ folderId index created');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('✅ Database connection closed');
});