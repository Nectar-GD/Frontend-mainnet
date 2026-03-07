"use client";

import { useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useIdentitySDK, IdentitySDK } from "@goodsdks/identity-sdk";
import { ClaimSDK } from "@goodsdks/citizen-sdk";

export type IdentityStatus = "loading" | "verified" | "not_verified" | "error";

export function useIdentity() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const identitySDK = useIdentitySDK("production");

  const [status, setStatus] = useState<IdentityStatus>("loading");
  const [fvLink, setFvLink] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const checkVerification = async () => {
    if (!address || !publicClient || !identitySDK) {
      if (!address) setStatus("not_verified");
      return;
    }

    try {
      // Don't flash "loading" if we're just polling in the background
      if (!isVerifying) setStatus("loading");

      const claimSDK = new ClaimSDK({
        account: address,
        publicClient: publicClient as any,
        walletClient: walletClient as any,
        identitySDK: identitySDK as any,
        env: "production",
      });

      const walletStatus = await claimSDK.getWalletClaimStatus();

      if (walletStatus.status === "not_whitelisted") {
        setStatus("not_verified");
      } else {
        setStatus("verified");
        setIsVerifying(false); // Stop verifying once confirmed
      }
    } catch (error) {
      console.error("Identity check failed:", error);
      setStatus("error");
    }
  };

  const generateLink = async () => {
    if (
      !address ||
      !publicClient ||
      !identitySDK ||
      !walletClient ||
      isGeneratingLink
    )
      return;

    try {
      setIsGeneratingLink(true);

      const idSDK = new (IdentitySDK as any)(
        publicClient,
        walletClient,
        "production",
      );

      // generateFVLink(popupMode, callbackUrl, chainId)
      // chainId 42220 = Celo mainnet
      const linkResult = await idSDK.generateFVLink(
        false,
        window.location.href,
        42220,
      );

      let finalLink = "";
      if (typeof linkResult === "string") {
        finalLink = linkResult;
      } else if (linkResult && (linkResult as any).link) {
        finalLink = (linkResult as any).link;
      }

      if (finalLink) {
        setFvLink(finalLink);
      }
    } catch (e: any) {
      console.error("Failed to generate FV link:", e);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Initial check on mount / address change
  useEffect(() => {
    checkVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, !!publicClient, !!identitySDK]);

  // Generate link only once when verification flow starts and we don't have one yet
  useEffect(() => {
    if (isVerifying && !fvLink && !isGeneratingLink) {
      generateLink();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVerifying, !!fvLink, isGeneratingLink, address, publicClient, walletClient, identitySDK]);

  // Poll every 5 seconds while the user is in the verification flow
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isVerifying && status !== "verified") {
      interval = setInterval(() => {
        checkVerification();
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVerifying, status, address, publicClient, identitySDK]);

  return {
    status,
    isVerified: status === "verified",
    fvLink,
    refresh: checkVerification,
    generateLink,
    isLoading: status === "loading",
    isVerifying,
    setIsVerifying,
    isGeneratingLink,
  };
}