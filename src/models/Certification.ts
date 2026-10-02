import { type Model, model, models, Schema } from "mongoose";

import { type MediaDoc, baseOptions, mediaSchema } from "./_shared";

export interface CertificationDoc {
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate: Date | null;
  credentialId: string;
  credentialUrl: string;
  certificateImage: MediaDoc | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const certificationSchema = new Schema<CertificationDoc>(
  {
    name: { type: String, required: true, trim: true },
    issuer: { type: String, required: true, trim: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, default: null },
    credentialId: { type: String, default: "" },
    credentialUrl: { type: String, default: "" },
    certificateImage: { type: mediaSchema, default: null },
    order: { type: Number, default: 0, index: true },
  },
  baseOptions,
);

export const Certification: Model<CertificationDoc> =
  (models.Certification as Model<CertificationDoc> | undefined) ??
  model<CertificationDoc>("Certification", certificationSchema);
