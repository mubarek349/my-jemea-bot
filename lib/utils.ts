export type ClassValue = string | number | null | boolean | undefined | ClassValue[] | { [key: string]: any }

function clsx(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string" || typeof input === "number") {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      classes.push(clsx(...input));
    } else if (typeof input === "object") {
      for (const key in input) {
        if (input[key]) classes.push(key);
      }
    }
  }

  return classes.join(" ");
}

function twMerge(classNames: string): string {
  // Simple fallback: just return the classNames as-is.
  // In a real implementation, you might want to resolve Tailwind conflicts.
  return classNames;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

