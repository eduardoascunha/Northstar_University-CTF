const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDirectory = path.join(__dirname, '..', 'data');
const databasePath = path.join(dataDirectory, 'university.db');

function initializeDatabase() {
  fs.mkdirSync(dataDirectory, { recursive: true });

  const database = new Database(databasePath);
  database.pragma('foreign_keys = ON');

  database.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY,
      student_number TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      programme TEXT NOT NULL,
      cohort TEXT NOT NULL,
      is_listed INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS academic_records (
      id INTEGER PRIMARY KEY,
      student_id INTEGER NOT NULL,
      course_code TEXT NOT NULL,
      course_title TEXT NOT NULL,
      grade TEXT NOT NULL,
      feedback TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );
  `);

  const studentCount = database.prepare('SELECT COUNT(*) AS count FROM students').get().count;
  if (studentCount === 0) {
    const insertStudent = database.prepare(`
      INSERT INTO students (id, student_number, full_name, programme, cohort, is_listed)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertRecord = database.prepare(`
      INSERT INTO academic_records (id, student_id, course_code, course_title, grade, feedback)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const seedDatabase = database.transaction(() => {
      insertStudent.run(1, 'NU-2026-1042', 'Maya Okafor', 'BSc Computer Science', '2026', 1);
      insertStudent.run(2, 'NU-2026-1187', 'Elias Romero', 'BSc Data Science', '2026', 1);
      insertStudent.run(3, 'NU-2025-0921', 'Avery Chen', 'BEng Software Systems', '2025', 1);
      insertStudent.run(94, 'NU-2024-0007', 'Rowan Vale', 'BSc Cybersecurity', '2024', 0);

      insertRecord.run(18, 1, 'CS204', 'Data Structures', 'A-', 'Clear reasoning throughout. Keep developing your code review habits.');
      insertRecord.run(31, 2, 'DS218', 'Applied Statistics', 'B+', 'Strong analysis. Recheck assumptions before drawing conclusions.');
      insertRecord.run(47, 3, 'SE301', 'Secure Systems Design', 'A', 'Excellent threat modelling and clear technical communication.');
      insertRecord.run(731, 94, 'CY404', 'Incident Response Practicum', 'A+', 'Strong practical response work and a thoughtful incident timeline.');
    });

    seedDatabase();
  }

  database.prepare(`
    UPDATE academic_records
    SET feedback = ?
    WHERE id = 731 AND feedback LIKE '%HiM{%'
  `).run('Strong practical response work and a thoughtful incident timeline.');

  return database;
}

module.exports = { initializeDatabase };