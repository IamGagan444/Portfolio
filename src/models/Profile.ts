import { type Model, model, models, Schema } from "mongoose";

import { type MediaDoc, baseOptions, mediaSchema } from "./_shared";

export interface SocialLinkDoc {
  platform: string;
  label: string;
  url: string;
  showInNav: boolean;
}

export interface ProfileDoc {
  /** Fixed key that guarantees a single profile document. */
  singleton: "profile";
  name: string;
  headline: string;
  roles: string[];
  bio: string;
  profileImage: MediaDoc | null;
  /** Photos the homepage ASCII portrait morphs between. */
  heroImages: MediaDoc[];
  location: string;
  locationUrl: string;
  email: string;
  phone: string;
  availability: string;
  socialLinks: SocialLinkDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const socialLinkSchema = new Schema<SocialLinkDoc>(
  {
    platform: { type: String, required: true },
    label: { type: String, required: true },
    url: { type: String, required: true },
    showInNav: { type: Boolean, default: true },
  },
  { _id: false },
);

const profileSchema = new Schema<ProfileDoc>(
  {
    singleton: { type: String, default: "profile", unique: true, immutable: true },
    name: { type: String, required: true, trim: true },
    headline: { type: String, default: "" },
    roles: { type: [String], default: [] },
    bio: { type: String, default: "" },
    profileImage: { type: mediaSchema, default: null },
    heroImages: { type: [mediaSchema], default: [] },
    location: { type: String, default: "" },
    locationUrl: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    availability: { type: String, default: "" },
    socialLinks: { type: [socialLinkSchema], default: [] },
  },
  baseOptions,
);

export const Profile: Model<ProfileDoc> =
  (models.Profile as Model<ProfileDoc> | undefined) ?? model<ProfileDoc>("Profile", profileSchema);
