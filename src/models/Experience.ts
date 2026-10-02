import { type Model, model, models, Schema } from "mongoose";

import { type MediaDoc, baseOptions, mediaSchema } from "./_shared";

export interface ExperienceDoc {
  company: string;
  companyUrl: string;
  logo: MediaDoc | null;
  position: string;
  location: string;
  employmentType: string;
  startDate: Date;
  endDate: Date | null;
  currentlyWorking: boolean;
  description: string;
  technologies: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const experienceSchema = new Schema<ExperienceDoc>(
  {
    company: { type: String, required: true, trim: true },
    companyUrl: { type: String, default: "" },
    logo: { type: mediaSchema, default: null },
    position: { type: String, required: true, trim: true },
    location: { type: String, default: "" },
    employmentType: { type: String, default: "Full-time" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    currentlyWorking: { type: Boolean, default: false },
    description: { type: String, default: "" },
    technologies: { type: [String], default: [] },
    order: { type: Number, default: 0, index: true },
  },
  baseOptions,
);

export const Experience: Model<ExperienceDoc> =
  (models.Experience as Model<ExperienceDoc> | undefined) ??
  model<ExperienceDoc>("Experience", experienceSchema);
