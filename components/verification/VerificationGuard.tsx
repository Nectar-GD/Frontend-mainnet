'use client';

import { useIdentity } from '@/hooks/useIdentity';
import { Loader2, ShieldAlert, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface VerificationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function VerificationGuard({ children, fallback }: VerificationGuardProps) {
  const { isVerified, isLoading } = useIdentity();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    );
  }

  if (!isVerified) {
    return fallback || (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-yellow-600" />
        </div>
        <h3 className="text-lg font-bold text-[#252B36] mb-2">
          Verification Required
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          You must verify your identity with GoodDollar Face Verification before
          you can join any savings pool.
        </p>
        <Link
          href="/verify"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFC000] text-[#252B36] rounded-lg font-bold hover:bg-[#FFD14D] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Verify Now
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}