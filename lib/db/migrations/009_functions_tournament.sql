-- ============================================================================
-- 009_functions_tournament.sql
-- Tournament Module Functions
-- ============================================================================

-- Drop functions if they exist (needed when changing return types)
DROP FUNCTION IF EXISTS fn_tournament_create(VARCHAR, TEXT, INTEGER, TIMESTAMP, TIMESTAMP, INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS fn_tournament_get_by_id(INTEGER);
DROP FUNCTION IF EXISTS fn_tournament_list(tournament_state, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_tournament_join(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_tournament_get_participants(INTEGER);

-- Function to create a new tournament
CREATE OR REPLACE FUNCTION fn_tournament_create(
    p_name VARCHAR(200),
    p_game_id INTEGER,
    p_creator_id INTEGER,
    p_description TEXT DEFAULT NULL,
    p_start_date TIMESTAMP DEFAULT NULL,
    p_end_date TIMESTAMP DEFAULT NULL,
    p_max_participants INTEGER DEFAULT NULL,
    p_url_image TEXT DEFAULT NULL,
    p_state tournament_state DEFAULT 'draft'
)
RETURNS TABLE(
    out_tournament JSONB
) AS $$
DECLARE
    v_tournament_id INTEGER;
BEGIN
    /******************************************************************************
      NOMBRE:  fn_tournament_create
      PROPÓSITO: Función para crear un nuevo torneo con estado configurable
      INVOCACIÓN: SELECT * FROM fn_tournament_create('Torneo League of Legends', 1, 1, 'Descripción del torneo', NULL, NULL, 16, NULL, 'draft');
      PARÁMETROS:
        - p_state: Estado del torneo (draft, active, in_progress, completed, cancelled) - default: 'draft'
      RETORNA: JSONB con los datos del torneo creado
    ******************************************************************************/
    -- Insert tournament
    INSERT INTO tournament (
        name, description, game_id, start_date, end_date,
        max_participants, creator_id, url_image, state
    )
    VALUES (
        p_name, p_description, p_game_id, p_start_date, p_end_date,
        p_max_participants, p_creator_id, p_url_image, p_state
    )
    RETURNING id INTO v_tournament_id;

    -- Return tournament as JSON
    RETURN QUERY
    SELECT to_jsonb(t.*) as tournament
    FROM tournament t
    WHERE t.id = v_tournament_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get tournament by ID with game information
CREATE OR REPLACE FUNCTION fn_tournament_get_by_id(
    p_tournament_id INTEGER
)
RETURNS TABLE(
    out_tournament JSONB
) AS $$
BEGIN
    /******************************************************************************
      NOMBRE:  fn_tournament_get_by_id
      PROPÓSITO: Función para obtener la información detallada de un torneo por su ID, incluyendo datos del juego
      INVOCACIÓN: SELECT * FROM fn_tournament_get_by_id(1);
      RETORNA: JSONB con los datos del torneo y su juego asociado
    ******************************************************************************/
    RETURN QUERY
    SELECT jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'description', t.description,
        'game_id', t.game_id,
        'start_date', t.start_date,
        'end_date', t.end_date,
        'max_participants', t.max_participants,
        'creator_id', t.creator_id,
        'url_image', t.url_image,
        'state', t.state,
        'creation_date', t.creation_date,
        'modification_date', t.modification_date,
        'game_name', g.name,
        'game_type', g.type
    ) as tournament
    FROM tournament t
    INNER JOIN game g ON t.game_id = g.id
    WHERE t.id = p_tournament_id;
END;
$$ LANGUAGE plpgsql;

-- Function to list tournaments with optional status filter
CREATE OR REPLACE FUNCTION fn_tournament_list(
    p_tournament_state tournament_state DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    out_tournament JSONB
) AS $$
BEGIN
    /******************************************************************************
      NOMBRE:  fn_tournament_list
      PROPÓSITO: Función para listar torneos con filtro opcional por estado, con paginación
      INVOCACIÓN: SELECT * FROM fn_tournament_list('active', 10, 0);
                  SELECT * FROM fn_tournament_list(NULL, 50, 0);
      RETORNA: JSONB con los datos de los torneos y sus juegos asociados
    ******************************************************************************/
    IF p_tournament_state IS NOT NULL THEN
        RETURN QUERY
        SELECT jsonb_build_object(
            'id', t.id,
            'name', t.name,
            'description', t.description,
            'game_id', t.game_id,
            'start_date', t.start_date,
            'end_date', t.end_date,
            'max_participants', t.max_participants,
            'creator_id', t.creator_id,
            'url_image', t.url_image,
            'state', t.state,
            'creation_date', t.creation_date,
            'modification_date', t.modification_date,
            'game_name', g.name,
            'game_type', g.type
        ) as tournament
        FROM tournament t
        INNER JOIN game g ON t.game_id = g.id
        WHERE t.state = p_tournament_state
        ORDER BY t.creation_date DESC
        LIMIT p_limit OFFSET p_offset;
    ELSE
        RETURN QUERY
        SELECT jsonb_build_object(
            'id', t.id,
            'name', t.name,
            'description', t.description,
            'game_id', t.game_id,
            'start_date', t.start_date,
            'end_date', t.end_date,
            'max_participants', t.max_participants,
            'creator_id', t.creator_id,
            'url_image', t.url_image,
            'state', t.state,
            'creation_date', t.creation_date,
            'modification_date', t.modification_date,
            'game_name', g.name,
            'game_type', g.type
        ) as tournament
        FROM tournament t
        INNER JOIN game g ON t.game_id = g.id
        ORDER BY t.creation_date DESC
        LIMIT p_limit OFFSET p_offset;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to join a tournament
CREATE OR REPLACE FUNCTION fn_tournament_join(
    p_tournament_id INTEGER,
    p_user_id INTEGER
)
RETURNS TABLE(
    out_success BOOLEAN,
    out_message TEXT,
    out_participation JSONB
) AS $$
DECLARE
    v_tournament tournament%ROWTYPE;
    v_participants_count INTEGER;
    v_existing_count INTEGER;
    v_participation_id INTEGER;
BEGIN
    /******************************************************************************
      NOMBRE:  fn_tournament_join
      PROPÓSITO: Función para inscribir un usuario en un torneo, validando disponibilidad y cupos
      INVOCACIÓN: SELECT * FROM fn_tournament_join(1, 5);
      RETORNA: Éxito, mensaje descriptivo y datos de la participación en JSONB
      VALIDACIONES:
        - Verifica que el torneo exista
        - Verifica que el torneo esté activo y aceptando participantes
        - Verifica que el usuario no esté ya inscrito
        - Verifica que haya cupos disponibles (si hay límite de participantes)
    ******************************************************************************/
    -- Get tournament
    SELECT * INTO v_tournament FROM tournament WHERE id = p_tournament_id;

    -- Check if tournament exists
    IF v_tournament.id IS NULL THEN
        RETURN QUERY SELECT false, 'Torneo no encontrado', NULL::JSONB;
        RETURN;
    END IF;

    -- Check if tournament is active
    IF v_tournament.state != 'active' THEN
        RETURN QUERY SELECT false, 'El torneo no está aceptando participantes', NULL::JSONB;
        RETURN;
    END IF;

    -- Check if already joined
    SELECT COUNT(*) INTO v_existing_count
    FROM tournament_participations
    WHERE tournament_id = p_tournament_id AND user_id = p_user_id;

    IF v_existing_count > 0 THEN
        RETURN QUERY SELECT false, 'Ya estás inscrito en este torneo', NULL::JSONB;
        RETURN;
    END IF;

    -- Check max participants
    IF v_tournament.max_participants IS NOT NULL THEN
        SELECT COUNT(*) INTO v_participants_count
        FROM tournament_participations
        WHERE tournament_id = p_tournament_id;

        IF v_participants_count >= v_tournament.max_participants THEN
            RETURN QUERY SELECT false, 'El torneo está lleno', NULL::JSONB;
            RETURN;
        END IF;
    END IF;

    -- Join tournament
    INSERT INTO tournament_participations (tournament_id, user_id, state)
    VALUES (p_tournament_id, p_user_id, 'confirmed')
    RETURNING id INTO v_participation_id;

    -- Return success with participation data
    RETURN QUERY
    SELECT
        true,
        'Inscripción exitosa en el torneo',
        to_jsonb(tp.*) as participation
    FROM tournament_participations tp
    WHERE tp.id = v_participation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get tournament participants
CREATE OR REPLACE FUNCTION fn_tournament_get_participants(
    p_tournament_id INTEGER
)
RETURNS TABLE(
    out_participant JSONB
) AS $$
BEGIN
    /******************************************************************************
      NOMBRE:  fn_tournament_get_participants
      PROPÓSITO: Función para obtener la lista de participantes de un torneo ordenados por fecha de inscripción
      INVOCACIÓN: SELECT * FROM fn_tournament_get_participants(1);
      RETORNA: JSONB con los datos de cada participante (usuario) y su estado de participación
        - id: ID de la participación
        - tournament_id: ID del torneo
        - user_id: ID del usuario
        - user_name: Nombre del usuario
        - registration_date: Fecha de registro (ISO string)
        - state: Estado de la participación (registered, confirmed, withdrawn)
    ******************************************************************************/
    RETURN QUERY
    SELECT jsonb_build_object(
        'id', tp.id,
        'tournament_id', tp.tournament_id,
        'user_id', u.id,
        'user_name', u.name,
        'registration_date', tp.registration_date,
        'state', tp.state
    ) as participant
    FROM tournament_participations tp
    INNER JOIN users u ON tp.user_id = u.id
    WHERE tp.tournament_id = p_tournament_id
    ORDER BY tp.registration_date ASC;
END;
$$ LANGUAGE plpgsql;
