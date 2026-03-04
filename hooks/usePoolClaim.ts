import { useRef, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import poolAbi from "@/constant/deposit.json";
import { toast } from "sonner";
import { decodeContractError } from "@/utils/decodeContractError";

export function usePoolClaim(poolAddress: `0x${string}`) {
  const lastProcessedHash = useRef<string | null>(null);

  const { data: hash, writeContractAsync, isPending, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (!isSuccess || !hash || lastProcessedHash.current === hash) return;
    lastProcessedHash.current = hash;
    toast.success("Funds claimed successfully! 💰");
  }, [isSuccess, hash]);

  const claim = async () => {
    lastProcessedHash.current = null;
    resetWrite();
    toast.info("Confirm the transaction in your wallet");
    try {
      await writeContractAsync({ address: poolAddress, abi: poolAbi, functionName: "claim", args: [] });
    } catch (err) {
      toast.error(`Claim failed: ${decodeContractError(err)}`);
    }
  };

  const emergencyWithdraw = async () => {
    lastProcessedHash.current = null;
    resetWrite();
    toast.info("Confirm the transaction in your wallet");
    try {
      await writeContractAsync({ address: poolAddress, abi: poolAbi, functionName: "emergencyWithdraw", args: [] });
    } catch (err) {
      toast.error(`Withdrawal failed: ${decodeContractError(err)}`);
    }
  };

  const reset = () => { lastProcessedHash.current = null; resetWrite(); };

  return { claim, emergencyWithdraw, isPending, isConfirming, isSuccess, isLoading: isPending || isConfirming, error: writeError, txHash: hash, reset };
}