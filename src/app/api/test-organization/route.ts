import Organization from "@/lib/db/models/Organization";
import { connectDB } from "@/lib/db/mongoose";
import { NextResponse } from "next/server";


export async function POST() {
  try {
    await connectDB();

    const organization = await Organization.create({
      name: "Opervia Demo",
      slug: "opervia-demo",
    });

    return NextResponse.json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error("Organization creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create organization",
      },
      { status: 500 }
    );
  }
}