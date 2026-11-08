// Automated tests for the shopping-list and purchase workflow.
// Run with: npm test   (see tests/services/run.mjs)
import { store, stats } from './mocks/firestore';
import { addItem, deleteItem, updateItemStatus } from '../../src/services/inventoryService';
import {
  addInventoryItemToShoppingList, addManualShoppingItem, markAsPurchased, removeFromShoppingList,
  AlreadyOnListError, AlreadyPurchasedError,
} from '../../src/services/shoppingService';
import type { InventoryItem, ShoppingListItem } from '../../src/types';

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, extra = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };
const docs = (sub: string) => [...store.entries()].filter(([p]) => p.startsWith(`users/user1/${sub}/`)).map(([p, d]) => ({ id: p.split('/').pop()!, ...d.data }));
const item = (id: string): InventoryItem => { const d = store.get(`users/user1/items/${id}`)!.data as any; return { id, ...d } as InventoryItem; };
const entry = (id: string): ShoppingListItem => { const d = store.get(`users/user1/shoppingList/${id}`)!.data as any; return { id, ...d } as ShoppingListItem; };
const settle = <T,>(p: Promise<T>) => p.then((v) => ({ ok: true as const, v }), (e) => ({ ok: false as const, e }));

(async () => {
  const { id: riceId } = await addItem({ name: 'Rice', category: 'Groceries', status: 'out_of_stock', quantity: 1, unit: 'kg', notes: null });
  const { id: soapId } = await addItem({ name: 'Soap', category: 'Toiletries', status: 'low_stock', quantity: null, unit: null, notes: null });

  // 1. Add from inventory -> deterministic entry ID
  await addInventoryItemToShoppingList(item(riceId), { quantity: 2, unit: 'kg' });
  const riceEntryId = `item_${riceId}`;
  check('Add from inventory creates entry item_<itemId>', !!store.get(`users/user1/shoppingList/${riceEntryId}`));
  check('Entry is pending and copies name/category/amount', (() => { const e = entry(riceEntryId) as any; return e.purchased === false && e.name === 'Rice' && e.category === 'Groceries' && e.quantity === 2 && e.unit === 'kg' && e.itemId === riceId; })());

  // 2. Second add -> AlreadyOnListError, still one entry
  const second = await settle(addInventoryItemToShoppingList(item(riceId)));
  check('Adding the same item again is refused', !second.ok && second.e instanceof AlreadyOnListError);

  // 3. Two simultaneous adds (double tap / two phones) -> exactly one entry
  const [a, b] = await Promise.all([settle(addInventoryItemToShoppingList(item(soapId))), settle(addInventoryItemToShoppingList(item(soapId)))]);
  check('Simultaneous double add: one succeeds, one refused', [a, b].filter((r) => r.ok).length === 1 && [a, b].some((r) => !r.ok && r.e instanceof AlreadyOnListError));
  check('Only one shopping entry per inventory item', docs('shoppingList').filter((d: any) => d.itemId === soapId).length === 1);

  // 4. Purchase linked entry
  await markAsPurchased(entry(riceEntryId));
  const riceEntry = entry(riceEntryId) as any;
  check('Purchase sets purchased=true and purchasedAt', riceEntry.purchased === true && !!riceEntry.purchasedAt);
  const hist1 = docs('purchaseHistory');
  check('Purchase creates exactly one history record', hist1.length === 1);
  const h = hist1[0] as any;
  check('History copies name, category, quantity, unit, itemId, shoppingItemId',
    h.name === 'Rice' && h.category === 'Groceries' && h.quantity === 2 && h.unit === 'kg' && h.itemId === riceId && h.shoppingItemId === riceEntryId && !!h.purchasedAt);
  check('Linked inventory item becomes Available', item(riceId).status === 'available');

  // 5. Purchasing again with the old (stale) entry object -> refused, no new history
  const stale = await settle(markAsPurchased({ ...riceEntry, id: riceEntryId, purchased: false }));
  check('Second purchase of same entry is refused', !stale.ok && stale.e instanceof AlreadyPurchasedError);
  check('No duplicate history after repeated tap', docs('purchaseHistory').length === 1);

  // 6. Simultaneous double purchase -> one history record
  const soapEntryId = `item_${soapId}`;
  const soapEntry = entry(soapEntryId);
  const [p1, p2] = await Promise.all([settle(markAsPurchased(soapEntry)), settle(markAsPurchased(soapEntry))]);
  check('Simultaneous double purchase: exactly one succeeds', [p1, p2].filter((r) => r.ok).length === 1);
  check('Simultaneous double purchase: one history record', docs('purchaseHistory').filter((d: any) => d.itemId === soapId).length === 1, `transaction retries so far: ${stats.transactionRetries}`);

  // 7. Re-adding after purchase reuses the same document as a new pending entry
  await updateItemStatus(riceId, 'low_stock');
  const again = await settle(addInventoryItemToShoppingList(item(riceId)));
  check('Item can be added again after it was bought', again.ok && entry(riceEntryId).purchased === false);
  check('Still one shopping document for the item', docs('shoppingList').filter((d: any) => d.itemId === riceId).length === 1);

  // 8. Manual entry purchase -> history with itemId null, no inventory change
  const itemsBefore = JSON.stringify(docs('items'));
  await addManualShoppingItem({ name: 'Bread', category: 'Groceries', quantity: null, unit: null });
  const bread = docs('shoppingList').find((d: any) => d.name === 'Bread') as any;
  check('Manual entry has itemId = null', bread && bread.itemId === null && bread.purchased === false);
  await markAsPurchased(entry(bread.id));
  const breadHist = docs('purchaseHistory').find((d: any) => d.name === 'Bread') as any;
  check('Manual purchase recorded with itemId = null', !!breadHist && breadHist.itemId === null);
  check('Manual purchase does not touch inventory', JSON.stringify(docs('items')).replace(/"status":"\w+"/g, '') === itemsBefore.replace(/"status":"\w+"/g, ''));

  // 9. Linked entry whose inventory item was deleted elsewhere -> purchase still works
  const { id: milkId } = await addItem({ name: 'Milk', category: 'Groceries', status: 'out_of_stock', quantity: null, unit: null, notes: null });
  await addInventoryItemToShoppingList(item(milkId));
  const milkEntry = entry(`item_${milkId}`);
  store.delete(`users/user1/items/${milkId}`); // deleted on another phone, entry left behind
  const milk = await settle(markAsPurchased(milkEntry));
  check('Purchase works if linked item no longer exists', milk.ok, milk.ok ? '' : String((milk as any).e));
  check('...and history is still created', docs('purchaseHistory').some((d: any) => d.name === 'Milk'));
  check('...and no inventory item is recreated', !store.has(`users/user1/items/${milkId}`));

  // 10. Deleting an item removes its shopping entry but keeps history
  const histBefore = docs('purchaseHistory').length;
  await deleteItem(riceId);
  check('Delete removes the item', !store.has(`users/user1/items/${riceId}`));
  check('Delete removes its shopping entry', !store.has(`users/user1/shoppingList/${riceEntryId}`));
  check('Delete keeps purchase history', docs('purchaseHistory').length === histBefore && docs('purchaseHistory').some((d: any) => d.itemId === riceId));

  // 11. Remove from list
  await addManualShoppingItem({ name: 'Candles', category: 'Others', quantity: 3, unit: 'pcs' });
  const candles = docs('shoppingList').find((d: any) => d.name === 'Candles') as any;
  await removeFromShoppingList(candles.id);
  check('Remove deletes the entry without creating history', !store.has(`users/user1/shoppingList/${candles.id}`) && !docs('purchaseHistory').some((d: any) => d.name === 'Candles'));

  // 12. Purchasing an entry that was removed elsewhere -> clear error, no history
  await addManualShoppingItem({ name: 'Tea', category: 'Groceries', quantity: null, unit: null });
  const tea = docs('shoppingList').find((d: any) => d.name === 'Tea') as any;
  const teaEntry = entry(tea.id);
  store.delete(`users/user1/shoppingList/${tea.id}`);
  const teaRes = await settle(markAsPurchased(teaEntry));
  check('Purchasing a removed entry fails with a message, no history', !teaRes.ok && /no longer on your shopping list/.test(String((teaRes as any).e?.message)) && !docs('purchaseHistory').some((d: any) => d.name === 'Tea'));

  console.log(`\n${pass} passed, ${fail} failed. Transaction retries caused by conflicts: ${stats.transactionRetries}`);
  if (fail) process.exitCode = 1;
})();
