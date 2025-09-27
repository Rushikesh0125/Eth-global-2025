import { useEffect, useMemo, useState } from "react";
import {
  getUniversalLink,
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode";
import { v4 as uuidv4 } from "uuid";
import type { SelfAppDisclosureConfig } from "@selfxyz/common";

// Define the types for the hook's options for better type safety
interface UseSelfIdentityOptions {
  disclosures: SelfAppDisclosureConfig;
  onSuccess: (data: any) => void;
  onError: (error: Error) => void;
}

/**
 * A custom hook to manage the Self Protocol identity verification flow.
 * @param {UseSelfIdentityOptions} options - Configuration for disclosures and callbacks.
 * @returns An object with state and functions to control the verification UI.
 */
export const useSelfIdentity = ({
  disclosures,
  onSuccess,
  onError,
}: UseSelfIdentityOptions) => {
  // --- STATE MANAGED BY THE HOOK ---
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false); // New state to track polling
  const [verificationData, setVerificationData] = useState<any | null>(null); // New state for verified data

  // Generate a stable, unique user ID for the hook's lifecycle
  const userId = useMemo(() => uuidv4(), []);

  // --- EFFECT FOR INITIALIZATION ---
  // This effect runs once to build the SelfApp instance.
  useEffect(() => {
    setIsLoading(true);
    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "zk-express Checkout",
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "zk-express-scope",
        endpoint: `${process.env.NEXT_PUBLIC_SELF_ENDPOINT}`,
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
        endpointType: "https",
        userIdType: "uuid",
        userDefinedData: "Welcome to zk-express! Please verify your identity.",
        disclosures: disclosures,
      }).build();

      setSelfApp(app);
      setUniversalLink(getUniversalLink(app));
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
      if (onError) {
        onError(
          error instanceof Error
            ? error
            : new Error("Unknown initialization error")
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [disclosures, userId, onError]);

  // --- NEW EFFECT FOR REAL-TIME POLLING ---
  useEffect(() => {
    if (!isVerifying || !selfApp) return;

    const POLLING_INTERVAL = 2000; // Check every 2 seconds
    const POLLING_TIMEOUT = 120000; // Timeout after 2 minutes

    const pollingStartTime = Date.now();

    const intervalId = setInterval(async () => {
      // 1. Check for timeout
      if (Date.now() - pollingStartTime > POLLING_TIMEOUT) {
        clearInterval(intervalId);
        setIsVerifying(false);
        onError(new Error("Verification timed out. Please try again."));
        return;
      }

      // 2. Poll the Self API endpoint
      try {
        const scope = process.env.NEXT_PUBLIC_SELF_SCOPE || "zk-express-scope";
        const appName =
          process.env.NEXT_PUBLIC_SELF_APP_NAME || "zk-express Checkout";
        const encodedAppName = encodeURIComponent(appName);

        const response = await fetch(
          `https://api.self.xyz/v2/scopes/${scope}/apps/${encodedAppName}/users/${userId}`
        );

        if (!response.ok) {
          // Don't stop polling for transient server errors, just log them
          console.warn(
            `Polling status ${response.status}: ${response.statusText}`
          );
          return;
        }

        const data = await response.json();

        // 3. Check if verification is successful
        if (data && data.status === "verified" && data.disclosed_data) {
          clearInterval(intervalId);
          setVerificationData(data.disclosed_data);
          setIsVerifying(false);
          onSuccess(data.disclosed_data);
        }
      } catch (error) {
        console.error("Polling network error:", error);
        // We don't stop polling on network errors to allow for recovery
      }
    }, POLLING_INTERVAL);

    // Cleanup function to clear the interval if the component unmounts or verification stops
    return () => clearInterval(intervalId);
  }, [isVerifying, selfApp, userId, onSuccess, onError]);

  // --- EXPOSED HELPER FUNCTIONS ---
  const copyLink = () => {
    if (!universalLink) return;
    navigator.clipboard
      .writeText(universalLink)
      .then(() => {
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        if (onError) onError(err);
      });
  };

  const openApp = () => {
    if (!universalLink) return;
    window.open(universalLink, "_blank");
  };

  // New function to be called by the UI to begin the verification process
  const startVerification = () => {
    setIsVerifying(true);
  };

  // --- RETURN THE HOOK'S PUBLIC API ---
  return {
    // State values for the UI
    selfApp,
    userId,
    universalLink,
    isLoading,
    isLinkCopied,
    isVerifying, // Expose verifying state for loading indicators
    verificationData, // Expose the final data
    // Callback props to pass to the QR component (if it handles its own polling)
    onSuccess,
    onError,
    // Action functions for buttons
    copyLink,
    openApp,
    startVerification, // Expose the function to start the process
  };
};
