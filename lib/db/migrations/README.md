# Database Migrations

This directory contains modular SQL migration files for the 1v1 Core tournament system.

## Overview

Migrations are executed in **alphabetical order** when running `npm run db:migrate`. Each file is prefixed with a 3-digit sequence number (e.g., `001_`, `002_`) to ensure correct execution order.

## Migration Files

### Current Migrations

| File | Description | Contains |
|------|-------------|----------|
| `001_types.sql` | ENUM Types | All custom PostgreSQL ENUM types (entity_state, user_state, tournament_state, etc.) |
| `002_tables.sql` | Table Definitions | All table schemas (person, users, role, tournament, match, champion, etc.) |
| `003_indexes.sql` | Performance Indexes | All database indexes for query optimization |
| `004_functions_shared.sql` | Shared Functions | Utility functions and triggers (modification_date auto-update) |
| `005_functions_auth.sql` | Auth Functions | Authentication module (`fn_auth_generate_access_code`, `fn_auth_verify_access_code`) |
| `006_functions_user.sql` | User Functions | User management (`fn_user_create_with_access_code`) |
| `007_functions_role.sql` | Role Functions | Role management (`fn_role_assign_to_user`) |
| `008_seed_data.sql` | Seed Data | Default roles, games, and module access permissions |

## Running Migrations

To apply all migrations to your database:

```bash
npm run db:migrate
```

This will:
1. Read all `.sql` files from this directory
2. Sort them alphabetically
3. Execute each file in order
4. Report success/failure for each migration

## Adding New Migrations

### Naming Convention

Format: `XXX_description.sql` where `XXX` is a 3-digit sequence number.

Examples:
- `009_add_notifications_table.sql`
- `010_add_email_verification.sql`
- `011_functions_notification.sql`

### Categories

Choose the appropriate category prefix based on your change:

- **00X_types_*.sql** - New ENUM types
- **00X_tables_*.sql** - New tables or table modifications
- **00X_indexes_*.sql** - New indexes
- **00X_functions_*.sql** - New or updated functions (specify module: `functions_auth`, `functions_user`, etc.)
- **00X_seed_*.sql** - Seed/default data

### Idempotency Rules

**CRITICAL**: All migrations must be idempotent (safe to run multiple times).

#### Tables
```sql
CREATE TABLE IF NOT EXISTS my_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);
```

#### Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_my_table_name ON my_table(name);
```

#### ENUM Types
```sql
DO $$ BEGIN
    CREATE TYPE my_state AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
```

#### Functions
```sql
-- Use CREATE OR REPLACE for functions
CREATE OR REPLACE FUNCTION fn_module_my_function()
RETURNS TEXT AS $$
BEGIN
    -- Function body
END;
$$ LANGUAGE plpgsql;

-- If changing return type, drop first
DROP FUNCTION IF EXISTS fn_module_my_function(param_types);
CREATE OR REPLACE FUNCTION fn_module_my_function(params)
RETURNS new_return_type AS $$
-- ...
$$ LANGUAGE plpgsql;
```

#### Seed Data
```sql
INSERT INTO my_table (name, value)
VALUES ('default', 'value')
ON CONFLICT (name) DO NOTHING;
```

### File Template

```sql
-- ============================================================================
-- XXX_description.sql
-- Brief description of what this migration does
-- ============================================================================

-- Your SQL statements here
-- Remember to make them idempotent!

CREATE TABLE IF NOT EXISTS my_new_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_my_new_table_name ON my_new_table(name);
```

## Database Function Naming Convention

All PostgreSQL functions MUST follow this pattern:

**Pattern**: `fn_[module]_[functionality]`

- `fn_` - Fixed prefix
- `[module]` - Module/domain (auth, user, role, tournament, match, shared)
- `[functionality]` - What the function does

**Examples**:
- `fn_auth_generate_access_code`
- `fn_user_create_with_access_code`
- `fn_role_assign_to_user`
- `fn_tournament_create_bracket`
- `fn_shared_update_modification_date`

## Modifying Existing Migrations

### Development (Pre-Production)
✅ **Safe to modify** - You can edit existing migration files if:
- Changes haven't been deployed to production
- You're working in a development/staging environment
- You can reset your local database

### Production
❌ **DO NOT modify** - Never change existing migration files in production. Instead:
1. Create a new migration file with the next sequence number
2. Write ALTER statements to modify existing objects
3. Use DROP/CREATE for functions that need changes

**Example**: Adding a column to an existing table

```sql
-- ============================================================================
-- 009_alter_users_add_email.sql
-- Add email column to users table
-- ============================================================================

-- Add column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'email'
    ) THEN
        ALTER TABLE users ADD COLUMN email VARCHAR(255);
    END IF;
END $$;

-- Add index
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

## Troubleshooting

### Migration Failed
If a migration fails:
1. Check the error message in the console
2. Fix the SQL in the problematic file
3. Ensure idempotency (safe to re-run)
4. Run `npm run db:migrate` again

### Function Return Type Change
If you see: `ERROR: cannot change return type of existing function`

Solution: Add `DROP FUNCTION IF EXISTS` before the function definition

```sql
DROP FUNCTION IF EXISTS fn_module_function(param1_type, param2_type);
CREATE OR REPLACE FUNCTION fn_module_function(params)...
```

### Column Ambiguity
If you see: `ERROR: column reference "..." is ambiguous`

Solution: Use table aliases in your queries

```sql
-- Bad
SELECT id FROM users WHERE user_id = user_id;

-- Good
SELECT u.id FROM users u WHERE u.user_id = p_user_id;
```

## Additional Resources

- Main documentation: `/CLAUDE.md`
- Database types: `/lib/db/types.ts`
- Migration runner: `/lib/db/migrate.ts`
- Database config: `/lib/db/config.ts`
