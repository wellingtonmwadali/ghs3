'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Car,
  Wrench,
  Users,
  BarChart3,
  Calendar,
  Shield,
  ClipboardCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Bell,
} from 'lucide-react';

const features = [
  {
    icon: Car,
    title: 'Vehicle Management',
    description: 'Track every vehicle from intake to delivery with detailed service histories and real-time status updates.',
  },
  {
    icon: Wrench,
    title: 'Job Card System',
    description: 'Create, assign, and monitor job cards with full inspection workflows and parts tracking.',
  },
  {
    icon: Users,
    title: 'Customer Relations',
    description: 'Manage customer profiles, communication history, and build lasting relationships.',
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Gain insights with revenue reports, expense tracking, and profit/loss statements.',
  },
  {
    icon: Calendar,
    title: 'Booking & Scheduling',
    description: 'Online booking system with calendar views, confirmations, and automated reminders.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'Secure access control for owners, managers, mechanics, and receptionists.',
  },
];

const benefits = [
  { icon: Clock, text: 'Save hours on paperwork every week' },
  { icon: DollarSign, text: 'Track revenue and expenses in real-time' },
  { icon: ClipboardCheck, text: 'Never miss a service or follow-up' },
  { icon: Bell, text: 'Automated notifications for customers and staff' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Wrench className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">GHS3</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">
                Get Started
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
              <Wrench className="h-4 w-4" />
              Garage Management System
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Run your garage{' '}
              <span className="text-primary">smarter</span>,{' '}
              not harder
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
              The all-in-one platform to manage vehicles, track jobs, handle invoicing,
              and grow your automotive business — from a single dashboard.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="h-12 px-8 text-base">
                  Start Managing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                  See Features
                </Button>
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: '100%', label: 'Digital Workflow' },
              { value: '4', label: 'User Roles' },
              { value: '24/7', label: 'Access' },
              { value: 'Real-time', label: 'Updates' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to run your garage
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From vehicle intake to final invoice — manage every aspect of your workshop.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Why choose GHS3?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Purpose-built for automotive garages, body shops, and service centers
                that want to ditch the spreadsheets and go digital.
              </p>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit.text} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <benefit.icon className="h-4 w-4" />
                    </div>
                    <span className="text-muted-foreground">{benefit.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border bg-card p-8 shadow-sm">
              <h3 className="text-xl font-semibold">Supported Roles</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every team member gets a tailored experience
              </p>
              <div className="mt-6 space-y-4">
                {[
                  { role: 'Owner', desc: 'Full system control, reports, and analytics' },
                  { role: 'Manager', desc: 'Day-to-day operations and staff management' },
                  { role: 'Mechanic', desc: 'Job assignments, inspections, and attendance' },
                  { role: 'Receptionist', desc: 'Bookings, customer intake, and invoicing' },
                ].map((r) => (
                  <div key={r.role} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <div className="font-medium">{r.role}</div>
                      <div className="text-sm text-muted-foreground">{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-primary/5 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to streamline your garage?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Sign in to start managing your vehicles, mechanics, and invoices — all in one place.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-base">
                Sign in Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wrench className="h-4 w-4" />
            GHS3 — Garage Management System
          </div>
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} All rights reserved
          </div>
        </div>
      </footer>
    </div>
  );
}
