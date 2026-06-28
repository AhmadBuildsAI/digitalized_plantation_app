export const APP_NAME = 'Digitalized Plantation';

export const BRAND = {
  primary: '#1B5E20',
  primaryLight: '#2E7D32',
  secondary: '#388E3C',
  accent: '#4CAF50',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: '#6B7280',
  error: '#DC2626',
  warning: '#F59E0B',
};

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export const EQUIPMENT_LABELS: Record<string, string> = {
  WATER_PUMP: 'Water Pump',
  INTAKE_FAN: 'Intake Fan',
  EXHAUST_FAN: 'Exhaust Fan',
  GROW_LIGHTS: 'Grow Lights',
  HUMIDIFIER: 'Humidifier',
};

export const TICKET_CATEGORY_LABELS: Record<string, string> = {
  MVP_TECHNICAL: 'MVP Technical Issue',
  PLANTATION_GUIDANCE: 'Plantation Guidance',
  GENERAL_INQUIRY: 'General Inquiry',
  EMERGENCY_SUPPORT: 'Emergency Support',
};
