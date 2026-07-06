import { defaultFeeSettings, defaultPaymentSettings, roleLabels, zoneLabels } from "./config.js";

export function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function escapeHtml(unsafe) {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function cloneDefaultFeeSettings() {
  return JSON.parse(JSON.stringify(defaultFeeSettings));
}

export function cloneDefaultPaymentSettings() {
  return JSON.parse(JSON.stringify(defaultPaymentSettings));
}

export function normalizeFeeSettings(settings = {}) {
  const defaults = cloneDefaultFeeSettings();
  return {
    roleRates: { ...defaults.roleRates, ...(settings.roleRates || {}) },
    zoneMultipliers: { ...defaults.zoneMultipliers, ...(settings.zoneMultipliers || {}) },
    handover: { ...defaults.handover, ...(settings.handover || {}) },
    travelCoordination: settings.travelCoordination ?? defaults.travelCoordination,
    reservePercent: settings.reservePercent ?? defaults.reservePercent,
    updatedAt: settings.updatedAt || defaults.updatedAt,
    updatedBy: settings.updatedBy || defaults.updatedBy,
  };
}

export function normalizePaymentSettings(settings = {}) {
  const defaults = cloneDefaultPaymentSettings();
  const methods = settings.methods || {};
  return {
    currency: asTrimmedString(settings.currency || defaults.currency).toUpperCase() || defaults.currency,
    expiryDays: Number.isInteger(Number(settings.expiryDays)) ? Math.min(Math.max(Number(settings.expiryDays), 1), 60) : defaults.expiryDays,
    settlementNote: asTrimmedString(settings.settlementNote || defaults.settlementNote),
    methods: {
      card: { ...defaults.methods.card, ...(methods.card || {}), enabled: methods.card?.enabled ?? defaults.methods.card.enabled },
      bank: { ...defaults.methods.bank, ...(methods.bank || {}), enabled: methods.bank?.enabled ?? defaults.methods.bank.enabled },
      mobileMoney: { ...defaults.methods.mobileMoney, ...(methods.mobileMoney || {}), enabled: methods.mobileMoney?.enabled ?? defaults.methods.mobileMoney.enabled },
      crypto: { ...defaults.methods.crypto, ...(methods.crypto || {}), enabled: methods.crypto?.enabled ?? defaults.methods.crypto.enabled, assets: Array.isArray(methods.crypto?.assets) && methods.crypto.assets.length ? methods.crypto.assets : defaults.methods.crypto.assets },
    },
  };
}

export function toBoundedNumber(value, label, { min, max, decimals = 0 }, errors) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    errors.push(`${label} must be between ${min} and ${max}.`);
    return null;
  }
  const factor = 10 ** decimals;
  return Math.round(number * factor) / factor;
}

export function calculateCost({ role, zone, days, travel }, feeSettings) {
  const settings = normalizeFeeSettings(feeSettings);
  const coverage = Math.round(settings.roleRates[role] * settings.zoneMultipliers[zone] * days);
  const handover = role === "surgical" ? settings.handover.surgical : settings.handover.default;
  const travelCoordination = travel ? settings.travelCoordination : 0;
  const reserve = Math.round((coverage + handover + travelCoordination) * (settings.reservePercent / 100));
  const total = coverage + handover + travelCoordination + reserve;
  return { coverage, handover, travelCoordination, reserve, total };
}

export function validateApplication(payload, feeSettings) {
  const settings = normalizeFeeSettings(feeSettings);
  const errors = [];
  const applicant = asTrimmedString(payload.applicant);
  const email = asTrimmedString(payload.email).toLowerCase();
  const doctorEmail = asTrimmedString(payload.doctorEmail).toLowerCase();
  const doctor = asTrimmedString(payload.doctor);
  const station = asTrimmedString(payload.station);
  const startDate = asTrimmedString(payload.startDate);
  const familyNotes = asTrimmedString(payload.familyNotes).slice(0, 1200);
  const role = asTrimmedString(payload.role);
  const zone = asTrimmedString(payload.zone);
  const days = Number(payload.days);
  const travel = Boolean(payload.travel);
  const consent = Boolean(payload.consent);
  const website = asTrimmedString(payload.website);

  if (website) errors.push("This request could not be processed.");
  if (!applicant) errors.push("Applicant name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("A valid email address is required.");
  if (!doctorEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doctorEmail)) errors.push("A valid doctor email address is required.");
  if (!doctor) errors.push("Field doctor's name is required.");
  if (!station) errors.push("Field station is required.");
  if (!role || !settings.roleRates[role]) errors.push("Replacement role is invalid.");
  if (!zone || !settings.zoneMultipliers[zone]) errors.push("Field pressure is invalid.");
  if (!Number.isInteger(days) || days < 7 || days > 45) errors.push("Requested leave must be between 7 and 45 days.");
  if (!startDate || Number.isNaN(Date.parse(`${startDate}T00:00:00Z`))) {
    errors.push("Preferred start date is required.");
  }
  if (!consent) errors.push("Consent to privacy notice and terms is required.");

  return {
    errors,
    data: {
      applicant, email, doctorEmail, doctor, station, startDate, familyNotes,
      role, roleLabel: roleLabels[role], zone, zoneLabel: zoneLabels[zone], days, travel, consent,
    },
  };
}

export function validateFeeSettings(payload, actor) {
  const errors = [];
  const current = normalizeFeeSettings(payload);
  const next = cloneDefaultFeeSettings();

  for (const [key, label] of Object.entries(roleLabels)) {
    next.roleRates[key] = toBoundedNumber(current.roleRates[key], `${label} daily rate`, { min: 50, max: 5000 }, errors);
  }

  for (const [key, label] of Object.entries(zoneLabels)) {
    next.zoneMultipliers[key] = toBoundedNumber(current.zoneMultipliers[key], `${label} multiplier`, { min: 0.5, max: 3, decimals: 2 }, errors);
  }

  next.handover.default = toBoundedNumber(current.handover.default, "Standard handover fee", { min: 0, max: 50000 }, errors);
  next.handover.surgical = toBoundedNumber(current.handover.surgical, "Surgical handover fee", { min: 0, max: 50000 }, errors);
  next.travelCoordination = toBoundedNumber(current.travelCoordination, "Travel coordination fee", { min: 0, max: 50000 }, errors);
  next.reservePercent = toBoundedNumber(current.reservePercent, "Operations reserve percent", { min: 0, max: 50, decimals: 2 }, errors);
  next.updatedAt = new Date().toISOString();
  next.updatedBy = actor;

  return { errors, settings: next };
}

export function validatePaymentSettings(payload) {
  const errors = [];
  const settings = normalizePaymentSettings(payload);

  if (settings.expiryDays < 1 || settings.expiryDays > 60) {
    errors.push("Expiry days must be between 1 and 60.");
  }
  
  if (settings.settlementNote.length > 500) {
    errors.push("Settlement note must be under 500 characters.");
  }

  // Cryptocurrencies validation
  if (settings.methods.crypto.enabled && (!settings.methods.crypto.assets || settings.methods.crypto.assets.length === 0)) {
    errors.push("At least one crypto asset must be configured if Crypto is enabled.");
  }

  return { errors, settings };
}
