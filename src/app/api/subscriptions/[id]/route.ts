import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/mongoose";
import {
  ForbiddenError,
  UnauthorizedError,
  requireOrganizationMembership,
} from "@/lib/auth/organization";
import Application from "@/lib/db/models/Application";
import Subscription from "@/lib/db/models/Subscription";
import { createActivity } from "@/lib/services/activity.service";
import { updateSubscriptionSchema } from "@/lib/validations/subscription.validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid subscription ID" },
        { status: 400 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body" },
        { status: 400 },
      );
    }

    const result = updateSubscriptionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid subscription data",
          errors: result.error.issues,
        },
        { status: 400 },
      );
    }

    const organization = await requireOrganizationMembership();
    const organizationId = new mongoose.Types.ObjectId(
      organization.organizationId,
    );

    const existing = await Subscription.findOne({
      _id: id,
      organizationId,
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Subscription not found" },
        { status: 404 },
      );
    }

    const input = result.data;

    if (input.applicationId) {
      const applicationExists = await Application.exists({
        _id: input.applicationId,
        organizationId,
      });

      if (!applicationExists) {
        return NextResponse.json(
          {
            success: false,
            message: "Application not found in the current organization",
          },
          { status: 404 },
        );
      }
    }

    const nextStartDate = input.startDate ?? existing.startDate;
    const hasEndDateUpdate = Object.prototype.hasOwnProperty.call(
      input,
      "endDate",
    );
    const nextEndDate = hasEndDateUpdate ? input.endDate : existing.endDate;

    if (nextEndDate != null && nextEndDate < nextStartDate) {
      return NextResponse.json(
        {
          success: false,
          message: "End date cannot be before the start date",
        },
        { status: 400 },
      );
    }

    const subscription = await Subscription.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: input },
      { new: true, runValidators: true },
    );

    if (!subscription) {
      return NextResponse.json(
        { success: false, message: "Subscription not found" },
        { status: 404 },
      );
    }

    try {
      await createActivity({
        organizationId: organization.organizationId,
        userId: organization.userId,
        type: "subscription_updated",
        title: "Subscription updated",
        description: `The ${subscription.plan} subscription was updated.`,
        entityId: subscription._id.toString(),
      });
    } catch (activityError) {
      console.error("Failed to log subscription update:", activityError);
    }

    return NextResponse.json({
      success: true,
      subscription: {
        _id: subscription._id.toString(),
        organizationId: subscription.organizationId.toString(),
        applicationId: subscription.applicationId.toString(),
        plan: subscription.plan,
        billingCycle: subscription.billingCycle,
        amount: subscription.amount,
        currency: subscription.currency,
        renewalDate: subscription.renewalDate.toISOString(),
        status: subscription.status,
        startDate: subscription.startDate.toISOString(),
        endDate: subscription.endDate?.toISOString(),
        createdAt: subscription.createdAt.toISOString(),
        updatedAt: subscription.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 },
      );
    }

    console.error("Update subscription API error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update subscription" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid subscription ID" },
        { status: 400 },
      );
    }

    const organization = await requireOrganizationMembership();

    const subscription = await Subscription.findOneAndDelete({
      _id: id,
      organizationId: organization.organizationId,
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, message: "Subscription not found" },
        { status: 404 },
      );
    }

    try {
      await createActivity({
        organizationId: organization.organizationId,
        userId: organization.userId,
        type: "subscription_deleted",
        title: "Subscription deleted",
        description: `The ${subscription.plan} subscription was deleted.`,
        entityId: subscription._id.toString(),
      });
    } catch (activityError) {
      console.error("Failed to log subscription deletion:", activityError);
    }

    return NextResponse.json({
      success: true,
      message: "Subscription deleted successfully",
      subscription: { _id: subscription._id.toString() },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 },
      );
    }

    console.error("Delete subscription API error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete subscription" },
      { status: 500 },
    );
  }
}
