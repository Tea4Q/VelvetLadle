export const isNetworkFetchError = (error: unknown): boolean => {
  const message = String((error as any)?.message ?? error ?? "").toLowerCase();
  return (
    message.includes("networkerror when attempting to fetch resource") ||
    message.includes("network request failed") ||
    message.includes("failed to fetch") ||
    message.includes("typeerror: networkerror") ||
    message.includes("attempting to fetch resource")
  );
};
