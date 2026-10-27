# Northstar University Academic Records - CTF Challenge

Northstar University has a public website for student records. Someone says that one hidden student record can still be found.

Find the private note in that record and submit the flag inside it. 

Organizer solution: [docs/solution.md](docs/solution.md).

## Architecture

- Node.js and Express serve the portal on port `3000` by default.
- SQLite stores students and academic records in `data/university.db`.
- `src/db.js` initializes the schema and seed data when the database is empty.
- `src/public/` contains static assets; `src/views/` contains server-rendered HTML templates.
- The Docker image installs production dependencies and includes the seeded database.

## Docker Setup

```sh
docker build -t northstar-academic-records .
docker run --rm -p 3000:3000 northstar-academic-records
```

Open `http://localhost:3000` after the container starts.