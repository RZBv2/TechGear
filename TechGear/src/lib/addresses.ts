import { readJSON, writeJSON } from "@/lib/storage";

export type Address = {
  id: string;
  label: string; // "Home", "Office", etc.
  phone: string;
  addressLine: string;
  isDefault: boolean;
};

const ADDRESSES_KEY = "techgear_addresses";

type AddressesByEmail = Record<string, Address[]>;

export function getAddresses(email: string): Address[] {
  const all = readJSON<AddressesByEmail>(ADDRESSES_KEY, {});
  return all[email] ?? [];
}

export function addAddress(email: string, address: Address): void {
  const all = readJSON<AddressesByEmail>(ADDRESSES_KEY, {});
  const existing = all[email] ?? [];
  // Only one default at a time.
  const next = address.isDefault
    ? existing.map((a) => ({ ...a, isDefault: false }))
    : existing;
  all[email] = [...next, address];
  writeJSON(ADDRESSES_KEY, all);
}

export function removeAddress(email: string, addressId: string): void {
  const all = readJSON<AddressesByEmail>(ADDRESSES_KEY, {});
  all[email] = (all[email] ?? []).filter((a) => a.id !== addressId);
  writeJSON(ADDRESSES_KEY, all);
}

export function setDefaultAddress(email: string, addressId: string): void {
  const all = readJSON<AddressesByEmail>(ADDRESSES_KEY, {});
  all[email] = (all[email] ?? []).map((a) => ({
    ...a,
    isDefault: a.id === addressId,
  }));
  writeJSON(ADDRESSES_KEY, all);
}

export function generateAddressId(): string {
  return `ADDR-${Date.now().toString(36).toUpperCase()}`;
}
