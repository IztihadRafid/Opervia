import mongoose from "mongoose";

const userId = "6ac0cfa28e734b2c3c24d603";
const organizationId = "6ac0c5cc8e734b2c3c24d600";

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const memberships = mongoose.connection.collection("memberships");

  const result = await memberships.updateOne(
    {
      userId: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    },
    {
      $set: {
        role: "owner",
        status: "active",
      },
      $setOnInsert: {
        userId: new mongoose.Types.ObjectId(userId),
        organizationId: new mongoose.Types.ObjectId(organizationId),
        createdAt: new Date(),
      },
    },
    {
      upsert: true,
    },
  );

  console.log(
    result.upsertedCount === 1
      ? "Initial membership created successfully."
      : "Initial membership already existed; updated successfully.",
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});
