export type SizeCategory = {
  name: string;
  description: string;
  unit: string;
  columns: string[];
  sizes: Record<string, (number | string)[]>;
};

export const sizeCategories: SizeCategory[] = [
  {
    name: "Compressions",
    description:
      "Tight-fit performance wear. 80% Polyamide (Nylon), 20% Spandex (Elastane). 310 GSM.",
    unit: "inches",
    columns: [
      "Chest",
      "Waist",
      "Bottom Opening",
      "Length",
      "Neck Width (Flat)",
      "Neck Drop (Flat)",
      "Back Neck Drop (Flat)",
      "Collar",
      "Shoulder Width",
      "Armhole",
      "Sleeve (Length)",
      "Sleeve (Opening)",
      "Rib Height",
    ],
    sizes: {
      XS: [32, 25, 24.5, 27, 6.5, 2.75, 1, 18.5, 16, 16.5, 6.5, 11, 0.65],
      S: [34, 27, 26, 28, 6.75, 2.9, 1.05, 19, 16.75, 17, 6.75, 11.5, 0.65],
      M: [36, 29, 27.5, 29, 7, 3, 1.1, 19.5, 17.5, 17.5, 7, 12, 0.7],
      L: [38, 31, 29, 30, 7.25, 3.15, 1.2, 20, 18.25, 18.25, 7.25, 12.5, 0.7],
      XL: [40, 33, 30.5, 31, 7.5, 3.25, 1.25, 20.5, 19, 19, 7.5, 13, 0.75],
    },
  },
  {
    name: "Regular Tops",
    description: "Standard fit t-shirts and tops. 100% Cotton. 350 GSM.",
    unit: "inches",
    columns: [
      "Chest",
      "Waist",
      "Bottom Opening",
      "Length",
      "Collar",
      "Shoulder Width",
      "Armhole",
      "Sleeve (Length)",
      "Sleeve (Opening)",
      "Rib Height",
    ],
    sizes: {
      XS: [38, 35, 35.5, 28.5, 19.5, 16.5, 17, 7.5, 12.5, 0.85],
      S: [40, 37, 37.5, 29, 20, 17.25, 17.5, 8, 13, 0.85],
      M: [42, 39, 39.5, 29.5, 20.5, 18, 18, 8.5, 13.5, 0.9],
      L: [44, 41, 41.5, 30, 21, 18.75, 19, 9, 14, 0.9],
      XL: [46, 43, 43.5, 30.5, 21.5, 19.5, 20, 9.5, 14.5, 0.9],
    },
  },
  {
    name: "Oversized Tops",
    description: "Relaxed oversized fit. 100% Cotton. 350 GSM.",
    unit: "inches",
    columns: [
      "Chest",
      "Bottom Opening",
      "Length",
      "Collar",
      "Shoulder Width",
      "Armhole",
      "Sleeve (Length)",
      "Sleeve (Opening)",
      "Rib Height",
    ],
    sizes: {
      XS: [42, 42, 29, 20, 18.5, 18.5, 9, 15, 1.1],
      S: [44, 44, 29.5, 20.5, 19, 19, 9.5, 15.5, 1.1],
      M: [46, 46, 30.5, 21, 20.5, 20, 10, 16, 1.15],
      L: [48, 48, 31, 21.5, 21.5, 21, 10.5, 16.5, 1.2],
      XL: [50, 50, 31.5, 22, 22.5, 22, 11, 17, 1.2],
    },
  },
  {
    name: "Sweatpants",
    description:
      "Premium heavyweight joggers. 90% Cotton, 7% Spandex, 3% Steel Micro. 450 GSM.",
    unit: "inches",
    columns: [
      "Waist (Relaxed)",
      "Waist (Stretched)",
      "Waistband Height",
      "Bottom Hem Height",
      "Hip (8in Below Waist)",
      "Inseam",
      "Outseam (Length)",
      "Front Rise",
      "Back Rise",
      "Thigh (1in Below Crotch)",
      "Leg Opening",
      "Knee (14in Down)",
    ],
    sizes: {
      XS: [28, 33, 1.75, 1, 36, 28.5, 39.5, 11, 14.5, 12, 9.5, 9.5],
      S: [30, 35, 1.75, 1, 38, 29, 40.5, 11.5, 15, 12.5, 10, 10],
      M: [32, 37, 1.75, 1, 40, 29.5, 41.5, 12, 15.5, 13, 10.5, 10.5],
      L: [34, 39, 1.75, 1, 42, 30, 42.5, 12.5, 16, 13.75, 11, 11],
      XL: [36, 41, 1.75, 1, 44, 30.5, 43.5, 13, 16.5, 14.5, 11.5, 11.5],
    },
  },
];

export const fitGuide = [
  {
    name: "Compressions",
    fit: "Tight / Athletic",
    description:
      "Body-contouring fit with medium-high compression. Designed for shoulder definition and hourglass shape. 4-way stretch performance fabric.",
  },
  {
    name: "Regular Tops",
    fit: "Standard",
    description:
      "True to size fit. Relaxed through the body with a comfortable drape. Ideal for everyday wear and light training.",
  },
  {
    name: "Oversized Tops",
    fit: "Relaxed / Oversized",
    description:
      "Intentionally oversized with dropped shoulders and extra room through the body. Size down for a less relaxed fit.",
  },
  {
    name: "Sweatpants",
    fit: "Relaxed Tapered",
    description:
      "Relaxed through the hip and thigh with a tapered leg. Elastic waistband with drawstring. Heavyweight premium cotton.",
  },
];
