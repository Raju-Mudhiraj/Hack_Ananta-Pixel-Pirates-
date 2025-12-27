
import { MenuItem, DailyEntry } from './types';

export const INITIAL_MENU: MenuItem[] = [
  {
    id: '1', name: 'Chicken Curry & Rice', category: 'Main', unit: 'Portions',
    baseQuantity: 100, price: 220, calories: 650, allergens: ['Gluten', 'Dairy'],
    isLowCarbon: false, isVeg: false, carbonGrams: 1200, popularityScore: 85,
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: '2', name: 'Vegetable Pasta', category: 'Main', unit: 'Portions',
    baseQuantity: 80, price: 180, calories: 520, allergens: ['Gluten'],
    isLowCarbon: true, isVeg: true, carbonGrams: 350, popularityScore: 72,
    image: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: '3', name: 'Garden Salad', category: 'Side', unit: 'Bowls',
    baseQuantity: 50, price: 120, calories: 150, allergens: [],
    isLowCarbon: true, isVeg: true, carbonGrams: 150, popularityScore: 60,
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: '4', name: 'Chocolate Brownie', category: 'Dessert', unit: 'Pieces',
    baseQuantity: 120, price: 90, calories: 380, allergens: ['Egg', 'Dairy', 'Gluten'],
    isLowCarbon: false, isVeg: false, carbonGrams: 280, popularityScore: 95,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: '5', name: 'Iced Lemon Tea', category: 'Drink', unit: 'Liters',
    baseQuantity: 30, price: 60, calories: 90, allergens: [],
    isLowCarbon: true, isVeg: true, carbonGrams: 80, popularityScore: 88,
    image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: '6', name: 'Paneer Butter Masala', category: 'Main', unit: 'Portions',
    baseQuantity: 60, price: 200, calories: 450, allergens: ['Dairy', 'Nuts'],
    isLowCarbon: false, isVeg: true, carbonGrams: 700, popularityScore: 92,
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: '7', name: 'Classic Veg Burger', category: 'Main', unit: 'Portions',
    baseQuantity: 50, price: 150, calories: 380, allergens: ['Gluten', 'Sesame'],
    isLowCarbon: true, isVeg: true, carbonGrams: 400, popularityScore: 78,
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: '8', name: 'Fresh Fruit Bowl', category: 'Dessert', unit: 'Bowls',
    baseQuantity: 40, price: 100, calories: 120, allergens: [],
    isLowCarbon: true, isVeg: true, carbonGrams: 50, popularityScore: 65,
    image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: '9', name: 'Coca-Cola', category: 'Drink', unit: 'Cans',
    baseQuantity: 100, price: 40, calories: 140, allergens: [],
    isLowCarbon: false, isVeg: true, carbonGrams: 150, popularityScore: 90,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: '10', name: 'Sprite', category: 'Drink', unit: 'Cans',
    baseQuantity: 80, price: 40, calories: 140, allergens: [],
    isLowCarbon: false, isVeg: true, carbonGrams: 150, popularityScore: 85,
    image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: '11', name: 'Minute Maid Orange', category: 'Drink', unit: 'Bottles',
    baseQuantity: 60, price: 50, calories: 110, allergens: [],
    isLowCarbon: true, isVeg: true, carbonGrams: 100, popularityScore: 80,
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=800&auto=format&fit=crop"
  }
];

export const INITIAL_HISTORY: DailyEntry[] = [
  { id: 'e1', date: '2023-10-23', menuItemId: '1', prepared: 100, consumed: 85, waste: 15, preOrders: 40, dayOfWeek: 'Monday', isHoliday: false },
  { id: 'e2', date: '2023-10-23', menuItemId: '2', prepared: 80, consumed: 75, waste: 5, preOrders: 30, dayOfWeek: 'Monday', isHoliday: false },
  { id: 'e3', date: '2023-10-24', menuItemId: '1', prepared: 110, consumed: 105, waste: 5, preOrders: 55, dayOfWeek: 'Tuesday', isHoliday: false },
  { id: 'e4', date: '2023-10-24', menuItemId: '2', prepared: 80, consumed: 60, waste: 20, preOrders: 25, dayOfWeek: 'Tuesday', isHoliday: false },
  { id: 'e5', date: '2023-10-25', menuItemId: '1', prepared: 95, consumed: 90, waste: 5, preOrders: 45, dayOfWeek: 'Wednesday', isHoliday: false },
  { id: 'e6', date: '2023-10-26', menuItemId: '1', prepared: 120, consumed: 80, waste: 40, preOrders: 30, dayOfWeek: 'Thursday', isHoliday: false }
];
