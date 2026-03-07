import {
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useRef, useEffect } from "react";
import { parseUnits, decodeEventLog } from "viem";
import nectarFactoryAbi from "@/constant/abi.json";
import { toast } from "sonner";

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS! as `0x${string}`;

export enum EnrollmentWindow {
  Standard = 0,
  Strict = 1,
  Fixed = 2,
}

export enum DistributionMode {
  Equal = 0,
  Weighted = 1,
  GrandPrize = 2,
}

export enum ContributionFrequency {
  Daily = 86400,
  Weekly = 604800,
  Monthly = 2592000,
}

export interface CreatePoolFormData {
  name: string;
  token: `0x${string}`;
  targetAmount: string;
  maxMembers: number;
  totalCycles: number;
  winnersCount: number;
  frequency: ContributionFrequency;
  requiresIdentity: boolean;
  enrollmentWindow: EnrollmentWindow;
  distributionMode: DistributionMode;
}

interface PoolCreatedArgs {
  pool: `0x${string}`;
  creator: `0x${string}`;
  token: `0x${string}`;
  targetAmount: bigint;
  maxMembers: number;
  totalCycles: number;
}

function extractPoolAddress(receipt: any): `0x${string}` | null {
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: nectarFactoryAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "PoolCreated") {
        return (decoded.args as unknown as PoolCreatedArgs).pool;
      }
    } catch {
      continue;
    }
  }
  return null;
}

export function useCreatePool() {
  const toastShownRef = useRef<string | null>(null);

  const {
    data: hash,
    writeContract,
    isPending: isWriting,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    data: createdPoolAddress,
    isLoading: isConfirming,
    isSuccess,
  } = useWaitForTransactionReceipt({
    hash,
    query: {
      select: extractPoolAddress,
    },
  });

  useEffect(() => {
    if (!isSuccess || !hash || toastShownRef.current === hash) return;
    toastShownRef.current = hash;

    if (createdPoolAddress) {
      toast.success(
        `Pool created at ${createdPoolAddress.slice(0, 6)}...${createdPoolAddress.slice(-4)}`
      );
    } else {
      toast.success("Pool created successfully!");
    }
  }, [isSuccess, hash, createdPoolAddress]);

  const createPool = (
    formData: CreatePoolFormData,
    tokenDecimals: number = 6
  ) => {
    try {
      const targetAmount = parseUnits(formData.targetAmount, tokenDecimals);

      const config = {
        name: formData.name,
        token: formData.token,
        targetAmount,
        maxMembers: formData.maxMembers,
        totalCycles: formData.totalCycles,
        winnersCount: formData.winnersCount,
        cycleDuration: formData.frequency as number,
        requiresIdentity: formData.requiresIdentity,
        enrollmentWindow: formData.enrollmentWindow,
        distributionMode: formData.distributionMode,
      };

      writeContract({
        address: FACTORY_ADDRESS,
        abi: nectarFactoryAbi,
        functionName: "createPool",
        args: [config],
      });

      toast.info("Please confirm the transaction in your wallet");
    } catch (error) {
      console.error("Error creating pool:", error);
      toast.error("Failed to create pool");
      throw error;
    }
  };

  const reset = () => {
    resetWrite();
    toastShownRef.current = null;
  };

  return {
    createPool,
    isWriting,
    isConfirming,
    isSuccess,
    error: writeError,
    txHash: hash,
    createdPoolAddress: createdPoolAddress ?? null,
    reset,
  };
}