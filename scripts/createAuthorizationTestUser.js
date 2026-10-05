import mongoose from "mongoose";
import argon2 from "argon2";

const organizationId = "6ac0c5cc8e734b2c3c24d600";
const email = "authorization-test@opervia-demo.com";

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const users = mongoose.connection.collection("users");

  const existingUser = await users.findOne({ email });

  let userId;

  if (existingUser) {
    userId = existingUser._id;
    console.log("Authorization test user already exists.");
  } else {
    const passwordHash = await argon2.hash("AuthorizationTest123!", {
      type: argon2.argon2id,
    });

    const result = await users.insertOne({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      name: "Authorization Test User",
      email,
      passwordHash,
      role: "member",
      status: "active",
      emailVerifiedAt: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    userId = result.insertedId;

    console.log("Authorization test user created.");
  }

  const memberships = mongoose.connection.collection("memberships");

  await memberships.updateOne(
    {
      userId,
      organizationId: new mongoose.Types.ObjectId(organizationId),
    },
    {
      $set: {
        role: "member",
        status: "active",
        updatedAt: new Date(),
      },
      $setOnInsert: {
        userId,
        organizationId: new mongoose.Types.ObjectId(organizationId),
        createdAt: new Date(),
      },
    },
    {
      upsert: true,
    },
  );

  console.log("Authorization test membership is ready.");

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});
