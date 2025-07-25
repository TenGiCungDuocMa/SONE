export const DiddyABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      },
      {
        "internalType": "uint40",
        "name": "_roundDuration",
        "type": "uint40"
      },
      {
        "internalType": "uint256",
        "name": "_stakeAmount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_treasuryFeeRecipient",
        "type": "address"
      },
      {
        "internalType": "uint16",
        "name": "_treasuryFeeBp",
        "type": "uint16"
      },
      {
        "internalType": "uint40",
        "name": "_maximumNumberOfPlayersPerRound",
        "type": "uint40"
      },
      {
        "internalType": "uint8",
        "name": "_numberOfRooms",
        "type": "uint8"
      },
      {
        "internalType": "address",
        "name": "_keeper",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "EnforcedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpectedPause",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "newKeeper",
        "type": "address"
      }
    ],
    "name": "KeeperUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint40",
        "name": "maximumNumberOfPlayersPerRound",
        "type": "uint40"
      }
    ],
    "name": "MaximumNumberOfPlayersPerRoundUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "numberOfRooms",
        "type": "uint8"
      }
    ],
    "name": "NumberOfRoomsUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isAllowed",
        "type": "bool"
      }
    ],
    "name": "OutflowAllowedUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "roundId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "roomNumber",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "PlayerHid",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "winner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "roundId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "PrizesClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint40",
        "name": "roundDuration",
        "type": "uint40"
      }
    ],
    "name": "RoundDurationUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "roundId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum DiddyHideAndSeek.RoundStatus",
        "name": "status",
        "type": "uint8"
      }
    ],
    "name": "RoundStatusUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "roundId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "safeRoom",
        "type": "uint8"
      }
    ],
    "name": "SafeRoomDrawn",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "stakeAmount",
        "type": "uint256"
      }
    ],
    "name": "StakeAmountUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "treasuryFeeBp",
        "type": "uint16"
      }
    ],
    "name": "TreasuryFeeBpUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "TreasuryFeePayment",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "treasuryFeeRecipient",
        "type": "address"
      }
    ],
    "name": "TreasuryFeeRecipientUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "TreasuryWithdrawal",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "MINIMUM_PLAYERS_FOR_VALID_ROUND",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "accumulatedTreasuryFees",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roundId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "canClaimPrize",
    "outputs": [
      {
        "internalType": "bool",
        "name": "canClaim",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "prizeAmount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "cancel",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "carryOverReward",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roundId",
        "type": "uint256"
      }
    ],
    "name": "claimPrize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentRoundId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "drawSafeRoom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roundId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getPlayerHidePositions",
    "outputs": [
      {
        "internalType": "uint8[]",
        "name": "roomNumbers",
        "type": "uint8[]"
      },
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      },
      {
        "internalType": "bool[]",
        "name": "claimed",
        "type": "bool[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roundId",
        "type": "uint256"
      }
    ],
    "name": "getRoomStakes",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "stakes",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roundId",
        "type": "uint256"
      }
    ],
    "name": "getRoundData",
    "outputs": [
      {
        "components": [
          {
            "internalType": "enum DiddyHideAndSeek.RoundStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "uint40",
            "name": "startTime",
            "type": "uint40"
          },
          {
            "internalType": "uint40",
            "name": "endTime",
            "type": "uint40"
          },
          {
            "internalType": "uint40",
            "name": "drawnAt",
            "type": "uint40"
          },
          {
            "internalType": "uint40",
            "name": "numberOfPlayers",
            "type": "uint40"
          },
          {
            "internalType": "uint8",
            "name": "safeRoom",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "totalStaked",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalWinnerStaked",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "treasuryFeeAmount",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "treasuryFeeProcessed",
            "type": "bool"
          }
        ],
        "internalType": "struct DiddyHideAndSeek.RoundInfo",
        "name": "roundInfo",
        "type": "tuple"
      },
      {
        "internalType": "uint256[]",
        "name": "roomStakes",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "systemParams",
        "type": "uint256[]"
      },
      {
        "internalType": "address[]",
        "name": "players",
        "type": "address[]"
      },
      {
        "internalType": "uint8[]",
        "name": "playerRoomNumbers",
        "type": "uint8[]"
      },
      {
        "internalType": "uint256[]",
        "name": "userHideIndices",
        "type": "uint256[]"
      },
      {
        "internalType": "bool",
        "name": "isOwner",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roundId",
        "type": "uint256"
      }
    ],
    "name": "getRoundInfo",
    "outputs": [
      {
        "internalType": "enum DiddyHideAndSeek.RoundStatus",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "uint40",
        "name": "startTime",
        "type": "uint40"
      },
      {
        "internalType": "uint40",
        "name": "endTime",
        "type": "uint40"
      },
      {
        "internalType": "uint40",
        "name": "drawnAt",
        "type": "uint40"
      },
      {
        "internalType": "uint40",
        "name": "numberOfPlayers",
        "type": "uint40"
      },
      {
        "internalType": "uint8",
        "name": "safeRoom",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "totalStaked",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalWinnerStaked",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "treasuryFeeAmount",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "treasuryFeeProcessed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roundId",
        "type": "uint256"
      }
    ],
    "name": "getRoundPlayers",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "players",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "stakes",
        "type": "uint256[]"
      },
      {
        "internalType": "uint8[]",
        "name": "roomNumbers",
        "type": "uint8[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTreasuryFeesAvailable",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roundId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "hasUserClaimedPrize",
    "outputs": [
      {
        "internalType": "bool",
        "name": "hasClaimed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roundId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "hasUserParticipated",
    "outputs": [
      {
        "internalType": "bool",
        "name": "hasParticipated",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roundId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "hasUserWithdrawnDeposits",
    "outputs": [
      {
        "internalType": "bool",
        "name": "hasWithdrawn",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "roomNumber",
        "type": "uint8"
      }
    ],
    "name": "hide",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "keeper",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maximumNumberOfPlayersPerRound",
    "outputs": [
      {
        "internalType": "uint40",
        "name": "",
        "type": "uint40"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "numberOfRooms",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "outflowAllowed",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "roundDuration",
    "outputs": [
      {
        "internalType": "uint40",
        "name": "",
        "type": "uint40"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "rounds",
    "outputs": [
      {
        "internalType": "enum DiddyHideAndSeek.RoundStatus",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "uint40",
        "name": "startTime",
        "type": "uint40"
      },
      {
        "internalType": "uint40",
        "name": "endTime",
        "type": "uint40"
      },
      {
        "internalType": "uint40",
        "name": "drawnAt",
        "type": "uint40"
      },
      {
        "internalType": "uint40",
        "name": "numberOfPlayers",
        "type": "uint40"
      },
      {
        "internalType": "uint8",
        "name": "safeRoom",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "totalStaked",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalWinnerStaked",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "treasuryFeeAmount",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "treasuryFeeProcessed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "stakeAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "toggleOutflowAllowed",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "togglePaused",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "treasuryFeeBp",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "treasuryFeeRecipient",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_newKeeper",
        "type": "address"
      }
    ],
    "name": "updateKeeper",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint40",
        "name": "_maximumNumberOfPlayersPerRound",
        "type": "uint40"
      }
    ],
    "name": "updateMaximumNumberOfPlayersPerRound",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "_numberOfRooms",
        "type": "uint8"
      }
    ],
    "name": "updateNumberOfRooms",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint40",
        "name": "_roundDuration",
        "type": "uint40"
      }
    ],
    "name": "updateRoundDuration",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_stakeAmount",
        "type": "uint256"
      }
    ],
    "name": "updateStakeAmount",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint16",
        "name": "_treasuryFeeBp",
        "type": "uint16"
      }
    ],
    "name": "updateTreasuryFeeBp",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_treasuryFeeRecipient",
        "type": "address"
      }
    ],
    "name": "updateTreasuryFeeRecipient",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roundId",
        "type": "uint256"
      }
    ],
    "name": "withdrawFromCancelledRound",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawTreasuryFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;