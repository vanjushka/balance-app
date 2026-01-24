import { Inter, Cormorant_Garamond } from "next/font/google";
export const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

export const cormorant = Cormorant_Garamond({
    subsets: ["latin"],
    variable: "--font-cormorant-garamond",
    display: "swap",
    weight: ["400", "600", "700"],
});
