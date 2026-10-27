const express = require('express');
const fs = require('fs');
const path = require('path');
const { initializeDatabase } = require('./db');

const app = express();
const port = process.env.PORT || 3000;
const viewsDirectory = path.join(__dirname, 'views');

const database = initializeDatabase();

app.use('/public', express.static(path.join(__dirname, 'public')));

function renderTemplate(name, values = {}) {
  const template = fs.readFileSync(path.join(viewsDirectory, `${name}.html`), 'utf8');
  return template.replace(/{{(\w+)}}/g, (_, key) => values[key] || '');
}

function renderPage(res, templateName, values) {
  const content = renderTemplate(templateName, values);
  const page = renderTemplate('layout', { ...values, content });
  res.type('html').send(page);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatRecordId(recordId) {
  return String(recordId).padStart(4, '0');
}

app.get('/', (req, res) => {
  renderPage(res, 'index', {
    pageTitle: 'Academic Records | Northstar University'
  });
});

app.get('/search', (req, res) => {
  const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
  const pageTitle = 'Directory Search | Northstar University';

  if (!name) {
    renderPage(res, 'search', {
      pageTitle,
      searchTerm: '',
      searchMessage: 'Enter a student name to search published academic records.',
      results: ''
    });
    return;
  }

  try {
    const students = database.prepare(`
      SELECT students.full_name, students.student_number, students.programme, students.cohort,
        academic_records.id AS record_id
      FROM students
      INNER JOIN academic_records ON academic_records.student_id = students.id
      WHERE students.full_name LIKE '%${name}%' AND students.is_listed = 1
      ORDER BY students.full_name
    `).all();

    const results = students.map((student) => `
      <li class="search-result">
        <strong>${escapeHtml(student.full_name)}</strong>
        <span>${escapeHtml(student.student_number)}</span>
        <span>${escapeHtml(student.programme)} | Cohort ${escapeHtml(student.cohort)}</span>
        <span class="record-reference">Record reference: ${formatRecordId(student.record_id)}</span>
      </li>
    `).join('');

    renderPage(res, 'search', {
      pageTitle,
      searchTerm: escapeHtml(name),
      searchMessage: students.length ? 'Published records matching your search.' : 'No published student records matched that search.',
      results
    });
  } catch {
    res.status(400);
    renderPage(res, 'search', {
      pageTitle,
      searchTerm: escapeHtml(name),
      searchMessage: 'Search is temporarily unavailable. Please revise your search and try again.',
      results: ''
    });
  }
});

app.get('/records/:recordId', (req, res) => {
  const recordId = Number(req.params.recordId);

  if (!/^\d{4}$/.test(req.params.recordId) || !Number.isSafeInteger(recordId)) {
    res.status(404);
    renderPage(res, 'record-not-found', {
      pageTitle: 'Record Not Found | Northstar University'
    });
    return;
  }

  const record = database.prepare(`
    SELECT students.full_name, students.student_number, students.programme, students.cohort,
      academic_records.id AS record_id, academic_records.course_code, academic_records.course_title, academic_records.grade,
      academic_records.feedback
    FROM academic_records
    INNER JOIN students ON students.id = academic_records.student_id
    WHERE academic_records.id = ?
  `).get(recordId);

  if (!record) {
    res.status(404);
    renderPage(res, 'record-not-found', {
      pageTitle: 'Record Not Found | Northstar University'
    });
    return;
  }

  renderPage(res, 'record', {
    pageTitle: `Academic Record | ${escapeHtml(record.full_name)} | Northstar University`,
    recordReference: formatRecordId(record.record_id),
    fullName: escapeHtml(record.full_name),
    studentNumber: escapeHtml(record.student_number),
    programme: escapeHtml(record.programme),
    cohort: escapeHtml(record.cohort),
    courseCode: escapeHtml(record.course_code),
    courseTitle: escapeHtml(record.course_title),
    grade: escapeHtml(record.grade),
    feedback: escapeHtml(record.feedback)
  });
});

app.listen(port, () => {
  console.log(`Northstar University Academic Records is listening on port ${port}`);
});