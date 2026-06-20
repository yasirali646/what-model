/**
 * True when the app is deployed to a cloud host (Vercel, AWS, etc.)
 * rather than running on the user's local machine.
 *
 * Set NEXT_PUBLIC_CLOUD_HOSTED=true in your deployment env, or it
 * auto-detects common serverless platforms.
 */
export function isCloudHosted(): boolean {
  if (process.env.NEXT_PUBLIC_CLOUD_HOSTED === "true") return true;
  if (process.env.NEXT_PUBLIC_CLOUD_HOSTED === "false") return false;

  return !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.RENDER ||
    process.env.FLY_APP_NAME ||
    process.env.NETLIFY
  );
}
