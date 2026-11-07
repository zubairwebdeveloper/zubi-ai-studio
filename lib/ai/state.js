export const JOB_STATUS = { QUEUED: "queued", PROCESSING: "processing", SUCCEEDED: "succeeded", FAILED: "failed" };
export const isTerminal = (s) => s === "succeeded" || s === "failed";
