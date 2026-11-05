import type { NavigatorScreenParams } from '@react-navigation/native';

/** Screens shown when nobody is signed in. */
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

/** The five bottom tabs. */
export type MainTabParamList = {
  Home: undefined;
  Inventory: undefined;
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
};

/** Combined list, used for typing `useNavigation()` anywhere in the app. */
export type RootStackParamList = AuthStackParamList & AppStackParamList;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
