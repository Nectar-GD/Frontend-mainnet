
import { useAccount } from 'wagmi';
import { useIdentity } from './useIdentity';

export function useVerificationStatus() {
  const { address } = useAccount();
  const { isVerified, isLoading } = useIdentity();

  return {
    isVerified,
    isLoading,
    address,
  };
}