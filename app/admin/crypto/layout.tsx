import { requireAdminUser } from "@/lib/admin/require-admin";

export default async function AdminCryptoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminUser();
  return <div className="space-y-4">{children}</div>;
}
