export const SCORE_CHECKER_ABI = [
  {
    inputs: [
      { name: "score", type: "uint256" },
      { name: "issuedAt", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    name: "submitScore",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "checkFee",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserData",
    outputs: [
      { name: "score", type: "uint256" },
      { name: "lastCheckTime", type: "uint256" },
      { name: "lastIssuedAt", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getScore",
    outputs: [
      { name: "score", type: "uint256" },
      { name: "timestamp", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "canSubmitScore",
    outputs: [
      { name: "canSubmit", type: "bool" },
      { name: "timeRemaining", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
];


