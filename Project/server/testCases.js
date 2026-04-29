import fetch from "node-fetch";

const API = "http://localhost:3000";

// ----------------------------
// Test Case 1: Valid Signup
// ----------------------------
async function testSignupSuccess() {
  const res = await fetch(API + "/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      u_first_name: "Test",
      u_last_name: "User",
      u_email: "testuser123@gmail.com",
      u_password: "Password1!",
      u_is_admin: 0
    }),
  });

  const data = await res.json();
  console.log("Test 1 - Signup Success:", data);
}

// ----------------------------
// Test Case 2: Invalid Password
// ----------------------------
async function testSignupFail() {
  const res = await fetch(API + "/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      u_first_name: "Bad",
      u_last_name: "User",
      u_email: "baduser@gmail.com",
      u_password: "123", // invalid
    }),
  });

  const data = await res.json();
  console.log("Test 2 - Invalid Password:", data);
}

// ----------------------------
// Test Case 3: Login Failure
// ----------------------------
async function testLoginFail() {
  const res = await fetch(API + "/user/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      u_email: "wrong@gmail.com",
      u_password: "Password1!",
    }),
  });

  const data = await res.json();
  console.log("Test 3 - Login Failure:", data);
}

// Run tests
async function runTests() {
  await testSignupSuccess();
  await testSignupFail();
  await testLoginFail();
}

runTests();