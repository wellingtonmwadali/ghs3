'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, UserPlus, UserCheck } from 'lucide-react';
import type { Customer } from '@/types';

interface CustomerSectionProps {
  customers: Customer[];
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerGender: string;
  isNewCustomer: boolean;
  onCustomerSelect: (customer: Customer | null) => void;
  onFieldChange: (field: string, value: string) => void;
  onToggleNewCustomer: (isNew: boolean) => void;
}

export function CustomerSection({
  customers,
  customerId,
  customerName,
  customerEmail,
  customerPhone,
  customerAddress,
  customerGender,
  isNewCustomer,
  onCustomerSelect,
  onFieldChange,
  onToggleNewCustomer,
}: CustomerSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = searchTerm
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone.includes(searchTerm) ||
          c.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : customers;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Customer Information
        </h3>
        <Button
          type="button"
          variant={isNewCustomer ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            onToggleNewCustomer(!isNewCustomer);
            if (!isNewCustomer) onCustomerSelect(null);
          }}
        >
          {isNewCustomer ? (
            <>
              <UserCheck className="mr-2 h-4 w-4" />
              Select Existing
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              New Customer
            </>
          )}
        </Button>
      </div>

      {!isNewCustomer ? (
        <div className="space-y-3">
          {/* Search + Select existing customer */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {searchTerm && filtered.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
              {filtered.slice(0, 20).map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => {
                    onCustomerSelect(c);
                    setSearchTerm('');
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors border-b last:border-b-0 ${
                    customerId === c._id ? 'bg-accent' : ''
                  }`}
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground ml-2">{c.phone}</span>
                  {c.email && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      ({c.email})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {customerId && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
              <p>
                <span className="font-medium">Selected:</span> {customerName}
              </p>
              {customerPhone && (
                <p className="text-muted-foreground">Phone: {customerPhone}</p>
              )}
              {customerEmail && (
                <p className="text-muted-foreground">Email: {customerEmail}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="customerName">Full Name *</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => onFieldChange('customerName', e.target.value)}
              placeholder="Enter customer name"
            />
          </div>
          <div>
            <Label htmlFor="customerPhone">Phone *</Label>
            <Input
              id="customerPhone"
              value={customerPhone}
              onChange={(e) => onFieldChange('customerPhone', e.target.value)}
              placeholder="e.g. 0712345678"
            />
          </div>
          <div>
            <Label htmlFor="customerEmail">Email</Label>
            <Input
              id="customerEmail"
              type="email"
              value={customerEmail}
              onChange={(e) => onFieldChange('customerEmail', e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <Label htmlFor="customerGender">Gender</Label>
            <Select
              value={customerGender}
              onValueChange={(v) => onFieldChange('customerGender', v)}
            >
              <SelectTrigger id="customerGender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="customerAddress">Address</Label>
            <Input
              id="customerAddress"
              value={customerAddress}
              onChange={(e) => onFieldChange('customerAddress', e.target.value)}
              placeholder="Customer address"
            />
          </div>
        </div>
      )}
    </div>
  );
}
