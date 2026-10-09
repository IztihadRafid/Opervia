import mongoose from "mongoose";
import Subscription from "../db/models/Subscription";

export interface RenewalIntelligenceItem {
  id: string;
  applicationName: string;
  plan: string;
  amount: number;
  currency: string;
  billingCycle: "monthly" | "quarterly" | "yearly";
  renewalDate: string;
  category: "expired" | "this_week" | "this_month" | "next_month";
}

export interface RenewalIntelligence {
  expired: number;
  thisWeek: number;
  thisMonth: number;
  nextMonth: number;
  items: RenewalIntelligenceItem[];
}

export async function getMonthlySpend(organizationId: string) {
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    return 0;
  }
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

export async function getRenewalIntelligence(
  organizationId: string,
): Promise<RenewalIntelligence> {
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    return {
      expired: 0,
      thisWeek: 0,
      thisMonth: 0,
      nextMonth: 0,
      items: [],
    };
  }

  const organizationObjectId = new mongoose.Types.ObjectId(organizationId);

  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const startOfWeek = new Date(startOfToday);
  const dayOfWeek = startOfWeek.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  const startOfNextWeek = new Date(endOfWeek);
  const startOfNextMonth = new Date(
    startOfToday.getFullYear(),
    startOfToday.getMonth() + 1,
    1,
  );

  const startOfMonthAfterNext = new Date(
    startOfToday.getFullYear(),
    startOfToday.getMonth() + 2,
    1,
  );

  const result = await Subscription.aggregate([
    {
      $match: {
        organizationId: organizationObjectId,
      },
    },

    {
      $facet: {
        expired: [
          {
            $match: {
              renewalDate: {
                $lt: startOfToday,
              },
              status: {
                $in: ["active", "expired"],
              },
            },
          },
          {
            $count: "count",
          },
        ],

        thisWeek: [
          {
            $match: {
              status: "active",
              renewalDate: {
                $gte: startOfToday,
                $lt: endOfWeek,
              },
            },
          },
          {
            $count: "count",
          },
        ],

        thisMonth: [
          {
            $match: {
              status: "active",
              renewalDate: {
                $gte: startOfNextWeek,
                $lt: startOfNextMonth,
              },
            },
          },
          {
            $count: "count",
          },
        ],

        nextMonth: [
          {
            $match: {
              status: "active",
              renewalDate: {
                $gte: startOfNextMonth,
                $lt: startOfMonthAfterNext,
              },
            },
          },
          {
            $count: "count",
          },
        ],

        items: [
          {
            $match: {
              $or: [
                {
                  status: "active",
                  renewalDate: {
                    $gte: startOfToday,
                    $lt: startOfMonthAfterNext,
                  },
                },
                {
                  renewalDate: {
                    $lt: startOfToday,
                  },
                  status: {
                    $in: ["active", "expired"],
                  },
                },
              ],
            },
          },

          {
            $lookup: {
              from: "applications",
              localField: "applicationId",
              foreignField: "_id",
              as: "application",
            },
          },

          {
            $unwind: {
              path: "$application",
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $sort: {
              renewalDate: 1,
              _id: 1,
            },
          },

          {
            $limit: 20,
          },

          {
            $project: {
              _id: 1,
              plan: 1,
              amount: 1,
              currency: 1,
              billingCycle: 1,
              renewalDate: 1,
              applicationName: {
                $ifNull: ["$application.name", "Unknown application"],
              },
            },
          },
        ],
      },
    },
  ]);

  const analytics = result[0];

  const expired = analytics?.expired?.[0]?.count ?? 0;

  const thisWeek = analytics?.thisWeek?.[0]?.count ?? 0;

  const thisMonth = analytics?.thisMonth?.[0]?.count ?? 0;

  const nextMonth = analytics?.nextMonth?.[0]?.count ?? 0;

  const items: RenewalIntelligenceItem[] = (analytics?.items ?? []).map(
    (item: {
      _id: mongoose.Types.ObjectId;
      applicationName: string;
      plan: string;
      amount: number;
      currency: string;
      billingCycle: "monthly" | "quarterly" | "yearly";
      renewalDate: Date;
    }) => {
      const renewalDate = new Date(item.renewalDate);

      let category: RenewalIntelligenceItem["category"];

      if (renewalDate < startOfToday) {
        category = "expired";
      } else if (renewalDate < endOfWeek) {
        category = "this_week";
      } else if (renewalDate < startOfNextMonth) {
        category = "this_month";
      } else {
        category = "next_month";
      }

      return {
        id: item._id.toString(),
        applicationName: item.applicationName,
        plan: item.plan,
        amount: item.amount,
        currency: item.currency,
        billingCycle: item.billingCycle,
        renewalDate: renewalDate.toISOString(),
        category,
      };
    },
  );

  return {
    expired,
    thisWeek,
    thisMonth,
    nextMonth,
    items,
  };
}
