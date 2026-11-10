// Datos editables que el propietario entrega al registrar por primera vez su empresa.
export interface CreateCompanyInput {
  name?: string;
  description?: string;
  phone?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  keywords?: string;
}

export interface SavePublicProfileLayoutInput {
  theme?: string;
  blocks?: Array<{ id?: string; visible?: boolean }>;
  content?: {
    text?: string;
    imageUrl?: string;
    imageAlt?: string;
    videoUrl?: string;
    videoTitle?: string;
    highlights?: string;
  };
  sales?: {
    title?: string;
    description?: string;
    buttonLabel?: string;
    featuredCouponId?: number | null;
  };
}

export interface UpdateCompanyApprovalInput {
  status?: 'approved' | 'rejected';
}

// Datos mínimos para que un negocio registre una ubicación propia.
export interface CreateStoreInput {
  name?: string;
  address?: string;
  description?: string;
  phone?: string;
  cityId?: number;
  latitude?: number | null;
  longitude?: number | null;
}

// Campos que el propietario puede editar en una sucursal ya registrada.
export interface UpdateStoreInput extends Omit<CreateStoreInput, 'cityId'> {
  cityId?: number | null;
}

// Horario que pertenece a una sucursal de la empresa autenticada.
export interface CreateServiceHourInput {
  storeId?: number;
  dayOfWeek?: string;
  openingTime?: string;
  closingTime?: string;
}

// Horario semanal editable: un intervalo distinto por cada día seleccionado.
export interface SaveWeeklyScheduleInput {
  storeId?: number;
  days?: Array<{
    dayOfWeek?: string;
    openingTime?: string;
    closingTime?: string;
  }>;
}

// Promoción que el negocio publica desde una de sus sucursales.
export interface CreateCouponInput {
  storeId?: number;
  name?: string;
  description?: string;
  code?: string;
  expiration?: string;
  terms?: string;
  image_1?: string;
  image_2?: string;
  image_3?: string;
  image_4?: string;
  image_5?: string;
  tiktok_video?: string;
  youtube_url_video?: string;
  facebook_url_video?: string;
}

// Datos editables de una promoción publicada por el propietario.
export type UpdateCouponInput = Omit<CreateCouponInput, 'storeId'>;
