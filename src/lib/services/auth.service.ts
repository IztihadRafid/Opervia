import User from "../db/models/User";
import { connectDB } from "../db/mongoose";

export async function getUserForAuthentication(email: string) {
  await connectDB();

  return User.findOne({
    email: email.toLowerCase().trim(),
  })
    .select("+passwordHash")
    .lean();
}

export async function getUserForSession(userId: string) {
  await connectDB();

  const user = await User.findById(userId)
    .select("_id status sessionVersion")
    .lean();

  console.log("SESSION CHECK:", {
    userId,
    status: user?.status,
    sessionVersion: user?.sessionVersion,
  });

  return user;
}

export async function updateLastLoginAt(userId: string) {
  await connectDB();

  await User.updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() } });
}
