/** Interpret only the authenticated payment-verification response, never callback query flags. */
export function paymentVerificationStatus(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const result = value as {
    success?: boolean;
    failed?: boolean;
    pending?: boolean;
    abandoned?: boolean;
    status?: string;
    payment?: { status?: string };
  };
  const status = String(
    result.status || result.payment?.status || "",
  ).toLowerCase();
  if (status === "refunded") return "refunded";
  if (result.failed === true || ["failed", "reversed"].includes(status))
    return "failed";
  if (result.success === true || status === "success") return "success";
  if (
    result.pending === true ||
    ["pending", "ongoing", "processing", "queued"].includes(status)
  )
    return "pending";
  if (result.abandoned === true || status === "abandoned") return "abandoned";
  return status || null;
}
