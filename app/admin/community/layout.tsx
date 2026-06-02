import { requireAdminUser } from "@/lib/admin/require-admin";

export default async function AdminCommunityLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminUser();
  return children;
}
