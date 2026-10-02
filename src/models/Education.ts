import { type Model, model, models, Schema } from "mongoose";

import { type MediaDoc, baseOptions, mediaSchema } from "./_shared";

export interface EducationDoc {
  institution: string;
  institutionUrl: string;
  logo: MediaDoc | null;
  degree: string;
  field: string;
  startDate: Date;
  endDate: Date | null;
  description: string;
  grade: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const educationSchema = new Schema<EducationDoc>(
  {
    institution: { type: String, required: true, trim: true },
    institutionUrl: { type: String, default: "" },
    logo: { type: mediaSchema, default: null },
    degree: { type: String, required: true, trim: true },
    field: { type: String, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    description: { type: String, default: "" },
    grade: { type: String, default: "" },
    order: { type: Number, default: 0, index: true },
  },
  baseOptions,
);

export const Education: Model<EducationDoc> =
  (models.Education as Model<EducationDoc> | undefined) ??
  model<EducationDoc>("Education", educationSchema);
