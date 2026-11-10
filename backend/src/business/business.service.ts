import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import {
  Alert,
  Company,
  Coupon,
  City,
  ServiceHour,
  Store,
  User,
} from '../database/entities/index.js';
import { UserRole } from '../database/entities/index.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { CreateCompanyInput, CreateCouponInput, CreateServiceHourInput, CreateStoreInput, SavePublicProfileLayoutInput, SaveWeeklyScheduleInput, UpdateCompanyApprovalInput, UpdateCouponInput, UpdateStoreInput } from './business.types.js';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    @InjectRepository(Store) private readonly stores: Repository<Store>,
    @InjectRepository(Coupon) private readonly coupons: Repository<Coupon>,
    @InjectRepository(ServiceHour) private readonly serviceHours: Repository<ServiceHour>,
    @InjectRepository(Alert) private readonly alerts: Repository<Alert>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(City) private readonly cities: Repository<City>,
    private readonly dataSource: DataSource,
  ) {}

  private parseStoreCoordinates(latitudeInput?: number | null, longitudeInput?: number | null): [string | null, string | null] | null {
    if (latitudeInput === undefined && longitudeInput === undefined) return null;
    if (latitudeInput === null && longitudeInput === null) return [null, null];
    const latitude = Number(latitudeInput);
    const longitude = Number(longitudeInput);
    if (latitudeInput === null || latitudeInput === undefined || longitudeInput === null || longitudeInput === undefined
      || !Number.isFinite(latitude) || !Number.isFinite(longitude)
      || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new BadRequestException('Selecciona una ubicación válida en el mapa');
    }
    return [String(latitude), String(longitude)];
  }

  async createCompany(user: AuthenticatedUser, input: CreateCompanyInput) {
    if (user.role !== UserRole.BUSINESS) {
      throw new ForbiddenException('Solo una cuenta de negocio puede registrar su empresa');
    }

    if (!input || typeof input !== 'object') {
      throw new BadRequestException('Envía los datos de la empresa');
    }

    const boundedFields: Array<[keyof CreateCompanyInput, number]> = [
      ['description', 2000], ['phone', 40], ['website', 255],
      ['facebook', 255], ['instagram', 100], ['tiktok', 100], ['keywords', 500],
    ];
    for (const [field, maxLength] of boundedFields) {
      const value = input[field];
      if (value !== undefined && (typeof value !== 'string' || value.length > maxLength)) {
        throw new BadRequestException(`El campo ${field} supera el límite permitido`);
      }
    }

    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const description = typeof input.description === 'string' ? input.description.trim() : '';
    const phone = typeof input.phone === 'string' ? input.phone.trim() : '';
    const website = typeof input.website === 'string' ? input.website.trim() : '';
    const keywords = typeof input.keywords === 'string' ? input.keywords.trim() : '';

    if (name.length < 2 || name.length > 120) {
      throw new BadRequestException('El nombre comercial debe tener entre 2 y 120 caracteres');
    }

    if (description.length < 10) {
      throw new BadRequestException('La descripción debe tener al menos 10 caracteres');
    }

    if (keywords.length < 2) {
      throw new BadRequestException('Escribe al menos una palabra clave');
    }

    const digits = phone.replace(/\D/g, '');
    if (!/^\+?[\d\s().-]+$/.test(phone) || digits.length < 10 || digits.length > 15) {
      throw new BadRequestException('Escribe un teléfono válido con código de país si aplica');
    }

    if (website) {
      try {
        const parsedWebsite = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
        if (!parsedWebsite.hostname.includes('.')) throw new Error('URL inválida');
      } catch {
        throw new BadRequestException('Escribe una página web válida, por ejemplo mipagina.com');
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const companyRepository = manager.getRepository(Company);
      // Bloquea solo la fila de usuario; cargar la relación en esta consulta
      // puede generar un FOR UPDATE sobre el lado opcional del JOIN en PostgreSQL.
      const lockedAccount = await userRepository.createQueryBuilder('account')
        .where('account.id = :userId', { userId: user.id })
        .setLock('pessimistic_write')
        .getOne();

      if (!lockedAccount) throw new NotFoundException('No encontramos la cuenta de negocio');

      const account = await userRepository.findOne({
        where: { id: user.id },
        relations: { companyId: true },
      });
      if (!account) throw new NotFoundException('No encontramos la cuenta de negocio');
      if (account.companyId) throw new ConflictException('Esta cuenta ya tiene una empresa vinculada');

      const company = companyRepository.create({
        name,
        description: description || undefined,
        phone: phone || undefined,
        website: website ? (/^https?:\/\//i.test(website) ? website : `https://${website}`) : undefined,
        facebook: typeof input.facebook === 'string' ? input.facebook.trim() || undefined : undefined,
        instagram: typeof input.instagram === 'string' ? input.instagram.trim() || undefined : undefined,
        tiktok: typeof input.tiktok === 'string' ? input.tiktok.trim() || undefined : undefined,
        keywords,
        approvalStatus: 'pending',
      });
      const savedCompany = await companyRepository.save(company);

      account.companyId = savedCompany;
      await userRepository.save(account);

      return savedCompany;
    });
  }

  async updateCompany(user: AuthenticatedUser, input: CreateCompanyInput) {
    const company = await this.requireOwnedCompany(user);
    if (!input || typeof input !== 'object') throw new BadRequestException('Envía los datos de la empresa');
    const name = this.requiredText(input.name, 'El nombre comercial es obligatorio', 120);
    const description = this.requiredText(input.description, 'La descripción es obligatoria', 2000);
    const phone = this.optionalPhone(input.phone);
    if (!phone) throw new BadRequestException('El teléfono es obligatorio');
    const keywords = this.requiredText(input.keywords, 'Escribe al menos una palabra clave', 500);
    const website = this.optionalText(input.website, 255);
    if (website) {
      try {
        const parsed = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
        if (!parsed.hostname.includes('.')) throw new Error('URL inválida');
      } catch { throw new BadRequestException('Escribe una página web válida, por ejemplo mipagina.com'); }
    }
    company.name = name;
    company.description = description;
    company.phone = phone;
    company.keywords = keywords;
    company.website = website ? (/^https?:\/\//i.test(website) ? website : `https://${website}`) : '';
    company.facebook = this.optionalText(input.facebook, 255) ?? '';
    company.instagram = this.optionalText(input.instagram, 100) ?? '';
    company.tiktok = this.optionalText(input.tiktok, 100) ?? '';
    if (company.approvalStatus === 'rejected') company.approvalStatus = 'pending';
    return this.companies.save(company);
  }

  async pendingCompanies() {
    return this.companies.createQueryBuilder('company')
      .leftJoin('company.users', 'owner')
      .leftJoin('company.storesId', 'store')
      .select('company.id', 'id')
      .addSelect('company.name', 'name')
      .addSelect('company.description', 'description')
      .addSelect('company.phone', 'phone')
      .addSelect('company.keywords', 'keywords')
      .addSelect('company.website', 'website')
      .addSelect('company.facebook', 'facebook')
      .addSelect('company.instagram', 'instagram')
      .addSelect('company.tiktok', 'tiktok')
      .addSelect('owner.name', 'ownerName')
      .addSelect('owner.email', 'ownerEmail')
      .addSelect('COUNT(DISTINCT store.id)', 'storeCount')
      .where('company.approvalStatus = :status', { status: 'pending' })
      .groupBy('company.id')
      .addGroupBy('owner.name')
      .addGroupBy('owner.email')
      .orderBy('company.id', 'ASC')
      .getRawMany();
  }

  async updateCompanyApproval(companyId: number, input: UpdateCompanyApprovalInput) {
    if (!input || !['approved', 'rejected'].includes(input.status || '')) {
      throw new BadRequestException('El estado debe ser approved o rejected');
    }
    const company = await this.companies.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('No encontramos la empresa solicitada');
    company.approvalStatus = input.status!;
    return this.companies.save(company);
  }

  async savePublicProfileLayout(user: AuthenticatedUser, input: SavePublicProfileLayoutInput) {
    const company = await this.requireOwnedCompany(user);
    const allowedThemes = ['classic', 'midnight', 'forest'];
    const allowedBlocks = ['hero', 'contact', 'location', 'carousel', 'promotions', 'text', 'image', 'gallery', 'videos', 'highlights', 'hours', 'branches', 'terms'];
    if (!input || !allowedThemes.includes(input.theme || '')) {
      throw new BadRequestException('Selecciona uno de los temas disponibles');
    }
    if (!Array.isArray(input.blocks) || input.blocks.length !== allowedBlocks.length) {
      throw new BadRequestException('El diseño debe incluir todos los bloques disponibles');
    }
    const seen = new Set<string>();
    const blocks = input.blocks.map((block) => {
      if (!block || !allowedBlocks.includes(block.id || '') || seen.has(block.id || '') || typeof block.visible !== 'boolean') {
        throw new BadRequestException('La lista de bloques contiene una opción inválida');
      }
      seen.add(block.id!);
      return { id: block.id!, visible: block.visible };
    });
    if (seen.size !== allowedBlocks.length) throw new BadRequestException('No se pueden quitar bloques del editor');
    if (!blocks.find((block) => block.id === 'hero')?.visible) {
      throw new BadRequestException('La portada del negocio debe permanecer visible');
    }
    const contentInput = input.content || {};
    const contentText = typeof contentInput.text === 'string' ? contentInput.text.trim() : '';
    const imageUrl = typeof contentInput.imageUrl === 'string' ? contentInput.imageUrl.trim() : '';
    const imageAlt = typeof contentInput.imageAlt === 'string' ? contentInput.imageAlt.trim() : 'Imagen promocional';
    const rawVideoUrl = typeof contentInput.videoUrl === 'string' ? contentInput.videoUrl.trim() : '';
    const videoTitle = typeof contentInput.videoTitle === 'string' ? contentInput.videoTitle.trim() : 'Conoce nuestro negocio';
    const rawHighlights = typeof contentInput.highlights === 'string' ? contentInput.highlights.trim() : '';
    const highlights = rawHighlights.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    if (contentText.length > 2000) throw new BadRequestException('El texto promocional no puede superar 2,000 caracteres');
    if (rawHighlights.length > 600) throw new BadRequestException('La lista de beneficios no puede superar 600 caracteres');
    if (imageUrl && !this.isSupportedCouponImageUrl(imageUrl)) {
      throw new BadRequestException('Sube la imagen promocional desde el editor antes de guardarla');
    }
    if (imageAlt.length > 120) throw new BadRequestException('La descripción de la imagen no puede superar 120 caracteres');
    if (videoTitle.length > 100) throw new BadRequestException('El título del video no puede superar 100 caracteres');
    if (rawVideoUrl.length > 500) throw new BadRequestException('El enlace del video no puede superar 500 caracteres');
    let videoUrl = '';
    if (rawVideoUrl) {
      try {
        const parsedUrl = new URL(/^https?:\/\//i.test(rawVideoUrl) ? rawVideoUrl : `https://${rawVideoUrl}`);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Protocolo no permitido');
        videoUrl = parsedUrl.toString();
      } catch {
        throw new BadRequestException('Escribe un enlace válido para el video');
      }
    }
    if (highlights.length > 6 || highlights.some((item) => item.length > 100)) {
      throw new BadRequestException('Agrega hasta 6 beneficios de máximo 100 caracteres cada uno');
    }
    const salesInput = input.sales || {};
    const salesTitle = typeof salesInput.title === 'string' ? salesInput.title.trim() : 'Promociones VIP';
    const salesDescription = typeof salesInput.description === 'string' ? salesInput.description.trim() : 'Descubre beneficios exclusivos disponibles en esta sucursal.';
    const salesButtonLabel = typeof salesInput.buttonLabel === 'string' ? salesInput.buttonLabel.trim() : 'Obtener cupón VIP';
    if (!salesTitle || salesTitle.length > 60) throw new BadRequestException('El título de promociones debe tener entre 1 y 60 caracteres');
    if (salesDescription.length > 180) throw new BadRequestException('La descripción de promociones no puede superar 180 caracteres');
    if (!salesButtonLabel || salesButtonLabel.length > 30) throw new BadRequestException('El texto del botón debe tener entre 1 y 30 caracteres');
    const featuredCouponId = salesInput.featuredCouponId == null ? null : Number(salesInput.featuredCouponId);
    if (featuredCouponId !== null) {
      if (!Number.isSafeInteger(featuredCouponId) || featuredCouponId <= 0) {
        throw new BadRequestException('Selecciona una promoción válida para destacar');
      }
      const featuredCoupon = await this.coupons.findOne({
        where: { id: featuredCouponId },
        relations: { storeId: { companyId: true } },
      });
      if (Number(featuredCoupon?.storeId?.companyId?.id) !== Number(company.id)) {
        throw new BadRequestException('Solo puedes destacar promociones de tu propio negocio');
      }
    }
    company.publicProfileLayout = {
      theme: input.theme!,
      blocks,
      content: {
        text: contentText,
        imageUrl,
        imageAlt: imageAlt || 'Imagen promocional',
        videoUrl,
        videoTitle: videoTitle || 'Conoce nuestro negocio',
        highlights: highlights.join('\n'),
      },
      sales: { title: salesTitle, description: salesDescription, buttonLabel: salesButtonLabel, featuredCouponId },
    };
    return this.companies.save(company);
  }

  async overview(user: AuthenticatedUser) {
    if (!user.companyId && user.role === UserRole.BUSINESS) {
      // Una cuenta nueva puede entrar al panel antes de que un administrador le asigne empresa.
      return {
        company: null,
        stores: [],
        coupons: [],
        serviceHours: [],
        alerts: [],
      };
    }

    if (!user.companyId) {
      return this.loadOverview();
    }

    return this.loadOverview(user.companyId);
  }

  // Registra sucursales únicamente bajo la empresa vinculada a quien inició sesión.
  async createStore(user: AuthenticatedUser, input: CreateStoreInput) {
    const company = await this.requireOwnedCompany(user);
    const name = this.requiredText(input?.name, 'El nombre de la sucursal es obligatorio', 120);
    const address = this.requiredText(input?.address, 'La dirección de la sucursal es obligatoria', 255);
    const description = this.optionalText(input?.description, 2000);
    const phone = this.optionalPhone(input?.phone);
    const coordinates = this.parseStoreCoordinates(input?.latitude, input?.longitude);
    let city: City | undefined;

    if (input.cityId !== undefined && input.cityId !== null) {
      if (!Number.isInteger(Number(input.cityId)) || Number(input.cityId) < 1) {
        throw new BadRequestException('Selecciona una ciudad válida');
      }
      city = (await this.cities.findOne({ where: { id: Number(input.cityId) } })) ?? undefined;
      if (!city) throw new BadRequestException('La ciudad seleccionada no existe');
    }

    const store = this.stores.create({
      name,
      address,
      ...(description ? { description } : {}),
      ...(phone ? { phone } : {}),
      ...(coordinates ? { latitude: coordinates[0], longitude: coordinates[1] } : {}),
      companyId: company,
      cityId: city ? [city] : [],
    });
    return this.stores.save(store);
  }

  // Actualiza la información pública de una sucursal después de comprobar su propietario.
  async updateStore(user: AuthenticatedUser, storeId: number, input: UpdateStoreInput) {
    const company = await this.requireOwnedCompany(user);
    const store = await this.requireOwnedStore(company, storeId);
    if (!input || typeof input !== 'object') throw new BadRequestException('Envía los datos que deseas actualizar');

    if (input.name !== undefined) store.name = this.requiredText(input.name, 'El nombre de la sucursal es obligatorio', 120);
    if (input.address !== undefined) store.address = this.requiredText(input.address, 'La dirección de la sucursal es obligatoria', 255);
    if (input.description !== undefined) store.description = this.optionalText(input.description, 2000) ?? '';
    if (input.phone !== undefined) store.phone = this.optionalPhone(input.phone) ?? '';
    const coordinates = this.parseStoreCoordinates(input.latitude, input.longitude);
    if (coordinates) [store.latitude, store.longitude] = coordinates;
    if (Object.hasOwn(input, 'cityId')) {
      if (input.cityId === null) {
        store.cityId = [];
      } else {
        if (!Number.isInteger(Number(input.cityId)) || Number(input.cityId) < 1) throw new BadRequestException('Selecciona una ciudad válida');
        const city = await this.cities.findOne({ where: { id: Number(input.cityId) } });
        if (!city) throw new BadRequestException('La ciudad seleccionada no existe');
        store.cityId = [city];
      }
    }

    return this.stores.save(store);
  }

  // Guarda horarios en una sucursal que sí pertenece a la empresa autenticada.
  async createServiceHour(user: AuthenticatedUser, input: CreateServiceHourInput) {
    const company = await this.requireOwnedCompany(user);
    const store = await this.requireOwnedStore(company, input?.storeId);
    const dayOfWeek = this.requiredText(input?.dayOfWeek, 'Selecciona el día de la semana', 20);
    const validDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    if (!validDays.includes(dayOfWeek.toLocaleLowerCase('es-MX'))) {
      throw new BadRequestException('El día debe ser de lunes a domingo');
    }
    const openingTime = this.requiredTime(input?.openingTime, 'Escribe la hora de apertura');
    const closingTime = this.requiredTime(input?.closingTime, 'Escribe la hora de cierre');
    if (openingTime === closingTime) throw new BadRequestException('La apertura y el cierre no pueden ser iguales');

    const serviceHour = this.serviceHours.create({
      dayOfWeek,
      openingTime,
      closingTime,
      companyId: company,
      storeId: store,
    });
    return this.serviceHours.save(serviceHour);
  }

  // Reemplaza de forma atómica el horario semanal de una sucursal propia.
  async saveWeeklySchedule(user: AuthenticatedUser, input: SaveWeeklyScheduleInput) {
    const company = await this.requireOwnedCompany(user);
    const store = await this.requireOwnedStore(company, input?.storeId);
    const canonicalDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    if (!Array.isArray(input?.days) || input.days.length > canonicalDays.length) {
      throw new BadRequestException('Envía una lista válida de días de la semana');
    }

    const seenDays = new Set<string>();
    const schedule = input.days.map((day) => {
      const normalizedDay = typeof day?.dayOfWeek === 'string'
        ? day.dayOfWeek.trim().toLocaleLowerCase('es-MX')
        : '';
      const canonicalDay = canonicalDays.find((candidate) => candidate.toLocaleLowerCase('es-MX') === normalizedDay);
      if (!canonicalDay || seenDays.has(normalizedDay)) {
        throw new BadRequestException('Cada día debe ser válido y aparecer una sola vez');
      }
      seenDays.add(normalizedDay);
      const openingTime = this.requiredTime(day.openingTime, `Escribe la hora de apertura del ${canonicalDay}`);
      const closingTime = this.requiredTime(day.closingTime, `Escribe la hora de cierre del ${canonicalDay}`);
      if (openingTime === closingTime) {
        throw new BadRequestException(`La apertura y el cierre del ${canonicalDay} no pueden ser iguales`);
      }
      return { dayOfWeek: canonicalDay, openingTime, closingTime, companyId: company, storeId: store };
    });

    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(ServiceHour);
      await repository.delete({ storeId: { id: store.id } });
      return schedule.length ? repository.save(repository.create(schedule)) : [];
    });
  }

  // Publica un cupón dentro de una sucursal propia, nunca en una ajena.
  async createCoupon(user: AuthenticatedUser, input: CreateCouponInput) {
    const company = await this.requireOwnedCompany(user);
    const store = await this.requireOwnedStore(company, input?.storeId);
    const name = this.requiredText(input?.name, 'El nombre del cupón es obligatorio', 120);
    const description = this.optionalText(input?.description, 2000);
    const requestedCode = this.optionalText(input?.code, 80);
    const code = requestedCode ? requestedCode.toUpperCase() : await this.generateCouponCode();
    const terms = this.optionalText(input?.terms, 2000);
    const media = this.validateCouponMedia(input);
    let expiration: Date | undefined;

    if (input?.expiration) {
      expiration = new Date(input.expiration);
      if (Number.isNaN(expiration.getTime())) throw new BadRequestException('Escribe una fecha de vencimiento válida');
      if (expiration.getTime() <= Date.now()) throw new BadRequestException('La fecha de vencimiento debe ser futura');
    }

    const coupon = this.coupons.create({
      name,
      ...(description ? { description } : {}),
      ...(code ? { code } : {}),
      ...(terms ? { terms } : {}),
      ...media,
      ...(expiration ? { expiration } : {}),
      storeId: store,
    });
    return this.coupons.save(coupon);
  }

  // Actualiza una promoción solo si pertenece a una sucursal de la empresa autenticada.
  async updateCoupon(user: AuthenticatedUser, couponId: number, input: UpdateCouponInput) {
    const company = await this.requireOwnedCompany(user);
    const coupon = await this.coupons.findOne({
      where: { id: couponId },
      relations: { storeId: { companyId: true } },
    });
    if (!coupon) throw new NotFoundException('No encontramos la promoción');
    if (coupon.storeId?.companyId?.id !== company.id) throw new ForbiddenException('Esta promoción no pertenece a tu negocio');
    if (!input || typeof input !== 'object') throw new BadRequestException('Envía los datos que deseas actualizar');

    if (input.name !== undefined) coupon.name = this.requiredText(input.name, 'El nombre del cupón es obligatorio', 120);
    if (input.description !== undefined) coupon.description = this.optionalText(input.description, 2000) ?? '';
    if (input.terms !== undefined) coupon.terms = this.optionalText(input.terms, 2000) ?? '';
    Object.assign(coupon, this.validateCouponMedia(input, coupon));
    if (input.code !== undefined) {
      const code = this.optionalText(input.code, 80)?.toUpperCase();
      if (code) {
        const duplicate = await this.coupons.findOne({ where: { code } });
        if (duplicate && duplicate.id !== coupon.id) throw new ConflictException('Ese código ya está asignado a otro cupón');
      }
      coupon.code = code ?? '';
    }
    if (input.expiration !== undefined) {
      if (!input.expiration) {
        coupon.expiration = null as never;
      } else {
        const expiration = new Date(input.expiration);
        if (Number.isNaN(expiration.getTime())) throw new BadRequestException('Escribe una fecha de vencimiento válida');
        if (expiration.getTime() <= Date.now()) throw new BadRequestException('La fecha de vencimiento debe ser futura');
        coupon.expiration = expiration;
      }
    }

    return this.coupons.save(coupon);
  }

  private validateCouponMedia(input: CreateCouponInput, current?: Coupon) {
    const media: Partial<Coupon> = {};
    for (const field of ['image_1', 'image_2', 'image_3', 'image_4', 'image_5'] as const) {
      if (input[field] === undefined) continue;
      const image = this.optionalText(input[field], 255);
      if (image && !this.isSupportedCouponImageUrl(image)) {
        throw new BadRequestException('Una imagen no tiene una referencia válida');
      }
      media[field] = image ?? '';
    }
    for (const field of ['tiktok_video', 'youtube_url_video', 'facebook_url_video'] as const) {
      if (input[field] === undefined) continue;
      const value = this.optionalText(input[field], 500);
      if (value) {
        try {
          const url = new URL(value);
          if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) throw new Error('URL inválida');
        } catch { throw new BadRequestException('Escribe un enlace de video válido (https://...)'); }
      }
      media[field] = value ?? '';
    }
    return current ? media : Object.fromEntries(Object.entries(media).filter(([, value]) => value !== '')) as Partial<Coupon>;
  }

  // Usa aleatoriedad criptográfica y revisa que el código todavía no exista.
  private async generateCouponCode() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = `QPV-${randomBytes(4).toString('hex').toUpperCase()}`;
      const existing = await this.coupons.findOne({ where: { code } });
      if (!existing) return code;
    }
    throw new ConflictException('No se pudo generar un código único. Inténtalo de nuevo.');
  }

  // Entrega una ruta pública únicamente después de verificar que el negocio tiene empresa vinculada.
  async uploadCouponImage(user: AuthenticatedUser, imageUrl: string) {
    await this.requireOwnedCompany(user);
    if (!this.isSupportedCouponImageUrl(imageUrl)) {
      throw new BadRequestException('El nombre de imagen no es válido');
    }
    return { imageUrl };
  }

  /** Acepta los archivos locales de desarrollo y las URL seguras de Cloudinary. */
  private isSupportedCouponImageUrl(imageUrl: string) {
    if (/^\/uploads\/coupons\/[a-f0-9-]+\.[a-z0-9]{1,8}$/i.test(imageUrl)) return true;
    try {
      const url = new URL(imageUrl);
      return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com';
    } catch {
      return false;
    }
  }

  // Relee la relación en base de datos para no confiar en el companyId enviado por el cliente.
  private async requireOwnedCompany(user: AuthenticatedUser) {
    if (user.role !== UserRole.BUSINESS) {
      throw new ForbiddenException('Solo una cuenta de negocio puede gestionar estos datos');
    }
    const account = await this.users.findOne({ where: { id: user.id }, relations: { companyId: true } });
    if (!account?.companyId) throw new BadRequestException('Primero registra y vincula tu empresa');
    return account.companyId;
  }

  // Comprueba la propiedad antes de aceptar horarios o promociones para una sucursal.
  private async requireOwnedStore(company: Company, storeId?: number) {
    if (!Number.isInteger(Number(storeId)) || Number(storeId) < 1) {
      throw new BadRequestException('Selecciona una sucursal');
    }
    const store = await this.stores.findOne({
      where: { id: Number(storeId), companyId: { id: company.id } },
      relations: { companyId: true },
    });
    if (!store) throw new NotFoundException('La sucursal no existe o no pertenece a tu empresa');
    return store;
  }

  private requiredText(value: unknown, message: string, maxLength: number) {
    if (typeof value !== 'string' || value.trim().length < 2 || value.trim().length > maxLength) {
      throw new BadRequestException(message);
    }
    return value.trim();
  }

  private optionalText(value: unknown, maxLength: number) {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value !== 'string' || value.trim().length > maxLength) {
      throw new BadRequestException(`El texto no puede superar ${maxLength} caracteres`);
    }
    return value.trim() || undefined;
  }

  private optionalPhone(value: unknown) {
    const phone = this.optionalText(value, 40);
    if (!phone) return undefined;
    const digits = phone.replace(/\D/g, '');
    if (!/^\+?[\d\s().-]+$/.test(phone) || digits.length < 10 || digits.length > 15) {
      throw new BadRequestException('Escribe un teléfono válido');
    }
    return phone;
  }

  private requiredTime(value: unknown, message: string) {
    if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
      throw new BadRequestException(message);
    }
    return value;
  }

  private async loadOverview(companyId?: number) {
    const company = companyId
      ? await this.companies.findOne({
          where: { id: companyId },
          relations: { cityIds: true, categories: true, subcategories: true },
        })
      : null;

    const stores = await this.stores.find({
      where: companyId ? { companyId: { id: companyId } } : {},
      relations: { cityId: true },
      order: { id: 'ASC' },
    });
    const storeIds = stores.map((store) => store.id);
    const coupons = storeIds.length
      ? await this.coupons.find({
          where: { storeId: { id: In(storeIds) } },
          relations: { storeId: true },
          order: { id: 'DESC' },
        })
      : [];
    const companyHours = companyId
      ? await this.serviceHours.find({
          // Solo incluye horarios generales de la empresa, no los ya asociados a sucursales.
          where: { companyId: { id: companyId }, storeId: IsNull() },
          relations: { companyId: true },
        })
      : [];
    const storeHours = storeIds.length
      ? await this.serviceHours.find({
          where: { storeId: { id: In(storeIds) } },
          relations: { storeId: true },
        })
      : [];
    const alerts = await this.alerts.find({ where: { active: true }, order: { id: 'DESC' } });

    return {
      company,
      stores,
      coupons,
      serviceHours: [...companyHours, ...storeHours],
      alerts,
    };
  }
}
