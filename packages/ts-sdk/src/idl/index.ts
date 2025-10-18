// Re-export the program IDL for timemarket
// NOTE: Ensure this file is generated/copied during build or via scripts.
// In this workspace, the IDL is expected to be placed at build time under src/idl.
import timemarketIdl from "./timemarket.json";

export { timemarketIdl };

