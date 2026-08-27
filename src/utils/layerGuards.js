/** Device + screenshot layers must stay on the board (hide only). */
export function isProtectedLayer(obj) {
  const role = obj?.glintRole;
  return role === 'framed-screenshot' || role === 'screenshot';
}
