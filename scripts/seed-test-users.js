import mongoose from "mongoose";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);

const ORGANIZATION_ID = "6ac0c5cc8e734b2c3c24d600";
const USER_COUNT = 200;
const EMAIL_PREFIX = "opervia.test.user.";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed a production environment.");
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI was not found in the local environment.");
  }

  if (!mongoose.Types.ObjectId.isValid(ORGANIZATION_ID)) {
    throw new Error("The organization ID is invalid.");
  }

  await mongoose.connect(uri);

  try {
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection was not established.");
    }

    const organizationId = new mongoose.Types.ObjectId(ORGANIZATION_ID);

    const organizations = db.collection("organizations");
    const users = db.collection("users");

    const organization = await organizations.findOne({
      _id: organizationId,
    });

    if (!organization) {
      throw new Error("Demo organization not found. No users were seeded.");
    }

    const now = new Date();
    const roles = ["member", "viewer", "admin"];
    const statuses = ["active", "invited", "suspended"];
    const operations = [];

    for (let i = 1; i <= USER_COUNT; i++) {
      const suffix = String(i).padStart(3, "0");
      const email = `${EMAIL_PREFIX}${suffix}@example.com`;

      const existing = await users.findOne(
        { email },
        { projection: { organizationId: 1 } },
      );

      if (existing) {
        if (existing.organizationId.toString() !== ORGANIZATION_ID) {
          throw new Error(
            `Email ${email} already belongs to another organization.`,
          );
        }

        continue;
      }

      operations.push({
        insertOne: {
          document: {
            organizationId,
            name: `Test User ${suffix}`,
            email,
            role: roles[(i - 1) % roles.length],
            status: statuses[(i - 1) % statuses.length],
            sessionVersion: 1,
            emailVerifiedAt: null,
            lastLoginAt: null,
            createdAt: new Date(now.getTime() + i),
            updatedAt: now,
          },
        },
      });
    }

    if (operations.length > 0) {
      await users.bulkWrite(operations, { ordered: true });
    }

    const total = await users.countDocuments({
      organizationId,
    });

    const seeded = await users.countDocuments({
      organizationId,
      email: {
        $regex: "^opervia\\.test\\.user\\.\\d+@example\\.com$",
      },
    });

    console.log("Seed completed.");
    console.log(`New users inserted: ${operations.length}`);
    console.log(`Test users present: ${seeded}`);
    console.log(`Total users in organization: ${total}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exitCode = 1;
});
