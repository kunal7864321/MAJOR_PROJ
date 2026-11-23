# PocketBridge DBMS Viva - Complete Recording Guide

This guide contains the exact preparation commands, what to display, a full spoken script for all five questions, and a post-recording checklist. Target length: about 4 minutes 45 seconds at a steady pace. Bracketed directions are stage cues; do not read them aloud.

## 0. Install and start PostgreSQL on macOS (one time)

The reported `command not found` errors mean `psql` and `createdb` are not installed or are not on PATH. Homebrew is available on this Mac. Install PostgreSQL 16 and add its command directory to zsh PATH. Run these in Terminal:

```bash
brew install postgresql@16
echo 'export PATH="$(brew --prefix postgresql@16)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
brew services start postgresql@16
psql --version
createdb --version
pg_isready
```

Do not repeat the `echo` command if that PATH line is already in `~/.zshrc`. The version commands should print versions, and `pg_isready` should report that the server accepts connections. Homebrew's `postgresql@16` formula is keg-only, so the PATH entry makes its `psql` and `createdb` commands available in zsh.

Set a password for the local macOS PostgreSQL role so the Express server can connect over localhost. `whoami` prints the role name created by a fresh Homebrew cluster. Run:

```bash
whoami
psql -d postgres
```

At the `postgres=#` prompt, set the password for the current role and quit:

```sql
\password
\q
```

Use a simple URL-safe password for this local demo. In the next section, copy the example `.env` only if you do not already have `server/.env`, then set `DATABASE_URL` to `postgresql://YOUR_MAC_USERNAME:YOUR_PASSWORD@localhost:5432/pocketbridge`, replacing both placeholders with the output of `whoami` and the password you just set.

## 1. Prepare the database before recording

Open Terminal at the repository root: `/Users/kunalkumarjha/MAJOR_PROJ`.

**Important:** `db/schema.sql` includes `DROP TABLE` statements and the seed inserts are not designed to run repeatedly. Only use the following setup on a new/disposable `pocketbridge` database. If your database is already populated and working, skip the create/schema/seed commands and continue to the verification commands.

### One-time database setup (fresh database only)

```bash
createdb pocketbridge
psql -d pocketbridge -f db/schema.sql
psql -d pocketbridge -f db/seeds/seed.sql
```

Expected seed data: 2 users, 3 devices, 5 notes, 8 tasks, and 5 file metadata records.

### One-time server preparation

From a terminal at the repository root, install server dependencies if needed and enter the server folder:

```bash
cd server
npm install
```

If `server/.env` does not exist yet, create it from the example (while in the `server` folder):

```bash
cp ../.env.example .env
```

Open the environment file to set the database connection:

```bash
nano .env
```

The example uses `postgresql://postgres:postgres@localhost:5432/pocketbridge`, which may not match a fresh Homebrew install. Edit `server/.env` and set `DATABASE_URL` to your local macOS PostgreSQL role and password as described above. Preserve any other working settings.

### Start the API before recording

In Terminal 1, from the repository root:

```bash
cd server
npm start
```

Leave this terminal visible in a tab. Expected message: `PocketBridge Server running on http://0.0.0.0:4000`.

### Prepare the database console

Open Terminal 2 at the repository root and connect:

```bash
psql -d pocketbridge
```

Enter these commands at the `pocketbridge=#` prompt. `\` commands are psql commands; SQL statements end with a semicolon.

```sql
\pset pager off
\timing on
\conninfo
\dt
```

Show sample rows:

```sql
SELECT full_name, email FROM users ORDER BY full_name;
SELECT device_name, platform, is_active FROM devices ORDER BY device_name;
SELECT title, status, priority FROM tasks ORDER BY title LIMIT 5;
SELECT original_name, size_bytes, status FROM files ORDER BY original_name;
```

Show a relationship query across users, devices, and tasks:

```sql
SELECT u.full_name,
       t.status,
       COUNT(t.task_id) AS total_tasks,
       COUNT(CASE WHEN t.priority = 'high' THEN 1 END) AS high_priority_tasks
FROM users u
JOIN devices d ON d.user_id = u.user_id
JOIN tasks t ON t.device_id = d.device_id
GROUP BY u.user_id, u.full_name, t.status
ORDER BY u.full_name, t.status;
```

Show table definitions, constraints, and indexes:

```sql
\d+ users
\d+ devices
\d+ tasks
\d+ files
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

Optional extra-credit constraint demonstration. This attempts an invalid task priority and should be rejected by `chk_tasks_priority`. It does not insert a row:

```sql
INSERT INTO tasks (device_id, title, priority, status)
VALUES ('aaaa1111-aaaa-1111-aaaa-111111111111', 'Invalid priority demo', 'urgent', 'todo');
```

The device ID above is present in the provided seed. PostgreSQL should reject the insert because `urgent` is outside the task priority check constraint, and no row should be added.

Exit psql with:

```sql
\q
```

### Open these project files in editor tabs

