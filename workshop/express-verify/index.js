import express from "express";
import bodyParser from "body-parser";
import { SelfBackendVerifier, AllIds, DefaultConfigStore } from "@selfxyz/core";

const app = express();
app.use(bodyParser.json());

// getID => create the instance of selfbackendverifier & return userId
// /api/verify => it's called by the self sdk, we are not calling it, it verifies a userId, correct?
// /api/check-verification => i'll send userId=> it's called by the user with userId to check if they're verified?

const selfBackendVerifier = new SelfBackendVerifier(
  "test-scope", // scope string
  "https://132304eab8bd.ngrok-free.app/api/verify", // endpoint (your backend verification API)
  false, // mockPassport → false = testnet, realPassport → true = mainnet
  AllIds, // allowed attestation IDs map
  new DefaultConfigStore({
    // config store (see separate docs)
    minimumAge: 18,
    excludedCountries: [],
    ofac: true,
  }),
  "uuid"
);

app.post("/api/verify", async (req, res) => {
  try {
    const { attestationId, proof, publicSignals, userContextData } = req.body;
    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return res.status(200).json({
        status: "error",
        result: false,
        reason:
          "Proof, publicSignals, attestationId and userContextData are required",
      });
    }

    const result = await selfBackendVerifier.verify(
      attestationId,
      proof,
      publicSignals,
      userContextData
    );

    const nullifier = result.discloseOutput.nullifier;

    const userId = result.userData.userIdentifier

    const { isValid, isMinimumAgeValid, isOfacValid } = result.isValidDetails;
    if (!isValid || !isMinimumAgeValid || isOfacValid) {
      let reason = "Verification failed";
      if (!isMinimumAgeValid) reason = "Minimum age verification failed";
      if (isOfacValid) reason = "OFAC verification failed";
      return res.status(200).json({
        status: "error",
        result: false,
        reason,
      });
    }

    return res.status(200).json({
      status: "success",
      result: true,
    });
  } catch (error) {
    return res.status(200).json({
      status: "error",
      result: false,
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
