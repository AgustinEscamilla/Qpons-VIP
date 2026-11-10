import React from 'react';
import { Text, View } from 'react-native';
import { Card, Label } from '../../shared/components/UI.js';
import { colors as C } from '../../shared/theme/colors.js';

function getStoresForCompany(stores, companyId) {
  return stores.filter((store) => store.companyId?.id === companyId);
}

function belongsToCity(store, cityId) {
  if (!cityId) return true;
  return store.cityId?.some((city) => city.id === cityId);
}

// Presenta las empresas y sucursales reales que devuelve el catálogo de NestJS.
export function CatalogBusinesses({ companies = [], stores = [], selectedCity }) {
  const visibleCompanies = companies.slice(0, 4);
  const visibleStores = stores.filter((store) => belongsToCity(store, selectedCity?.id)).slice(0, 4);

  return (
    <View style={{ marginTop: 14 }}>
      <Label style={{ fontSize: 18, marginBottom: 8 }}>Negocios conectados</Label>
      {!visibleCompanies.length && !visibleStores.length && (
        <Text style={{ color: C.muted, fontSize: 11 }}>Todavía no hay empresas o sucursales registradas.</Text>
      )}

      {visibleCompanies.map((company) => {
        const companyStores = getStoresForCompany(stores, company.id);

        return (
          <Card key={`company-${company.id}`} style={{ padding: 13, marginBottom: 8 }}>
            <Label style={{ fontSize: 15 }}>{company.name}</Label>
            <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>
              {company.description || 'Empresa afiliada a QPONS VIP'}
            </Text>
            <Text style={{ color: C.green, fontSize: 10, marginTop: 6 }}>
              {companyStores.length} sucursal(es) registrada(s)
            </Text>
          </Card>
        );
      })}

      {visibleStores.map((store) => (
        <Card key={`store-${store.id}`} style={{ padding: 13, marginBottom: 8 }}>
          <Label style={{ fontSize: 14 }}>{store.name}</Label>
          <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>
            {store.address || 'Dirección pendiente de registro'}
          </Text>
          {store.companyId?.name && (
            <Text style={{ color: C.pink, fontSize: 10, marginTop: 5 }}>{store.companyId.name}</Text>
          )}
        </Card>
      ))}
    </View>
  );
}
