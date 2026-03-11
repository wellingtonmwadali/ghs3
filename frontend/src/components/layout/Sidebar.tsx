'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
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
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cars', href: '/cars', icon: Car },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Team', href: '/mechanics', icon: Wrench },
  { name: 'Bookings', href: '/bookings', icon: Calendar },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');

  useEffect(() => {
    // Load logo and company name from localStorage
    const savedLogo = localStorage.getItem('companyLogo');
    const savedName = localStorage.getItem('companyName');
    if (savedLogo) {
      setCompanyLogo(savedLogo);
    }
    if (savedName) {
      setCompanyName(savedName);
    }

    // Listen for storage changes to update logo in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'companyLogo') {
        setCompanyLogo(e.newValue || '');
      }
      if (e.key === 'companyName') {
        setCompanyName(e.newValue || '');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event for same-tab updates
    const handleLogoUpdate = ((e: CustomEvent) => {
      setCompanyLogo(e.detail.logo);
      if (e.detail.name) {
        setCompanyName(e.detail.name);
      }
    }) as EventListener;
    
    window.addEventListener('logoUpdated', handleLogoUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('logoUpdated', handleLogoUpdate);
    };
  }, []);

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        {companyLogo ? (
          <div className="flex flex-col items-center gap-1 w-full">
            <img 
              src={companyLogo} 
              alt="Company Logo" 
              className="h-10 w-10 object-contain"
            />
            {companyName && (
              <span className="text-xs font-medium text-gray-700">{companyName}</span>
            )}
          </div>
        ) : (
          <h1 className="text-xl font-semibold tracking-tight">GHS3</h1>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-muted-foreground">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
