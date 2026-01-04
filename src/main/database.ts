import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

// Get the user data path for storing the database
const getDbPath = () => {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'sticky-notes.db');
};

// Migration type
interface Migration {
    version: number;
    name: string;
    up: (db: Database.Database) => void;
}

// All migrations - add new ones at the bottom with incrementing version numbers
const migrations: Migration[] = [
    {
        version: 1,
        name: 'initial_schema',
        up: (db) => {
            // Create workspaces table
            db.exec(`
        CREATE TABLE IF NOT EXISTS workspaces (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          layout TEXT NOT NULL,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL
        )
      `);

            // Create notes table
            db.exec(`
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY,
          workspaceId TEXT NOT NULL,
          panelId TEXT,
          title TEXT NOT NULL DEFAULT 'Untitled',
          content TEXT NOT NULL DEFAULT '',
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL,
          FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
        )
      `);

            // Create migrations tracking table
            db.exec(`
        CREATE TABLE IF NOT EXISTS _migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          appliedAt INTEGER NOT NULL
        )
      `);
        },
    },
    // Migration for app settings to remember last workspace
    {
        version: 2,
        name: 'add_app_settings',
        up: (db) => {
            db.exec(`
                CREATE TABLE IF NOT EXISTS app_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            `);
        },
    },
];

class StickyNotesDatabase {
    private db: Database.Database | null = null;

    // Initialize the database and run migrations
    initialize(): void {
        const dbPath = getDbPath();
        console.log('[Database] Initializing at:', dbPath);

        this.db = new Database(dbPath);
        this.db.pragma('journal_mode = WAL'); // Better performance
        this.db.pragma('foreign_keys = ON'); // Enable foreign key constraints

        this.runMigrations();
    }

    // Run any pending migrations
    private runMigrations(): void {
        if (!this.db) throw new Error('Database not initialized');

        // First, ensure the _migrations table exists (for fresh databases)
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        appliedAt INTEGER NOT NULL
      )
    `);

        // Get applied migrations
        const appliedVersions = new Set(
            this.db
                .prepare('SELECT version FROM _migrations')
                .all()
                .map((row: any) => row.version)
        );

        // Run pending migrations
        for (const migration of migrations) {
            if (!appliedVersions.has(migration.version)) {
                console.log(`[Database] Running migration ${migration.version}: ${migration.name}`);

                const transaction = this.db.transaction(() => {
                    migration.up(this.db!);
                    this.db!
                        .prepare('INSERT INTO _migrations (version, name, appliedAt) VALUES (?, ?, ?)')
                        .run(migration.version, migration.name, Date.now());
                });

                transaction();
                console.log(`[Database] Migration ${migration.version} complete`);
            }
        }
    }

    // Close the database connection
    close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }

    // ============================================================================
    // WORKSPACE OPERATIONS
    // ============================================================================

    getAllWorkspaces(): any[] {
        if (!this.db) throw new Error('Database not initialized');
        const rows = this.db.prepare('SELECT * FROM workspaces ORDER BY createdAt ASC').all();
        return rows.map((row: any) => ({
            ...row,
            layout: JSON.parse(row.layout),
        }));
    }

    getWorkspace(id: string): any | null {
        if (!this.db) throw new Error('Database not initialized');
        const row: any = this.db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id);
        if (!row) return null;
        return {
            ...row,
            layout: JSON.parse(row.layout),
        };
    }

    createWorkspace(workspace: {
        id: string;
        name: string;
        layout: any;
        createdAt: number;
        updatedAt: number;
    }): void {
        if (!this.db) throw new Error('Database not initialized');
        this.db
            .prepare(
                'INSERT INTO workspaces (id, name, layout, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
            )
            .run(
                workspace.id,
                workspace.name,
                JSON.stringify(workspace.layout),
                workspace.createdAt,
                workspace.updatedAt
            );
    }

    updateWorkspace(id: string, updates: { name?: string; layout?: any }): void {
        if (!this.db) throw new Error('Database not initialized');

        const setClauses: string[] = ['updatedAt = ?'];
        const values: any[] = [Date.now()];

        if (updates.name !== undefined) {
            setClauses.push('name = ?');
            values.push(updates.name);
        }
        if (updates.layout !== undefined) {
            setClauses.push('layout = ?');
            values.push(JSON.stringify(updates.layout));
        }

        values.push(id);
        this.db
            .prepare(`UPDATE workspaces SET ${setClauses.join(', ')} WHERE id = ?`)
            .run(...values);
    }

    deleteWorkspace(id: string): void {
        if (!this.db) throw new Error('Database not initialized');
        // Notes will be deleted automatically due to ON DELETE CASCADE
        this.db.prepare('DELETE FROM workspaces WHERE id = ?').run(id);
    }

    // ============================================================================
    // NOTE OPERATIONS
    // ============================================================================

    getNotesForWorkspace(workspaceId: string): any[] {
        if (!this.db) throw new Error('Database not initialized');
        return this.db
            .prepare('SELECT * FROM notes WHERE workspaceId = ? ORDER BY createdAt ASC')
            .all(workspaceId);
    }

    createNote(note: {
        id: string;
        workspaceId: string;
        panelId: string | null;
        title: string;
        content: string;
        createdAt: number;
        updatedAt: number;
    }): void {
        if (!this.db) throw new Error('Database not initialized');
        this.db
            .prepare(
                'INSERT INTO notes (id, workspaceId, panelId, title, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
            )
            .run(
                note.id,
                note.workspaceId,
                note.panelId,
                note.title,
                note.content,
                note.createdAt,
                note.updatedAt
            );
    }

    updateNote(id: string, updates: { panelId?: string | null; title?: string; content?: string }): void {
        if (!this.db) throw new Error('Database not initialized');

        const setClauses: string[] = ['updatedAt = ?'];
        const values: any[] = [Date.now()];

        if (updates.panelId !== undefined) {
            setClauses.push('panelId = ?');
            values.push(updates.panelId);
        }
        if (updates.title !== undefined) {
            setClauses.push('title = ?');
            values.push(updates.title);
        }
        if (updates.content !== undefined) {
            setClauses.push('content = ?');
            values.push(updates.content);
        }

        values.push(id);
        this.db
            .prepare(`UPDATE notes SET ${setClauses.join(', ')} WHERE id = ?`)
            .run(...values);
    }

    deleteNote(id: string): void {
        if (!this.db) throw new Error('Database not initialized');
        this.db.prepare('DELETE FROM notes WHERE id = ?').run(id);
    }

    // ============================================================================
    // APP SETTINGS OPERATIONS
    // ============================================================================

    getSetting(key: string): string | null {
        if (!this.db) throw new Error('Database not initialized');
        const row: any = this.db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
        return row ? row.value : null;
    }

    setSetting(key: string, value: string): void {
        if (!this.db) throw new Error('Database not initialized');
        this.db.prepare(
            'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)'
        ).run(key, value);
    }

    getLastWorkspaceId(): string | null {
        return this.getSetting('lastWorkspaceId');
    }

    setLastWorkspaceId(workspaceId: string): void {
        this.setSetting('lastWorkspaceId', workspaceId);
    }
}

// Export singleton instance
export const database = new StickyNotesDatabase();
