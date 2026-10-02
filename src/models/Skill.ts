import { type Model, model, models, Schema } from "mongoose";

import { baseOptions } from "./_shared";

export interface SkillDoc {
  name: string;
  category: string;
  proficiency: number;
  icon: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const skillSchema = new Schema<SkillDoc>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "Other" },
    proficiency: { type: Number, default: 0, min: 0, max: 100 },
    icon: { type: String, default: "" },
    order: { type: Number, default: 0, index: true },
  },
  baseOptions,
);

export const Skill: Model<SkillDoc> =
  (models.Skill as Model<SkillDoc> | undefined) ?? model<SkillDoc>("Skill", skillSchema);
