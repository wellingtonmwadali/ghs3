'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, FileText, Printer } from 'lucide-react';

interface ReportShellProps {
  id: string;
  title: string;
  description: string;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onPrint: () => void;
  children: React.ReactNode;
}

export function ReportShell({ id, title, description, onExportCSV, onExportPDF, onPrint, children }: ReportShellProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
        <div className="flex gap-1 no-print">
          <Button variant="ghost" size="sm" onClick={onExportCSV} title="Export CSV">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onExportPDF} title="Export PDF">
            <FileText className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onPrint} title="Print">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent id={id}>
        {children}
      </CardContent>
    </Card>
  );
}
