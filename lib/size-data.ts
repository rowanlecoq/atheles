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
    columns: ["Chest", "Waist", "Length", "Shoulder Width", "Sleeve Length"],
    sizes: {
      S: [34, 27, 28, 16.75, 6.75],
      M: [36, 29, 29, 17.5, 7],
      L: [38, 31, 30, 18.25, 7.25],
      XL: [40, 33, 31, 19, 7.5],
    },
  },
  {
    name: "Regular Tops",
    description: "Standard fit t-shirts and tops. 100% Cotton. 350 GSM.",
    unit: "inches",
    columns: ["Chest", "Waist", "Length", "Shoulder Width", "Sleeve Length"],
    sizes: {
      S: [40, 37, 27.5, 17.25, 8],
      M: [42, 39, 28, 18, 8.5],
      L: [44, 41, 28.5, 18.75, 9],
      XL: [46, 43, 29, 19.5, 9.5],
    },
  },
  {
    name: "Oversized Tops",
    description: "Relaxed oversized fit. 100% Cotton. 350 GSM.",
    unit: "inches",
    columns: ["Chest", "Length", "Shoulder Width", "Sleeve Length"],
    sizes: {
      S: [44, 28.5, 19.5, 9.5],
      M: [46, 29.5, 20.5, 10],
      L: [48, 30, 21.5, 10.5],
      XL: [50, 30.5, 22.5, 11],
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
      "Hip",
      "Inseam",
      "Outseam",
      "Thigh",
      "Leg Opening",
    ],
    sizes: {
      S: [30, 35, 38, 29, 40.5, 12.5, 10],
      M: [32, 37, 40, 29.5, 41.5, 13, 10.5],
      L: [34, 39, 42, 30, 42.5, 13.75, 11],
      XL: [36, 41, 44, 30.5, 43.5, 14.5, 11.5],
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
