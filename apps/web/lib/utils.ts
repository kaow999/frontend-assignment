import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges conditional classes, letting a later Tailwind utility win. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
