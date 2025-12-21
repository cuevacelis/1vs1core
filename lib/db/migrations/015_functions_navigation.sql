-- ============================================================================
-- 015_functions_navigation.sql
-- Navigation Functions
-- ============================================================================

-- Function to get navigation items for a user based on their roles
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
    -- PROPÓSITO: Obtiene los items de navegación disponibles para un usuario según sus roles activos
    -- INVOCACIÓN: SELECT * FROM fn_navigation_get_items_for_user(1);
    -- PARÁMETROS:
    --   - p_user_id: ID del usuario para el cual se obtienen los items de navegación
    -- RETORNA: Tabla con los items de navegación (título, href, icono, orden)
    -- VALIDACIONES:
    --   - Solo retorna módulos con state = 'active'
    --   - Solo considera roles activos del usuario (state = 'active')
    --   - Solo retorna módulos marcados como visibles en navegación
    --   - Elimina duplicados (si un usuario tiene múltiples roles con el mismo módulo)
    -- NOTAS:
    --   - Los resultados se ordenan por display_order
    --   - El href se calcula removiendo el wildcard /* si existe
    --   - Si el usuario no tiene roles activos, retorna una tabla vacía
    -- ============================================================================
    RETURN QUERY
    SELECT DISTINCT
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
    INNER JOIN role_user ru ON r.id = ru.role_id
    WHERE ru.user_id = p_user_id
        AND ru.state = 'active'
        AND m.state = 'active'
        AND m.is_visible_in_nav = true
        AND m.title IS NOT NULL  -- Only return modules with navigation metadata
    ORDER BY m.display_order;
END;
$$ LANGUAGE plpgsql;
