"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAppKitAccount, useAppKit } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import { toast } from "sonner";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { open } = useAppKit();
  const { isConnected } = useAppKitAccount();
  const { isVerified, isLoading } = useVerificationStatus();
  const router = useRouter();

  // Guard handler — blocks navigation to protected routes if not verified
  const handleProtectedNav = (
    e: React.MouseEvent,
    href: string,
    closeMobile = false,
  ) => {
    if (!isConnected) {
      e.preventDefault();
      open(); // Prompt wallet connection first
      return;
    }
    if (!isVerified) {
      e.preventDefault();
      toast.warning("Verify your identity first", {
        description: "You need GoodDollar face verification to access this.",
        action: {
          label: "Verify Now",
          onClick: () => router.push("/verify"),
        },
      });
      return;
    }
    if (closeMobile) setMobileMenuOpen(false);
  };

  return (
    <div className="bg-white py-8">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-50"
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Nectar Logo"
                width={140}
                height={40}
                className="h-8 sm:h-10 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-12">
            <Link
              href="/pools"
              onClick={(e) => handleProtectedNav(e, "/pools")}
              className="text-sm lg:text-base font-medium text-[#252B36] hover:text-[#FFC000] transition-colors duration-300"
            >
              Pools
            </Link>
            <Link
              href="/create"
              onClick={(e) => handleProtectedNav(e, "/create")}
              className="text-sm lg:text-base font-medium text-[#252B36] hover:text-[#FFC000] transition-colors duration-300"
            >
              Create
            </Link>
          </nav>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-3">
            {isConnected && (
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="px-3 py-1.5 bg-gray-100 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                    <span className="text-xs text-gray-500">Checking...</span>
                  </div>
                ) : isVerified ? (
                  <div className="px-3 py-1.5 bg-green-100 rounded-full flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700">Verified</span>
                  </div>
                ) : (
                  <Link
                    href="/verify"
                    className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 rounded-full flex items-center gap-2 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-700">Verify Now</span>
                  </Link>
                )}
              </div>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => open()}
              className="bg-[#FFC000] text-[#252B36] px-6 lg:px-8 py-2.5 lg:py-3 rounded-lg font-medium text-sm lg:text-base hover:bg-[#2D3441] hover:text-white transition-colors duration-300"
            >
              {isConnected ? "Connected" : "Connect Wallet"}
            </motion.button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#252B36]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed top-18 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-40"
          >
            <nav className="px-4 py-6 space-y-4">
              <Link
                href="/pools"
                onClick={(e) => handleProtectedNav(e, "/pools", true)}
                className="block text-base font-medium text-[#252B36] hover:text-[#FFC000] transition-colors duration-300 py-2"
              >
                Pools
              </Link>
              <Link
                href="/create"
                onClick={(e) => handleProtectedNav(e, "/create", true)}
                className="block text-base font-medium text-[#252B36] hover:text-[#FFC000] transition-colors duration-300 py-2"
              >
                Create
              </Link>

              {isConnected && (
                <div className="py-2">
                  {isLoading ? (
                    <div className="px-3 py-2 bg-gray-100 rounded-lg flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                      <span className="text-sm text-gray-500">Checking verification...</span>
                    </div>
                  ) : isVerified ? (
                    <div className="px-3 py-2 bg-green-100 rounded-lg flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Verified Human</span>
                    </div>
                  ) : (
                    <Link
                      href="/verify"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">Verify Your Identity</span>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </nav>

            <div className="px-4 mb-8">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  open();
                }}
                className="w-full bg-[#FFC000] text-[#252B36] px-6 py-3 rounded-lg font-medium text-base hover:bg-[#2D3441] transition-colors duration-300 hover:text-white"
              >
                {isConnected ? "Connected" : "Connect Wallet"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}