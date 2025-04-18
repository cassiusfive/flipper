import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
    title: "Create Next App",
    description: "Generated by create next app",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <Providers>
                    <Header />
                    <div className="mx-12">{children}</div>
                </Providers>
            </body>
        </html>
    );
}
