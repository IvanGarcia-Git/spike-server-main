const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./spikes.db');

db.serialize(() => {
  // Create note_folder table
  db.run(`
    CREATE TABLE IF NOT EXISTS note_folder (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
      folderId VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      parentId VARCHAR(255),
      userId INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating note_folder table:', err);
    } else {
      console.log('✅ Note folder table created successfully');
    }
  });

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_note_folder_userId ON note_folder(userId)`, (err) => {
    if (err) {
      console.error('Error creating userId index:', err);
    } else {
      console.log('✅ userId index created');
    }
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_note_folder_folderId ON note_folder(folderId)`, (err) => {
    if (err) {
      console.error('Error creating folderId index:', err);
    } else {
      console.log('✅ folderId index created');
    }
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_note_folder_parentId ON note_folder(parentId)`, (err) => {
    if (err) {
      console.error('Error creating parentId index:', err);
    } else {
      console.log('✅ parentId index created');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('✅ Database connection closed');
});