import Database from 'better-sqlite3';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { ScheduleEntry, PresetLocation } from '../../shared/src/types/diary';
import type { UserRole } from '../../shared/src/types/user';

const dbPath = join(__dirname, '..', 'data', 'diaryflow.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student','family','teacher')),
    teacher_id TEXT REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS curricula (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES users(id),
    entries_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES users(id),
    date TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT,
    timestamp TEXT,
    url TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_photos_teacher_date ON photos(teacher_id, date);

  CREATE TABLE IF NOT EXISTS diaries (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES users(id),
    date TEXT NOT NULL,
    diary_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_diaries_teacher_date ON diaries(teacher_id, date);

  CREATE TABLE IF NOT EXISTS preset_locations (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    radius_m REAL NOT NULL DEFAULT 50,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_preset_locations_teacher ON preset_locations(teacher_id);
`);

// --- Users ---

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  teacher_id: string | null;
  created_at: string;
  updated_at: string;
}

export function getUserByEmail(email: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
}

export function getUser(id: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export function createUser(
  email: string,
  passwordHash: string,
  name: string,
  role: UserRole,
  teacherId?: string,
): UserRow {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO users (id, email, password_hash, name, role, teacher_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(id, email, passwordHash, name, role, teacherId || null, now, now);
  return getUser(id)!;
}

// --- Curricula ---

export function getCurriculum(teacherId: string): ScheduleEntry[] | null {
  const row = db.prepare('SELECT entries_json FROM curricula WHERE teacher_id = ?').get(teacherId) as { entries_json: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.entries_json);
}

export function saveCurriculum(teacherId: string, entries: ScheduleEntry[]): void {
  const existing = db.prepare('SELECT id FROM curricula WHERE teacher_id = ?').get(teacherId) as { id: string } | undefined;
  const json = JSON.stringify(entries);
  const now = new Date().toISOString();
  if (existing) {
    db.prepare('UPDATE curricula SET entries_json = ?, updated_at = ? WHERE teacher_id = ?').run(json, now, teacherId);
  } else {
    db.prepare('INSERT INTO curricula (id, teacher_id, entries_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(randomUUID(), teacherId, json, now, now);
  }
}

// --- Photos ---

export function savePhoto(
  teacherId: string,
  date: string,
  filename: string,
  originalName: string,
  timestamp: string | null,
  url: string,
): void {
  db.prepare(
    'INSERT INTO photos (id, teacher_id, date, filename, original_name, timestamp, url) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(randomUUID(), teacherId, date, filename, originalName, timestamp, url);
}

export function getPhotos(teacherId: string, date: string): { url: string; timestamp: string; filename: string }[] {
  return db.prepare('SELECT url, timestamp, filename FROM photos WHERE teacher_id = ? AND date = ?').all(teacherId, date) as any[];
}

// --- Diaries ---

export function saveDiary(teacherId: string, date: string, diaryJson: string): void {
  const existing = db.prepare('SELECT id FROM diaries WHERE teacher_id = ? AND date = ?').get(teacherId, date) as { id: string } | undefined;
  const now = new Date().toISOString();
  if (existing) {
    db.prepare('UPDATE diaries SET diary_json = ?, created_at = ? WHERE id = ?').run(diaryJson, now, existing.id);
  } else {
    db.prepare('INSERT INTO diaries (id, teacher_id, date, diary_json, created_at) VALUES (?, ?, ?, ?, ?)').run(randomUUID(), teacherId, date, diaryJson, now);
  }
}

export function getDiary(teacherId: string, date: string): string | null {
  const row = db.prepare('SELECT diary_json FROM diaries WHERE teacher_id = ? AND date = ?').get(teacherId, date) as { diary_json: string } | undefined;
  return row?.diary_json || null;
}

export function listDiaries(teacherId: string): { id: string; date: string; createdAt: string }[] {
  return db.prepare('SELECT id, date, created_at as createdAt FROM diaries WHERE teacher_id = ? ORDER BY date DESC').all(teacherId) as any[];
}

// --- Preset Locations ---

interface PresetLocationRow {
  id: string;
  teacher_id: string;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  created_at: string;
  updated_at: string;
}

function rowToPresetLocation(row: PresetLocationRow): PresetLocation {
  return {
    id: row.id,
    name: row.name,
    lat: row.lat,
    lng: row.lng,
    radiusM: row.radius_m,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getPresetLocations(teacherId: string): PresetLocation[] {
  const rows = db.prepare('SELECT * FROM preset_locations WHERE teacher_id = ? ORDER BY name').all(teacherId) as PresetLocationRow[];
  return rows.map(rowToPresetLocation);
}

export function createPresetLocation(
  teacherId: string,
  name: string,
  lat: number,
  lng: number,
  radiusM: number,
): PresetLocation {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO preset_locations (id, teacher_id, name, lat, lng, radius_m, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(id, teacherId, name, lat, lng, radiusM, now, now);
  const row = db.prepare('SELECT * FROM preset_locations WHERE id = ?').get(id) as PresetLocationRow;
  return rowToPresetLocation(row);
}

export function updatePresetLocation(
  id: string,
  name: string,
  lat: number,
  lng: number,
  radiusM: number,
): PresetLocation {
  const now = new Date().toISOString();
  db.prepare(
    'UPDATE preset_locations SET name = ?, lat = ?, lng = ?, radius_m = ?, updated_at = ? WHERE id = ?',
  ).run(name, lat, lng, radiusM, now, id);
  const row = db.prepare('SELECT * FROM preset_locations WHERE id = ?').get(id) as PresetLocationRow;
  return rowToPresetLocation(row);
}

export function deletePresetLocation(id: string): void {
  db.prepare('DELETE FROM preset_locations WHERE id = ?').run(id);
}

export default db;
