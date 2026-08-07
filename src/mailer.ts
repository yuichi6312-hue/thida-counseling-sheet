export const openMailDraft = (to: string, subject: string, body: string) => {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const query = params.toString();
  window.location.href = `mailto:${to}${query ? `?${query}` : ""}`;
};
