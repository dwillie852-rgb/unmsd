import "./globals.css";

export const metadata = {
  title: "United Nations Medical Services Division (UNMSD)",
  description:
    "Providing global independent, impartial medical humanitarian assistance, occupational health management, and field hospital operations for United Nations personnel worldwide.",
  keywords: ["United Nations", "Medical Services", "UNMSD", "Field Hospitals", "Peacekeeping", "Health Data"],
  authors: [{ name: "United Nations Medical Services Division" }],
  openGraph: {
    title: "United Nations Medical Services Division (UNMSD)",
    description:
      "Providing global independent, impartial medical humanitarian assistance and field hospital operations for UN personnel worldwide.",
    url: "https://unmsd.un.org",
    siteName: "UNMSD",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "United Nations Medical Services Division (UNMSD)",
    description:
      "Providing global independent, impartial medical humanitarian assistance and field hospital operations for UN personnel worldwide.",
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL("https://unmsd.un.org"),
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#005bbb",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
