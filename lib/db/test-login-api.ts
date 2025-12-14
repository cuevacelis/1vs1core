async function testLogin() {
  const accessCode = "OA33AYNVNZRR";

  console.log("Testing login with access code:", accessCode);

  try {
    const response = await fetch("http://localhost:3000/rpc/auth.login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accessCode }),
    });

    console.log("Response status:", response.status);
    console.log("Response statusText:", response.statusText);

    const text = await response.text();
    console.log("Response body:", text);

    const data = JSON.parse(text);
    console.log("Response data:", JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("\n✅ LOGIN SUCCESSFUL!");
      console.log("User:", data.user?.name);
      console.log("User ID:", data.user?.id);
      console.log("Roles:", data.user?.roles);
    } else {
      console.log("\n❌ LOGIN FAILED!");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testLogin();
