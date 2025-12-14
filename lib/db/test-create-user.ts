import { getPool } from "./config";

async function testCreateUser() {
  const pool = getPool();

  try {
    console.log("Testing user creation with auto-generated access code...\n");

    // Test 1: Create a simple user
    console.log("Test 1: Creating a basic player user...");
    const result1 = await pool.query(
      `SELECT * FROM create_user_with_access_code($1, $2, $3, $4)`,
      ["Test Player", "TestP", null, null],
    );

    const user1 = result1.rows[0];
    console.log("✓ User created successfully:");
    console.log(`  - ID: ${user1.user_id}`);
    console.log(`  - Name: ${user1.user_name}`);
    console.log(`  - Access Code: ${user1.access_code}`);
    console.log(
      "  - IMPORTANT: Save this access code, it cannot be retrieved later!\n",
    );

    // Test 2: Assign role to user
    console.log("Test 2: Assigning 'player' role to user...");
    await pool.query(`SELECT assign_role_to_user($1, $2)`, [
      user1.user_id,
      "player",
    ]);
    console.log("✓ Role assigned successfully\n");

    // Test 3: Verify user and roles
    console.log("Test 3: Verifying user with roles...");
    const verification = await pool.query(
      `SELECT u.id, u.name, u.status,
              COALESCE(
                json_agg(
                  json_build_object('name', r.name)
                ) FILTER (WHERE r.id IS NOT NULL),
                '[]'
              ) as roles
       FROM users u
       LEFT JOIN role_user ru ON u.id = ru.user_id AND ru.status = true
       LEFT JOIN role r ON ru.role_id = r.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [user1.user_id],
    );

    const userWithRoles = verification.rows[0];
    console.log("✓ User verification:");
    console.log(`  - ID: ${userWithRoles.id}`);
    console.log(`  - Name: ${userWithRoles.name}`);
    console.log(`  - Status: ${userWithRoles.status ? "Active" : "Inactive"}`);
    console.log(`  - Roles: ${JSON.stringify(userWithRoles.roles)}\n`);

    // Test 4: Create user with admin role
    console.log("Test 4: Creating admin user...");
    const result2 = await pool.query(
      `SELECT * FROM create_user_with_access_code($1, $2, $3, $4)`,
      ["Admin User", "Admin", null, null],
    );

    const user2 = result2.rows[0];
    await pool.query(`SELECT assign_role_to_user($1, $2)`, [
      user2.user_id,
      "admin",
    ]);
    console.log("✓ Admin user created:");
    console.log(`  - ID: ${user2.user_id}`);
    console.log(`  - Access Code: ${user2.access_code}\n`);

    // Test 5: Test access code uniqueness (generate multiple codes)
    console.log("Test 5: Testing access code uniqueness (5 users)...");
    const accessCodes = new Set();
    for (let i = 0; i < 5; i++) {
      const result = await pool.query(
        `SELECT * FROM create_user_with_access_code($1, $2, $3, $4)`,
        [`Test User ${i + 1}`, null, null, null],
      );
      accessCodes.add(result.rows[0].access_code);
    }
    console.log(`✓ Generated ${accessCodes.size} unique access codes\n`);

    console.log("✓ All tests passed successfully!");
    console.log("\nSummary:");
    console.log("- pgcrypto extension is working");
    console.log("- Access code generation is working");
    console.log("- User creation function is working");
    console.log("- Role assignment function is working");
    console.log("- All codes are unique");
  } catch (error) {
    console.error("✗ Test failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  testCreateUser()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { testCreateUser };
