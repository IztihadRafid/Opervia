import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db/mongoose";
import Application from "@/lib/db/models/Application";
import Subscription from "@/lib/db/models/Subscription";
import Vendor from "@/lib/db/models/Vendor";
import License from "@/lib/db/models/License";
import Expense from "@/lib/db/models/Expense";
import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

    if (query.length < 2 || query.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Search must be between 2 and 100 characters.",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const organization = await requireOrganizationMembership();
    const organizationId = new mongoose.Types.ObjectId(
      organization.organizationId,
    );
    const searchRegex = new RegExp(escapeRegex(query), "i");

    // Only applications belonging to the selected organization.
    const matchingApplications = await Application.find({
      organizationId,
      $or: [
        { name: searchRegex },
        { vendor: searchRegex },
        { category: searchRegex },
        { description: searchRegex },
      ],
    })
      .select("_id name vendor category status")
      .sort({ name: 1 })
      .limit(5)
      .lean();

    // Find applications by name for related subscription/license searches.
    const relatedApplications = await Application.find({
      organizationId,
      name: searchRegex,
    })
      .select("_id name")
      .limit(20)
      .lean();

    const relatedApplicationIds = relatedApplications.map(
      (application) => application._id,
    );

    const [subscriptions, vendors, licenses, expenses] = await Promise.all([
      Subscription.find({
        organizationId,
        $or: [
          { plan: searchRegex },
          { applicationId: { $in: relatedApplicationIds } },
        ],
      })
        .select("_id applicationId plan status renewalDate")
        .sort({ createdAt: -1, _id: -1 })
        .limit(5)
        .lean(),

      Vendor.find({
        organizationId,
        name: searchRegex,
      })
        .select("_id name status")
        .sort({ name: 1 })
        .limit(5)
        .lean(),

      License.find({
        organizationId,
        $or: [
          { name: searchRegex },
          { licenseType: searchRegex },
          { applicationId: { $in: relatedApplicationIds } },
        ],
      })
        .select("_id applicationId name licenseType status expiryDate")
        .sort({ createdAt: -1, _id: -1 })
        .limit(5)
        .lean(),

      organization.role === "admin" || organization.role === "owner"
        ? Expense.find({
            organizationId,
            $or: [
              { title: searchRegex },
              { description: searchRegex },
              { invoiceNumber: searchRegex },
              { category: searchRegex },
            ],
          })
            .select("_id title status expenseDate")
            .sort({ createdAt: -1, _id: -1 })
            .limit(5)
            .lean()
        : Promise.resolve([]),
    ]);

    const applicationNames = new Map(
      relatedApplications.map((application) => [
        application._id.toString(),
        application.name,
      ]),
    );

    return NextResponse.json({
      success: true,
      data: {
        applications: matchingApplications.map((application) => ({
          id: application._id.toString(),
          title: application.name,
          subtitle: `${application.vendor} · ${application.category}`,
          href: "/applications",
        })),

        subscriptions: subscriptions.map((subscription) => ({
          id: subscription._id.toString(),
          title: subscription.plan,
          subtitle:
            applicationNames.get(subscription.applicationId.toString()) ??
            "Subscription",
          href: "/subscriptions",
        })),

        vendors: vendors.map((vendor) => ({
          id: vendor._id.toString(),
          title: vendor.name,
          subtitle: `Vendor · ${vendor.status}`,
          href: "/vendors",
        })),

        licenses: licenses.map((license) => ({
          id: license._id.toString(),
          title: license.name,
          subtitle:
            applicationNames.get(license.applicationId.toString()) ??
            license.licenseType,
          href: "/licenses",
        })),

        expenses: expenses.map((expense) => ({
          id: expense._id.toString(),
          title: expense.title,
          subtitle: `Expense · ${expense.status}`,
          href: "/expenses",
        })),
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have access to this organization.",
        },
        { status: 403 },
      );
    }

    console.error("Global search error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to perform search." },
      { status: 500 },
    );
  }
}