1. `db/schema.sql` - tables, foreign keys, checks, and indexes.
2. `db/queries/reports.sql` - reporting query with joins.
3. `db/docs/normalization-3nf.md` - functional dependencies and 3NF reasoning.
4. `server/src/modules/auth/auth.routes.js` - registration transaction.
5. `server/src/modules/pairing/pairing.routes.js` - pairing transaction and row lock.
6. `db/docs/diagrams/entity-relationship-diagram.png` or `db/docs/diagrams/pocketbridge-dbms-diagrams.pdf` - visual schema and transaction flow.
7. `server/src/db.js` - the actual PostgreSQL connection pool used by the API.

Before recording, enlarge the terminal font, turn off notifications, and arrange the screen so the code and query results are legible. Start recording only after the API is running and the psql data/query output is ready. Keep the screen visible for the whole video.

## 2. Full spoken script and screen cues

### 0:00-0:50 | Introduction and Q1: database choice

[Start recording. Briefly show the running API terminal, then the ER diagram.]

“Hello, I’m [your name]. PocketBridge transfers files, notes, and tasks between a phone and laptop on the same Wi-Fi network. Our team chose PostgreSQL, a relational database. I led the Express backend and APIs for authentication, pairing, and file transfer. The API uses the Node `pg` pool and parameterized SQL; `db/schema.sql` creates the database structure. The Prisma file is a model reference, not the runtime access layer.

Our structured data links users, devices, notes, tasks, files, and pairing codes. Common reads list user notes or tasks across devices and show file history. Writes create records and consume pairing codes. The seed has 2 users, 3 devices, 5 notes, 8 tasks, and 5 file metadata rows. We expect a few thousand records for a small deployment; that is an estimate, not a measurement. Strong consistency matters for ownership and one-time pairing, so we rely on constraints and transactions. We considered a document database, but relational joins suit these relationships better.”

### 0:50-1:35 | Q2: schema and relationships

[Show `db/schema.sql`, then the ER diagram. Point to the tables as you name them.]

“Our entities are users, devices, pairing codes, notes, tasks, files, and activity logs. Each has a UUID primary key. One user owns many devices. Each device can have many notes, tasks, and activity records. A file has one source device and an optional target device. A pairing code records its creating device and, after use, its consuming device.

There is no direct many-to-many relationship in our schema. Each device belongs to one user, so a foreign key on devices handles user ownership; no junction table is needed. File bytes stay on the server filesystem. PostgreSQL stores file metadata and the checksum.”

### 1:35-2:15 | Q3: normalization

[Show `db/docs/normalization-3nf.md`, then point to the tasks table.]

“The highest normal form we document is Third Normal Form; we have not separately proved BCNF. In tasks, task_id determines device_id, title, description, priority, status, due date, and timestamps. A single-column key avoids partial dependencies. We avoid a transitive dependency by omitting user_id from tasks; we resolve the owner through devices. We do not deliberately duplicate relational fields. File bytes are outside PostgreSQL; metadata remains in files.”

### 2:15-3:20 | Q4: correctness, transactions, concurrency

[Show `db/schema.sql` constraints and `\d+ tasks` output. Optionally run the invalid-priority insert prepared above.]

“The database enforces NOT NULL, primary and unique keys, foreign keys, and checks for platform, task priority and status, file direction and status, and file size. The API also validates required inputs and normalizes email. Here the database rejects an invalid task priority.”

[Show the registration transaction in `server/src/modules/auth/auth.routes.js`.]

“Registration inserts a user and their first device in one transaction. If either insert fails, the code rolls back both changes.”

[Show `server/src/modules/pairing/pairing.routes.js`; point to BEGIN, SELECT FOR UPDATE, insert, update, COMMIT, and ROLLBACK. If asked about file upload, note that disk writes and DB inserts do not share one transaction.]

“Pairing is the concurrency example. In one transaction, the API locks the code row with SELECT FOR UPDATE, validates it, inserts a device, marks the code consumed, and commits. On error it rolls back. PostgreSQL uses default READ COMMITTED isolation. A second request waits for the row lock, then sees the code is used, so only one request succeeds.”

### 3:20-4:10 | Q5: indexes and efficiency

[Show the index definitions in `db/schema.sql`, then the join in `db/queries/reports.sql`.]

“Indexes cover devices by user and active state, pairing-code expiry, notes by device and update time, tasks by device, status, and due date, files by source device and creation time, and activity logs by device and creation time. Audit found the email UNIQUE constraint and explicit email index duplicate each other, so I would remove the extra index. The task-list route sorts by custom priority and creation time; its current index does not directly match that sort, so I would check EXPLAIN ANALYZE before changing it. We do not index large note bodies or standalone booleans without evidence, and we do not use sharding or partitioning.”

### 4:10-4:55 | Q5: growth and closing

[Keep the schema or query output visible.]

“At 100 times the users, connection pressure and user-wide list queries would likely need attention first. I’d measure query plans and connection use, add pagination, tune indexes, and configure pooling. If reads dominate, I’d consider a replica; for very large logs, partitioning. I’d shard only if one tuned database could not meet measured needs. Thank you.”

### Stop recording

[Pause briefly, then stop the recording.]

After stopping, check that your face/voice and screen were recorded, the SQL output is readable, and the video is under 10 minutes. Do not say a concurrency experiment was run unless you actually ran it; the locking code itself is safe to explain from the implementation.
