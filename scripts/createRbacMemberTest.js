import mongoose from "mongoose";
import argon2 from "argon2";

const organizationId = "6ac0c5cc8e734b2c3c24d600";

const name = "RBAC Member Test";
const email = "rbac-member-test@opervia-demo.com";
const password = "RbacMemberTest123!";

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const users = mongoose.connection.collection("users");
  const memberships = mongoose.connection.collection("memberships");

  const existingUser = await users.findOne({ email });

  if (existingUser) {
    console.log("Test user already exists.");
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  const now = new Date();

  const userResult = await users.insertOne({
    organizationId: new mongoose.Types.ObjectId(organizationId),
    name,
    email,
    passwordHash,
    role: "member",
    status: "active",
    emailVerifiedAt: null,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  });

  await memberships.insertOne({
    userId: userResult.insertedId,
    organizationId: new mongoose.Types.ObjectId(organizationId),
    role: "member",
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  console.log("RBAC member test user created successfully.");
  console.log("Email:", email);
  console.log("User ID:", userResult.insertedId.toString());

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});
