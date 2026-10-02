import { type Model, model, models, Schema } from "mongoose";

export interface AdminUserDoc {
  email: string;
  name: string;
  passwordHash: string;
  /** Incremented on password change; invalidates every existing session. */
  authVersion: number;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const adminUserSchema = new Schema<AdminUserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: "Admin" },
    passwordHash: { type: String, required: true, select: false },
    authVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

export const AdminUser: Model<AdminUserDoc> =
  (models.AdminUser as Model<AdminUserDoc> | undefined) ??
  model<AdminUserDoc>("AdminUser", adminUserSchema);
