export type Locale = 'ar' | 'en';

export type Localized<T> = { ar: T; en: T };

export type ListingType = 'chalet' | 'rest_house' | 'camp' | 'farm';

export type AmenityId =
  | 'wifi'
  | 'pool'
  | 'kitchen'
  | 'parking'
  | 'ac'
  | 'bbq'
  | 'sound_system'
  | 'tv'
  | 'private_entrance'
  | 'majlis'
  | 'kids_area'
  | 'prayer_room';

export interface Amenity {
  id: AmenityId;
  label: Localized<string>;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Capacity {
  guests: number;
  bedrooms: number;
  bathrooms: number;
}

export interface Pricing {
  nightly: number;
  cleaningFee: number;
  serviceFee: number;
}

export interface Rating {
  average: number;
  count: number;
}

export interface Host {
  id: string;
  name: Localized<string>;
  avatarUrl: string;
  joinedAt: string;
  languages: Locale[];
  responseRate: number;
  isSuperHost: boolean;
}

export interface Listing {
  id: string;
  type: ListingType;
  title: Localized<string>;
  description: Localized<string>;
  city: Localized<string>;
  region: Localized<string>;
  coordinates: Coordinates;
  capacity: Capacity;
  amenities: AmenityId[];
  photos: string[];
  pricing: Pricing;
  hostId: string;
  rating: Rating;
  createdAt: string;
}

export type ServiceKind = 'catering' | 'decoration' | 'staff' | 'photography' | 'entertainment';

export type ServiceUnit = 'flat' | 'per_guest' | 'per_hour';

export interface AddOnService {
  id: string;
  kind: ServiceKind;
  title: Localized<string>;
  description: Localized<string>;
  price: number;
  unit: ServiceUnit;
  imageUrl?: string;
}

export type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

export interface BookedService {
  serviceId: string;
  quantity: number;
}

export interface BookingPriceBreakdown {
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  servicesTotal: number;
  total: number;
}

export interface Booking {
  id: string;
  listingId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  services: BookedService[];
  pricing: BookingPriceBreakdown;
  status: BookingStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  listingId: string;
  authorId: string;
  authorName: Localized<string>;
  authorAvatarUrl: string;
  rating: number;
  text: Localized<string>;
  createdAt: string;
}

export interface User {
  id: string;
  name: Localized<string>;
  email: string;
  phone: string;
  avatarUrl: string;
  preferredLocale: Locale;
  createdAt: string;
}

export interface MessageThread {
  id: string;
  hostId: string;
  listingId?: string;
  lastMessagePreview: Localized<string>;
  unread: boolean;
  updatedAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  body: Localized<string>;
  sentAt: string;
}
