export {};

import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import Application from "@/lib/db/models/Application";
import Subscription from "@/lib/db/models/Subscription";
import Membership from "@/lib/db/models/Membership";
import {
  createSubscriptionSchema,
  getSubscriptionsSchema,
} from "@/lib/validations/subscription.validation";
import { createActivity } from "@/lib/services/activity.service";
import { connectDB } from "@/lib/db/mongoose";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const parsed = getSubscriptionsSchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      billingCycle: searchParams.get("billingCycle") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid query parameters",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const membership = await Membership.findOne({
      userId: new Types.ObjectId(session.user.id),
    }).lean();

    if (!membership) {
      return NextResponse.json(
        { success: false, message: "Organization membership not found" },
        { status: 403 },
      );
    }

    const { page, limit, status, billingCycle, search } = parsed.data;
    const filter: Record<string, unknown> = {
      organizationId: membership.organizationId,
    };

    if (status) filter.status = status;
    if (billingCycle) filter.billingCycle = billingCycle;

    if (search) {
      const matchingApplications = await Application.find({
        organizationId: membership.organizationId,
        name: {
          $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        },
      })
        .select("_id")
        .lean();

      filter.$or = [
        {
          plan: {
            $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        },
        { applicationId: { $in: matchingApplications.map((app) => app._id) } },
      ];
    }

    const [items, total] = await Promise.all([
      Subscription.find(filter)
        .sort({ renewalDate: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Subscription.countDocuments(filter),
    ]);

    const appIds = [
      ...new Set(items.map((item) => String(item.applicationId))),
    ];
    const apps = await Application.find({
      _id: { $in: appIds },
      organizationId: membership.organizationId,
    })
      .select("_id name")
      .lean();

    const appNameMap = new Map(apps.map((app) => [String(app._id), app.name]));

    const subscriptions = items.map((item) => ({
      ...item,
      _id: String(item._id),
      organizationId: String(item.organizationId),
      applicationId: String(item.applicationId),
      applicationName:
        appNameMap.get(String(item.applicationId)) ?? "Unknown application",
      renewalDate: item.renewalDate.toISOString(),
      startDate: item.startDate.toISOString(),
      endDate: item.endDate?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/subscriptions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch subscriptions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();

    const body = await request.json().catch(() => null);
    const parsed = createSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid subscription data",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const membership = await Membership.findOne({
      userId: new Types.ObjectId(session.user.id),
    }).lean();

    if (!membership) {
      return NextResponse.json(
        { success: false, message: "Organization membership not found" },
        { status: 403 },
      );
    }

    const application = await Application.findOne({
      _id: parsed.data.applicationId,
      organizationId: membership.organizationId,
    })
      .select("_id")
      .lean();

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          message: "Application not found in your organization",
        },
        { status: 400 },
      );
    }

    const subscription = await Subscription.create({
      ...parsed.data,
      organizationId: membership.organizationId,
    });

    try {
      await createActivity({
        organizationId: String(membership.organizationId),
        userId: session.user.id,
        type: "subscription_added",
        title: "Subscription added",
        description: `Added subscription: ${parsed.data.plan}`,
      });
    } catch (error) {
      console.error("Subscription activity logging failed:", error);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Subscription created successfully",
        subscription: {
          ...subscription.toObject(),
          _id: String(subscription._id),
          organizationId: String(subscription.organizationId),
          applicationId: String(subscription.applicationId),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/subscriptions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create subscription" },
      { status: 500 },
    );
  }
}
