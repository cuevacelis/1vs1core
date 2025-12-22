-- ============================================================================
-- 015_functions_navigation.sql
-- Navigation Functions
-- ============================================================================

-- Function to get navigation items for a user based on their role
CREATE OR REPLACE FUNCTION fn_navigation_get_items_for_user(
    p_user_id INTEGER
)
RETURNS TABLE(
    title VARCHAR(100),
    href VARCHAR(200),
    icon VARCHAR(50),
    display_order INTEGER
) AS $$
BEGIN
    -- ============================================================================
    -- NOMBRE:  fn_navigation_get_items_for_user
    -- PROPÓSITO: Obtiene los items de navegación disponibles para un usuario según su rol
    -- INVOCACIÓN: SELECT * FROM fn_navigation_get_items_for_user(1);
    -- PARÁMETROS:
    --   - p_user_id: ID del usuario para el cual se obtienen los items de navegación
    -- RETORNA: Tabla con los items de navegación (título, href, icono, orden)
    -- VALIDACIONES:
    --   - Solo retorna módulos con state = 'active'
    --   - Solo retorna módulos marcados como visibles en navegación
    -- NOTAS:
    --   - Los resultados se ordenan por display_order
    --   - El href se calcula removiendo el wildcard /* si existe
    --   - Si el usuario no existe, retorna una tabla vacía
    -- ============================================================================
    RETURN QUERY
    SELECT
        m.title,
        -- Remove wildcard /* from url_pattern to get the base href
        CASE
            WHEN m.url_pattern LIKE '%/*' THEN
                LEFT(m.url_pattern, LENGTH(m.url_pattern) - 2)
            ELSE
                m.url_pattern
        END AS href,
        m.icon,
        m.display_order
    FROM module m
    INNER JOIN role r ON m.role_id = r.id
    INNER JOIN users u ON u.role_id = r.id
    WHERE u.id = p_user_id
        AND m.state = 'active'
        AND m.is_visible_in_nav = true
        AND m.title IS NOT NULL  -- Only return modules with navigation metadata
    ORDER BY m.display_order;
END;
$$ LANGUAGE plpgsql;
