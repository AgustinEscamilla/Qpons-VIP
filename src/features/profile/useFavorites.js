import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_STORAGE_KEY = 'qpons.vip.favorites.v1';
const EMPTY_FAVORITES = { coupons: [], stores: [] };

export function getFavoriteId(item) {
  const id = item?.documentId ?? item?.id;
  return id === null || id === undefined || id === '' ? '' : String(id);
}

function normalizeFavorites(value) {
  return {
    coupons: Array.isArray(value?.coupons) ? value.coupons.map(String) : [],
    stores: Array.isArray(value?.stores) ? value.stores.map(String) : [],
  };
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(EMPTY_FAVORITES);
  const [ready, setReady] = useState(false);
  const favoritesRef = useRef(EMPTY_FAVORITES);
  const writeQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(FAVORITES_STORAGE_KEY)
      .then((storedValue) => {
        if (!active) return;
        const parsed = storedValue ? JSON.parse(storedValue) : EMPTY_FAVORITES;
        const normalized = normalizeFavorites(parsed);
        favoritesRef.current = normalized;
        setFavorites(normalized);
      })
      .catch(() => {
        if (active) {
          favoritesRef.current = EMPTY_FAVORITES;
          setFavorites(EMPTY_FAVORITES);
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const toggleFavorite = useCallback((collection, item) => {
    if (!ready) return;
    const id = getFavoriteId(item);
    if (!id || !['coupons', 'stores'].includes(collection)) return;

    const current = favoritesRef.current;
    const currentIds = current[collection];
    const next = {
      ...current,
      [collection]: currentIds.includes(id)
        ? currentIds.filter((currentId) => currentId !== id)
        : [...currentIds, id],
    };
    favoritesRef.current = next;
    setFavorites(next);
    writeQueueRef.current = writeQueueRef.current
      .catch(() => {})
      .then(() => AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next)))
      .catch(() => {});
  }, [ready]);

  const isFavoriteCoupon = useCallback(
    (coupon) => favorites.coupons.includes(getFavoriteId(coupon)),
    [favorites.coupons],
  );
  const isFavoriteStore = useCallback(
    (store) => favorites.stores.includes(getFavoriteId(store)),
    [favorites.stores],
  );
  const toggleCoupon = useCallback((coupon) => toggleFavorite('coupons', coupon), [toggleFavorite]);
  const toggleStore = useCallback((store) => toggleFavorite('stores', store), [toggleFavorite]);

  return {
    couponIds: favorites.coupons,
    storeIds: favorites.stores,
    ready,
    isFavoriteCoupon,
    isFavoriteStore,
    toggleCoupon,
    toggleStore,
  };
}
