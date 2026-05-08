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

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED VALIDATORS FOR COMPREHENSIVE FORM VALIDATION
// Based on database schema requirements
// ─────────────────────────────────────────────────────────────────────────────

export function validateIdNumber(idNumber: string): string | null {
  if (!idNumber) return null; // Optional in most cases
  // Kenya ID: 8 digits (old) or 12 digits (new) or passport number
  if (!/^(\d{8}|\d{12}|[A-Z]{2}\d{7}[A-Z]{1})$/.test(idNumber.replace(/\s/g, "")))
    return "Enter a valid ID number, Passport, or Alien number";
  return null;
}

export function validateIdNumberRequired(idNumber: string, label = "ID number"): string | null {
  if (!idNumber || !idNumber.trim()) return `${label} is required`;
  return validateIdNumber(idNumber);
}

export function validateCompanyName(name: string): string | null {
  if (!name || !name.trim()) return "Company name is required";
  if (name.trim().length < 3) return "Company name must be at least 3 characters";
  return null;
}

export function validateDateRange(
  startDate: string,
  endDate: string,
  startLabel = "Start date",
  endLabel = "End date"
): string | null {
  if (!startDate || !endDate) return null; // Will be caught by individual date validators
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) {
    return `${endLabel} must be after ${startLabel}`;
  }
  return null;
}

export function validatePastDate(value: string, label: string): string | null {
  if (!value) return `${label} is required`;
  const date = new Date(value);
  if (isNaN(date.getTime())) return `${label} must be a valid date`;
  if (date > new Date()) {
    return `${label} cannot be in the future`;
  }
  return null;
}

export function validateFutureDate(value: string, label: string): string | null {
  if (!value) return `${label} is required`;
  const date = new Date(value);
  if (isNaN(date.getTime())) return `${label} must be a valid date`;
  if (date < new Date()) {
    return `${label} must be in the future`;
  }
  return null;
}

export function validateAmount(value: string, label: string, minAmount = 0): string | null {
  if (!value) return `${label} is required`;
  const n = parseFloat(value);
  if (isNaN(n) || n < minAmount) {
    return `${label} must be a valid amount greater than ${minAmount}`;
  }
  return null;
}

export function validatePremium(value: string): string | null {
  if (!value) return "Premium amount is required";
  const n = parseFloat(value);
  if (isNaN(n) || n <= 0) return "Premium must be greater than 0";
  if (n < 500) return "Premium seems too low — minimum usually KES 500";
  return null;
}

export function validateInpatientLimit(value: string): string | null {
  if (!value) return "Inpatient cover limit is required for medical policies";
  const n = parseFloat(value);
  if (isNaN(n) || n <= 0) return "Inpatient limit must be greater than 0";
  if (n < 100000) return "Inpatient limit seems too low — typical minimum is KES 100,000";
  return null;
}

export function validateMemberCount(value: string, label = "Member count"): string | null {
  if (!value) return `${label} is required`;
  const n = parseInt(value);
  if (isNaN(n) || n < 1) return `${label} must be at least 1`;
  if (n > 500) return `${label} seems too high — please verify`;
  return null;
}

export function validateCarType(value: string): string | null {
  if (!value) return "Car type is required";
  return null;
}

export function validateStage(value: string, allowedStages: string[]): string | null {
  if (!value) return "Stage is required";
  if (!allowedStages.includes(value)) return "Please select a valid stage";
  return null;
}

export function validateNatureOfLoss(value: string): string | null {
  if (!value) return "Nature of loss is required";
  const valid = ["Accident", "Theft", "Fire", "Flood", "Vandalism", "Other"];
  if (!valid.includes(value)) return "Please select a valid nature of loss";
  return null;
}

export function validateCommissionAmount(value: string): string | null {
  if (!value) return null; // Optional
  const n = parseFloat(value);
  if (isNaN(n) || n < 0) return "Commission must be a valid positive amount or 0";
  return null;
}

export function validateDependentFields(
  parentValue: boolean,
  fieldValue: string,
  fieldLabel: string
): string | null {
  if (parentValue && (!fieldValue || !fieldValue.trim())) {
    return `${fieldLabel} is required when parent option is selected`;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Run all validators and return a field-keyed error map
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
