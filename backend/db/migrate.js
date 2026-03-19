const pool = require('./pool');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // USERS
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_initials VARCHAR(4),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // TASKS (self-referencing for nested subtasks)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        parent_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        tag VARCHAR(50) DEFAULT 'Other',
        priority VARCHAR(10) DEFAULT 'mid',
        status VARCHAR(20) DEFAULT 'pending',
        deadline DATE,
        planned_hours DECIMAL(5,2) DEFAULT 0,
        project_id INTEGER,
        position INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // PROJECTS
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        tag VARCHAR(50) DEFAULT 'Other',
        target_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Add FK from tasks -> projects after projects table exists
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'tasks_project_id_fkey'
        ) THEN
          ALTER TABLE tasks ADD CONSTRAINT tasks_project_id_fkey
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // DAILY LOGS
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        log_date DATE NOT NULL,
        hours_studied DECIMAL(4,2) DEFAULT 0,
        mood VARCHAR(10) DEFAULT '🙂',
        what_studied TEXT,
        wins TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, log_date)
      );
    `);

    // NOTES
    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        body TEXT,
        tag VARCHAR(50) DEFAULT 'Other',
        is_pinned BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // GOALS (roadmap)
    await client.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        target_date DATE,
        duration_months INTEGER DEFAULT 6,
        position INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ROADMAP ITEMS (Month > Week > Day structure)
    await client.query(`
      CREATE TABLE IF NOT EXISTS roadmap_items (
        id SERIAL PRIMARY KEY,
        goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE,
        parent_id INTEGER REFERENCES roadmap_items(id) ON DELETE CASCADE,
        item_type VARCHAR(10) NOT NULL, -- 'month', 'week', 'day'
        title VARCHAR(255) NOT NULL,
        position INTEGER DEFAULT 0
      );
    `);

    // REVISION (spaced repetition)
    await client.query(`
      CREATE TABLE IF NOT EXISTS revision_topics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        topic VARCHAR(255) NOT NULL,
        tag VARCHAR(50) DEFAULT 'Other',
        due_date DATE NOT NULL,
        interval_days INTEGER DEFAULT 7,
        box_level INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // TIME LOGS (per-task timer sessions)
    await client.query(`
      CREATE TABLE IF NOT EXISTS time_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        seconds INTEGER DEFAULT 0,
        log_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // CALENDAR EVENTS
    await client.query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        event_date DATE NOT NULL,
        color VARCHAR(20) DEFAULT 'blue',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('✅ Database migration complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
};

migrate();
