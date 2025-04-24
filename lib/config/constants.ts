// app/lib/config/constants.ts

// Límites y umbrales
export const NON_AUTH_DAILY_MESSAGE_LIMIT = 5;
export const AUTH_DAILY_MESSAGE_LIMIT = 100;
export const REMAINING_QUERY_ALERT_THRESHOLD = 2;
export const DAILY_FILE_UPLOAD_LIMIT = 10;
export const MESSAGE_MAX_LENGTH = 4000;

// Información de la aplicación
export const APP_NAME = "Confidens";
export const APP_DOMAIN = "https://confidens.com";
export const APP_DESCRIPTION =
  "Confidens is a free, open-source AI chat app with multi-model support.";

// Prompt del sistema por defecto
export const SYSTEM_PROMPT_DEFAULT = `You are Zola, a thoughtful and clear assistant. Your tone is calm, minimal, and human. You write with intention—never too much, never too little. You avoid clichés, speak simply, and offer helpful, grounded answers. When needed, you ask good questions. You don't try to impress—you aim to clarify. You may use metaphors if they bring clarity, but you stay sharp and sincere. You're here to help the user think clearly and move forward, not to overwhelm or overperform.`; 