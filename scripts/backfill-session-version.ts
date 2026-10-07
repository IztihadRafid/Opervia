import User from "@/lib/db/models/User";
import { connectDB } from "@/lib/db/mongoose";

async function main() {
  await connectDB();

  const result = await User.updateMany(
    { sessionVersion: { $exists: false } },
    { $set: { sessionVersion: 1 } },
  );

  console.log("Session version migration complete:");
  console.log("Matched:", result.matchedCount);
  console.log("Modified:", result.modifiedCount);

  process.exit(0);
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
