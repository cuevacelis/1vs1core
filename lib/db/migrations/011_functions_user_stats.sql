-- ============================================================================
-- 011_functions_user_stats.sql
-- User Statistics and Profile Module Functions
-- ============================================================================

-- Drop functions if they exist (needed when changing return types)
DROP FUNCTION IF EXISTS fn_user_get_by_id(INTEGER);
DROP FUNCTION IF EXISTS fn_user_get_profile(INTEGER);
DROP FUNCTION IF EXISTS fn_user_get_statistics(INTEGER);
DROP FUNCTION IF EXISTS fn_user_get_recent_matches(INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_user_get_tournaments(INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_user_list_with_roles(BOOLEAN, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_user_get_accessible_modules(INTEGER);

-- Function to get user by ID with role
CREATE OR REPLACE FUNCTION fn_user_get_by_id(
    p_user_id INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_user JSONB;
BEGIN
    /******************************************************************************
      NOMBRE:  fn_user_get_by_id
      PROPÓSITO: Obtener información completa de un usuario por su ID, incluyendo su rol
      INVOCACIÓN: SELECT fn_user_get_by_id(1);
      PARÁMETROS:
        - p_user_id: ID del usuario a buscar
      RETORNA: JSONB con estructura del usuario y su rol, NULL si no existe
      VALIDACIONES:
        - Retorna NULL si el usuario no existe
      NOTAS:
        - El rol se agrega como un objeto JSON dentro del objeto usuario
    ******************************************************************************/

    SELECT jsonb_build_object(
        'id', u.id,
        'name', u.name,
        'short_name', u.short_name,
        'state', u.state,
        'url_image', u.url_image,
        'creation_date', u.creation_date,
        'modification_date', u.modification_date,
        'role', jsonb_build_object(
            'id', r.id,
            'name', r.name,
            'description', r.description
        )
    ) INTO v_user
    FROM users u
    INNER JOIN role r ON u.role_id = r.id
    WHERE u.id = p_user_id;

    RETURN v_user;
END;
$$ LANGUAGE plpgsql;

-- Function to get user profile with person and role
CREATE OR REPLACE FUNCTION fn_user_get_profile(
    p_user_id INTEGER
)
RETURNS TABLE(
    out_profile JSONB
) AS $$
BEGIN
    /******************************************************************************
      NOMBRE:  fn_user_get_profile
      PROPÓSITO: Función para obtener el perfil completo de un usuario incluyendo su rol y datos personales
      INVOCACIÓN: SELECT * FROM fn_user_get_profile(5);
      RETORNA: JSONB con los datos del usuario, su rol asignado y datos de la persona asociada
    ******************************************************************************/
    RETURN QUERY
    SELECT jsonb_build_object(
        'id', u.id,
        'name', u.name,
        'short_name', u.short_name,
        'state', u.state,
        'url_image', u.url_image,
        'creation_date', u.creation_date,
        'modification_date', u.modification_date,
        'role', jsonb_build_object(
            'id', r.id,
            'name', r.name,
            'description', r.description
        ),
        'person', CASE
            WHEN p.id IS NOT NULL THEN
                jsonb_build_object(
                    'first_name', p.first_name,
                    'second_name', p.second_name,
                    'paternal_last_name', p.paternal_last_name,
                    'maternal_last_name', p.maternal_last_name
                )
            ELSE NULL
        END
    ) as profile
    FROM users u
    INNER JOIN role r ON u.role_id = r.id
    LEFT JOIN person p ON u.persona_id = p.id
    WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION fn_user_get_statistics(
    p_user_id INTEGER
)
RETURNS TABLE(
    out_stats JSONB
) AS $$
DECLARE
    v_total_matches INTEGER;
    v_wins INTEGER;
    v_losses INTEGER;
    v_win_rate NUMERIC;
    v_current_streak INTEGER := 0;
    v_tournaments_joined INTEGER;
    v_recent_matches RECORD;
BEGIN
    /******************************************************************************
      NOMBRE:  fn_user_get_statistics
      PROPÓSITO: Función para calcular las estadísticas de un usuario (partidas, victorias, derrotas, racha actual)
      INVOCACIÓN: SELECT * FROM fn_user_get_statistics(5);
      RETORNA: JSONB con estadísticas del usuario incluyendo:
        - totalMatches: Total de partidas completadas
        - wins: Partidas ganadas
        - losses: Partidas perdidas
        - winRate: Porcentaje de victorias
        - currentStreak: Racha de victorias consecutivas actuales
        - tournamentsJoined: Torneos en los que participa
    ******************************************************************************/
    -- Get total matches
    SELECT COUNT(*)::INTEGER INTO v_total_matches
    FROM match
    WHERE (player1_id = p_user_id OR player2_id = p_user_id)
    AND state = 'completed';

    -- Get wins
    SELECT COUNT(*)::INTEGER INTO v_wins
    FROM match
    WHERE winner_id = p_user_id
    AND state = 'completed';

    -- Calculate losses
    v_losses := v_total_matches - v_wins;

    -- Calculate win rate
    v_win_rate := CASE
        WHEN v_total_matches > 0 THEN (v_wins::NUMERIC / v_total_matches::NUMERIC) * 100
        ELSE 0
    END;

    -- Calculate current streak
    FOR v_recent_matches IN
        SELECT id, winner_id
        FROM match
        WHERE (player1_id = p_user_id OR player2_id = p_user_id)
        AND state = 'completed'
        ORDER BY match_date DESC
        LIMIT 10
    LOOP
        IF v_recent_matches.winner_id = p_user_id THEN
            v_current_streak := v_current_streak + 1;
        ELSE
            EXIT;
        END IF;
    END LOOP;

    -- Get tournaments joined
    SELECT COUNT(*)::INTEGER INTO v_tournaments_joined
    FROM tournament_participations
    WHERE user_id = p_user_id
    AND state = 'confirmed';

    -- Return statistics as JSON
    RETURN QUERY
    SELECT jsonb_build_object(
        'totalMatches', v_total_matches,
        'wins', v_wins,
        'losses', v_losses,
        'winRate', ROUND(v_win_rate),
        'currentStreak', v_current_streak,
        'tournamentsJoined', v_tournaments_joined
    ) as stats;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's recent matches
CREATE OR REPLACE FUNCTION fn_user_get_recent_matches(
    p_user_id INTEGER,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    out_match JSONB
) AS $$
BEGIN
    /******************************************************************************
      NOMBRE:  fn_user_get_recent_matches
      PROPÓSITO: Función para obtener el historial de partidas completadas de un usuario con paginación
      INVOCACIÓN: SELECT * FROM fn_user_get_recent_matches(5, 10, 0);
      RETORNA: JSONB con los datos de cada partida incluyendo:
        - Información de la partida y torneo
        - Nombres de ambos jugadores
        - Campeones seleccionados
        - Resultado desde la perspectiva del usuario (Victoria/Derrota)
    ******************************************************************************/
    RETURN QUERY
    SELECT jsonb_build_object(
        'id', m.id,
        'tournament_id', m.tournament_id,
        'tournament_name', t.name,
        'round', m.round,
        'player1_id', m.player1_id,
        'player1_name', p1.name,
        'player2_id', m.player2_id,
        'player2_name', p2.name,
        'winner_id', m.winner_id,
        'winner_name', w.name,
        'match_date', m.match_date,
        'state', m.state,
        'player1_champion_id', mc1.champion_id,
        'player1_champion_name', c1.name,
        'player2_champion_id', mc2.champion_id,
        'player2_champion_name', c2.name,
        'opponent_name', CASE
            WHEN m.player1_id = p_user_id THEN p2.name
            ELSE p1.name
        END,
        'my_champion', CASE
            WHEN m.player1_id = p_user_id THEN c1.name
            ELSE c2.name
        END,
        'result', CASE
            WHEN m.winner_id = p_user_id THEN 'Victoria'
            ELSE 'Derrota'
        END
    ) as match
    FROM match m
    INNER JOIN tournament t ON m.tournament_id = t.id
    INNER JOIN users p1 ON m.player1_id = p1.id
    INNER JOIN users p2 ON m.player2_id = p2.id
    LEFT JOIN users w ON m.winner_id = w.id
    LEFT JOIN match_champions mc1 ON m.id = mc1.match_id AND mc1.player_id = m.player1_id
    LEFT JOIN match_champions mc2 ON m.id = mc2.match_id AND mc2.player_id = m.player2_id
    LEFT JOIN champion c1 ON mc1.champion_id = c1.id
    LEFT JOIN champion c2 ON mc2.champion_id = c2.id
    WHERE (m.player1_id = p_user_id OR m.player2_id = p_user_id)
    AND m.state = 'completed'
    ORDER BY m.match_date DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's tournaments
CREATE OR REPLACE FUNCTION fn_user_get_tournaments(
    p_user_id INTEGER,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    out_tournament JSONB
) AS $$
BEGIN
    /******************************************************************************
      NOMBRE:  fn_user_get_tournaments
      PROPÓSITO: Función para obtener los torneos en los que participa un usuario con paginación
      INVOCACIÓN: SELECT * FROM fn_user_get_tournaments(5, 10, 0);
      RETORNA: JSONB con los datos de cada torneo incluyendo:
        - Información del torneo
        - Datos del juego asociado
        - Fecha de inscripción y estado de participación del usuario
    ******************************************************************************/
    RETURN QUERY
    SELECT jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'description', t.description,
        'game_id', t.game_id,
        'game_name', g.name,
        'start_date', t.start_date,
        'end_date', t.end_date,
        'max_participants', t.max_participants,
        'creator_id', t.creator_id,
        'url_image', t.url_image,
        'state', t.state,
        'creation_date', t.creation_date,
        'modification_date', t.modification_date,
        'registration_date', tp.registration_date,
        'participation_state', tp.state
    ) as tournament
    FROM tournament_participations tp
    INNER JOIN tournament t ON tp.tournament_id = t.id
    INNER JOIN game g ON t.game_id = g.id
    WHERE tp.user_id = p_user_id
    ORDER BY tp.registration_date DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to list users with role (admin only)
CREATE OR REPLACE FUNCTION fn_user_list_with_roles(
    p_status BOOLEAN DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    out_user JSONB
) AS $$
BEGIN
    /******************************************************************************
      NOMBRE:  fn_user_list_with_roles
      PROPÓSITO: Función para listar usuarios con su rol asignado (uso administrativo)
      INVOCACIÓN: SELECT * FROM fn_user_list_with_roles(true, 50, 0);
                  SELECT * FROM fn_user_list_with_roles(NULL, 50, 0);
      PARÁMETROS:
        - p_status: NULL = todos los usuarios, true = solo activos, false = solo inactivos
        - p_limit: Cantidad máxima de resultados
        - p_offset: Desplazamiento para paginación
      RETORNA: JSONB con los datos de cada usuario y su rol asignado
    ******************************************************************************/
    IF p_status IS NOT NULL THEN
        RETURN QUERY
        SELECT jsonb_build_object(
            'id', u.id,
            'name', u.name,
            'short_name', u.short_name,
            'state', u.state,
            'url_image', u.url_image,
            'creation_date', u.creation_date,
            'modification_date', u.modification_date,
            'role', jsonb_build_object(
                'id', r.id,
                'name', r.name,
                'description', r.description
            )
        ) as user_data
        FROM users u
        INNER JOIN role r ON u.role_id = r.id
        WHERE u.state = CASE WHEN p_status THEN 'active' ELSE 'inactive' END
        ORDER BY u.creation_date DESC
        LIMIT p_limit OFFSET p_offset;
    ELSE
        RETURN QUERY
        SELECT jsonb_build_object(
            'id', u.id,
            'name', u.name,
            'short_name', u.short_name,
            'state', u.state,
            'url_image', u.url_image,
            'creation_date', u.creation_date,
            'modification_date', u.modification_date,
            'role', jsonb_build_object(
                'id', r.id,
                'name', r.name,
                'description', r.description
            )
        ) as user_data
        FROM users u
        INNER JOIN role r ON u.role_id = r.id
        ORDER BY u.creation_date DESC
        LIMIT p_limit OFFSET p_offset;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get accessible modules for a user based on their role
CREATE OR REPLACE FUNCTION fn_user_get_accessible_modules(
    p_user_id INTEGER
)
RETURNS TABLE(
    out_module JSONB
) AS $$
BEGIN
    /******************************************************************************
      NOMBRE:  fn_user_get_accessible_modules
      PROPÓSITO: Función para obtener los módulos/rutas a los que tiene acceso un usuario según su rol
      INVOCACIÓN: SELECT * FROM fn_user_get_accessible_modules(5);
      RETORNA: JSONB con los datos de cada módulo accesible incluyendo:
        - id: ID del módulo
        - url_pattern: Patrón de URL del módulo (ej: /dashboard, /torneos/todas)
        - description: Descripción del módulo
        - role_name: Nombre del rol que otorga el acceso
        - state: Estado del módulo (active/inactive)
      NOTAS:
        - Los patrones con asterisco (*) indican acceso al módulo y todas sus sub-rutas
    ******************************************************************************/
    RETURN QUERY
    SELECT jsonb_build_object(
        'id', m.id,
        'url_pattern', m.url_pattern,
        'description', m.description,
        'role_name', r.name,
        'role_id', r.id,
        'state', m.state
    ) as module
    FROM module m
    INNER JOIN role r ON m.role_id = r.id
    INNER JOIN users u ON u.role_id = r.id
    WHERE u.id = p_user_id
    AND m.state = 'active'
    ORDER BY m.url_pattern ASC;
END;
$$ LANGUAGE plpgsql;
