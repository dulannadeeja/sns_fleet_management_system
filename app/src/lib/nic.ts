// A Sri Lankan NIC as on the card (system design 3.2 "Partner accounts", 6; Proposed: Dulan, 1 Nov 2026): 9 digits and V
// or X (old cards) or 12 digits (new cards). Typed spaces are dropped and letters made capital.
export const NIC = /^(\d{9}[VX]|\d{12})$/;
export const normalNic = (raw: string) => raw.replace(/\s+/g, '').toUpperCase();
export const isNic = (raw: string) => NIC.test(normalNic(raw));
