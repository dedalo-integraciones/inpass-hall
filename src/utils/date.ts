export function getFechaLocal() {
  const h = new Date();
  return h.getFullYear() + '-' + ('0' + (h.getMonth() + 1)).slice(-2) + '-' + ('0' + h.getDate()).slice(-2);
}
