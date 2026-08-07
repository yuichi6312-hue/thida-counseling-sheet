export const openMailDraft = (to: string, subject: string, body: string) => {
  const params: string[] = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  const query = params.join("&");
  window.location.href = `mailto:${to}${query ? `?${query}` : ""}`;
};
