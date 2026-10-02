import { Schema } from "mongoose";

export interface MediaDoc {
  url: string;
  publicId: string;
  alt?: string;
}

export const mediaSchema = new Schema<MediaDoc>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: "", trim: true },
    alt: { type: String, default: "", trim: true },
  },
  { _id: false },
);

/** Common schema options: timestamps on, no `__v`. */
export const baseOptions = { timestamps: true, versionKey: false } as const;
