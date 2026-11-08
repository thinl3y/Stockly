import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { StockStatus } from './index';

/** Screens shown when nobody is signed in. */
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  /** `email` pre-fills the field with whatever was typed on the Login screen. */
  ForgotPassword: { email?: string } | undefined;
};

/** The five bottom tabs. */
export type MainTabParamList = {
  Home: undefined;
  /** `status` opens Inventory pre-filtered (used by the Home dashboard). */
  Inventory: { status?: StockStatus } | undefined;
  ShoppingList: undefined;
  History: undefined;
  Profile: undefined;
};

/** Stack that wraps the tabs and adds full-screen item screens on top. */
export type AppStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList> | undefined;
  AddItem: undefined;
  EditItem: { itemId: string };
  ItemDetails: { itemId: string };
  /** Opens on the given tab: pick from inventory, or type a new item. */
  AddShoppingItem: { tab?: 'inventory' | 'manual' } | undefined;
};

/** Props for a screen in the signed-in stack (Add/Edit Item, Item Details). */
export type AppScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>;

/** Props for a tab screen that can also open the stack screens above the tabs. */
export type TabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<AppStackParamList>
>;

/** Combined list, used for typing `useNavigation()` anywhere in the app. */
export type RootStackParamList = AuthStackParamList & AppStackParamList;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
