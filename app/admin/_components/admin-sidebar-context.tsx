"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const LEGACY_STORAGE_KEY = "admin-sidebar-collapsed";

type AdminSidebarContextValue = {
  /** true면 아이콘만 보이는 접힌 상태 */
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
};

const AdminSidebarContext = createContext<AdminSidebarContextValue | null>(
  null,
);

export function AdminSidebarProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // 기본: 메뉴 라벨이 보이는 펼친 상태
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 예전 접힘 설정이 남아 있으면 제거 (아이콘만 보이던 상태 방지)
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // 무시
    }
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({ isCollapsed, toggleCollapsed, setCollapsed }),
    [isCollapsed, toggleCollapsed, setCollapsed],
  );

  return (
    <AdminSidebarContext.Provider value={value}>
      {children}
    </AdminSidebarContext.Provider>
  );
}

export function useAdminSidebar() {
  const context = useContext(AdminSidebarContext);
  if (!context) {
    throw new Error("useAdminSidebar는 AdminSidebarProvider 안에서 사용해야 합니다.");
  }
  return context;
}
