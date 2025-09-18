const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Open database
const db = new sqlite3.Database(path.join(__dirname, 'spikes.db'));

// Check if task_state table has data
db.get("SELECT COUNT(*) as count FROM task_state", (err, row) => {
  if (err) {
    console.error("Error checking task_state table:", err);
    db.close();
    return;
  }

  if (row.count === 0) {
    console.log("Inserting task states...");

    const taskStates = [
      ['Por Hacer', '#57a9de'],
      ['Haciendo', '#f9d02d'],
      ['Hecho', '#7ede57'],
      ['Falta Info', '#ee4d3a']
    ];

    const stmt = db.prepare("INSERT INTO task_state (name, colorHex) VALUES (?, ?)");

    taskStates.forEach(([name, colorHex]) => {
      stmt.run(name, colorHex, (err) => {
        if (err) {
          console.error(`Error inserting ${name}:`, err);
        } else {
          console.log(`Inserted: ${name}`);
        }
      });
    });

    stmt.finalize(() => {
      console.log("Task states inserted successfully!");
      db.close();
    });
  } else {
    console.log(`Task states already exist (${row.count} records found)`);
    db.close();
  }
});