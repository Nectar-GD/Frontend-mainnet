"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Loader2, ShieldCheck, Gift, Lock, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useIdentity } from "@/hooks/useIdentity";

export function AutoVerifyModal() {
  const { address, isConnected } = useAccount();
  const [showModal, setShowModal] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const {
    status,
    isVerified,
    fvLink,
    isLoading,
    isVerifying,
    setIsVerifying,
    isGeneratingLink,
    generateLink,
  } = useIdentity();

  // Show modal once per session when user is connected and not verified
  useEffect(() => {
    if (!isConnected || !address || hasChecked) return;
    if (status === "loading") return; // Wait for check to complete

    if (!isVerified) {
      setShowModal(true);
    }
    setHasChecked(true);
  }, [isConnected, address, status, isVerified, hasChecked]);

  // Hide modal automatically when user gets verified
  useEffect(() => {
    if (isVerified && showModal) {
      toast.success("🎉 Identity verified! You can now join pools.");
      setShowModal(false);
    }
  }, [isVerified, showModal]);

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

  const handleClose = () => {
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center gap-4">
          {/* Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-green-600" />
          </div>

          {/* Title */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-[#252B36] mb-2">
              Verify Your Identity
            </h3>
            <p className="text-sm text-gray-600">
              Verify with GoodDollar Face Verification to join savings pools and
              claim daily UBI.
            </p>
          </div>

          {/* Benefits */}
          <div className="w-full bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Gift className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-900">
                Claim daily G$ UBI tokens
              </p>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-900">
                One real person — one wallet
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-900">Required to join any pool</p>
            </div>
          </div>

          {/* Step flow */}
          {!isVerifying ? (
            // Step 1: Start verification
            <button
              onClick={handleStartVerification}
              disabled={isLoading}
              className="w-full py-3 bg-[#FFC000] text-[#252B36] rounded-lg font-bold hover:bg-[#FFD14D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Checking status...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Start Face Verification
                </>
              )}
            </button>
          ) : (
            // Step 2: Open FV link
            <div className="w-full space-y-3">
              {isGeneratingLink ? (
                <div className="w-full py-3 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center gap-2 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating verification link...
                </div>
              ) : fvLink ? (
                <button
                  onClick={handleOpenFvLink}
                  className="w-full py-3 bg-[#FFC000] text-[#252B36] rounded-lg font-bold hover:bg-[#FFD14D] transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  Open Face Verification
                </button>
              ) : (
                <button
                  onClick={generateLink}
                  className="w-full py-3 bg-[#FFC000] text-[#252B36] rounded-lg font-bold hover:bg-[#FFD14D] transition-colors flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Retry — Get Verification Link
                </button>
              )}

              {/* Polling indicator */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Waiting for verification to complete…
              </div>
            </div>
          )}

          {/* Info */}
          <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800 text-center">
              💡 You&apos;ll complete a quick face scan via{" "}
              <strong>GoodDollar</strong> — no app download required.
            </p>
          </div>

          {/* Skip */}
          <button
            onClick={handleClose}
            className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
          >
            Skip for now (you won&apos;t be able to join pools)
          </button>
        </div>
      </div>
    </div>
  );
}