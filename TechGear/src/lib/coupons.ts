export type Coupon = {
  code: string;
  description: string;
  kind: "percent" | "flat";
  value: number; // percent (0-100) or flat BDT amount
  minSubtotal?: number;
};

/** A small fixed set of demo coupons — enough to show a real discount flow
 * without needing a backend or an admin-managed promotions table. */
const COUPONS: Coupon[] = [
  {
    code: "WELCOME10",
    description: "10% off your first order",
    kind: "percent",
    value: 10,
  },
  {
    code: "TECHGEAR500",
    description: "৳500 off orders over ৳20,000",
    kind: "flat",
    value: 500,
    minSubtotal: 20000,
  },
  {
    code: "FREESHIP",
    description: "৳150 off — on us",
    kind: "flat",
    value: 150,
  },
];

export function findCoupon(code: string): Coupon | undefined {
  return COUPONS.find(
    (c) => c.code.toLowerCase() === code.trim().toLowerCase(),
  );
}

export function calculateDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) return 0;
  if (coupon.kind === "percent")
    return Math.round((subtotal * coupon.value) / 100);
  return Math.min(coupon.value, subtotal);
}

export function listCoupons(): Coupon[] {
  return COUPONS;
}
