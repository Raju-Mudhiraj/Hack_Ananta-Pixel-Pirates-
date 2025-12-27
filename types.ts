
export type PortionSize = 'SMALL' | 'REGULAR' | 'LARGE';

export interface MenuItem {
  id: string;
  name: string;
  category: 'Main' | 'Side' | 'Dessert' | 'Drink';
  description?: string;
  unit: string;
  baseQuantity: number;
  price: number;
  calories: number;
  allergens: string[];
  isLowCarbon: boolean;
  isVeg: boolean; // Computed or manual flag
  carbonGrams: number; // CO2e per regular portion
  popularityScore: number; // 0-100
  image?: string;
  isFlashSale?: boolean;
  flashSaleStartTime?: number;
  flashSalePercentage?: number;
  isSurpriseDish?: boolean;
  ingredients?: string[];
}

export type OrderStatus = 'PREPARING' | 'READY' | 'PICKED_UP';

export interface ActiveOrder {
  id: string;
  items: Record<string, number>; // composite keys itemId:size
  itemComments?: Record<string, string>; // composite keys itemId:size -> comment
  status: OrderStatus;
  timestamp: number;
}

export interface DailyEntry {
  id: string;
  date: string;
  menuItemId: string;
  prepared: number;
  consumed: number;
  waste: number;
  preOrders: number;
  dayOfWeek: string;
  isHoliday: boolean;
  qualitativeFeedback?: string; // AI insight from scanning
}

export interface PortionDistribution {
  small: number;
  regular: number;
  large: number;
}

export interface AppliedPlanItem {
  quantity: number;
  distribution: PortionDistribution;
}

export interface PredictionResult {
  menuItemId: string;
  name: string;
  predictedQuantity: number;
  portionDistribution: PortionDistribution;
  confidenceScore: number;
  reasoning: string;
  carbonImpactSaved: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  STUDENT_PORTAL = 'STUDENT_PORTAL',
  ORDER_HISTORY = 'ORDER_HISTORY',
  DATA_ENTRY = 'DATA_ENTRY',
  PREDICTIONS = 'PREDICTIONS',
  MENU_MANAGER = 'MENU_MANAGER',
  KITCHEN = 'KITCHEN'
}

export type UserRole = 'ADMIN' | 'STAFF' | 'STUDENT';

export type OptimizationMode = 'NORMAL' | 'EXAM' | 'FEST';

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  type: NotificationType;
  role?: UserRole;
}
