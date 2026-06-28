export const APP_NAME = 'Digitalized Plantation';

export const BRAND = {
  primary: '#1B5E20',
  primaryLight: '#2E7D32',
  secondary: '#388E3C',
  accent: '#4CAF50',
  background: '#F8F9FA',
} as const;

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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

export const STATUS_COLORS: Record<string, string> = {
  HEALTHY: 'bg-green-100 text-green-800',
  WARNING: 'bg-amber-100 text-amber-800',
  CRITICAL: 'bg-red-100 text-red-800',
  OFFLINE: 'bg-gray-100 text-gray-800',
  ONLINE: 'bg-green-100 text-green-800',
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-600',
  FAULT: 'bg-red-100 text-red-800',
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-amber-100 text-amber-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL_PRIORITY: 'bg-red-100 text-red-800',
};

export function isInternalRole(role: string): boolean {
  return ['ADMIN', 'SUPPORT', 'SUPER_ADMIN'].includes(role);
}
