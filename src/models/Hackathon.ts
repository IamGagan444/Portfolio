import { type Model, model, models, Schema } from "mongoose";

import { type MediaDoc, baseOptions, mediaSchema } from "./_shared";

export interface HackathonDoc {
  title: string;
  location: string;
  startDate: Date;
  endDate: Date | null;
  description: string;
  image: MediaDoc | null;
  links: { title: string; url: string }[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const hackathonSchema = new Schema<HackathonDoc>(
  {
    title: { type: String, required: true, trim: true },
    location: { type: String, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    description: { type: String, default: "" },
    image: { type: mediaSchema, default: null },
    links: {
      type: [new Schema({ title: String, url: String }, { _id: false })],
      default: [],
    },
    order: { type: Number, default: 0, index: true },
  },
  baseOptions,
);

export const Hackathon: Model<HackathonDoc> =
  (models.Hackathon as Model<HackathonDoc> | undefined) ??
  model<HackathonDoc>("Hackathon", hackathonSchema);
