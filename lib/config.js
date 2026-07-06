export const PORT = Number(process.env.PORT || 4173);
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "local-admin-password";
export const ADMIN_NAME = process.env.ADMIN_NAME || "Operations admin";
export const SESSION_COOKIE = "dwb_admin_session";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const ROOT = import.meta.dirname ? import.meta.dirname.replace(/\/src$/, "") : process.cwd();
export const DATA_DIR = import.meta.dirname ? import.meta.dirname.replace(/\/src$/, "/data") : process.cwd() + "/data";
export const DB_FILE = DATA_DIR + "/applications.json";

export const roleLabels = {
  medical: "Medical officer",
  emergency: "Emergency physician",
  surgical: "Surgical or anaesthesia doctor",
  maternal: "OB or maternal health clinician",
  mental: "Mental health clinician",
};

export const zoneLabels = {
  standard: "Standard mission",
  hardship: "Hardship mission",
  critical: "Critical or conflict mission",
};

export const statuses = new Set([
  "RECEIVED",
  "COVERAGE_REVIEW",
  "COVERAGE_MATCHED",
  "PAYMENT_PENDING",
  "APPROVED_FOR_TRAVEL",
  "DECLINED",
  "REFUNDED",
  "CLOSED",
]);

export const paymentStatuses = new Set(["NOT_REQUESTED", "INVOICE_SENT", "PAID", "REFUNDED", "WAIVED"]);

export const defaultFeeSettings = {
  roleRates: { medical: 245, emergency: 380, surgical: 520, maternal: 320, mental: 290 },
  zoneMultipliers: { standard: 1, hardship: 1.18, critical: 1.35 },
  handover: { default: 650, surgical: 900 },
  travelCoordination: 480,
  reservePercent: 8,
  updatedAt: null,
  updatedBy: "system-default",
};

export const defaultPaymentSettings = {
  currency: "USD",
  expiryDays: 14,
  settlementNote: "Payment must use the application payment reference so operations can reconcile it quickly.",
  methods: {
    card: { enabled: true, label: "Card or digital wallet", provider: "Hosted checkout", checkoutUrl: "", instructions: "Operations can attach a hosted checkout link when a processor is connected." },
    bank: { enabled: true, label: "Bank transfer", accountName: "UNMISSDOCTORS Relief Operations", bankName: "Global operations account", accountNumber: "Issued by finance", iban: "Issued by finance", swift: "Issued by finance", instructions: "Use the payment reference as the transfer memo." },
    mobileMoney: { enabled: true, label: "Mobile money", providers: "M-Pesa, MTN, Airtel Money", contact: "payments@doctorswithoutborder.example", instructions: "Operations will confirm the local wallet route for the applicant country." },
    crypto: { enabled: true, label: "Cryptocurrency", settlement: "Stablecoin settlement preferred for fast global reconciliation.", assets: [ { asset: "USDC", network: "Polygon", address: "Wallet issued after compliance review" }, { asset: "USDT", network: "TRON", address: "Wallet issued after compliance review" }, { asset: "BTC", network: "Bitcoin", address: "Wallet issued after compliance review" } ], instructions: "Use the exact payment reference in the confirmation message. Operations verifies network, amount, and sender review before travel clearance." },
  },
};
