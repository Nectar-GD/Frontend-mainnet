import { decodeErrorResult } from "viem";
import poolAbi from "@/constant/deposit.json";
import vaultAbi from "@/constant/vault.json";

const combinedAbi = [...poolAbi, ...vaultAbi];

export function decodeContractError(error: unknown): string {
  if (!error) return "Unknown error";

  const err = error as any;

  console.error("[ContractError]", err?.shortMessage || err?.message?.slice(0, 200), err);

  const revertData = findRevertData(err);
  if (revertData) {
    const decoded = tryDecodeRevertData(revertData);
    if (decoded) return decoded;
  }

  const chainMessage = walkCauseChain(err);
  if (chainMessage) return chainMessage;

  if (err?.metaMessages?.length) return err.metaMessages.join(" | ");
  if (err?.shortMessage) return err.shortMessage;
  if (err?.details) return err.details;

  if (err?.message) {
    const msg = err.message;
    if (msg.length > 300) return msg.split("\n")[0] || msg.slice(0, 200) + "...";
    return msg;
  }

  return "Transaction failed — check console for details";
}

function findRevertData(err: any, depth = 0): string | null {
  if (!err || depth > 10) return null;

  if (typeof err.data === "string" && err.data.startsWith("0x") && err.data.length > 2) {
    return err.data;
  }

  if (typeof err.data?.data === "string" && err.data.data.startsWith("0x")) {
    return err.data.data;
  }

  if (err.cause) return findRevertData(err.cause, depth + 1);
  if (err.error) return findRevertData(err.error, depth + 1);

  if (typeof err.message === "string") {
    const hexMatch = err.message.match(/data: "(0x[a-fA-F0-9]+)"/);
    if (hexMatch) return hexMatch[1];
  }

  return null;
}

function tryDecodeRevertData(data: string): string | null {
  if (data.startsWith("0x08c379a0")) {
    try {
      const reason = decodeErrorResult({
        abi: [{ type: "error", name: "Error", inputs: [{ name: "reason", type: "string" }] }],
        data: data as `0x${string}`,
      });
      return String(reason.args?.[0] || "Unknown revert reason");
    } catch {}
  }

  if (data.startsWith("0x4e487b71")) {
    const panicCodes: Record<string, string> = {
      "0x00": "Generic compiler panic",
      "0x01": "Assert failed",
      "0x11": "Arithmetic overflow/underflow",
      "0x12": "Division by zero",
      "0x21": "Invalid enum value",
      "0x31": "Pop on empty array",
      "0x32": "Array index out of bounds",
      "0x41": "Out of memory",
      "0x51": "Uninitialized function pointer",
    };
    const code = "0x" + data.slice(10, 12);
    return `Panic: ${panicCodes[code] || `code ${code}`}`;
  }

  const knownSelectors: Record<string, string> = {
    "0xfb8f41b2": "ERC20InsufficientAllowance — pool needs token approval",
    "0xe602df05": "ERC20InsufficientBalance — not enough tokens in wallet",
    "0x3d7e9985": "ERC20InvalidApprover",
    "0x94280d62": "ERC20InvalidReceiver",
    "0x96c6fd1e": "ERC20InvalidSender",
  };

  const selector = data.slice(0, 10).toLowerCase();
  if (knownSelectors[selector]) return knownSelectors[selector];

  try {
    const decoded = decodeErrorResult({
      abi: combinedAbi as any,
      data: data as `0x${string}`,
    });
    const args = decoded.args?.length ? ` (${decoded.args.map(String).join(", ")})` : "";
    return `${decoded.errorName}${args}`;
  } catch {}

  return `Unknown contract error: ${selector}`;
}

function walkCauseChain(err: any, depth = 0): string | null {
  if (!err || depth > 10) return null;

  const deeper = walkCauseChain(err.cause, depth + 1);
  if (deeper) return deeper;

  if (err.shortMessage && !err.shortMessage.includes("An unknown RPC error")) {
    return err.shortMessage;
  }
  if (err.reason) return err.reason;
  if (err.details && !err.details.includes("An unknown RPC error")) {
    return err.details;
  }

  return null;
}