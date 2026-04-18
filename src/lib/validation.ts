// src/lib/validation.ts
// Shared validation helpers — reuse these across all form components

export function validatePhone(phone: string): string | null {
  if (!phone) return "Phone number is required";
  const cleaned = phone.replace(/\s+/g, "");
  if (!/^(\+254|07|01)\d{8,9}$/.test(cleaned))
    return "Enter a valid Kenyan phone number (e.g. 0712 345 678 or +254712345678)";
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email) return null; // email is optional in most forms
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Enter a valid email address (e.g. john@email.com)";
  return null;
}

export function validateRequired(value: string, label: string): string | null {
  if (!value || !value.trim()) return `${label} is required`;
  return null;
}

export function validateNumber(
  value: string,
  label: string,
  opts?: { min?: number; max?: number }
): string | null {
  if (!value) return `${label} is required`;
  const n = parseFloat(value);
  if (isNaN(n)) return `${label} must be a valid number`;
  if (opts?.min !== undefined && n < opts.min) return `${label} must be at least ${opts.min}`;
  if (opts?.max !== undefined && n > opts.max) return `${label} must be at most ${opts.max}`;
  return null;
}

export function validateYear(value: string): string | null {
  if (!value) return "Year of manufacture is required";
  const y = parseInt(value);
  const currentYear = new Date().getFullYear();
  if (isNaN(y) || y < 1960 || y > currentYear + 1)
    return `Year must be between 1960 and ${currentYear + 1}`;
  return null;
}

export function validateDate(value: string, label: string): string | null {
  if (!value) return `${label} is required`;
  const d = new Date(value);
  if (isNaN(d.getTime())) return `${label} must be a valid date`;
  return null;
}

export function validateSumInsured(value: string): string | null {
  if (!value) return "Vehicle value / sum insured is required";
  const n = parseFloat(value);
  if (isNaN(n) || n <= 0) return "Enter a valid amount greater than 0";
  if (n < 50000) return "Sum insured seems too low — minimum is KES 50,000";
  return null;
}

export function validateRate(value: string): string | null {
  if (!value) return "Premium rate is required";
  const n = parseFloat(value);
  if (isNaN(n) || n <= 0) return "Rate must be greater than 0%";
  if (n > 50) return "Rate seems unusually high — please double-check";
  return null;
}

export function validateKRAPin(pin: string): string | null {
  if (!pin) return null; // KRA PIN is optional
  if (!/^[A-Z]\d{9}[A-Z]$/.test(pin.toUpperCase()))
    return "KRA PIN format should be A123456789B (letter, 9 digits, letter)";
  return null;
}

export function validateRegNo(reg: string): string | null {
  if (!reg || !reg.trim()) return "Registration number is required";
  // Kenya plate: KAA 000A or KKKK 000A style
  if (reg.trim().length < 5) return "Enter a valid vehicle registration number";
  return null;
}

// Run all validators and return a field-keyed error map
export function runValidators(
  validators: { field: string; fn: () => string | null }[]
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const { field, fn } of validators) {
    const err = fn();
    if (err) errors[field] = err;
  }
  return errors;
}
