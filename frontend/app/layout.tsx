import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { inter, cormorant } from "./fonts";

export const metadata: Metadata = {
    title: "Balance",
    description: "Women’s Health Symptom Tracker",
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} ${cormorant.variable}`}>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
