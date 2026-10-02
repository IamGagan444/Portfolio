import { type Model, model, models, Schema } from "mongoose";

export interface ResumeDoc {
  title: string;
  fileUrl: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  version: number;
  isActive: boolean;
  uploadedAt: Date;
}

const resumeSchema = new Schema<ResumeDoc>(
  {
    title: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    publicId: { type: String, default: "" },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    version: { type: Number, required: true, unique: true },
    isActive: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false },
);

// The database itself guarantees at most one active resume.
resumeSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

export const Resume: Model<ResumeDoc> =
  (models.Resume as Model<ResumeDoc> | undefined) ?? model<ResumeDoc>("Resume", resumeSchema);
