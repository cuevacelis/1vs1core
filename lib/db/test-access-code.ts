import * as bcrypt from "bcryptjs";

const accessCode = "OA33AYNVNZRR";
const storedHash =
  "$2a$06$RzbBV6c0crCAJowTznAVw.rfyr8MySolA1QSlhIW9WBQ.r/LOaZ5O";

async function testAccessCode() {
  console.log("Testing access code:", accessCode);
  console.log("Against hash:", storedHash);

  const isMatch = await bcrypt.compare(accessCode, storedHash);

  console.log("Match result:", isMatch);

  if (!isMatch) {
    console.log("\nThe access code does NOT match the stored hash.");
    console.log("This means either:");
    console.log("1. The access code is incorrect");
    console.log("2. The hash was generated incorrectly");

    // Generate a new hash with the access code to compare
    const newHash = await bcrypt.hash(accessCode, 10);
    console.log("\nNew hash with bcryptjs (10 rounds):", newHash);

    const testMatch = await bcrypt.compare(accessCode, newHash);
    console.log("Test match with new hash:", testMatch);
  } else {
    console.log("\nAccess code is CORRECT!");
  }
}

testAccessCode().catch(console.error);
