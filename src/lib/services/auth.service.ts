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
