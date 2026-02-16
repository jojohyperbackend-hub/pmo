import "@/styles/globals.css"; 

export const metadata = {
  title: "PMO RPG Planner",
  description: "Turn-based RPG style planner 1-900 days",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white font-sans">
        {children}
      </body>
    </html>
  );
}
