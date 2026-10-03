import Application from "@/lib/db/models/Application";
import { connectDB } from "@/lib/db/mongoose";
import { NextResponse } from "next/server";


export async function POST() {
  try {
    await connectDB();

    const application = await Application.create({
      organizationId: "6ac0c5cc8e734b2c3c24d600",
      name: "Slack",
      vendor: "Slack Technologies",
      category: "Communication",
      description: "Team communication and collaboration platform",
      website: "https://slack.com",
      status: "active",
      owner: "IT Department",
      usersCount: 184,
    });

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Application creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create application",
      },
      { status: 500 }
    );
  }
}