import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
export async function POST() {
  try {
    await connectDB();

    const user = await User.create({
      organizationId: "6ac0c5cc8e734b2c3c24d600",
      name: "Alex Morgan",
      email: "alex@opervia-demo.com",
      role: "owner",
      status: "active",
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("User creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create user",
      },
      { status: 500 }
    );
  }
}