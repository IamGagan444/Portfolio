import { type Model, model, models, Schema } from "mongoose";

import { type MediaDoc, baseOptions, mediaSchema } from "./_shared";

export interface ProjectDoc {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnail: MediaDoc | null;
  images: MediaDoc[];
  video: string;
  technologies: string[];
  category: string;
  liveUrl: string;
  githubUrl: string;
  featured: boolean;
  status: "published" | "draft";
  startDate: Date | null;
  endDate: Date | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<ProjectDoc>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, required: true, trim: true, maxlength: 400 },
    description: { type: String, default: "" },
    thumbnail: { type: mediaSchema, default: null },
    images: { type: [mediaSchema], default: [] },
    video: { type: String, default: "" },
    technologies: { type: [String], default: [] },
    category: { type: String, default: "", trim: true },
    liveUrl: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ["published", "draft"], default: "draft" },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    order: { type: Number, default: 0 },
  },
  baseOptions,
);

projectSchema.index({ status: 1, order: 1 });
projectSchema.index({ featured: 1, status: 1 });

export const Project: Model<ProjectDoc> =
  (models.Project as Model<ProjectDoc> | undefined) ?? model<ProjectDoc>("Project", projectSchema);
