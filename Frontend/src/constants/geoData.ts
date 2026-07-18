// src/constants/geoData.ts

export interface CurrencyConfig {
  code: string;
  symbol: string;
  label: string;
  flag: string;
}

export interface CountryConfig {
  name: string;
  defaultCurrency: string;
  defaultLanguage: string;
}

// 🌐 1. UNIFIED SYSTEM GLOBAL ISO CURRENCIES
export const WORLD_CURRENCIES: CurrencyConfig[] = [
  { code: "PKR", symbol: "₨", label: "Pakistani Rupee", flag: "🇵🇰" },
  { code: "USD", symbol: "$", label: "US Dollar", flag: "🇺🇸" },
  { code: "INR", symbol: "₹", label: "Indian Rupee", flag: "🇮🇳" },
  { code: "EUR", symbol: "€", label: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", label: "British Pound", flag: "🇬🇧" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen", flag: "🇯🇵" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham", flag: "🇦🇪" },
  { code: "SAR", symbol: "ر.س", label: "Saudi Riyal", flag: "🇸🇦" },
  { code: "CAD", symbol: "$", label: "Canadian Dollar", flag: "🇨🇦" },
  { code: "AUD", symbol: "$", label: "Australian Dollar", flag: "🇦🇺" },
  { code: "SGD", symbol: "$", label: "Singapore Dollar", flag: "🇸🇬" },
  { code: "CHF", symbol: "CHf", label: "Swiss Franc", flag: "🇨🇭" },
  { code: "CNY", symbol: "¥", label: "Chinese Yuan", flag: "🇨🇳" },
  { code: "HKD", symbol: "$", label: "Hong Kong Dollar", flag: "🇭🇰" },
  { code: "NZD", symbol: "$", label: "New Zealand Dollar", flag: "🇳🇿" },
  { code: "SEK", symbol: "kr", label: "Swedish Krona", flag: "🇸🇪" },
  { code: "KRW", symbol: "₩", label: "South Korean Won", flag: "🇰🇷" },
  { code: "NOK", symbol: "kr", label: "Norwegian Krone", flag: "🇳🇴" },
  { code: "MXN", symbol: "$", label: "Mexican Peso", flag: "🇲🇽" },
  { code: "RUB", symbol: "₽", label: "Russian Ruble", flag: "🇷🇺" },
  { code: "ZAR", symbol: "R", label: "South African Rand", flag: "🇿🇦" },
  { code: "TRY", symbol: "₺", label: "Turkish Lira", flag: "🇹🇷" },
  { code: "BRL", symbol: "R$", label: "Brazilian Real", flag: "🇧🇷" },
  { code: "TWD", symbol: "$", label: "New Taiwan Dollar", flag: "🇹🇼" },
  { code: "PLN", symbol: "zł", label: "Polish Zloty", flag: "🇵🇱" },
  { code: "THB", symbol: "฿", label: "Thai Baht", flag: "🇹🇭" },
  { code: "IDR", symbol: "Rp", label: "Indonesian Rupiah", flag: "🇮🇩" },
  { code: "HUF", symbol: "Ft", label: "Hungarian Forint", flag: "🇭🇺" },
  { code: "DKK", symbol: "kr", label: "Danish Krone", flag: "🇩🇰" },
  { code: "ILS", symbol: "₪", label: "Israeli Shekel", flag: "🇮🇱" },
  { code: "CLP", symbol: "$", label: "Chilean Peso", flag: "🇨🇱" },
  { code: "PHP", symbol: "₱", label: "Philippine Peso", flag: "🇵🇭" },
  { code: "COP", symbol: "$", label: "Colombian Peso", flag: "🇨🇴" },
  { code: "MYR", symbol: "RM", label: "Malaysian Ringgit", flag: "🇲🇾" },
  { code: "RON", symbol: "lei", label: "Romanian Leu", flag: "🇷🇴" },
  { code: "VND", symbol: "₫", label: "Vietnamese Dong", flag: "🇻🇳" },
  { code: "KWD", symbol: "د.ك", label: "Kuwaiti Dinar", flag: "🇰🇼" },
  { code: "OMR", symbol: "ر.ع.", label: "Omani Rial", flag: "🇴🇲" },
  { code: "QAR", symbol: "ر.ق", label: "Qatari Riyal", flag: "🇶🇦" },
  { code: "BHD", symbol: "د.ب", label: "Bahraini Dinar", flag: "🇧🇭" },
];

// 🌍 2. COMPLETE ALIGNED COUNTRIES WITH SUGGESTION AUTOPILOT
export const WORLD_COUNTRIES: CountryConfig[] = [
  { name: "Pakistan", defaultCurrency: "PKR", defaultLanguage: "Urdu (اُردو)" },
  { name: "India", defaultCurrency: "INR", defaultLanguage: "Hindi (हिन्दी)" },
  { name: "United States", defaultCurrency: "USD", defaultLanguage: "English" },
  { name: "United Kingdom", defaultCurrency: "GBP", defaultLanguage: "English" },
  { name: "Germany", defaultCurrency: "EUR", defaultLanguage: "German (Deutsch)" },
  { name: "Japan", defaultCurrency: "JPY", defaultLanguage: "Japanese (日本語)" },
  { name: "Canada", defaultCurrency: "CAD", defaultLanguage: "English" },
  { name: "Australia", defaultCurrency: "AUD", defaultLanguage: "English" },
  { name: "United Arab Emirates", defaultCurrency: "AED", defaultLanguage: "Arabic (العربية)" },
  { name: "Saudi Arabia", defaultCurrency: "SAR", defaultLanguage: "Arabic (العربية)" },
  { name: "Afghanistan", defaultCurrency: "USD", defaultLanguage: "Pashto (پښتو)" },
  { name: "Albania", defaultCurrency: "EUR", defaultLanguage: "English" },
  { name: "Algeria", defaultCurrency: "USD", defaultLanguage: "Arabic (العربية)" },
  { name: "Argentina", defaultCurrency: "USD", defaultLanguage: "Spanish (Español)" },
  { name: "Austria", defaultCurrency: "EUR", defaultLanguage: "German (Deutsch)" },
  { name: "Bangladesh", defaultCurrency: "USD", defaultLanguage: "Bengali (বাংলা)" },
  { name: "Belgium", defaultCurrency: "EUR", defaultLanguage: "French (Français)" },
  { name: "Brazil", defaultCurrency: "BRL", defaultLanguage: "Portuguese (Português)" },
  { name: "Chile", defaultCurrency: "CLP", defaultLanguage: "Spanish (Español)" },
  { name: "China", defaultCurrency: "CNY", defaultLanguage: "Mandarin (中文)" },
  { name: "Colombia", defaultCurrency: "COP", defaultLanguage: "Spanish (Español)" },
  { name: "Denmark", defaultCurrency: "DKK", defaultLanguage: "English" },
  { name: "Egypt", defaultCurrency: "USD", defaultLanguage: "Arabic (العربية)" },
  { name: "Finland", defaultCurrency: "EUR", defaultLanguage: "English" },
  { name: "France", defaultCurrency: "EUR", defaultLanguage: "French (Français)" },
  { name: "Greece", defaultCurrency: "EUR", defaultLanguage: "English" },
  { name: "Hong Kong", defaultCurrency: "HKD", defaultLanguage: "Mandarin (中文)" },
  { name: "Indonesia", defaultCurrency: "IDR", defaultLanguage: "Indonesia (Bahasa)" },
  { name: "Iran", defaultCurrency: "USD", defaultLanguage: "Arabic (العربية)" },
  { name: "Iraq", defaultCurrency: "USD", defaultLanguage: "Arabic (العربية)" },
  { name: "Ireland", defaultCurrency: "EUR", defaultLanguage: "English" },
  { name: "Israel", defaultCurrency: "ILS", defaultLanguage: "English" },
  { name: "Italy", defaultCurrency: "EUR", defaultLanguage: "Italian (Italiano)" },
  { name: "Jordan", defaultCurrency: "USD", defaultLanguage: "Arabic (العربية)" },
  { name: "Kenya", defaultCurrency: "USD", defaultLanguage: "English" },
  { name: "Kuwait", defaultCurrency: "KWD", defaultLanguage: "Arabic (العربية)" },
  { name: "Malaysia", defaultCurrency: "MYR", defaultLanguage: "Malay (Bahasa Melayu)" },
  { name: "Mexico", defaultCurrency: "MXN", defaultLanguage: "Spanish (Español)" },
  { name: "Morocco", defaultCurrency: "USD", defaultLanguage: "Arabic (العربية)" },
  { name: "Netherlands", defaultCurrency: "EUR", defaultLanguage: "English" },
  { name: "New Zealand", defaultCurrency: "NZD", defaultLanguage: "English" },
  { name: "Norway", defaultCurrency: "NOK", defaultLanguage: "English" },
  { name: "Oman", defaultCurrency: "OMR", defaultLanguage: "Arabic (العربية)" },
  { name: "Philippines", defaultCurrency: "PHP", defaultLanguage: "English" },
  { name: "Poland", defaultCurrency: "PLN", defaultLanguage: "English" },
  { name: "Portugal", defaultCurrency: "EUR", defaultLanguage: "Portuguese (Português)" },
  { name: "Qatar", defaultCurrency: "QAR", defaultLanguage: "Arabic (العربية)" },
  { name: "Romania", defaultCurrency: "RON", defaultLanguage: "English" },
  { name: "Russia", defaultCurrency: "RUB", defaultLanguage: "Russian (Русский)" },
  { name: "Singapore", defaultCurrency: "SGD", defaultLanguage: "English" },
  { name: "South Africa", defaultCurrency: "ZAR", defaultLanguage: "English" },
  { name: "South Korea", defaultCurrency: "KRW", defaultLanguage: "Korean (한국어)" },
  { name: "Spain", defaultCurrency: "EUR", defaultLanguage: "Spanish (Español)" },
  { name: "Sweden", defaultCurrency: "SEK", defaultLanguage: "English" },
  { name: "Switzerland", defaultCurrency: "CHF", defaultLanguage: "German (Deutsch)" },
  { name: "Thailand", defaultCurrency: "THB", defaultLanguage: "Thai (ภาษาไทย)" },
  { name: "Turkey", defaultCurrency: "TRY", defaultLanguage: "Turkish (Türkçe)" },
  { name: "Ukraine", defaultCurrency: "EUR", defaultLanguage: "Russian (Русский)" },
  { name: "Vietnam", defaultCurrency: "VND", defaultLanguage: "Vietnamese (Tiếng Việt)" },
  { name: "Yemen", defaultCurrency: "USD", defaultLanguage: "Arabic (العربية)" },
  { name: "Zimbabwe", defaultCurrency: "USD", defaultLanguage: "English" }
];

// 🗣️ 3. CLEAN COMPREHENSIVE LANGUAGES CORE
export const PRIORITY_LANGUAGES = [
  "English", "Urdu (اُردو)", "Punjabi (پنجابی)", "Sindhi (سنڌي)", 
  "Pashto (پښتو)", "Hindi (हिन्दी)", "Spanish (Español)", 
  "Arabic (العربية)", "French (Français)", "German (Deutsch)", "Japanese (日本語)"
];

export const EXTENDED_LANGUAGES = [
  "Bengali (বাংলা)", "Tamil (தமிழ்)", "Telugu (తెлуу)", "Marathi (मराठी)", 
  "Italian (Italiano)", "Portuguese (Português)", "Russian (Русский)", 
  "Turkish (Türkçe)", "Mandarin (中文)", "Korean (한국어)", 
  "Vietnamese (Tiếng Việt)", "Thai (ภาษาไทย)", "Kashmiri (کٲشُر)", 
  "Saraiki (سرائیکی)", "Balochi (بلوچی)", "Malay (Bahasa Melayu)", "Indonesia (Bahasa)"
];