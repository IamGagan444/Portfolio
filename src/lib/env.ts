import "server-only";

/**
 * Server-only environment access. Values are read lazily so that a missing
 * optional integration (e.g. Cloudinary) only fails the code path that needs it.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get mongodbUri() {
    return required("MONGODB_URI");
  },
  get cloudinary() {
    return {
      cloudName: required("CLOUDINARY_CLOUD_NAME"),
      apiKey: required("CLOUDINARY_API_KEY"),
      apiSecret: required("CLOUDINARY_API_SECRET"),
      folder: process.env.CLOUDINARY_FOLDER || "portfolio",
    };
  },
};
