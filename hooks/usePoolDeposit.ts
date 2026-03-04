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

type Step = "idle" | "approving" | "depositing";

export function usePoolDeposit(
  poolAddress: `0x${string}`,
  tokenAddress: `0x${string}`,
  userAddress?: `0x${string}`
) {
  const [step, setStep] = useState<Step>("idle");
  const pendingAmount = useRef<bigint>(0n);
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

    if (step === "approving" && pendingAmount.current > 0n) {
      toast.success("Approval confirmed");
      refetchAllowance();
      const amount = pendingAmount.current;
      setTimeout(async () => {
        setStep("depositing");
        try {
          await writeContractAsync({
            address: poolAddress, abi: poolAbi, functionName: "deposit", args: [amount],
          });
        } catch (err) {
          toast.error(`Deposit failed: ${decodeContractError(err)}`);
          setStep("idle");
          pendingAmount.current = 0n;
        }
      }, 500);
    } else if (step === "depositing") {
      toast.success("Deposit successful! 🎉");
      setStep("idle");
      pendingAmount.current = 0n;
    }
  }, [isSuccess, hash, step, poolAddress, writeContractAsync, refetchAllowance]);

  const deposit = useCallback(
    async (amount: bigint) => {
      if (!userAddress) { toast.error("Please connect your wallet"); return; }

      lastProcessedHash.current = null;
      resetWrite();
      pendingAmount.current = amount;

      if (allowance < amount) {
        setStep("approving");
        toast.info("Approving token spend...");
        try {
          await writeContractAsync({
            address: tokenAddress, abi: erc20Abi, functionName: "approve", args: [poolAddress, amount],
          });
        } catch (err) {
          toast.error(`Approval failed: ${decodeContractError(err)}`);
          setStep("idle");
          pendingAmount.current = 0n;
        }
      } else {
        setStep("depositing");
        toast.info("Confirm the transaction in your wallet");
        try {
          await writeContractAsync({
            address: poolAddress, abi: poolAbi, functionName: "deposit", args: [amount],
          });
        } catch (err) {
          toast.error(`Deposit failed: ${decodeContractError(err)}`);
          setStep("idle");
          pendingAmount.current = 0n;
        }
      }
    },
    [userAddress, allowance, poolAddress, tokenAddress, writeContractAsync, resetWrite]
  );

  const reset = () => {
    setStep("idle");
    pendingAmount.current = 0n;
    lastProcessedHash.current = null;
    resetWrite();
  };

  return { deposit, step, isPending, isConfirming, isSuccess, isLoading: isPending || isConfirming, error: writeError, txHash: hash, currentAllowance: allowance, reset };
}