import mongoose from "mongoose";
import Application from "@/lib/db/models/Application";
import {
  getMonthlySpend,
  getRenewalIntelligence,
} from "@/lib/services/subscription.service";
import User from "@/lib/db/models/User";
import Subscription from "@/lib/db/models/Subscription";
export type DashboardRange = "7d" | "30d" | "90d" | "6m" | "12m";

export interface DashboardSpendingPoint {
  label: string;
  amount: number;
}
export interface DashboardSubscriptionAnalytics {
  active: number;
  expired: number;
  upcomingRenewals: number;
  billingCycle: {
    monthly: number;
    quarterly: number;
    yearly: number;
  };
  costDistribution: {
    low: number;
    medium: number;
    high: number;
  };
}
export interface DashboardApplicationAnalytics {
  total: number;
  status: {
    active: number;
    inactive: number;
    archived: number;
  };
  categories: {
    name: string;
    count: number;
  }[];
  vendors: {
    name: string;
    count: number;
  }[];
  userCountDistribution: {
    zero: number;
    low: number;
    medium: number;
    high: number;
  };
}
export interface DashboardRenewalIntelligence {
  expired: number;
  thisWeek: number;
  thisMonth: number;
  nextMonth: number;
  items: {
    id: string;
    applicationName: string;
    plan: string;
    amount: number;
    currency: string;
    billingCycle: "monthly" | "quarterly" | "yearly";
    renewalDate: string;
    category: "expired" | "this_week" | "this_month" | "next_month";
  }[];
}
export interface DashboardMetrics {
  applications: number;
  monthlySpend: number;
  activeUsers: number;
  upcomingRenewals: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;

  spending: {
    range: DashboardRange;
    data: DashboardSpendingPoint[];
  };

  subscriptions: DashboardSubscriptionAnalytics;
  applications: DashboardApplicationAnalytics;
  renewals: DashboardRenewalIntelligence;
}

interface SpendingBucket {
  key: string;
  start: Date;
  end: Date;
  label: string;
}

function getRangeStart(range: DashboardRange, now: Date): Date {
  const start = new Date(now);

  switch (range) {
    case "7d":
      start.setDate(start.getDate() - 6);
      break;

    case "30d":
      start.setDate(start.getDate() - 29);
      break;

    case "90d":
      start.setDate(start.getDate() - 89);
      break;

    case "6m":
      start.setMonth(start.getMonth() - 5);
      start.setDate(1);
      break;

    case "12m":
      start.setMonth(start.getMonth() - 11);
      start.setDate(1);
      break;
  }

  start.setHours(0, 0, 0, 0);

  return start;
}

function getDisplayLabel(date: Date, range: DashboardRange): string {
  if (range === "7d" || range === "30d" || range === "90d") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    year: range === "12m" ? "numeric" : undefined,
  });
}

function createSpendingBuckets(
  range: DashboardRange,
  now: Date,
): SpendingBucket[] {
  const buckets: SpendingBucket[] = [];

  if (range === "7d" || range === "30d" || range === "90d") {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;

    for (let index = days - 1; index >= 0; index -= 1) {
      const start = new Date(now);

      start.setDate(start.getDate() - index);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      buckets.push({
        key: start.toISOString().slice(0, 10),
        start,
        end,
        label: getDisplayLabel(start, range),
      });
    }

    return buckets;
  }

  const months = range === "6m" ? 6 : 12;

  for (let index = months - 1; index >= 0; index -= 1) {
    const start = new Date(now);

    start.setMonth(start.getMonth() - index);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    buckets.push({
      key: start.toISOString().slice(0, 7),
      start,
      end,
      label: getDisplayLabel(start, range),
    });
  }

  return buckets;
}

