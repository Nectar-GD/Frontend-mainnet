"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

// Dynamic SDK imports — safe for environments where packages may not be installed
let ClaimSDK: any;
let useIdentitySDK: any;

try {
  const identitySDK = require("@goodsdks/identity-sdk");
  const citizenSDK = require("@goodsdks/citizen-sdk");
  useIdentitySDK =
    identitySDK.useIdentitySDK || identitySDK.default?.useIdentitySDK;
  ClaimSDK =
    citizenSDK.ClaimSDK ||
    citizenSDK.default?.ClaimSDK ||
    identitySDK.ClaimSDK;
} catch (error) {
  console.warn("[useGoodDollarClaim] SDK packages not found:", error);
}

// Always call useIdentitySDK unconditionally so hook order is stable
function useIdentitySDKSafe() {
  if (useIdentitySDK) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useIdentitySDK("production");
  }
  return null;
}

export interface UseGoodDollarClaimReturn {
  isLoading: boolean;
  isClaiming: boolean;
  isVerifying: boolean;
  isWhitelisted: boolean;
  entitlement: bigint | null;
  hasClaimed: boolean;
  nextClaimTime: Date | null;
  claim: () => Promise<void>;
  error: Error | null;
  isInitialized: boolean;
}

export function useGoodDollarClaim(): UseGoodDollarClaimReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const identitySDK = useIdentitySDKSafe();

  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [entitlement, setEntitlement] = useState<bigint | null>(null);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  
  const isLoading =
    !address || !publicClient || !walletClient || !identitySDK || !ClaimSDK;

 
  const buildSDK = useCallback(() => {
    if (!ClaimSDK || !address || !publicClient || !walletClient || !identitySDK)
      return null;
    return new ClaimSDK({
      account: address,
      publicClient: publicClient as any,
      walletClient: walletClient as any,
      identitySDK: identitySDK as any,
      env: "production",
    });
  }, [address, publicClient, walletClient, identitySDK]);

  const isNetworkError = (err: any) => {
    const msg = err?.message || String(err);
    return (
      msg.includes("ERR_NAME_NOT_RESOLVED") ||
      msg.includes("fuse-rpc") ||
      msg.includes("pokt.network") ||
      msg.includes("network")
    );
  };

 
  const checkWhitelisted = useCallback(async (): Promise<boolean> => {
    const sdk = buildSDK();
    if (!sdk) return false;
    try {
      const walletStatus = await sdk.getWalletClaimStatus();
      return walletStatus.status !== "not_whitelisted";
    } catch (err: any) {
      if (isNetworkError(err)) return false;
      console.error("[useGoodDollarClaim] isWhitelisted check failed:", err);
      return false;
    }
  }, [buildSDK]);

 
  const checkClaimStatus = useCallback(async () => {
    const sdk = buildSDK();
    if (!sdk) return;

    try {
      const walletStatus = await sdk.getWalletClaimStatus();

      let nextTime: Date;
      try {
        nextTime = await sdk.nextClaimTime();
      } catch (nextTimeErr: any) {
        if (isNetworkError(nextTimeErr)) {
          nextTime = new Date(0);
        } else {
          throw nextTimeErr;
        }
      }

      setEntitlement(walletStatus.entitlement);
      setHasClaimed(walletStatus.status === "already_claimed");
      // epoch 0 means claimable now
      setNextClaimTime(nextTime.getTime() === 0 ? null : nextTime);
    } catch (err: any) {
      if (isNetworkError(err)) return;
      console.error("[useGoodDollarClaim] Failed to check claim status:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to check claim status"),
      );
    }
  }, [buildSDK]);


  useEffect(() => {
    if (isLoading) {
      setIsInitialized(false);
      return;
    }

    (async () => {
      try {
        const whitelisted = await checkWhitelisted();
        setIsWhitelisted(whitelisted);
        await checkClaimStatus();
      } catch {
        // Silently ignore — still mark initialized
      } finally {
        setIsInitialized(true);
      }
    })();
  }, [isLoading, checkWhitelisted, checkClaimStatus]);


  useEffect(() => {
    if (isLoading || !address) return;
    const interval = setInterval(() => {
      checkClaimStatus().catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, [isLoading, address, checkClaimStatus]);


  useEffect(() => {
    if (!isVerifying) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    if (!identitySDK || !address) return;

    pollRef.current = setInterval(async () => {
      const whitelisted = await checkWhitelisted();
      if (whitelisted) {
        setIsWhitelisted(true);
        setIsVerifying(false);
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        await checkClaimStatus();
      }
    }, 5_000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isVerifying, identitySDK, address, checkWhitelisted, checkClaimStatus]);


  const claim = async () => {
    const sdk = buildSDK();
    if (!sdk) return;

    try {
      setIsClaiming(true);
      setError(null);

      await sdk.claim();

      // Allow the chain state to settle
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      await checkClaimStatus();

      // 🎉 Confetti — injected via script tag to avoid missing type declarations
      try {
        await new Promise<void>((resolve) => {
          if (typeof (window as any).confetti === "function") {
            resolve();
            return;
          }
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js";
          script.onload = () => resolve();
          script.onerror = () => resolve(); // Fail silently
          document.head.appendChild(script);
        });
        if (typeof (window as any).confetti === "function") {
          (window as any).confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#6366f1", "#a855f7", "#ec4899", "#f59e0b"],
          });
        }
      } catch {
        // Confetti is fully optional
      }
    } catch (err: any) {
      console.error("Claim failed:", err);
      setError(err instanceof Error ? err : new Error("Claim failed"));
    } finally {
      setIsClaiming(false);
    }
  };

  return {
    isLoading,
    isClaiming,
    isVerifying,
    isWhitelisted,
    entitlement,
    hasClaimed,
    nextClaimTime,
    claim,
    error,
    isInitialized,
  };
}