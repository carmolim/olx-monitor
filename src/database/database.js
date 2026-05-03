const path = require('path');
const config = require('../config');
const sqlite = require("sqlite3").verbose();

// Database initialization with performance tuning
const db = new sqlite.Database(
  path.join(__dirname, '../', config.dbFile)
);

// Performance: Enable WAL mode for better concurrency
db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA synchronous = NORMAL;");

const getTableColumns = (table) => {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table});`, function (error, rows) {
      if (error) {
        reject(error);
        return;
      }
      resolve(rows.map((r) => r.name));
    });
  });
};

const addColumnIfMissing = async (table, column, definition) => {
  const cols = await getTableColumns(table);
  if (cols.includes(column)) return;

  await new Promise((resolve, reject) => {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`, function (error) {
      if (error) {
        reject(error);
        return;
      }
      resolve(true);
    });
  });
};

const createTables = async () => {
  const queries = [
    // Ads table
    `CREATE TABLE IF NOT EXISTS "ads" (
        "id"            INTEGER NOT NULL UNIQUE,
        "searchTerm"    TEXT NOT NULL,
        "title"         TEXT NOT NULL,
        "price"         INTEGER NOT NULL,
        "url"           TEXT NOT NULL,
        "created"       TEXT NOT NULL,
        "lastUpdate"    TEXT NOT NULL
    );`,
    
    // Logs table
    `CREATE TABLE IF NOT EXISTS "logs" (
        "id"            INTEGER NOT NULL UNIQUE,
        "url"           TEXT NOT NULL,  
        "adsFound"      INTEGER NOT NULL, 
        "averagePrice"  NUMERIC NOT NULL,
        "minPrice"      NUMERIC NOT NULL,
        "maxPrice"      NUMERIC NOT NULL, 
        "created"       TEXT NOT NULL,
        PRIMARY KEY("id" AUTOINCREMENT)
    );`,

    // Subscriptions table (Multi-chat and Topic support)
    `CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id"            INTEGER NOT NULL UNIQUE,
        "chatId"        TEXT NOT NULL,
        "threadId"      TEXT,
        "username"      TEXT,
        "url"           TEXT NOT NULL,
        "searchName"    TEXT NOT NULL,
        "created"       TEXT NOT NULL,
        PRIMARY KEY("id" AUTOINCREMENT),
        UNIQUE("chatId", "url")
    );`,

    // PERFORMANCE INDEXES
    `CREATE INDEX IF NOT EXISTS idx_ads_id ON ads(id);`,
    `CREATE INDEX IF NOT EXISTS idx_ads_searchTerm ON ads(searchTerm);`,
    `CREATE INDEX IF NOT EXISTS idx_logs_url ON logs(url);`,
    `CREATE INDEX IF NOT EXISTS idx_logs_created ON logs(created);`,
    `CREATE INDEX IF NOT EXISTS idx_subs_chatId ON subscriptions(chatId);`,
    `CREATE INDEX IF NOT EXISTS idx_subs_url ON subscriptions(url);`
  ];

  for (const query of queries) {
    await new Promise((resolve, reject) => {
      db.run(query, (err) => err ? reject(err) : resolve());
    });
  }

  // Schema evolution
  const logCols = [
    ["medianPrice", "NUMERIC"], ["modePrice", "NUMERIC"], 
    ["modalIntervalStart", "NUMERIC"], ["modalIntervalEnd", "NUMERIC"],
    ["modalIntervalWidth", "NUMERIC"], ["modalIntervalCount", "INTEGER"],
    ["modalTop3BinsJson", "TEXT"], ["goodPrice", "NUMERIC"],
    ["goodPriceType", "TEXT"], ["stdDevPrice", "NUMERIC"],
    ["cvPrice", "NUMERIC"], ["sampleSize", "INTEGER"]
  ];

  for (const [col, def] of logCols) {
    await addColumnIfMissing("logs", col, def);
  }

  // Schema evolution for subscriptions
  await addColumnIfMissing("subscriptions", "threadId", "TEXT");
  await addColumnIfMissing("subscriptions", "username", "TEXT");

  return true;
};

module.exports = {
  db,
  createTables
};
