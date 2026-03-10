export interface CountryCode {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
  validation: {
    pattern: RegExp;
    message: string;
  };
}

export const countryCodes: CountryCode[] = [
  {
    code: "IN",
    dialCode: "+91",
    name: "India",
    flag: "🇮🇳",
    validation: {
      pattern: /^[6-9]\d{9}$/,
      message: "Indian phone number must be exactly 10 digits starting with 6-9",
    },
  },
  {
    code: "SG",
    dialCode: "+65",
    name: "Singapore",
    flag: "🇸🇬",
    validation: {
      pattern: /^\d{8}$/,
      message: "Singapore phone number must be exactly 8 digits",
    },
  },
  {
    code: "DE",
    dialCode: "+49",
    name: "Germany",
    flag: "🇩🇪",
    validation: {
      pattern: /^(\d{10,11}|0\d{9,10})$/,
      message: "German phone number must be 10-11 digits",
    },
  },
  {
    code: "CH",
    dialCode: "+41",
    name: "Switzerland",
    flag: "🇨🇭",
    validation: {
      pattern: /^(\d{9}|\d{10})$/,
      message: "Swiss phone number must be 9-10 digits",
    },
  },
  {
    code: "US",
    dialCode: "+1",
    name: "United States",
    flag: "🇺🇸",
    validation: {
      pattern: /^\d{10}$/,
      message: "US phone number must be exactly 10 digits",
    },
  },
  {
    code: "GB",
    dialCode: "+44",
    name: "United Kingdom",
    flag: "🇬🇧",
    validation: {
      pattern: /^\d{10,11}$/,
      message: "UK phone number must be 10-11 digits",
    },
  },
  {
    code: "FR",
    dialCode: "+33",
    name: "France",
    flag: "🇫🇷",
    validation: {
      pattern: /^\d{9}$/,
      message: "French phone number must be exactly 9 digits",
    },
  },
  {
    code: "IT",
    dialCode: "+39",
    name: "Italy",
    flag: "🇮🇹",
    validation: {
      pattern: /^\d{9,10}$/,
      message: "Italian phone number must be 9-10 digits",
    },
  },
  {
    code: "ES",
    dialCode: "+34",
    name: "Spain",
    flag: "🇪🇸",
    validation: {
      pattern: /^\d{9}$/,
      message: "Spanish phone number must be exactly 9 digits",
    },
  },
  {
    code: "AU",
    dialCode: "+61",
    name: "Australia",
    flag: "🇦🇺",
    validation: {
      pattern: /^\d{9}$/,
      message: "Australian phone number must be exactly 9 digits",
    },
  },
  {
    code: "CA",
    dialCode: "+1",
    name: "Canada",
    flag: "🇨🇦",
    validation: {
      pattern: /^\d{10}$/,
      message: "Canadian phone number must be exactly 10 digits",
    },
  },
  {
    code: "JP",
    dialCode: "+81",
    name: "Japan",
    flag: "🇯🇵",
    validation: {
      pattern: /^\d{10,11}$/,
      message: "Japanese phone number must be 10-11 digits",
    },
  },
  {
    code: "CN",
    dialCode: "+86",
    name: "China",
    flag: "🇨🇳",
    validation: {
      pattern: /^\d{11}$/,
      message: "Chinese phone number must be exactly 11 digits",
    },
  },
  {
    code: "KR",
    dialCode: "+82",
    name: "South Korea",
    flag: "🇰🇷",
    validation: {
      pattern: /^\d{9,10}$/,
      message: "South Korean phone number must be 9-10 digits",
    },
  },
  {
    code: "BR",
    dialCode: "+55",
    name: "Brazil",
    flag: "🇧🇷",
    validation: {
      pattern: /^\d{10,11}$/,
      message: "Brazilian phone number must be 10-11 digits",
    },
  },
];

export function getCountryByCode(code: string): CountryCode | undefined {
  return countryCodes.find((country) => country.code === code);
}

export function getCountryByDialCode(dialCode: string): CountryCode | undefined {
  return countryCodes.find((country) => country.dialCode === dialCode);
}

export function validatePhoneNumber(phone: string, countryCode: string): {
  valid: boolean;
  message?: string;
} {
  const country = getCountryByCode(countryCode);
  if (!country) {
    return { valid: false, message: "Invalid country code" };
  }

  // Remove any non-digit characters
  const digitsOnly = phone.replace(/\D/g, "");

  if (digitsOnly.length === 0) {
    return { valid: false, message: "Phone number is required" };
  }

  if (!country.validation.pattern.test(digitsOnly)) {
    return { valid: false, message: country.validation.message };
  }

  return { valid: true };
}
