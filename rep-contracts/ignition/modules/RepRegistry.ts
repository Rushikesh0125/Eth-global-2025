import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("RepRegistryModule", (m) => {
  const repRegistry = m.contract("RepRegistry");
  return { repRegistry };
});
