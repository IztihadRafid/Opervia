import mongoose from "mongoose";
import { connectDB } from "../db/mongoose";
import Membership from "../db/models/Membership";
import "@/lib/db/models/Organization";
export async function getMembership(userId: string, organizationId: string) {
  await connectDB();

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(organizationId)
  ) {
    return null;
  }

  return Membership.findOne({
    userId,
    organizationId,
    status: "active",
  })
    .populate("organizationId", "name slug")
    .lean();
}
