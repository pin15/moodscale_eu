
export type StatFormat = "plain" | "grouped";

export interface StatFormatOptions {
  suffix?: string;
  prefix?: string;
  format?: StatFormat;
  locale?: string;
}

export function formatStatValue(value: number, opts: StatFormatOptions = {}): string {
  const { suffix = "", prefix = "", format = "grouped", locale } = opts;
  const rounded = Math.round(value);
  const body = format === "plain" ? String(rounded) : rounded.toLocaleString(locale);
  return `${prefix}${body}${suffix}`;
}

export function readStatFormatOptions(numEl: HTMLElement): StatFormatOptions {
  return {
    suffix: numEl.dataset.suffix ?? "",
    prefix: numEl.dataset.prefix ?? "",
    format: numEl.dataset.format === "plain" ? "plain" : "grouped",
  };
}
