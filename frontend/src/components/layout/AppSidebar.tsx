'use client';

import { useState, useEffect } from 'react';
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
  ChevronsLeft,
  ChevronsRight,
  ClipboardCheck,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

const navigation: NavItem[] = [
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

export default function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { isCollapsed, toggle } = useSidebarStore();
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');

  useEffect(() => {
    const savedLogo = localStorage.getItem('companyLogo');
    const savedName = localStorage.getItem('companyName');
    if (savedLogo) setCompanyLogo(savedLogo);
    if (savedName) setCompanyName(savedName);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'companyLogo') setCompanyLogo(e.newValue || '');
      if (e.key === 'companyName') setCompanyName(e.newValue || '');
    };

    const handleLogoUpdate = ((e: CustomEvent) => {
      setCompanyLogo(e.detail.logo);
      if (e.detail.name) setCompanyName(e.detail.name);
    }) as EventListener;

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('logoUpdated', handleLogoUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('logoUpdated', handleLogoUpdate);
    };
  }, []);

  const filteredNav = navigation.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role?.slug?.toLowerCase() || '');
  });

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'hidden md:flex flex-col border-r bg-sidebar text-sidebar-foreground sidebar-transition',
          isCollapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        {/* Logo / Brand */}
        <div className={cn('flex h-14 items-center border-b border-sidebar-border px-3', isCollapsed ? 'justify-center' : 'px-4')}>
          {isCollapsed ? (
            companyLogo ? (
              <img src={companyLogo} alt="Logo" className="h-8 w-8 object-contain" />
            ) : (
              <span className="text-lg font-bold text-primary">G</span>
            )
          ) : (
            <div className="flex items-center gap-2 overflow-hidden">
              {companyLogo ? (
                <img src={companyLogo} alt="Logo" className="h-8 w-8 object-contain flex-shrink-0" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                  G
                </div>
              )}
              <span className="font-semibold truncate text-sm">
                {companyName || 'GHS3 Garage'}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="flex flex-col gap-1 px-2">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href;
              const link = (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-primary'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <item.icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-primary')} />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-4">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return link;
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-2">
          {!isCollapsed && (
            <div className="mb-2 px-3 py-1">
              <p className="text-sm font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role?.name || user?.role?.slug}</p>
            </div>
          )}

          <Separator className={cn('mb-2', isCollapsed && 'hidden')} />

          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={logout}
                  className="flex w-full items-center justify-center rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          )}

          {/* Collapse Toggle */}
          <button
            onClick={toggle}
            className="mt-1 flex w-full items-center justify-center rounded-lg py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {isCollapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <div className="flex items-center gap-2">
                <ChevronsLeft className="h-4 w-4" />
                <span className="text-xs">Collapse</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
