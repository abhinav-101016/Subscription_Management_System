const assert = require("assert");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const validatePassword = require("../utils/validatePassword");
const generateToken = require("../utils/token");
const {
  generateSeededStaffId,
  generateLoginId,
  generateSecurePassword
} = require("../utils/credentialGenerator");
const {
  createStaff,
  listStaff,
  getStaffById,
  updateStaff,
  resetStaffCredentials,
  deleteStaff,
  seedStaff
} = require("../controllers/adminController");
const { login } = require("../controllers/authController");

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

console.log("--- 1. Testing User Model Staff & Credential Schema Fields ---");
const userPaths = User.schema.paths;
assert(userPaths["staffId"], "User: staffId schema field is missing");
assert(userPaths["loginId"], "User: loginId schema field is missing");
assert(userPaths["department"], "User: department schema field is missing");
assert(userPaths["phone"], "User: phone schema field is missing");
assert(userPaths["isActive"], "User: isActive schema field is missing");
assert(userPaths["role"], "User: role schema field is missing");

const roles = userPaths["role"].enumValues;
assert(roles.includes("admin"), "User: 'admin' role missing");
assert(roles.includes("staff"), "User: 'staff' role missing");
assert(roles.includes("customer"), "User: 'customer' role missing");
console.log("✓ User schema fields verified (staffId, loginId, department, phone, isActive, role)");

console.log("\n--- 2. Testing Password Generation & Strict Policy Compliance ---");
for (let i = 0; i < 50; i++) {
  const pwd = generateSecurePassword(12);
  assert(pwd.length >= 10, `Generated password length too short: ${pwd.length}`);
  const err = validatePassword(pwd);
  assert.strictEqual(err, null, `Generated password failed validation: ${pwd} -> ${err}`);
}
assert(validatePassword("weak") !== null, "Should reject short password");
assert(validatePassword("alllowercase123!") !== null, "Should reject password without uppercase");
assert(validatePassword("ALLUPPERCASE123!") !== null, "Should reject password without lowercase");
assert(validatePassword("NoSpecialChars123") !== null, "Should reject password without special chars");
console.log("✓ Password generation strictly satisfies all security requirements (>8 chars, uppercase, lowercase, special char, digits)");

console.log("\n--- 3. Testing Token Generation with Staff Context ---");
process.env.JWT_SECRET = "test_jwt_secret_key";
const testStaffUser = {
  _id: "6723456789abcdef01234567",
  email: "john.staff@odoo.internal",
  role: "staff",
  staffId: "STF-0001",
  loginId: "john.staff"
};
const token = generateToken(testStaffUser);
assert(typeof token === "string" && token.length > 20, "Token should be a valid string");
const jwt = require("jsonwebtoken");
const decoded = jwt.verify(token, process.env.JWT_SECRET);
assert.strictEqual(decoded.email, testStaffUser.email);
assert.strictEqual(decoded.role, "staff");
assert.strictEqual(decoded.staffId, "STF-0001");
assert.strictEqual(decoded.loginId, "john.staff");
console.log("✓ JWT token correctly includes staffId and loginId payload");

