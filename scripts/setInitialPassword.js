import mongoose from "mongoose";
import argon2 from "argon2";

const userId = "6ac0cfa28e734b2c3c24d603";

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  const password = process.env.OPERVIA_INITIAL_PASSWORD;

  if (!password) {
    throw new Error(
      "OPERVIA_INITIAL_PASSWORD environment variable is required",
    );
  }

  if (password.length < 8) {
    throw new Error("Initial password must be at least 8 characters");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  const result = await mongoose.connection.collection("users").updateOne(
    {
      _id: new mongoose.Types.ObjectId(userId),
    },
    {
      $set: {
        passwordHash,
      },
    },
  );

  if (result.matchedCount !== 1) {
    throw new Error("User was not found");
  }

  console.log("Initial password hash created successfully.");

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});
