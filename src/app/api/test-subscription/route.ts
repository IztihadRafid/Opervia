
import Subscription from "@/lib/db/models/Subscription";
import { connectDB } from "@/lib/db/mongoose";
import { NextResponse } from "next/server";


export async function POST() {
  try {
    await connectDB();

    const subscription = await Subscription.create({
      organizationId: "6ac0c5cc8e734b2c3c24d600",
      applicationId: "6ac0c6528e734b2c3c24d601",

      plan: "Business",
      billingCycle: "yearly",
      amount: 2400,
      currency: "USD",

      renewalDate: new Date("2027-10-14"),
      status: "active",

      startDate: new Date("2026-10-14"),
    });

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error("Subscription creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create subscription",
      },
      { status: 500 }
    );
  }
}