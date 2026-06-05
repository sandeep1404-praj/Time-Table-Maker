const normalizeHex = (color) => {
  if (!color || typeof color !== "string") return "#64748b";
  const trimmed = color.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return "#64748b";
};

export const getTeacherHighlightStyle = (color) => {
  const hex = normalizeHex(color);
  return {
    color: hex,
    backgroundColor: `${hex}1a`,
    borderColor: `${hex}40`
  };
};
