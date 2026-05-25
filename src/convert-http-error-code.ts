import { HttpHandlerErrorCode } from "./models/error.js";

const CODE_TIME_OUT = ["ETIMEDOUT", "EAI_AGAIN"];
const CODE_NETWORK_ERROR = ["ECONNRESET", "ECONNREFUSED", "EADDRINUSE", "EPIPE", "EHOSTUNREACH", "ENETUNREACH"];

export const convertNodeHttpErrorCode = (code: unknown): HttpHandlerErrorCode => {
  if (typeof code !== "string") return "SDK.UNKNOWN_ERROR";

  if (CODE_TIME_OUT.includes(code)) return "SDK.TIMEOUT";
  if (CODE_NETWORK_ERROR.includes(code)) return "SDK.NETWORK_ERROR";

  return "SDK.UNKNOWN_ERROR";
};

export const convertNodeFetchErrorCode = (err: any): HttpHandlerErrorCode => {
  const causeCode = err?.cause?.code;
  if (typeof causeCode === "string") {
    if (CODE_TIME_OUT.includes(causeCode)) return "SDK.TIMEOUT";
    if (CODE_NETWORK_ERROR.includes(causeCode)) return "SDK.NETWORK_ERROR";
  }

  if (typeof err?.code === "string") {
    if (CODE_TIME_OUT.includes(err.code)) return "SDK.TIMEOUT";
    if (CODE_NETWORK_ERROR.includes(err.code)) return "SDK.NETWORK_ERROR";
  }

  const errMsg = String(err?.message || "").toLowerCase();
  if (errMsg.includes("fetch failed") || errMsg.includes("hang up") || errMsg.includes("reset")) {
    return "SDK.NETWORK_ERROR";
  }

  return "SDK.UNKNOWN_ERROR";
};
