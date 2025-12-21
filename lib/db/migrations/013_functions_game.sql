-- ============================================================================
-- 013_functions_game.sql
-- Game Module Functions
-- ============================================================================

-- Drop functions if they exist (needed when changing return types)
DROP FUNCTION IF EXISTS fn_game_list();
DROP FUNCTION IF EXISTS fn_game_get_by_id(INTEGER);
DROP FUNCTION IF EXISTS fn_game_create(VARCHAR, VARCHAR, TEXT);

-- Function to list all active games
CREATE OR REPLACE FUNCTION fn_game_list()
RETURNS TABLE(
    out_game JSONB
) AS $$
BEGIN
    /******************************************************************************
      NOMBRE:  fn_game_list
      PROPÓSITO: Función para listar todos los juegos activos ordenados alfabéticamente
      INVOCACIÓN: SELECT * FROM fn_game_list();
      RETORNA: JSONB con los datos de cada juego activo
    ******************************************************************************/
    RETURN QUERY
    SELECT to_jsonb(g.*) as game
    FROM game g
    WHERE g.state = 'active'
    ORDER BY g.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get game by ID
CREATE OR REPLACE FUNCTION fn_game_get_by_id(
    p_game_id INTEGER
)
RETURNS TABLE(
    out_game JSONB
) AS $$
BEGIN
    /******************************************************************************
      NOMBRE:  fn_game_get_by_id
      PROPÓSITO: Función para obtener la información detallada de un juego por su ID
      INVOCACIÓN: SELECT * FROM fn_game_get_by_id(1);
      RETORNA: JSONB con los datos del juego
    ******************************************************************************/
    RETURN QUERY
    SELECT to_jsonb(g.*) as game
    FROM game g
    WHERE g.id = p_game_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new game
CREATE OR REPLACE FUNCTION fn_game_create(
    p_name VARCHAR(100),
    p_type VARCHAR(50),
    p_description TEXT DEFAULT NULL
)
RETURNS TABLE(
    out_game JSONB
) AS $$
DECLARE
    v_game_id INTEGER;
BEGIN
    /******************************************************************************
      NOMBRE:  fn_game_create
      PROPÓSITO: Función para crear un nuevo juego
      INVOCACIÓN: SELECT * FROM fn_game_create('League of Legends', 'MOBA', 'Multiplayer online battle arena');
      RETORNA: JSONB con los datos del juego creado
    ******************************************************************************/
    INSERT INTO game (name, type, description, state)
    VALUES (p_name, p_type, p_description, 'active')
    RETURNING id INTO v_game_id;

    RETURN QUERY
    SELECT to_jsonb(g.*) as game
    FROM game g
    WHERE g.id = v_game_id;
END;
$$ LANGUAGE plpgsql;
