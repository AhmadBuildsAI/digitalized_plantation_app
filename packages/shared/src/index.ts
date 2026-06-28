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
  info: '#2563EB',
} as const;

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  SUPPORT = 'SUPPORT',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum EquipmentType {
  WATER_PUMP = 'WATER_PUMP',
  INTAKE_FAN = 'INTAKE_FAN',
  EXHAUST_FAN = 'EXHAUST_FAN',
  GROW_LIGHTS = 'GROW_LIGHTS',
  HUMIDIFIER = 'HUMIDIFIER',
}

export enum EquipmentState {
  ON = 'ON',
  OFF = 'OFF',
}

export enum DeviceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FAULT = 'FAULT',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum NotificationType {
  PUMP_FAILURE = 'PUMP_FAILURE',
  LOW_MOISTURE = 'LOW_MOISTURE',
  HIGH_TEMPERATURE = 'HIGH_TEMPERATURE',
  CONNECTION_LOST = 'CONNECTION_LOST',
  SENSOR_FAILURE = 'SENSOR_FAILURE',
  CONTROLLER_OFFLINE = 'CONTROLLER_OFFLINE',
  SYSTEM = 'SYSTEM',
  SUPPORT = 'SUPPORT',
}

export enum TicketCategory {
  MVP_TECHNICAL = 'MVP_TECHNICAL',
  PLANTATION_GUIDANCE = 'PLANTATION_GUIDANCE',
  GENERAL_INQUIRY = 'GENERAL_INQUIRY',
  EMERGENCY_SUPPORT = 'EMERGENCY_SUPPORT',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  ASSIGNED = 'ASSIGNED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
}

export enum PlantationStatus {
  HEALTHY = 'HEALTHY',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  OFFLINE = 'OFFLINE',
}

export enum ActivityAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EQUIPMENT_CONTROL = 'EQUIPMENT_CONTROL',
  SUPPORT_MESSAGE = 'SUPPORT_MESSAGE',
  NOTIFICATION = 'NOTIFICATION',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  SYSTEM_EVENT = 'SYSTEM_EVENT',
  ACCOUNT_UPDATE = 'ACCOUNT_UPDATE',
}

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  [EquipmentType.WATER_PUMP]: 'Water Pump',
  [EquipmentType.INTAKE_FAN]: 'Intake Fan',
  [EquipmentType.EXHAUST_FAN]: 'Exhaust Fan',
  [EquipmentType.GROW_LIGHTS]: 'Grow Lights',
  [EquipmentType.HUMIDIFIER]: 'Humidifier',
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  [TicketCategory.MVP_TECHNICAL]: 'MVP Technical Issue',
  [TicketCategory.PLANTATION_GUIDANCE]: 'Plantation Guidance',
  [TicketCategory.GENERAL_INQUIRY]: 'General Inquiry',
  [TicketCategory.EMERGENCY_SUPPORT]: 'Emergency Support',
};
