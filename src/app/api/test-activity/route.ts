import Activity from "@/lib/db/models/Activity";
import User from "@/lib/db/models/User";
import { connectDB } from "@/lib/db/mongoose";
import { NextResponse } from "next/server";


export async function POST() {
  try {
    await connectDB();

    const activity = await Activity.create({
      organizationId: "6ac0c5cc8e734b2c3c24d600",
      userId: "6ac0cfa28e734b2c3c24d603",
      type: "application_added",
      title: "New application added",
      description: "Slack was added to your SaaS inventory",
      entityId: "6ac0c6528e734b2c3c24d601",
    });

    return NextResponse.json({
      success: true,
      activity,
    });
  } catch (error) {
    console.error("Activity creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create activity",
      },
      { status: 500 }
    );
  }
}