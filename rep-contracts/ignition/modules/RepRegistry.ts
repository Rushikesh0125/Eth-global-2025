import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("RepRegistryModule", (m) => {
  const repRegistry = m.contract("RepRegistry", ["0x5EF0d89a9E859CFcA0C52C9A17CFF93f1A6A19C1"]);
  return { repRegistry };
});
