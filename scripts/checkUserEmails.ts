import User from "@/lib/db/models/User";
import { connectDB } from "@/lib/db/mongoose";

async function checkUserEmails() {
  await connectDB();

  const duplicates = await User.aggregate([
    {
      $group: {
        _id: "$email",
        count: { $sum: 1 },
        users: {
          $push: {
            id: "$_id",
            name: "$name",
            organizationId: "$organizationId",
          },
        },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
  ]);

  console.log(JSON.stringify(duplicates, null, 2));

  process.exit(0);
}

checkUserEmails().catch((error) => {
  console.error(error);
  process.exit(1);
});