console.log("\n--- 4. Testing Admin Controller: Staff Validation & Creation Logic ---");
(async () => {
  // Test 4a: Missing staff name
  const res1 = mockRes();
  await createStaff({ body: {} }, res1);
  assert.strictEqual(res1.statusCode, 400);
  assert.strictEqual(res1.body.message, "Staff name is required");
  console.log("✓ createStaff blocks request when staff name is missing (400 Bad Request)");

  // Test 4b: Custom invalid password rejection
  const res2 = mockRes();
  await createStaff({ body: { name: "Alice", password: "simple" } }, res2);
  assert.strictEqual(res2.statusCode, 400);
  assert(res2.body.message.includes("Password must"), "Expected password validation error message");
  console.log("✓ createStaff blocks custom password violating policy (400 Bad Request)");

  // Setup database mocks
  const originalFind = User.find;
  const originalFindOne = User.findOne;
  const originalCreate = User.create;
  const originalFindByIdAndDelete = User.findByIdAndDelete;

  User.find = () => ({
    select: () => Promise.resolve([])
  });
  User.findOne = () => Promise.resolve(null);

  let createdPayload = null;
  User.create = async (payload) => {
    createdPayload = payload;
    return {
      _id: "6723456789abcdef01234588",
      ...payload,
      createdAt: new Date()
    };
  };

  // Test 4c: Successful creation with auto-generated seeded ID & credentials
  const res3 = mockRes();
  await createStaff(
    {
      body: {
        name: "Robert Taylor",
        department: "Billing"
      }
    },
    res3
  );

  assert.strictEqual(res3.statusCode, 201);
  assert.strictEqual(res3.body.success, true);
  assert.strictEqual(res3.body.staff.name, "Robert Taylor");
  assert.strictEqual(res3.body.staff.role, "staff");
  assert.strictEqual(res3.body.staff.department, "Billing");
  assert(res3.body.credentials.seededId.startsWith("STF-"), "Seeded ID should start with STF-");
  assert(res3.body.credentials.loginId.includes("robert.taylor"), "Login ID should be derived from name");
  assert(res3.body.credentials.temporaryPassword, "Generated password must be returned");
  assert.strictEqual(validatePassword(res3.body.credentials.temporaryPassword), null);
  console.log(`✓ createStaff successfully generated seeded ID (${res3.body.credentials.seededId}), login ID (${res3.body.credentials.loginId}), and temporary password`);

  // Test 4d: Duplicate email / loginId / staffId conflict (409)
  User.findOne = async (query) => {
    if (query.staffId) return { staffId: query.staffId };
    return null;
  };
  const res4 = mockRes();
  await createStaff(
    {
      body: {
        name: "Duplicate Tester",
        staffId: "STF-0001"
      }
    },
    res4
  );
  assert.strictEqual(res4.statusCode, 409);
  assert(res4.body.message.includes("already assigned"));
  console.log("✓ createStaff prevents duplicate seeded staff ID collisions (409 Conflict)");

  console.log("\n--- 5. Testing Admin Controller: List, Get, Update, Credentials Reset, Delete ---");
  const sampleStaffList = [
    {
      _id: "6723456789abcdef01234591",
      name: "Alice Support",
      role: "staff",
      staffId: "STF-0001",
      loginId: "alice.support",
      department: "Support",
      isActive: true
    }
  ];

  User.find = () => ({
    select: () => ({
      sort: () => Promise.resolve(sampleStaffList)
    })
  });

  const resList = mockRes();
  await listStaff({ query: {} }, resList);
  assert.strictEqual(resList.statusCode, 200);
  assert.strictEqual(resList.body.count, 1);
  assert.strictEqual(resList.body.staff[0].staffId, "STF-0001");
  console.log("✓ listStaff returns staff array with seeded IDs");

  // Get by ID / staffId
  const sampleStaff = {
    _id: "6723456789abcdef01234591",
    name: "Alice Support",
    email: "alice@odoo.internal",
    role: "staff",
    staffId: "STF-0001",
    loginId: "alice.support",
    department: "Support",
    isActive: true,
    save: async function () { return this; }
  };
  User.findOne = async () => sampleStaff;

  const resGet = mockRes();
  await getStaffById({ params: { id: "STF-0001" } }, resGet);
  assert.strictEqual(resGet.statusCode, 200);
  assert.strictEqual(resGet.body.staff.staffId, "STF-0001");
  console.log("✓ getStaffById retrieves staff by seeded ID");

  // Update staff
  const resUpdate = mockRes();
  await updateStaff(
    {
      params: { id: "STF-0001" },
      body: { department: "Escalations", phone: "+123456789" }
    },
    resUpdate
  );
  assert.strictEqual(resUpdate.statusCode, 200);
  assert.strictEqual(resUpdate.body.staff.department, "Escalations");
  console.log("✓ updateStaff successfully updates department and phone");

  // Reset Credentials
  const resReset = mockRes();
  await resetStaffCredentials(
    {
      params: { id: "STF-0001" },
      body: {}
    },
    resReset
  );
  assert.strictEqual(resReset.statusCode, 200);
  assert(resReset.body.credentials.temporaryPassword, "Should return new temporary password");
  assert.strictEqual(validatePassword(resReset.body.credentials.temporaryPassword), null);
  console.log("✓ resetStaffCredentials generates a compliant new temporary password");

  // Delete staff
  User.findByIdAndDelete = async () => true;
  const resDelete = mockRes();
  await deleteStaff({ params: { id: "STF-0001" }, query: {} }, resDelete);
  assert.strictEqual(resDelete.statusCode, 200);
  assert(resDelete.body.message.includes("deleted"));
  console.log("✓ deleteStaff successfully removes staff");

  console.log("\n--- 6. Testing Multi-Identifier Staff Login (Email, Login ID, Seeded ID) ---");
  const sampleStaffHash = await bcrypt.hash("Staff@Pass1234!", 10);
  const sampleStaffDoc = {
    _id: "6723456789abcdef01234599",
    name: "Emma Watson",
    email: "emma.watson@odoo.internal",
    loginId: "emma.watson",
    staffId: "STF-0005",
    password: sampleStaffHash,
    role: "staff",
    isActive: true,
    isVerified: true,
    department: "Support"
  };

  User.findOne = async () => sampleStaffDoc;

  // Login via Email
  const resEmailLogin = mockRes();
  await login(
    { body: { email: "emma.watson@odoo.internal", password: "Staff@Pass1234!" } },
    resEmailLogin
  );
  assert.strictEqual(resEmailLogin.statusCode, 200);
  assert(resEmailLogin.body.token, "Login via email should return auth token");
  console.log("✓ Login via email succeeded");

  // Login via Login ID
  const resLoginIdLogin = mockRes();
  await login(
    { body: { loginId: "emma.watson", password: "Staff@Pass1234!" } },
    resLoginIdLogin
  );
  assert.strictEqual(resLoginIdLogin.statusCode, 200);
  assert(resLoginIdLogin.body.token, "Login via loginId should return auth token");
  console.log("✓ Login via generated login ID succeeded");

  // Login via Seeded Staff ID
  const resStaffIdLogin = mockRes();
  await login(
    { body: { identifier: "STF-0005", password: "Staff@Pass1234!" } },
    resStaffIdLogin
  );
  assert.strictEqual(resStaffIdLogin.statusCode, 200);
  assert(resStaffIdLogin.body.token, "Login via seeded staff ID (identifier) should return auth token");
  console.log("✓ Login via seeded staff ID succeeded");

  // Login blocked if deactivated
  sampleStaffDoc.isActive = false;
  const resDeactivated = mockRes();
  await login(
    { body: { loginId: "emma.watson", password: "Staff@Pass1234!" } },
    resDeactivated
  );
  assert.strictEqual(resDeactivated.statusCode, 403);
  assert(resDeactivated.body.message.includes("deactivated"));
  console.log("✓ Login for deactivated staff correctly blocked with 403 Forbidden");

  // Restore mocks
  User.find = originalFind;
  User.findOne = originalFindOne;
  User.create = originalCreate;
  User.findByIdAndDelete = originalFindByIdAndDelete;

  console.log("\n========================================");
  console.log("ALL ADMIN STAFF MANAGEMENT TESTS PASSED!");
  console.log("========================================");
})();
