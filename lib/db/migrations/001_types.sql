-- ============================================================================
-- 001_types.sql
-- ENUM Types for 1v1 Tournament System
-- ============================================================================

-- Enable pgcrypto extension for random token generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create ENUM types for state management (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE entity_state AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE user_state AS ENUM ('active', 'suspended', 'banned', 'pending_verification');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE tournament_state AS ENUM ('draft', 'active', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE participation_state AS ENUM ('registered', 'confirmed', 'withdrawn');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE match_state AS ENUM ('pending', 'active', 'player1_connected', 'player2_connected', 'both_connected', 'in_selection', 'locked', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
