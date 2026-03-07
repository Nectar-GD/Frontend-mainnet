"use client";

import { useIdentity } from "@/hooks/useIdentity";
import { useGoodDollarClaim } from "@/hooks/useGoodDollarClaim";
import { useAccount } from "wagmi";
import {
  ShieldCheck,
  Loader2,
  ExternalLink,
  Gift,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatUnits } from "viem";

export default function Verify() {
  const { address, isConnected } = useAccount();

  const {
    status,
    isVerified,
    fvLink,
    isLoading: identityLoading,
    isVerifying,
    setIsVerifying,
    isGeneratingLink,
    generateLink,
    refresh,
  } = useIdentity();

  const {
    entitlement,
    canClaim,
    claim,
    isClaiming,
    isLoading: claimLoading,
    nextClaimDate,
    error: claimError,
    isReady,
  } = useGoodDollarClaim() as any; // useGoodDollarSDK shape

  const handleStartVerification = async () => {
    setIsVerifying(true);
    if (!fvLink) {
      await generateLink();
    }
  };

  const handleOpenFvLink = () => {
    if (fvLink) {
      window.open(fvLink, "_blank", "noopener,noreferrer");
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-[#252B36] mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-sm text-gray-600">
            Connect your wallet to start the verification process.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-lg mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#252B36] mb-1">
            Identity Verification
          </h1>
          <p className="text-sm text-gray-600">
            Verify once with GoodDollar to join pools and claim daily G$ UBI.
          </p>
        </div>

        {/* Status Card */}
        <div className="border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            {identityLoading ? (
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            ) : isVerified ? (
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
            )}
            <div>
              <p className="font-semibold text-[#252B36] text-sm">
                {identityLoading
                  ? "Checking status…"
                  : isVerified
                  ? "Identity Verified ✓"
                  : "Not Yet Verified"}
              </p>
              <p className="text-xs text-gray-500 font-mono">
                {address?.slice(0, 8)}…{address?.slice(-6)}
              </p>
            </div>
          </div>

          {/* Verification Action */}
          {!identityLoading && !isVerified && (
            <div className="space-y-3">
              {!isVerifying ? (
                <button
                  onClick={handleStartVerification}
                  className="w-full py-3 bg-[#FFC000] text-[#252B36] rounded-lg font-bold hover:bg-[#FFD14D] transition-colors flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Start Face Verification
                </button>
              ) : isGeneratingLink ? (
                <div className="w-full py-3 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center gap-2 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating secure link…
                </div>
              ) : fvLink ? (
                <div className="space-y-2">
                  <button
                    onClick={handleOpenFvLink}
                    className="w-full py-3 bg-[#FFC000] text-[#252B36] rounded-lg font-bold hover:bg-[#FFD14D] transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Open Face Verification
                  </button>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Polling for verification…
                  </div>
                </div>
              ) : (
                <button
                  onClick={generateLink}
                  className="w-full py-3 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                >
                  Retry — Generate Link
                </button>
              )}

              {isVerifying && (
                <button
                  onClick={refresh}
                  className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Already verified? Check again
                </button>
              )}
            </div>
          )}

          {/* Verified state */}
          {!identityLoading && isVerified && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              ✅ Your identity is verified. You can now join any pool.
            </p>
          )}
        </div>

        {/* UBI Claim Card — only shown when verified */}
        {isVerified && (
          <div className="border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-green-600" />
              <h2 className="font-bold text-[#252B36]">Daily G$ UBI</h2>
            </div>

            {claimLoading ? (
              <div className="flex items-center justify-center py-6 gap-2 text-gray-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading claim data…
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Available</p>
                    <p className="font-bold text-[#252B36] text-lg">
                      {entitlement
                        ? `${parseFloat(entitlement).toFixed(2)} G$`
                        : "—"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Next Claim</p>
                    <p className="font-bold text-[#252B36] text-sm">
                      {nextClaimDate
                        ? nextClaimDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : canClaim
                        ? "Now!"
                        : "—"}
                    </p>
                  </div>
                </div>

                {canClaim ? (
                  <button
                    onClick={claim}
                    disabled={isClaiming || !isReady}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Claiming…
                      </>
                    ) : (
                      <>
                        <Gift className="w-5 h-5" />
                        Claim {entitlement ? `${parseFloat(entitlement).toFixed(2)} G$` : "G$"} Now
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 justify-center text-sm text-gray-500 py-2">
                    <Clock className="w-4 h-4" />
                    {nextClaimDate
                      ? `Next claim: ${nextClaimDate.toLocaleString()}`
                      : "Already claimed today"}
                  </div>
                )}

                {claimError && (
                  <p className="text-xs text-red-600 text-center">
                    {claimError.message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* How it works */}
        <div className="mt-6 bg-gray-50 rounded-xl p-5">
          <h3 className="font-semibold text-[#252B36] text-sm mb-3">
            How it works
          </h3>
          <ol className="space-y-2 text-xs text-gray-600 list-decimal list-inside">
            <li>Click <strong>Start Face Verification</strong> above.</li>
            <li>
              Complete a brief face scan via GoodDollar&apos;s secure portal —
              no app required.
            </li>
            <li>
              Return here — your status updates automatically within seconds.
            </li>
            <li>Once verified, claim your daily G$ UBI and join any pool.</li>
          </ol>
        </div>
      </main>
    </div>
  );
}