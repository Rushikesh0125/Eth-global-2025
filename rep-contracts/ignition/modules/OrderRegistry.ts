import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("OrderRegistryModule", (m) => {
    const repRegistry = m.contract("OrderRegistry", ["0x5EF0d89a9E859CFcA0C52C9A17CFF93f1A6A19C1"]);
    return { repRegistry };
});
