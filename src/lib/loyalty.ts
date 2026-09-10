// Loyalty program rates — change these two numbers to retune the whole
// program; everywhere that earns or redeems points reads from here.
export const LOYALTY_EARN_RATE = 0.01; // points earned per ৳ spent (1 point per ৳100)
export const LOYALTY_REDEEM_VALUE = 1; // ৳ knocked off per point redeemed (1 point = ৳1)

export function pointsEarnedFor(amountPaid: number): number {
  return Math.floor(amountPaid * LOYALTY_EARN_RATE);
}
