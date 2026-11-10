// Hook que carga el catálogo una sola vez y expone estado de carga y error.
import { useEffect, useState } from 'react';
import { catalogApi } from '../../services/api/catalog.service';

const emptyCatalog = {
  categories: [],
  subcategories: [],
  cities: [],
  companies: [],
  stores: [],
  serviceHours: [],
  coupons: [],
  alerts: [],
  storeConfig: [],
};

export function useCatalog() {
  const [catalog, setCatalog] = useState(emptyCatalog);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      try {
        const [categories, subcategories, cities, companies, stores, serviceHours, coupons, alerts, storeConfig] = await Promise.all([
          catalogApi.categories(),
          catalogApi.subcategories(),
          catalogApi.cities(),
          catalogApi.companies(),
          catalogApi.stores(),
          catalogApi.serviceHours(),
          catalogApi.coupons(),
          catalogApi.alerts(),
          catalogApi.storeConfig(),
        ]);

        if (active) {
          setCatalog({ categories, subcategories, cities, companies, stores, serviceHours, coupons, alerts, storeConfig });
          setError(null);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCatalog();

    return () => {
      active = false;
    };
  }, []);

  return { catalog, loading, error };
}
