import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { Category, StockStatus } from '../types';
import { colors } from './theme';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export const CATEGORIES: { value: Category; icon: IoniconName }[] = [
  { value: 'Groceries', icon: 'nutrition-outline' },
  { value: 'Toiletries', icon: 'water-outline' },
  { value: 'Cleaning Supplies', icon: 'sparkles-outline' },
  { value: 'Kitchen Essentials', icon: 'restaurant-outline' },
  { value: 'Others', icon: 'cube-outline' },
];

export const getCategoryIcon = (category: Category): IoniconName =>
  CATEGORIES.find((c) => c.value === category)?.icon ?? 'cube-outline';

export interface StatusMeta {
  value: StockStatus;
  label: string;
  icon: IoniconName;
  color: string;
  textColor: string;
  background: string;
}

export const STOCK_STATUSES: StatusMeta[] = [
  {
    value: 'available',
    label: 'Available',
    icon: 'checkmark-circle',
    color: colors.primary,
    textColor: colors.primary,
    background: colors.primaryLight,
  },
  {
    value: 'low_stock',
    label: 'Low Stock',
    icon: 'alert-circle',
    color: colors.warning,
    textColor: colors.warningText,
    background: colors.warningLight,
  },
  {
    value: 'out_of_stock',
    label: 'Out of Stock',
    icon: 'close-circle',
    color: colors.danger,
    textColor: colors.dangerText,
    background: colors.dangerLight,
  },
];

export const getStatusMeta = (status: StockStatus): StatusMeta =>
  STOCK_STATUSES.find((s) => s.value === status) ?? STOCK_STATUSES[0];

/** Quick unit choices shown under the Unit field. */
export const UNIT_SUGGESTIONS = ['pcs', 'pack', 'kg', 'g', 'L', 'ml', 'bottle'];
