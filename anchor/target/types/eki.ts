/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/eki.json`.
 */
export type Eki = {
  "address": "51uA4MrH53ToDjm3eF8jcxHfyHZctrU1HtebwyqVkM1U",
  "metadata": {
    "name": "eki",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "depositTokenA",
      "discriminator": [
        70,
        68,
        89,
        108,
        186,
        230,
        50,
        20
      ],
      "accounts": [
        {
          "name": "depositor",
          "writable": true,
          "signer": true
        },
        {
          "name": "depositorTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "depositor"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "tokenMintA"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenMintA"
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "positionA",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110,
                  95,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "market"
              },
              {
                "kind": "account",
                "path": "depositor"
              }
            ]
          }
        },
        {
          "name": "treasuryA",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          },
          "relations": [
            "market"
          ]
        },
        {
          "name": "bookkeeping",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  111,
                  107,
                  107,
                  101,
                  101,
                  112,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          }
        },
        {
          "name": "exits",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "endSlot",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositTokenB",
      "discriminator": [
        224,
        215,
        253,
        240,
        169,
        119,
        20,
        227
      ],
      "accounts": [
        {
          "name": "depositor",
          "writable": true,
          "signer": true
        },
        {
          "name": "depositorTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "depositor"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "tokenMintB"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenMintB"
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "positionB",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110,
                  95,
                  98
                ]
              },
              {
                "kind": "account",
                "path": "market"
              },
              {
                "kind": "account",
                "path": "depositor"
              }
            ]
          }
        },
        {
          "name": "treasuryB",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  98
                ]
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          },
          "relations": [
            "market"
          ]
        },
        {
          "name": "bookkeeping",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  111,
                  107,
                  107,
                  101,
                  101,
                  112,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          }
        },
        {
          "name": "exits",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "endSlot",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeExits",
      "discriminator": [
        8,
        22,
        150,
        118,
        168,
        56,
        87,
        236
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "exits",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeMarket",
      "discriminator": [
        35,
        35,
        189,
        193,
        155,
        48,
        170,
        203
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenMintA"
        },
        {
          "name": "tokenMintB"
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "treasuryA",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          }
        },
        {
          "name": "treasuryB",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  98
                ]
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          }
        },
        {
          "name": "bookkeeping",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  111,
                  107,
                  107,
                  101,
                  101,
                  112,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          }
        },
        {
          "name": "exits",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "startSlot",
          "type": "u64"
        },
        {
          "name": "endSlotInterval",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawSwappedTokenA",
      "discriminator": [
        219,
        231,
        4,
        162,
        65,
        138,
        99,
        148
      ],
      "accounts": [
        {
          "name": "withdrawer",
          "writable": true,
          "signer": true
        },
        {
          "name": "withdrawerTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "withdrawer"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "tokenMintA"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenMintA"
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "positionB",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110,
                  95,
                  98
                ]
              },
              {
                "kind": "account",
                "path": "market"
              },
              {
                "kind": "account",
                "path": "withdrawer"
              }
            ]
          }
        },
        {
          "name": "treasuryA",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          },
          "relations": [
            "market"
          ]
        },
        {
          "name": "bookkeeping",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  111,
                  107,
                  107,
                  101,
                  101,
                  112,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "market"
              }
            ]
          }
        },
        {
          "name": "exits",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "bookkeeping",
      "discriminator": [
        222,
        183,
        70,
        70,
        180,
        109,
        184,
        251
      ]
    },
    {
      "name": "exits",
      "discriminator": [
        240,
        175,
        85,
        167,
        2,
        200,
        2,
        180
      ]
    },
    {
      "name": "market",
      "discriminator": [
        219,
        190,
        213,
        55,
        0,
        227,
        198,
        154
      ]
    },
    {
      "name": "positionA",
      "discriminator": [
        115,
        100,
        243,
        3,
        118,
        209,
        212,
        78
      ]
    },
    {
      "name": "positionB",
      "discriminator": [
        63,
        224,
        139,
        42,
        212,
        119,
        253,
        67
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "endSlotAlreadyPassed",
      "msg": "End slot has already passed"
    },
    {
      "code": 6001,
      "name": "accountTooSmall",
      "msg": "Account is too small"
    },
    {
      "code": 6002,
      "name": "invalidSlotInterval",
      "msg": "Slot interval has to be power of 10"
    },
    {
      "code": 6003,
      "name": "depositTooSmall",
      "msg": "Deposit amount is too small"
    },
    {
      "code": 6004,
      "name": "noTokensSwapped",
      "msg": "No tokens have been swapped yet"
    }
  ],
  "types": [
    {
      "name": "bookkeeping",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "aPerB",
            "type": "u64"
          },
          {
            "name": "bPerA",
            "type": "u64"
          },
          {
            "name": "noTradeSlots",
            "type": "u64"
          },
          {
            "name": "lastSlot",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "exits",
      "serialization": "bytemuck",
      "repr": {
        "kind": "c"
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenA",
            "type": {
              "array": [
                "u64",
                640000
              ]
            }
          },
          {
            "name": "tokenB",
            "type": {
              "array": [
                "u64",
                640000
              ]
            }
          },
          {
            "name": "pointer",
            "type": "u64"
          },
          {
            "name": "startSlot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "market",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "treasuryA",
            "type": "pubkey"
          },
          {
            "name": "treasuryB",
            "type": "pubkey"
          },
          {
            "name": "tokenAVolume",
            "type": "u64"
          },
          {
            "name": "tokenBVolume",
            "type": "u64"
          },
          {
            "name": "endSlotInterval",
            "type": "u64"
          },
          {
            "name": "startSlot",
            "type": "u64"
          },
          {
            "name": "endSlot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "positionA",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "startSlot",
            "type": "u64"
          },
          {
            "name": "endSlot",
            "type": "u64"
          },
          {
            "name": "bookkeeping",
            "type": "u64"
          },
          {
            "name": "noTradeSlots",
            "type": "u64"
          },
          {
            "name": "totalNoTrades",
            "type": "u64"
          },
          {
            "name": "withdrawSlot",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "positionB",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "startSlot",
            "type": "u64"
          },
          {
            "name": "endSlot",
            "type": "u64"
          },
          {
            "name": "bookkeeping",
            "type": "u64"
          },
          {
            "name": "noTradeSlots",
            "type": "u64"
          },
          {
            "name": "totalNoTrades",
            "type": "u64"
          },
          {
            "name": "withdrawSlot",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "seed",
      "type": "string",
      "value": "\"anchor\""
    }
  ]
};