async function getSpendingAnalytics(
  organizationId: string,
  range: DashboardRange,
): Promise<DashboardSpendingPoint[]> {
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    return [];
  }

  const now = new Date();
  const rangeStart = getRangeStart(range, now);

  const buckets = createSpendingBuckets(range, now);

  const organizationObjectId = new mongoose.Types.ObjectId(organizationId);

  const subscriptions = await Subscription.aggregate([
    {
      $match: {
        organizationId: organizationObjectId,

        startDate: {
          $lt: now,
        },

        $or: [
          {
            endDate: {
              $exists: false,
            },
          },
          {
            endDate: null,
          },
          {
            endDate: {
              $gte: rangeStart,
            },
          },
        ],
      },
    },

    {
      $project: {
        startDate: 1,
        endDate: 1,
        amount: 1,
        billingCycle: 1,
      },
    },

    {
      $addFields: {
        monthlyAmount: {
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
  ]);

  return buckets.map((bucket) => {
    const amount = subscriptions.reduce((total, subscription) => {
      const startDate = new Date(subscription.startDate);

      const endDate = subscription.endDate
        ? new Date(subscription.endDate)
        : null;

      const isActiveDuringBucket =
        startDate < bucket.end && (!endDate || endDate >= bucket.start);

      if (!isActiveDuringBucket) {
        return total;
      }

      return total + Number(subscription.monthlyAmount ?? 0);
    }, 0);

    return {
      label: bucket.label,
      amount: Math.round(amount * 100) / 100,
    };
  });
}
async function getSubscriptionAnalytics(
  organizationId: string,
): Promise<DashboardSubscriptionAnalytics> {
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    return {
      active: 0,
      expired: 0,
      upcomingRenewals: 0,
      billingCycle: {
        monthly: 0,
        quarterly: 0,
        yearly: 0,
      },
      costDistribution: {
        low: 0,
        medium: 0,
        high: 0,
      },
    };
  }

  const now = new Date();

  const thirtyDaysFromNow = new Date(now);

  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const organizationObjectId = new mongoose.Types.ObjectId(organizationId);

  const result = await Subscription.aggregate([
    {
      $match: {
        organizationId: organizationObjectId,
      },
    },

    {
      $facet: {
        active: [
          {
            $match: {
              status: "active",
            },
          },
          {
            $count: "count",
          },
        ],

        expired: [
          {
            $match: {
              status: "expired",
            },
          },
          {
            $count: "count",
          },
        ],

        upcomingRenewals: [
          {
            $match: {
              status: "active",
              renewalDate: {
                $gte: now,
                $lte: thirtyDaysFromNow,
              },
            },
          },
          {
            $count: "count",
          },
        ],

        billingCycle: [
          {
            $match: {
              status: {
                $in: ["active", "paused"],
              },
            },
          },
          {
            $group: {
              _id: "$billingCycle",
              count: {
                $sum: 1,
              },
            },
          },
        ],

        costDistribution: [
          {
            $match: {
              status: {
                $in: ["active", "paused"],
              },
            },
          },
          {
            $addFields: {
              monthlyAmount: {
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
          {
            $group: {
              _id: null,

              low: {
                $sum: {
                  $cond: [
                    {
                      $lt: ["$monthlyAmount", 100],
                    },
                    1,
                    0,
                  ],
                },
              },

              medium: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $gte: ["$monthlyAmount", 100],
                        },
                        {
                          $lt: ["$monthlyAmount", 500],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },

              high: {
                $sum: {
                  $cond: [
                    {
                      $gte: ["$monthlyAmount", 500],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],
      },
    },
  ]);

  const analytics = result[0];

  const active = analytics?.active?.[0]?.count ?? 0;

  const expired = analytics?.expired?.[0]?.count ?? 0;

  const upcomingRenewals = analytics?.upcomingRenewals?.[0]?.count ?? 0;

  const billingCycle = {
    monthly: 0,
    quarterly: 0,
    yearly: 0,
  };

  for (const item of analytics?.billingCycle ?? []) {
    if (item._id === "monthly") {
      billingCycle.monthly = item.count;
    }

    if (item._id === "quarterly") {
      billingCycle.quarterly = item.count;
    }

    if (item._id === "yearly") {
      billingCycle.yearly = item.count;
    }
  }

  const costDistribution = {
    low: analytics?.costDistribution?.[0]?.low ?? 0,
    medium: analytics?.costDistribution?.[0]?.medium ?? 0,
    high: analytics?.costDistribution?.[0]?.high ?? 0,
  };

  return {
    active,
    expired,
    upcomingRenewals,
    billingCycle,
    costDistribution,
  };
}

async function getApplicationAnalytics(
  organizationId: string,
): Promise<DashboardApplicationAnalytics> {
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    return {
      total: 0,
      status: {
        active: 0,
        inactive: 0,
        archived: 0,
      },
      categories: [],
      vendors: [],
      userCountDistribution: {
        zero: 0,
        low: 0,
        medium: 0,
        high: 0,
      },
    };
  }

  const organizationObjectId = new mongoose.Types.ObjectId(organizationId);

  const result = await Application.aggregate([
    {
      $match: {
        organizationId: organizationObjectId,
      },
    },

    {
      $facet: {
        total: [
          {
            $count: "count",
          },
        ],

        status: [
          {
            $group: {
              _id: "$status",
              count: {
                $sum: 1,
              },
            },
          },
        ],

        categories: [
          {
            $group: {
              _id: "$category",
              count: {
                $sum: 1,
              },
            },
          },
          {
            $sort: {
              count: -1,
              _id: 1,
            },
          },
          {
            $limit: 10,
          },
        ],

        vendors: [
          {
            $group: {
              _id: "$vendor",
              count: {
                $sum: 1,
              },
            },
          },
          {
            $sort: {
              count: -1,
              _id: 1,
            },
          },
          {
            $limit: 10,
          },
        ],

        userCountDistribution: [
          {
            $group: {
              _id: null,

              zero: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$usersCount", 0],
                    },
                    1,
                    0,
                  ],
                },
              },

              low: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $gte: ["$usersCount", 1],
                        },
                        {
                          $lte: ["$usersCount", 10],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },

              medium: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $gte: ["$usersCount", 11],
                        },
                        {
                          $lte: ["$usersCount", 100],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },

              high: {
                $sum: {
                  $cond: [
                    {
                      $gt: ["$usersCount", 100],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],
      },
    },
  ]);

  const analytics = result[0];

  const status = {
    active: 0,
    inactive: 0,
    archived: 0,
  };

  for (const item of analytics?.status ?? []) {
    if (item._id === "active") {
      status.active = item.count;
    }

    if (item._id === "inactive") {
      status.inactive = item.count;
    }

    if (item._id === "archived") {
      status.archived = item.count;
    }
  }

  const categories = (analytics?.categories ?? []).map(
    (item: { _id: string; count: number }) => ({
      name: item._id,
      count: item.count,
    }),
  );

  const vendors = (analytics?.vendors ?? []).map(
    (item: { _id: string; count: number }) => ({
      name: item._id,
      count: item.count,
    }),
  );

  const userCountDistribution = {
    zero: analytics?.userCountDistribution?.[0]?.zero ?? 0,

    low: analytics?.userCountDistribution?.[0]?.low ?? 0,

    medium: analytics?.userCountDistribution?.[0]?.medium ?? 0,

    high: analytics?.userCountDistribution?.[0]?.high ?? 0,
  };

  return {
    total: analytics?.total?.[0]?.count ?? 0,
    status,
    categories,
    vendors,
    userCountDistribution,
  };
}

export async function getDashboardData(
  organizationId: string,
  range: DashboardRange = "12m",
): Promise<DashboardData> {
  const [
    monthlySpend,
    activeUsers,
    spending,
    subscriptions,
    applicationAnalytics,
    renewalIntelligence,
  ] = await Promise.all([
    getMonthlySpend(organizationId),
    User.countDocuments({
      organizationId,
      status: "active",
    }),
    getSpendingAnalytics(organizationId, range),
    getSubscriptionAnalytics(organizationId),
    getApplicationAnalytics(organizationId),
    getRenewalIntelligence(organizationId),
  ]);

  return {
    metrics: {
      applications: applicationAnalytics.total,
      monthlySpend,
      activeUsers,
      upcomingRenewals: subscriptions.upcomingRenewals,
    },
    spending: {
      range,
      data: spending,
    },
    subscriptions,
    applications: applicationAnalytics,
    renewals: renewalIntelligence,
  };
}
