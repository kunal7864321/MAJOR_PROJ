# PocketBridge

PocketBridge is a local-first system designed to transfer files, notes, and tasks directly between a smartphone and a laptop connected to the same Wi-Fi network, without needing cloud services like Google Drive or messaging apps.

## Team Members and Roles

We worked collaboratively across all three areas (DE, ASD, and ISD) so everyone has hands-on understanding of the entire system:

- **Mahin Patel**: Lead on Database Engineering (schema design, 3NF normalization, SQL reporting) + contributed to backend DB pool setup and desktop testing.
- **Kunal Kumar Jha**: Lead on Backend & APIs (Express API architecture, JWT authentication, file upload/stream) + contributed to SQL queries and mobile API integration.
- **Shekhar Jadhav**: Lead on Client Applications (React Native mobile app, Electron desktop companion, CLI) + contributed to API testing and database seed generation.

## Project Structure

```
pocketbridge/
├── apps/
│   ├── mobile/       # React Native / Expo mobile application
│   ├── desktop/      # Electron desktop companion application
│   └── cli/          # Node.js command-line interface
├── server/           # Express REST API using PostgreSQL and node-postgres
│   ├── src/          # Controllers, routes, and middleware
│   └── storage/      # Local uploaded files (gitignored)
└── db/               # PostgreSQL schema, seeds, queries, and reports
```

## How to Run

### 1. Database Setup
Make sure PostgreSQL is running locally on port 5432:
```bash
createdb pocketbridge
psql -d pocketbridge -f db/schema.sql
psql -d pocketbridge -f db/seeds/seed.sql
```
The schema script drops and recreates its tables, so run it only against a new or disposable database.

### 2. Backend Server
```bash
cd server
npm install
cp -n ../.env.example .env
# Set DATABASE_URL in .env to match your local PostgreSQL role and password.
npm start
```
The server will run on `http://0.0.0.0:4000`.

### 3. Mobile Client
```bash
cd apps/mobile
npm install
npm start
```
On an Android emulator, the default API address is `http://10.0.2.2:4000/api`. On a physical phone, use your computer's LAN IP and port `4000` in the server URL field.

### 4. Desktop Client
```bash
cd apps/desktop
npm install
npm run build
npm start
```

### 5. CLI Tool
```bash
cd apps/cli
node pocketbridge.js status
node pocketbridge.js tasks list
```

## Documentation
- [Data Dictionary](db/docs/data-dictionary.md)
- [3NF Normalization Report](db/docs/normalization-3nf.md)
- [ACID and Concurrency Test](db/docs/acid-concurrency.md)
- [API Contract](docs/api-contract.md)
- [Individual Contribution Summaries](docs/contributions/)
