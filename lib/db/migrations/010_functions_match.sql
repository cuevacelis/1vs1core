-- ============================================================================
-- 010_functions_match.sql
-- Match Module Functions
-- ============================================================================

-- Drop functions if they exist (needed when changing return types)
DROP FUNCTION IF EXISTS fn_match_get_by_id(INTEGER);
DROP FUNCTION IF EXISTS fn_match_list_by_tournament(INTEGER);
DROP FUNCTION IF EXISTS fn_match_get_active_for_user(INTEGER);
DROP FUNCTION IF EXISTS fn_match_connect(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_match_activate(INTEGER);
DROP FUNCTION IF EXISTS fn_match_complete(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_match_generate_for_tournament(INTEGER, INTEGER);

-- Function to get match by ID with player information
CREATE OR REPLACE FUNCTION fn_match_get_by_id(
    p_match_id INTEGER
)
RETURNS TABLE(
    out_match JSONB
) AS $$
BEGIN
    /******************************************************************************
      NOMBRE:  fn_match_get_by_id
      PROPÓSITO: Función para obtener la información detallada de una partida por su ID, incluyendo datos de los jugadores
      INVOCACIÓN: SELECT * FROM fn_match_get_by_id(1);
      RETORNA: JSONB con los datos de la partida y la información de ambos jugadores
    ******************************************************************************/
    RETURN QUERY
    SELECT jsonb_build_object(
        'id', m.id,
        'tournament_id', m.tournament_id,
        'round', m.round,
        'player1_id', m.player1_id,
        'player2_id', m.player2_id,
        'winner_id', m.winner_id,
        'match_date', m.match_date,
        'state', m.state,
        'creation_date', m.creation_date,
        'modification_date', m.modification_date,
        'player1_name', p1.name,
        'player1_url_image', p1.url_image,
        'player2_name', p2.name,
        'player2_url_image', p2.url_image
    ) as match
    FROM match m
    INNER JOIN users p1 ON m.player1_id = p1.id
    INNER JOIN users p2 ON m.player2_id = p2.id
    WHERE m.id = p_match_id;
END;
$$ LANGUAGE plpgsql;

-- Function to list matches by tournament
CREATE OR REPLACE FUNCTION fn_match_list_by_tournament(
    p_tournament_id INTEGER
)
RETURNS TABLE(
    out_match JSONB
) AS $$
BEGIN
    /******************************************************************************
      NOMBRE:  fn_match_list_by_tournament
      PROPÓSITO: Función para listar todas las partidas de un torneo ordenadas por ronda
      INVOCACIÓN: SELECT * FROM fn_match_list_by_tournament(1);
      RETORNA: JSONB con los datos de cada partida incluyendo nombres de jugadores y ganador
    ******************************************************************************/
    RETURN QUERY
    SELECT jsonb_build_object(
        'id', m.id,
        'tournament_id', m.tournament_id,
        'round', m.round,
        'player1_id', m.player1_id,
        'player2_id', m.player2_id,
        'winner_id', m.winner_id,
        'match_date', m.match_date,
        'state', m.state,
        'creation_date', m.creation_date,
        'modification_date', m.modification_date,
        'player1_name', p1.name,
        'player2_name', p2.name,
        'winner_name', w.name
    ) as match
    FROM match m
    INNER JOIN users p1 ON m.player1_id = p1.id
    INNER JOIN users p2 ON m.player2_id = p2.id
    LEFT JOIN users w ON m.winner_id = w.id
    WHERE m.tournament_id = p_tournament_id
    ORDER BY m.round ASC, m.id ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get active match for a user
CREATE OR REPLACE FUNCTION fn_match_get_active_for_user(
    p_user_id INTEGER
)
RETURNS TABLE(
    out_match JSONB
) AS $$
BEGIN
    /******************************************************************************
      NOMBRE:  fn_match_get_active_for_user
      PROPÓSITO: Función para obtener la partida activa de un usuario (en curso o esperando conexión)
      INVOCACIÓN: SELECT * FROM fn_match_get_active_for_user(5);
      RETORNA: JSONB con los datos de la partida activa del usuario, NULL si no tiene partidas activas
      ESTADOS CONSIDERADOS: active, player1_connected, player2_connected, both_connected, in_selection
    ******************************************************************************/
    RETURN QUERY
    SELECT jsonb_build_object(
        'id', m.id,
        'tournament_id', m.tournament_id,
        'round', m.round,
        'player1_id', m.player1_id,
        'player2_id', m.player2_id,
        'winner_id', m.winner_id,
        'match_date', m.match_date,
        'state', m.state,
        'creation_date', m.creation_date,
        'modification_date', m.modification_date,
        'player1_name', p1.name,
        'player2_name', p2.name,
        'tournament_name', t.name
    ) as match
    FROM match m
    INNER JOIN users p1 ON m.player1_id = p1.id
    INNER JOIN users p2 ON m.player2_id = p2.id
    INNER JOIN tournament t ON m.tournament_id = t.id
    WHERE (m.player1_id = p_user_id OR m.player2_id = p_user_id)
    AND m.state IN ('active', 'player1_connected', 'player2_connected', 'both_connected', 'in_selection')
    ORDER BY m.match_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to connect to a match (update connection state)
CREATE OR REPLACE FUNCTION fn_match_connect(
    p_match_id INTEGER,
    p_user_id INTEGER
)
RETURNS TABLE(
    out_success BOOLEAN,
    out_message TEXT,
    out_match JSONB
) AS $$
DECLARE
    v_match match%ROWTYPE;
    v_new_state match_state;
BEGIN
    /******************************************************************************
      NOMBRE:  fn_match_connect
      PROPÓSITO: Función para conectar un jugador a una partida y actualizar el estado de conexión
      INVOCACIÓN: SELECT * FROM fn_match_connect(1, 5);
      RETORNA: Éxito, mensaje descriptivo y datos de la partida actualizada en JSONB
      VALIDACIONES:
        - Verifica que la partida exista
        - Verifica que el usuario sea parte de la partida
        - Verifica que la partida esté en un estado válido para conexión
      ESTADOS: active → player1_connected/player2_connected → both_connected
    ******************************************************************************/
    -- Get match
    SELECT * INTO v_match FROM match WHERE id = p_match_id;

    -- Check if match exists
    IF v_match.id IS NULL THEN
        RETURN QUERY SELECT false, 'Partida no encontrada', NULL::JSONB;
        RETURN;
    END IF;

    -- Check if user is part of the match
    IF v_match.player1_id != p_user_id AND v_match.player2_id != p_user_id THEN
        RETURN QUERY SELECT false, 'No eres parte de esta partida', NULL::JSONB;
        RETURN;
    END IF;

    -- Check if match is in a valid state for connection
    IF v_match.state NOT IN ('active', 'player1_connected', 'player2_connected') THEN
        RETURN QUERY SELECT false, 'La partida no está disponible para conexión', NULL::JSONB;
        RETURN;
    END IF;

    -- Determine new match state
    IF v_match.state = 'active' THEN
        v_new_state := CASE
            WHEN v_match.player1_id = p_user_id THEN 'player1_connected'::match_state
            ELSE 'player2_connected'::match_state
        END;
    ELSIF (v_match.state = 'player1_connected' AND v_match.player2_id = p_user_id) OR
          (v_match.state = 'player2_connected' AND v_match.player1_id = p_user_id) THEN
        v_new_state := 'both_connected'::match_state;
    ELSE
        -- Already connected
        v_new_state := v_match.state;
    END IF;

    -- Update match state
    UPDATE match SET state = v_new_state WHERE id = p_match_id;

    -- Return success with updated match data
    RETURN QUERY
    SELECT
        true,
        'Conexión exitosa a la partida',
        to_jsonb(m.*) as match
    FROM match m
    WHERE m.id = p_match_id;
END;
$$ LANGUAGE plpgsql;

-- Function to activate a match
CREATE OR REPLACE FUNCTION fn_match_activate(
    p_match_id INTEGER
)
RETURNS TABLE(
    out_success BOOLEAN,
    out_message TEXT,
    out_match JSONB
) AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    /******************************************************************************
      NOMBRE:  fn_match_activate
      PROPÓSITO: Función para activar una partida pendiente, cambiando su estado a activo
      INVOCACIÓN: SELECT * FROM fn_match_activate(1);
      RETORNA: Éxito, mensaje descriptivo y datos de la partida activada en JSONB
      VALIDACIONES:
        - Solo activa partidas en estado 'pending'
        - Establece la fecha de la partida al momento actual
    ******************************************************************************/
    -- Update match state
    UPDATE match
    SET state = 'active', match_date = CURRENT_TIMESTAMP
    WHERE id = p_match_id AND state = 'pending';

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
        RETURN QUERY SELECT false, 'Partida no encontrada o ya está activa', NULL::JSONB;
        RETURN;
    END IF;

    -- Return success with updated match data
    RETURN QUERY
    SELECT
        true,
        'Partida activada exitosamente',
        to_jsonb(m.*) as match
    FROM match m
    WHERE m.id = p_match_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete a match with a winner
CREATE OR REPLACE FUNCTION fn_match_complete(
    p_match_id INTEGER,
    p_winner_id INTEGER
)
RETURNS TABLE(
    out_success BOOLEAN,
    out_message TEXT,
    out_match JSONB
) AS $$
DECLARE
    v_match match%ROWTYPE;
BEGIN
    /******************************************************************************
      NOMBRE:  fn_match_complete
      PROPÓSITO: Función para completar una partida estableciendo el ganador
      INVOCACIÓN: SELECT * FROM fn_match_complete(1, 5);
      RETORNA: Éxito, mensaje descriptivo y datos de la partida completada en JSONB
      VALIDACIONES:
        - Verifica que la partida exista
        - Verifica que el ganador sea uno de los jugadores de la partida
    ******************************************************************************/
    -- Get match
    SELECT * INTO v_match FROM match WHERE id = p_match_id;

    -- Check if match exists
    IF v_match.id IS NULL THEN
        RETURN QUERY SELECT false, 'Partida no encontrada', NULL::JSONB;
        RETURN;
    END IF;

    -- Check if winner is part of the match
    IF v_match.player1_id != p_winner_id AND v_match.player2_id != p_winner_id THEN
        RETURN QUERY SELECT false, 'El ganador debe ser uno de los jugadores de la partida', NULL::JSONB;
        RETURN;
    END IF;

    -- Update match state
    UPDATE match
    SET state = 'completed', winner_id = p_winner_id
    WHERE id = p_match_id;

    -- Return success with updated match data
    RETURN QUERY
    SELECT
        true,
        'Partida completada exitosamente',
        to_jsonb(m.*) as match
    FROM match m
    WHERE m.id = p_match_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate matches for a tournament (bracket generation)
CREATE OR REPLACE FUNCTION fn_match_generate_for_tournament(
    p_tournament_id INTEGER,
    p_round INTEGER DEFAULT 1
)
RETURNS TABLE(
    out_success BOOLEAN,
    out_message TEXT,
    out_matches JSONB
) AS $$
DECLARE
    v_participants INTEGER[];
    v_participant_count INTEGER;
    v_matches JSONB := '[]'::JSONB;
    v_match_id INTEGER;
    i INTEGER;
BEGIN
    /******************************************************************************
      NOMBRE:  fn_match_generate_for_tournament
      PROPÓSITO: Función para generar partidas de un torneo emparejando participantes aleatoriamente
      INVOCACIÓN: SELECT * FROM fn_match_generate_for_tournament(1, 1);
      RETORNA: Éxito, mensaje con cantidad de partidas generadas y array JSONB con las partidas creadas
      VALIDACIONES:
        - Verifica que haya al menos 2 participantes confirmados
        - Empareja participantes de forma aleatoria
        - Las partidas se crean en estado 'pending'
    ******************************************************************************/
    -- Get all confirmed participants (randomized)
    SELECT array_agg(user_id ORDER BY RANDOM())
    INTO v_participants
    FROM tournament_participations
    WHERE tournament_id = p_tournament_id AND state = 'confirmed';

    -- Get participant count
    v_participant_count := array_length(v_participants, 1);

    -- Check if enough participants
    IF v_participant_count IS NULL OR v_participant_count < 2 THEN
        RETURN QUERY SELECT false, 'No hay suficientes participantes para generar partidas', NULL::JSONB;
        RETURN;
    END IF;

    -- Create matches by pairing participants
    FOR i IN 1..v_participant_count BY 2 LOOP
        IF i + 1 <= v_participant_count THEN
            INSERT INTO match (tournament_id, round, player1_id, player2_id, state)
            VALUES (p_tournament_id, p_round, v_participants[i], v_participants[i + 1], 'pending')
            RETURNING id INTO v_match_id;

            -- Add match to result array
            v_matches := v_matches || jsonb_build_object(
                'id', v_match_id,
                'tournament_id', p_tournament_id,
                'round', p_round,
                'player1_id', v_participants[i],
                'player2_id', v_participants[i + 1],
                'state', 'pending'
            );
        END IF;
    END LOOP;

    -- Return success with generated matches
    RETURN QUERY SELECT true, format('Se generaron %s partidas', jsonb_array_length(v_matches)), v_matches;
END;
$$ LANGUAGE plpgsql;
