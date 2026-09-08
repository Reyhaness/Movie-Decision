export function toPersianDigits(input: number | string | null | undefined): string {
  if (input === null || input === undefined) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(/\d/g, (d) => persianDigits[Number(d)] ?? d);
}

export function formatLocalizedNumber(
  input: number | string | null | undefined,
  locale: string
): string {
  if (input === null || input === undefined) return "";
  if (locale === "fa") {
    return toPersianDigits(input);
  }
  return String(input);
}
