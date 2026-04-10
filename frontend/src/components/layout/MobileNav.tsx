'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useSidebarStore } from '@/store/sidebar.store';
import {
  LayoutDashboard,
  Car,
  Users,
  FileText,
  Package,
  Wrench,
  Calendar,
  Settings,
  LogOut,
  BarChart3,
  X,
  ClipboardCheck,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cars', href: '/cars', icon: Car },
  { name: 'Inspections', href: '/inspections', icon: ClipboardCheck },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Bookings', href: '/bookings', icon: Calendar },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Team', href: '/mechanics', icon: Wrench },
  { name: 'Attendance', href: '/attendance', icon: Clock },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { isMobileOpen, setMobileOpen } = useSidebarStore();
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    const savedName = localStorage.getItem('companyName');
    if (savedName) setCompanyName(savedName);
  }, []);

  // Close on route change 
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  const filteredNav = navigation.filter((item) => {
    if (!(item as any).roles) return true;
    return (item as any).roles.includes(user?.role?.slug?.toLowerCase() || '');
  });

  if (!isMobileOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => setMobileOpen(false)}
      />
      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 bg-background border-r shadow-xl animate-in slide-in-from-left duration-300">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="font-semibold text-sm">{companyName || 'GHS3 Garage'}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 h-[calc(100vh-3.5rem)]">
          <nav className="flex flex-col gap-1 p-3">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-primary'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className={cn('h-4 w-4', isActive && 'text-primary')} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t p-3 mt-auto">
            <div className="mb-2 px-3">
              <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role?.name || user?.role?.slug}</p>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

const bottomNavItems = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cars', href: '/cars', icon: Car },
  { name: 'Bookings', href: '/bookings', icon: Calendar },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'More', href: '/settings', icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex items-center justify-around py-1.5">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
