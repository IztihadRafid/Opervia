import mongoose from "mongoose";
import Subscription from "../db/models/Subscription";

export async function getMonthlySpend(organizationId: string) {
  const result = await Subscription.aggregate([
    {
      $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        status: "active",
      },
    },
    {
      $group: {
        _id: null,
        monthlySpend: {
          $sum: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: ["$billingCycle", "monthly"],
                  },
                  then: "$amount",
                },
                {
                  case: {
                    $eq: ["$billingCycle", "quarterly"],
                  },
                  then: {
                    $divide: ["$amount", 3],
                  },
                },
                {
                  case: {
                    $eq: ["$billingCycle", "yearly"],
                  },
                  then: {
                    $divide: ["$amount", 12],
                  },
                },
              ],
              default: 0,
            },
          },
        },
      },
    },
  ]);

  return result[0]?.monthlySpend ?? 0;
}
