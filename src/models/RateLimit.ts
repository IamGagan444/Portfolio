import { type Model, model, models, Schema } from "mongoose";

export interface RateLimitDoc {
  key: string;
  count: number;
  expiresAt: Date;
}

const rateLimitSchema = new Schema<RateLimitDoc>(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
    // The TTL monitor removes expired windows automatically.
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { versionKey: false },
);

export const RateLimit: Model<RateLimitDoc> =
  (models.RateLimit as Model<RateLimitDoc> | undefined) ??
  model<RateLimitDoc>("RateLimit", rateLimitSchema);
