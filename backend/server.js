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

const fs = require('fs');
let dbFolder = process.env.RENDER_DISK_PATH || __dirname;
if (process.env.RENDER_DISK_PATH) {
  try {
    if (!fs.existsSync(dbFolder)) {
      fs.mkdirSync(dbFolder, { recursive: true });
    }
  } catch (err) {
    console.error('Không thể tạo thư mục RENDER_DISK_PATH, fallback về __dirname:', err.message);
    dbFolder = __dirname;
  }
}
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
      ta TEXT,
      schedule TEXT,
      room TEXT,
      capacity INTEGER
    )`);

    db.run("ALTER TABLE classes ADD COLUMN ta TEXT", (err) => {
      // Bỏ qua lỗi nếu cột đã tồn tại
    });

    db.run(`CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role INTEGER NOT NULL,
      phone TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
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

    db.run(`DROP TABLE IF EXISTS teacher_attendance`);
    db.run(`CREATE TABLE IF NOT EXISTS teacher_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER,
      teacher_name TEXT,
      role TEXT,
      date TEXT,
      status TEXT,
      FOREIGN KEY (class_id) REFERENCES classes(id),
      UNIQUE(class_id, role, date)
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
  const { name, teacher, ta, schedule, room, capacity } = req.body;
  db.run(`INSERT INTO classes (name, teacher, ta, schedule, room, capacity) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, teacher, ta, schedule, room, capacity],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.put('/api/classes/:id', (req, res) => {
  const { name, teacher, ta, schedule, room, capacity } = req.body;
  db.run(`UPDATE classes SET name = ?, teacher = ?, ta = ?, schedule = ?, room = ?, capacity = ? WHERE id = ?`,
    [name, teacher, ta, schedule, room, capacity, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// ---------------- TEACHERS ----------------
app.get('/api/teachers', (req, res) => {
  db.all('SELECT * FROM teachers ORDER BY role ASC, name ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/teachers', (req, res) => {
  const { name, role, phone } = req.body;
  db.run(`INSERT INTO teachers (name, role, phone) VALUES (?, ?, ?)`,
    [name, role, phone],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, role, phone });
    }
  );
});

app.put('/api/teachers/:id', (req, res) => {
  const { name, role, phone } = req.body;
  db.run(`UPDATE teachers SET name = ?, role = ?, phone = ? WHERE id = ?`,
    [name, role, phone, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/teachers/:id', (req, res) => {
  db.run(`DELETE FROM teachers WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
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

// ---------------- TEACHER ATTENDANCE ----------------
app.get('/api/classes/:id/teacher-attendance', (req, res) => {
  const { date } = req.query; // YYYY-MM-DD
  db.all('SELECT teacher_name, role, status FROM teacher_attendance WHERE class_id = ? AND date = ?', [req.params.id, date], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/classes/:id/teacher-attendance', (req, res) => {
  const { date, teacher_name, role, status } = req.body;
  db.run(`INSERT INTO teacher_attendance (class_id, teacher_name, role, date, status) VALUES (?, ?, ?, ?, ?) 
          ON CONFLICT(class_id, role, date) DO UPDATE SET teacher_name = excluded.teacher_name, status = excluded.status`,
    [req.params.id, teacher_name, role, date, status],
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
app.use((req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
