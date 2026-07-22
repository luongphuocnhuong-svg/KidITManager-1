const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files from the React frontend app
const frontendBuildPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendBuildPath));

const dbFolder = process.env.RENDER_DISK_PATH || __dirname;
const dbPath = path.join(dbFolder, 'kidit.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Lỗi khi kết nối database:', err.message);
  } else {
    console.log('Đã kết nối với SQLite database.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      parentName TEXT,
      parentPhone TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      teacher TEXT,
      schedule TEXT,
      room TEXT,
      capacity INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS class_students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER,
      student_id INTEGER,
      enrolledAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      UNIQUE(class_id, student_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER,
      student_id INTEGER,
      date TEXT,
      status TEXT,
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      UNIQUE(class_id, student_id, date)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_code TEXT UNIQUE,
      student_id INTEGER,
      amount INTEGER,
      status TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id)
    )`);
    
    console.log('Đã khởi tạo các bảng CSDL nâng cao.');
  });
}

// ---------------- DASHBOARD STATS ----------------
app.get('/api/dashboard/stats', (req, res) => {
  const stats = {};
  db.get("SELECT COUNT(*) as count FROM students", [], (err, row) => {
    stats.totalStudents = row ? row.count : 0;
    db.get("SELECT COUNT(*) as count FROM classes", [], (err, row) => {
      stats.totalClasses = row ? row.count : 0;
      db.get("SELECT SUM(amount) as total FROM invoices WHERE status = 'paid'", [], (err, row) => {
        stats.revenue = row ? row.total || 0 : 0;
        res.json(stats);
      });
    });
  });
});

// ---------------- STUDENTS ----------------
app.get('/api/students', (req, res) => {
  db.all('SELECT * FROM students ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/students', (req, res) => {
  const { name, phone, parentName, parentPhone } = req.body;
  db.run(`INSERT INTO students (name, phone, parentName, parentPhone) VALUES (?, ?, ?, ?)`,
    [name, phone, parentName, parentPhone],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, phone, parentName, parentPhone });
    }
  );
});

app.put('/api/students/:id', (req, res) => {
  const { name, phone, parentName, parentPhone } = req.body;
  db.run(`UPDATE students SET name = ?, phone = ?, parentName = ?, parentPhone = ? WHERE id = ?`,
    [name, phone, parentName, parentPhone, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// ---------------- CLASSES ----------------
app.get('/api/classes', (req, res) => {
  const sql = `
    SELECT c.*, COUNT(cs.student_id) as enrolledCount 
    FROM classes c
    LEFT JOIN class_students cs ON c.id = cs.class_id
    GROUP BY c.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/classes/:id', (req, res) => {
  db.get('SELECT * FROM classes WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

app.post('/api/classes', (req, res) => {
  const { name, teacher, schedule, room, capacity } = req.body;
  db.run(`INSERT INTO classes (name, teacher, schedule, room, capacity) VALUES (?, ?, ?, ?, ?)`,
    [name, teacher, schedule, room, capacity],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.put('/api/classes/:id', (req, res) => {
  const { name, teacher, schedule, room, capacity } = req.body;
  db.run(`UPDATE classes SET name = ?, teacher = ?, schedule = ?, room = ?, capacity = ? WHERE id = ?`,
    [name, teacher, schedule, room, capacity, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// ---------------- CLASS ENROLLMENTS ----------------
app.get('/api/classes/:id/students', (req, res) => {
  const sql = `SELECT s.* FROM students s 
               JOIN class_students cs ON s.id = cs.student_id 
               WHERE cs.class_id = ?`;
  db.all(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/classes/:id/students', (req, res) => {
  const { student_id } = req.body;
  db.run(`INSERT INTO class_students (class_id, student_id) VALUES (?, ?)`,
    [req.params.id, student_id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// ---------------- ATTENDANCE ----------------
app.get('/api/classes/:id/attendance', (req, res) => {
  const { date } = req.query; // YYYY-MM-DD
  db.all('SELECT student_id, status FROM attendance WHERE class_id = ? AND date = ?', [req.params.id, date], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/classes/:id/attendance', (req, res) => {
  const { date, student_id, status } = req.body;
  db.run(`INSERT INTO attendance (class_id, student_id, date, status) VALUES (?, ?, ?, ?) 
          ON CONFLICT(class_id, student_id, date) DO UPDATE SET status = excluded.status`,
    [req.params.id, student_id, date, status],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// ---------------- INVOICES ----------------
app.get('/api/invoices', (req, res) => {
  const sql = `SELECT i.*, s.name as student_name FROM invoices i 
               JOIN students s ON i.student_id = s.id ORDER BY i.createdAt DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/invoices', (req, res) => {
  const { student_id, amount, status } = req.body;
  const invoice_code = 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  db.run(`INSERT INTO invoices (invoice_code, student_id, amount, status) VALUES (?, ?, ?, ?)`,
    [invoice_code, student_id, amount, status],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Anything that doesn't match the API routes should be served the index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
