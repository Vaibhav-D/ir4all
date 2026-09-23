/**
 * The learning portal (LMS) lives on its own deployment. Override with
 * NEXT_PUBLIC_PORTAL_URL (e.g. http://localhost:3100 in .env.local).
 */
export const PORTAL_URL = (process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://ir4all-lms.vercel.app").replace(/\/$/, "");
export const PORTAL_LOGIN_URL = `${PORTAL_URL}/login`;
