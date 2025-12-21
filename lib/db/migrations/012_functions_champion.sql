-- ============================================================================
-- 012_functions_champion.sql
-- Champion Module Functions
-- ============================================================================

-- Drop functions if they exist (needed when changing return types)
DROP FUNCTION IF EXISTS fn_champion_list_by_game(INTEGER);
DROP FUNCTION IF EXISTS fn_champion_create(VARCHAR, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS fn_champion_select(INTEGER, INTEGER, INTEGER, VARCHAR);
DROP FUNCTION IF EXISTS fn_champion_lock_selection(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_champion_get_match_selections(INTEGER);

-- Function to list champions by game
CREATE OR REPLACE FUNCTION fn_champion_list_by_game(
    p_game_id INTEGER
)
RETURNS TABLE(
    out_champion JSONB
) AS $$
BEGIN
    /******************************************************************************
      NOMBRE:  fn_champion_list_by_game
      PROPÓSITO: Función para listar todos los campeones activos de un juego específico
      INVOCACIÓN: SELECT * FROM fn_champion_list_by_game(1);
      RETORNA: JSONB con los datos de cada campeón activo (sin ban) ordenados alfabéticamente
    ******************************************************************************/
    RETURN QUERY
    SELECT to_jsonb(c.*) as champion
    FROM champion c
    WHERE c.game_id = p_game_id
      AND c.state = 'active'
    ORDER BY c.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new champion
CREATE OR REPLACE FUNCTION fn_champion_create(
    p_name VARCHAR(100),
    p_game_id INTEGER,
    p_description TEXT DEFAULT NULL,
    p_url_image TEXT DEFAULT NULL
)
RETURNS TABLE(
    out_champion JSONB
) AS $$
DECLARE
    v_champion_id INTEGER;
BEGIN
    /******************************************************************************
      NOMBRE:  fn_champion_create
      PROPÓSITO: Función para crear un nuevo campeón
      INVOCACIÓN: SELECT * FROM fn_champion_create('Ahri', 1, 'Nine-tailed fox', 'https://...');
      RETORNA: JSONB con los datos del campeón creado
    ******************************************************************************/
    INSERT INTO champion (name, game_id, description, url_image)
    VALUES (p_name, p_game_id, p_description, p_url_image)
    RETURNING id INTO v_champion_id;

    RETURN QUERY
    SELECT to_jsonb(c.*) as champion
    FROM champion c
    WHERE c.id = v_champion_id;
END;
$$ LANGUAGE plpgsql;

-- Function to select champion for a match
CREATE OR REPLACE FUNCTION fn_champion_select(
    p_match_id INTEGER,
    p_player_id INTEGER,
    p_champion_id INTEGER,
    p_role VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE(
    out_success BOOLEAN,
    out_message TEXT,
    out_selection JSONB
) AS $$
DECLARE
    v_match match%ROWTYPE;
    v_existing match_champions%ROWTYPE;
BEGIN
    /******************************************************************************
      NOMBRE:  fn_champion_select
      PROPÓSITO: Función para seleccionar un campeón para una partida (vista previa en tiempo real)
      INVOCACIÓN: SELECT * FROM fn_champion_select(1, 5, 10, 'mid');
      RETORNA: Éxito, mensaje y datos de la selección en JSONB
      VALIDACIONES:
        - Verifica que la partida exista
        - Verifica que el jugador sea parte de la partida
        - Verifica que la partida esté en estado válido para selección
        - Verifica que la selección no esté bloqueada
      COMPORTAMIENTO:
        - Actualiza el estado de la partida a 'in_selection' si está en 'both_connected'
        - Inserta o actualiza la selección del campeón (UPSERT)
    ******************************************************************************/
    -- Get match
    SELECT * INTO v_match FROM match WHERE id = p_match_id;

    -- Check if match exists
    IF v_match.id IS NULL THEN
        RETURN QUERY SELECT false, 'Partida no encontrada', NULL::JSONB;
        RETURN;
    END IF;

    -- Check if player is part of the match
    IF v_match.player1_id != p_player_id AND v_match.player2_id != p_player_id THEN
        RETURN QUERY SELECT false, 'No eres parte de esta partida', NULL::JSONB;
        RETURN;
    END IF;

    -- Check if match is in valid state for selection
    IF v_match.state NOT IN ('both_connected', 'in_selection') THEN
        RETURN QUERY SELECT false, 'La partida no está disponible para selección', NULL::JSONB;
        RETURN;
    END IF;

    -- Check if already locked
    SELECT * INTO v_existing
    FROM match_champions
    WHERE match_id = p_match_id AND player_id = p_player_id;

    IF v_existing.id IS NOT NULL AND v_existing.is_locked THEN
        RETURN QUERY SELECT false, 'La selección de campeón ya está bloqueada', NULL::JSONB;
        RETURN;
    END IF;

    -- Update match state to in_selection if needed
    UPDATE match
    SET state = 'in_selection'
    WHERE id = p_match_id AND state = 'both_connected';

    -- Upsert champion selection
    INSERT INTO match_champions (match_id, player_id, champion_id, role, is_locked)
    VALUES (p_match_id, p_player_id, p_champion_id, p_role, false)
    ON CONFLICT (match_id, player_id)
    DO UPDATE SET
        champion_id = p_champion_id,
        role = p_role,
        selection_date = CURRENT_TIMESTAMP;

    -- Return success with selection data
    RETURN QUERY
    SELECT
        true,
        'Campeón seleccionado exitosamente',
        to_jsonb(mc.*) as selection
    FROM match_champions mc
    WHERE mc.match_id = p_match_id AND mc.player_id = p_player_id;
END;
$$ LANGUAGE plpgsql;

-- Function to lock champion selection
CREATE OR REPLACE FUNCTION fn_champion_lock_selection(
    p_match_id INTEGER,
    p_player_id INTEGER
)
RETURNS TABLE(
    out_success BOOLEAN,
    out_message TEXT,
    out_selection JSONB
) AS $$
DECLARE
    v_locked_count INTEGER;
BEGIN
    /******************************************************************************
      NOMBRE:  fn_champion_lock_selection
      PROPÓSITO: Función para confirmar y bloquear la selección de campeón de un jugador
      INVOCACIÓN: SELECT * FROM fn_champion_lock_selection(1, 5);
      RETORNA: Éxito, mensaje y datos de la selección bloqueada en JSONB
      VALIDACIONES:
        - Verifica que exista una selección previa
      COMPORTAMIENTO:
        - Marca la selección como bloqueada (is_locked = true)
        - Si ambos jugadores bloquearon, actualiza el estado de la partida a 'locked'
    ******************************************************************************/
    -- Lock the selection
    UPDATE match_champions
    SET is_locked = true, lock_date = CURRENT_TIMESTAMP
    WHERE match_id = p_match_id AND player_id = p_player_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'No hay campeón seleccionado', NULL::JSONB;
        RETURN;
    END IF;

    -- Check if both players locked
    SELECT COUNT(*)::INTEGER INTO v_locked_count
    FROM match_champions
    WHERE match_id = p_match_id AND is_locked = true;

    IF v_locked_count = 2 THEN
        -- Update match status to locked
        UPDATE match SET state = 'locked' WHERE id = p_match_id;
    END IF;

    -- Return success with selection data
    RETURN QUERY
    SELECT
        true,
        'Selección bloqueada exitosamente',
        to_jsonb(mc.*) as selection
    FROM match_champions mc
    WHERE mc.match_id = p_match_id AND mc.player_id = p_player_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get champion selections for a match
CREATE OR REPLACE FUNCTION fn_champion_get_match_selections(
    p_match_id INTEGER
)
RETURNS TABLE(
    out_selection JSONB
) AS $$
BEGIN
    /******************************************************************************
      NOMBRE:  fn_champion_get_match_selections
      PROPÓSITO: Función para obtener todas las selecciones de campeones de una partida
      INVOCACIÓN: SELECT * FROM fn_champion_get_match_selections(1);
      RETORNA: JSONB con los datos de cada selección incluyendo:
        - Datos de la selección (match_champions)
        - Nombre del jugador
        - Nombre e imagen del campeón
    ******************************************************************************/
    RETURN QUERY
    SELECT jsonb_build_object(
        'id', mc.id,
        'match_id', mc.match_id,
        'player_id', mc.player_id,
        'champion_id', mc.champion_id,
        'role', mc.role,
        'is_locked', mc.is_locked,
        'selection_date', mc.selection_date,
        'lock_date', mc.lock_date,
        'player_name', u.name,
        'champion_name', c.name,
        'champion_url_image', c.url_image
    ) as selection
    FROM match_champions mc
    INNER JOIN users u ON mc.player_id = u.id
    INNER JOIN champion c ON mc.champion_id = c.id
    WHERE mc.match_id = p_match_id;
END;
$$ LANGUAGE plpgsql;
