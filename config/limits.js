// Safety caps. Move to Firestore platformSettings in Phase 11 so admins can tune them.
const MB = 1024 * 1024;
export const LIMITS = {
  maxProjectsPerUser: 50,
  maxFavoritesPerUser: 200,
  // Abuse guards that apply IN ADDITION to credits: jobs per user per UTC day.
  maxJobsPerUserPerDay: 40,
  // Extra daily caps for expensive job types (a document job makes several provider calls).
  dailyCapsByType: { image: 10, document: 10 },
  maxJobRequestsPerMinute: 10,
  // Developer API
  maxApiKeysPerUser: 5,
  apiRequestsPerMinutePerKey: 30,
  apiRequestsPerMinutePerIp: 120,
  // Uploads go through our server, so they must fit the host's request-body limit (about 4.5 MB on Vercel).
  maxUploadBytes: 4 * MB,
  maxStorageBytesPerUser: 200 * MB,
  uploadRetentionDays: 7,
  outputRetentionDays: 30,
  // Prompts / pasted text / chat history kept for retries are erased after this many days.
  inputRetentionDays: 30,
};
