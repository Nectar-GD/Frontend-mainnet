import { useState, useRef, useEffect, useCallback } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { erc20Abi } from "viem";
import poolAbi from "@/constant/deposit.json";
import { toast } from "sonner";
import { decodeContractError } from "@/utils/decodeContractError";

type Step = "idle" | "approving" | "joining";

export function useJoinPool(
  poolAddress: `0x${string}`,
  tokenAddress: `0x${string}`,
  userAddress?: `0x${string}`
) {
  const [step, setStep] = useState<Step>("idle");
  const lastProcessedHash = useRef<string | null>(null);

  const { data: currentAllowance, refetch: refetchAllowance } =
    useReadContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "allowance",
      args: userAddress ? [userAddress, poolAddress] : undefined,
      query: { enabled: !!userAddress, staleTime: 5_000 },
    });

  const allowance = currentAllowance ?? 0n;

  const {
    data: hash,
    writeContractAsync,
    isPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (!isSuccess || !hash || lastProcessedHash.current === hash) return;
    lastProcessedHash.current = hash;

    if (step === "approving") {
      toast.success("Approval confirmed");
      refetchAllowance();
      setTimeout(async () => {
        setStep("joining");
        try {
          await writeContractAsync({
            address: poolAddress, abi: poolAbi, functionName: "joinPool", args: [],
          });
        } catch (err) {
          toast.error(`Join failed: ${decodeContractError(err)}`);
          setStep("idle");
        }
      }, 500);
    } else if (step === "joining") {
      toast.success("Successfully joined the pool! 🌱");
      setStep("idle");
    }
  }, [isSuccess, hash, step, poolAddress, writeContractAsync, refetchAllowance]);

  const join = useCallback(
    async (perMember: bigint) => {
      if (!userAddress) { toast.error("Please connect your wallet"); return; }

      lastProcessedHash.current = null;
      resetWrite();

      if (allowance < perMember) {
        setStep("approving");
        toast.info("Approving token spend...");
        try {
          await writeContractAsync({
            address: tokenAddress, abi: erc20Abi, functionName: "approve", args: [poolAddress, perMember],
          });
        } catch (err) {
          toast.error(`Approval failed: ${decodeContractError(err)}`);
          setStep("idle");
        }
      } else {
        setStep("joining");
        toast.info("Confirm the transaction in your wallet");
        try {
          await writeContractAsync({
            address: poolAddress, abi: poolAbi, functionName: "joinPool", args: [],
          });
        } catch (err) {
          toast.error(`Join failed: ${decodeContractError(err)}`);
          setStep("idle");
        }
      }
    },
    [userAddress, allowance, poolAddress, tokenAddress, writeContractAsync, resetWrite]
  );

  const reset = () => {
    setStep("idle");
    lastProcessedHash.current = null;
    resetWrite();
  };

  return { join, step, isPending, isConfirming, isSuccess, isLoading: isPending || isConfirming, error: writeError, txHash: hash, currentAllowance: allowance, reset };
}