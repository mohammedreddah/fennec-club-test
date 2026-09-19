// Formats a date value (a clean 'YYYY-MM-DD' string from the backend, or a
// full ISO timestamp as a fallback) as 'dd/mm/yyyy' for display.
// Never used for values sent back to the API — those stay in ISO/'YYYY-MM-DD'
// form, this is a display-only transform.
export function formatDateDMY(value) {
  if (!value) return '';
  const datePart = String(value).slice(0, 10); // 'YYYY-MM-DD' even if a full timestamp slipped through
  const [y, m, d] = datePart.split('-');
  if (!y || !m || !d) return String(value);
  return `${d}/${m}/${y}`;
}
