exports['retry [afterEach] reporter results'] = {
  "stats": {
    "suites": 3,
    "tests": 5,
    "passes": 5,
    "pending": 0,
    "skipped": 0,
    "failures": 0,
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
    "wallClockEndedAt": "1970-01-01T00:00:00.000Z",
    "wallClockDuration": 0
  },
  "reporter": "spec",
  "reporterStats": {
    "suites": 3,
    "tests": 5,
    "passes": 5,
    "pending": 0,
    "failures": 0,
    "start": "match.date",
    "end": "match.date",
    "duration": "match.number"
  },
  "hooks": [
    {
      "hookId": "h1",
      "hookName": "before all",
      "title": [
        "\"before all\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h2",
      "hookName": "before each",
      "title": [
        "\"before each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h3",
      "hookName": "before each",
      "title": [
        "\"before each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h4",
      "hookName": "after each",
      "title": [
        "\"after each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h5",
      "hookName": "after each",
      "title": [
        "\"after each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h6",
      "hookName": "after all",
      "title": [
        "\"after all\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h7",
      "hookName": "after each",
      "title": [
        "\"after each\" hook"
      ],
      "body": "[body]"
    }
  ],
  "tests": [
    {
      "testId": "r3",
      "title": [
        "suite 1",
        "test 1"
      ],
      "state": "passed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": 1,
            "afterFnDuration": 1
          },
          {
            "hookId": "h3",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        },
        "after each": [
          {
            "hookId": "h4",
            "fnDuration": 1,
            "afterFnDuration": 1
          },
          {
            "hookId": "h5",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null,
      "prevAttempts": [
        {
          "state": "failed",
          "stack": null,
          "error": null,
          "timings": {
            "lifecycle": 1,
            "before all": [
              {
                "hookId": "h1",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ],
            "before each": [
              {
                "hookId": "h2",
                "fnDuration": 1,
                "afterFnDuration": 1
              },
              {
                "hookId": "h3",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ],
            "test": {
              "fnDuration": 1,
              "afterFnDuration": 1
            },
            "after each": [
              {
                "hookId": "h4",
                "fnDuration": 1,
                "afterFnDuration": 1
              },
              {
                "hookId": "h5",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ]
          },
          "failedFromHookId": "h4",
          "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
          "wallClockDuration": 1,
          "videoTimestamp": null
        }
      ]
    },
    {
      "testId": "r4",
      "title": [
        "suite 1",
        "test 2"
      ],
      "state": "passed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": 1,
            "afterFnDuration": 1
          },
          {
            "hookId": "h3",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        },
        "after each": [
          {
            "hookId": "h4",
            "fnDuration": 1,
            "afterFnDuration": 1
          },
          {
            "hookId": "h5",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null
    },
    {
      "testId": "r5",
      "title": [
        "suite 1",
        "test 3"
      ],
      "state": "passed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": 1,
            "afterFnDuration": 1
          },
          {
            "hookId": "h3",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        },
        "after each": [
          {
            "hookId": "h4",
            "fnDuration": 1,
            "afterFnDuration": 1
          },
          {
            "hookId": "h5",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "after all": [
          {
            "hookId": "h6",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null
    },
    {
      "testId": "r7",
      "title": [
        "suite 2",
        "test 1"
      ],
      "state": "passed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        },
        "after each": [
          {
            "hookId": "h7",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null,
      "prevAttempts": [
        {
          "state": "failed",
          "stack": null,
          "error": null,
          "timings": {
            "lifecycle": 1,
            "test": {
              "fnDuration": 1,
              "afterFnDuration": 1
            },
            "after each": [
              {
                "hookId": "h7",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ]
          },
          "failedFromHookId": "h7",
          "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
          "wallClockDuration": 1,
          "videoTimestamp": null
        },
        {
          "state": "failed",
          "stack": null,
          "error": null,
          "timings": {
            "lifecycle": 1,
            "test": {
              "fnDuration": 1,
              "afterFnDuration": 1
            },
            "after each": [
              {
                "hookId": "h7",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ]
          },
          "failedFromHookId": "h7",
          "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
          "wallClockDuration": 1,
          "videoTimestamp": null
        }
      ]
    },
    {
      "testId": "r9",
      "title": [
        "suite 3",
        "test 1"
      ],
      "state": "passed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        }
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null
    }
  ]
}

exports['retry [afterEach] runnables'] = {
  "r3": {
    "title": "test 1",
    "fn": "[Function fn]",
    "_trace": {},
    "pending": false,
    "type": "test",
    "body": "[body]",
    "state": "passed",
    "parent": "{Suite}",
    "id": "r3",
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
    "timings": {
      "lifecycle": 1,
      "before each": [
        {
          "hookId": "h2"
        },
        {
          "hookId": "h3"
        }
      ],
      "test": {},
      "after each": [
        {
          "hookId": "h4"
        },
        {
          "hookId": "h5"
        }
      ]
    },
    "prevAttempts": [
      {
        "title": "test 1",
        "fn": "[Function fn]",
        "_trace": {},
        "pending": false,
        "type": "test",
        "body": "[body]",
        "state": "failed",
        "parent": "{Suite}",
        "id": "r3",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
        "timings": {
          "lifecycle": 1,
          "before all": [
            {
              "hookId": "h1"
            }
          ],
          "before each": [
            {
              "hookId": "h2"
            },
            {
              "hookId": "h3"
            }
          ],
          "test": {},
          "after each": [
            {
              "hookId": "h4"
            },
            {
              "hookId": "h5"
            }
          ]
        },
        "hookName": "after each",
        "err": "{Object 5}",
        "failedFromHookId": "h4"
      }
    ],
    "final": true,
    "speed": "fast"
  },
  "r4": {
    "title": "test 2",
    "fn": "[Function fn]",
    "_trace": {},
    "pending": false,
    "type": "test",
    "body": "[body]",
    "state": "passed",
    "parent": "{Suite}",
    "id": "r4",
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
    "timings": {
      "lifecycle": 1,
      "before each": [
        {
          "hookId": "h2"
        },
        {
          "hookId": "h3"
        }
      ],
      "test": {},
      "after each": [
        {
          "hookId": "h4"
        },
        {
          "hookId": "h5"
        }
      ]
    },
    "final": true,
    "speed": "fast"
  },
  "r5": {
    "title": "test 3",
    "fn": "[Function fn]",
    "_trace": {},
    "pending": false,
    "type": "test",
    "body": "[body]",
    "state": "passed",
    "parent": "{Suite}",
    "id": "r5",
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
    "timings": {
      "lifecycle": 1,
      "before each": [
        {
          "hookId": "h2"
        },
        {
          "hookId": "h3"
        }
      ],
      "test": {},
      "after each": [
        {
          "hookId": "h4"
        },
        {
          "hookId": "h5"
        }
      ],
      "after all": [
        {
          "hookId": "h6"
        }
      ]
    },
    "final": true,
    "speed": "fast"
  },
  "r2": {
    "title": "suite 1",
    "ctx": {},
    "suites": [],
    "tests": [
      {
        "title": "test 1",
        "fn": "[Function fn]",
        "_trace": {},
        "pending": false,
        "type": "test",
        "body": "[body]",
        "state": "passed",
        "parent": "{Suite}",
        "id": "r3",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
        "timings": {
          "lifecycle": 1,
          "before each": [
            {
              "hookId": "h2"
            },
            {
              "hookId": "h3"
            }
          ],
          "test": {},
          "after each": [
            {
              "hookId": "h4"
            },
            {
              "hookId": "h5"
            }
          ]
        },
        "prevAttempts": [
          {
            "title": "test 1",
            "fn": "[Function fn]",
            "_trace": {},
            "pending": false,
            "type": "test",
            "body": "[body]",
            "state": "failed",
            "parent": "{Suite}",
            "id": "r3",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "timings": {
              "lifecycle": 1,
              "before all": [
                {
                  "hookId": "h1"
                }
              ],
              "before each": [
                {
                  "hookId": "h2"
                },
                {
                  "hookId": "h3"
                }
              ],
              "test": {},
              "after each": [
                {
                  "hookId": "h4"
                },
                {
                  "hookId": "h5"
                }
              ]
            },
            "hookName": "after each",
            "err": "{Object 5}",
            "failedFromHookId": "h4"
          }
        ],
        "final": true,
        "speed": "fast"
      },
      {
        "title": "test 2",
        "fn": "[Function fn]",
        "_trace": {},
        "pending": false,
        "type": "test",
        "body": "[body]",
        "state": "passed",
        "parent": "{Suite}",
        "id": "r4",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
        "timings": {
          "lifecycle": 1,
          "before each": [
            {
              "hookId": "h2"
            },
            {
              "hookId": "h3"
            }
          ],
          "test": {},
          "after each": [
            {
              "hookId": "h4"
            },
            {
              "hookId": "h5"
            }
          ]
        },
        "final": true,
        "speed": "fast"
      },
      {
        "title": "test 3",
        "fn": "[Function fn]",
        "_trace": {},
        "pending": false,
        "type": "test",
        "body": "[body]",
        "state": "passed",
        "parent": "{Suite}",
        "id": "r5",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
        "timings": {
          "lifecycle": 1,
          "before each": [
            {
              "hookId": "h2"
            },
            {
              "hookId": "h3"
            }
          ],
          "test": {},
          "after each": [
            {
              "hookId": "h4"
            },
            {
              "hookId": "h5"
            }
          ],
          "after all": [
            {
              "hookId": "h6"
            }
          ]
        },
        "final": true,
        "speed": "fast"
      }
    ],
    "pending": false,
    "root": false,
    "delayed": false,
    "parent": "{Suite}",
    "id": "r2",
    "type": "suite"
  },
  "r7": {
    "title": "test 1",
    "fn": "[Function fn]",
    "_trace": {},
    "pending": false,
    "type": "test",
    "body": "[body]",
    "state": "passed",
    "parent": "{Suite}",
    "id": "r7",
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
    "timings": {
      "lifecycle": 1,
      "test": {},
      "after each": [
        {
          "hookId": "h7"
        }
      ]
    },
    "prevAttempts": [
      {
        "title": "test 1",
        "fn": "[Function fn]",
        "_trace": {},
        "pending": false,
        "type": "test",
        "body": "[body]",
        "state": "failed",
        "parent": "{Suite}",
        "id": "r7",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
        "timings": {
          "lifecycle": 1,
          "test": {},
          "after each": [
            {
              "hookId": "h7"
            }
          ]
        },
        "hookName": "after each",
        "err": "{Object 5}",
        "failedFromHookId": "h7"
      },
      {
        "title": "test 1",
        "fn": "[Function fn]",
        "_trace": {},
        "pending": false,
        "type": "test",
        "body": "[body]",
        "state": "failed",
        "parent": "{Suite}",
        "id": "r7",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
        "timings": {
          "lifecycle": 1,
          "test": {},
          "after each": [
            {
              "hookId": "h7"
            }
          ]
        },
        "hookName": "after each",
        "err": "{Object 5}",
        "failedFromHookId": "h7"
      }
    ],
    "final": true,
    "speed": "fast"
  },
  "r6": {
    "title": "suite 2",
    "ctx": {},
    "suites": [],
    "tests": [
      {
        "title": "test 1",
        "fn": "[Function fn]",
        "_trace": {},
        "pending": false,
        "type": "test",
        "body": "[body]",
        "state": "passed",
        "parent": "{Suite}",
        "id": "r7",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
        "timings": {
          "lifecycle": 1,
          "test": {},
          "after each": [
            {
              "hookId": "h7"
            }
          ]
        },
        "prevAttempts": [
          {
            "title": "test 1",
            "fn": "[Function fn]",
            "_trace": {},
            "pending": false,
            "type": "test",
            "body": "[body]",
            "state": "failed",
            "parent": "{Suite}",
            "id": "r7",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "timings": {
              "lifecycle": 1,
              "test": {},
              "after each": [
                {
                  "hookId": "h7"
                }
              ]
            },
            "hookName": "after each",
            "err": "{Object 5}",
            "failedFromHookId": "h7"
          },
          {
            "title": "test 1",
            "fn": "[Function fn]",
            "_trace": {},
            "pending": false,
            "type": "test",
            "body": "[body]",
            "state": "failed",
            "parent": "{Suite}",
            "id": "r7",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "timings": {
              "lifecycle": 1,
              "test": {},
              "after each": [
                {
                  "hookId": "h7"
                }
              ]
            },
            "hookName": "after each",
            "err": "{Object 5}",
            "failedFromHookId": "h7"
          }
        ],
        "final": true,
        "speed": "fast"
      }
    ],
    "pending": false,
    "root": false,
    "delayed": false,
    "parent": "{Suite}",
    "id": "r6",
    "type": "suite"
  },
  "r9": {
    "title": "test 1",
    "fn": "[Function fn]",
    "_trace": {},
    "pending": false,
    "type": "test",
    "body": "[body]",
    "state": "passed",
    "parent": "{Suite}",
    "id": "r9",
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
    "timings": {
      "lifecycle": 1,
      "test": {}
    },
    "final": true,
    "speed": "fast"
  },
  "r8": {
    "title": "suite 3",
    "ctx": {},
    "suites": [],
    "tests": [
      {
        "title": "test 1",
        "fn": "[Function fn]",
        "_trace": {},
        "pending": false,
        "type": "test",
        "body": "[body]",
        "state": "passed",
        "parent": "{Suite}",
        "id": "r9",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
        "timings": {
          "lifecycle": 1,
          "test": {}
        },
        "final": true,
        "speed": "fast"
      }
    ],
    "pending": false,
    "root": false,
    "delayed": false,
    "parent": "{Suite}",
    "id": "r8",
    "type": "suite"
  },
  "r1": {
    "title": "",
    "ctx": {},
    "suites": [
      {
        "title": "suite 1",
        "ctx": {},
        "suites": [],
        "tests": [
          {
            "title": "test 1",
            "fn": "[Function fn]",
            "_trace": {},
            "pending": false,
            "type": "test",
            "body": "[body]",
            "state": "passed",
            "parent": "{Suite}",
            "id": "r3",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "timings": {
              "lifecycle": 1,
              "before each": [
                {
                  "hookId": "h2"
                },
                {
                  "hookId": "h3"
                }
              ],
              "test": {},
              "after each": [
                {
                  "hookId": "h4"
                },
                {
                  "hookId": "h5"
                }
              ]
            },
            "prevAttempts": [
              {
                "title": "test 1",
                "fn": "[Function fn]",
                "_trace": {},
                "pending": false,
                "type": "test",
                "body": "[body]",
                "state": "failed",
                "parent": "{Suite}",
                "id": "r3",
                "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
                "timings": {
                  "lifecycle": 1,
                  "before all": [
                    {
                      "hookId": "h1"
                    }
                  ],
                  "before each": [
                    {
                      "hookId": "h2"
                    },
                    {
                      "hookId": "h3"
                    }
                  ],
                  "test": {},
                  "after each": [
                    {
                      "hookId": "h4"
                    },
                    {
                      "hookId": "h5"
                    }
                  ]
                },
                "hookName": "after each",
                "err": "{Object 5}",
                "failedFromHookId": "h4"
              }
            ],
            "final": true,
            "speed": "fast"
          },
          {
            "title": "test 2",
            "fn": "[Function fn]",
            "_trace": {},
            "pending": false,
            "type": "test",
            "body": "[body]",
            "state": "passed",
            "parent": "{Suite}",
            "id": "r4",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "timings": {
              "lifecycle": 1,
              "before each": [
                {
                  "hookId": "h2"
                },
                {
                  "hookId": "h3"
                }
              ],
              "test": {},
              "after each": [
                {
                  "hookId": "h4"
                },
                {
                  "hookId": "h5"
                }
              ]
            },
            "final": true,
            "speed": "fast"
          },
          {
            "title": "test 3",
            "fn": "[Function fn]",
            "_trace": {},
            "pending": false,
            "type": "test",
            "body": "[body]",
            "state": "passed",
            "parent": "{Suite}",
            "id": "r5",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "timings": {
              "lifecycle": 1,
              "before each": [
                {
                  "hookId": "h2"
                },
                {
                  "hookId": "h3"
                }
              ],
              "test": {},
              "after each": [
                {
                  "hookId": "h4"
                },
                {
                  "hookId": "h5"
                }
              ],
              "after all": [
                {
                  "hookId": "h6"
                }
              ]
            },
            "final": true,
            "speed": "fast"
          }
        ],
        "pending": false,
        "root": false,
        "delayed": false,
        "parent": "{Suite}",
        "id": "r2",
        "type": "suite"
      },
      {
        "title": "suite 2",
        "ctx": {},
        "suites": [],
        "tests": [
          {
            "title": "test 1",
            "fn": "[Function fn]",
            "_trace": {},
            "pending": false,
            "type": "test",
            "body": "[body]",
            "state": "passed",
            "parent": "{Suite}",
            "id": "r7",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "timings": {
              "lifecycle": 1,
              "test": {},
              "after each": [
                {
                  "hookId": "h7"
                }
              ]
            },
            "prevAttempts": [
              {
                "title": "test 1",
                "fn": "[Function fn]",
                "_trace": {},
                "pending": false,
                "type": "test",
                "body": "[body]",
                "state": "failed",
                "parent": "{Suite}",
                "id": "r7",
                "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
                "timings": {
                  "lifecycle": 1,
                  "test": {},
                  "after each": [
                    {
                      "hookId": "h7"
                    }
                  ]
                },
                "hookName": "after each",
                "err": "{Object 5}",
                "failedFromHookId": "h7"
              },
              {
                "title": "test 1",
                "fn": "[Function fn]",
                "_trace": {},
                "pending": false,
                "type": "test",
                "body": "[body]",
                "state": "failed",
                "parent": "{Suite}",
                "id": "r7",
                "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
                "timings": {
                  "lifecycle": 1,
                  "test": {},
                  "after each": [
                    {
                      "hookId": "h7"
                    }
                  ]
                },
                "hookName": "after each",
                "err": "{Object 5}",
                "failedFromHookId": "h7"
              }
            ],
            "final": true,
            "speed": "fast"
          }
        ],
        "pending": false,
        "root": false,
        "delayed": false,
        "parent": "{Suite}",
        "id": "r6",
        "type": "suite"
      },
      {
        "title": "suite 3",
        "ctx": {},
        "suites": [],
        "tests": [
          {
            "title": "test 1",
            "fn": "[Function fn]",
            "_trace": {},
            "pending": false,
            "type": "test",
            "body": "[body]",
            "state": "passed",
            "parent": "{Suite}",
            "id": "r9",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "timings": {
              "lifecycle": 1,
              "test": {}
            },
            "final": true,
            "speed": "fast"
          }
        ],
        "pending": false,
        "root": false,
        "delayed": false,
        "parent": "{Suite}",
        "id": "r8",
        "type": "suite"
      }
    ],
    "tests": [],
    "pending": false,
    "root": true,
    "delayed": false,
    "id": "r1",
    "type": "suite"
  },
  "h1": {
    "hookId": "h1",
    "type": "hook",
    "title": "\"before all\" hook",
    "body": "[body]",
    "hookName": "before all"
  },
  "h2": {
    "hookId": "h2",
    "type": "hook",
    "title": "\"before each\" hook",
    "body": "[body]",
    "hookName": "before each"
  },
  "h3": {
    "hookId": "h3",
    "type": "hook",
    "title": "\"before each\" hook",
    "body": "[body]",
    "hookName": "before each"
  },
  "h4": {
    "hookId": "h4",
    "type": "hook",
    "title": "\"after each\" hook",
    "body": "[body]",
    "hookName": "after each"
  },
  "h5": {
    "hookId": "h5",
    "type": "hook",
    "title": "\"after each\" hook",
    "body": "[body]",
    "hookName": "after each"
  },
  "h6": {
    "hookId": "h6",
    "type": "hook",
    "title": "\"after all\" hook",
    "body": "[body]",
    "hookName": "after all"
  },
  "h7": {
    "hookId": "h7",
    "type": "hook",
    "title": "\"after each\" hook",
    "body": "[body]",
    "hookName": "after each"
  }
}

exports['retry [afterEach] runner emit'] = [
  [
    "start",
    null
  ],
  [
    "suite",
    "{Suite}"
  ],
  [
    "suite",
    "{Suite}"
  ],
  [
    "hook",
    "{Object 50}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "test",
    "{Test}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "test end",
    "{Test}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 53}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "hook",
    "{Object 55}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 54}"
  ],
  [
    "hook",
    "{Object 54}"
  ],
  [
    "hook end",
    "{Object 54}"
  ],
  [
    "hook",
    "{Object 55}"
  ],
  [
    "hook end",
    "{Object 55}"
  ],
  [
    "hook",
    "{Object 54}"
  ],
  [
    "hook end",
    "{Object 54}"
  ],
  [
    "pass",
    "{Test}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "test",
    "{Test}"
  ],
  [
    "hook",
    "{Object 50}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "hook",
    "{Object 51}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "test end",
    "{Test}"
  ],
  [
    "hook",
    "{Object 53}"
  ],
  [
    "hook end",
    "{Object 53}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "pass",
    "{Test}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "test",
    "{Test}"
  ],
  [
    "hook",
    "{Object 50}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "hook",
    "{Object 51}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "test end",
    "{Test}"
  ],
  [
    "hook",
    "{Object 53}"
  ],
  [
    "hook end",
    "{Object 53}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "pass",
    "{Test}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "suite end",
    "{Suite}"
  ],
  [
    "suite",
    "{Suite}"
  ],
  [
    "test",
    "{Test}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "test end",
    "{Test}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 53}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook",
    "{Object 55}"
  ],
  [
    "hook end",
    "{Object 55}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook",
    "{Object 55}"
  ],
  [
    "hook end",
    "{Object 55}"
  ],
  [
    "pass",
    "{Test}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "suite end",
    "{Suite}"
  ],
  [
    "suite",
    "{Suite}"
  ],
  [
    "test",
    "{Test}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "test end",
    "{Test}"
  ],
  [
    "pass",
    "{Test}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "suite end",
    "{Suite}"
  ],
  [
    "suite end",
    "{Suite}"
  ],
  [
    "end",
    null
  ]
]

exports['retry [afterEach] stdout'] = `


  suite 1
    \u2713 test 1
    \u2713 test 2
    \u2713 test 3

  suite 2
    \u2713 test 1

  suite 3
    \u2713 test 1


  5 passing 


`

exports['retry [beforeEach] reporter results'] = {
  "stats": {
    "suites": 1,
    "tests": 1,
    "passes": 1,
    "pending": 0,
    "skipped": 0,
    "failures": 0,
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
    "wallClockEndedAt": "1970-01-01T00:00:00.000Z",
    "wallClockDuration": 0
  },
  "reporter": "spec",
  "reporterStats": {
    "suites": 1,
    "tests": 1,
    "passes": 1,
    "pending": 0,
    "failures": 0,
    "start": "match.date",
    "end": "match.date",
    "duration": "match.number"
  },
  "hooks": [
    {
      "hookId": "h1",
      "hookName": "before all",
      "title": [
        "\"before all\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h2",
      "hookName": "before each",
      "title": [
        "\"before each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h3",
      "hookName": "before each",
      "title": [
        "\"before each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h4",
      "hookName": "before each",
      "title": [
        "\"before each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h5",
      "hookName": "after each",
      "title": [
        "\"after each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h6",
      "hookName": "after all",
      "title": [
        "\"after all\" hook"
      ],
      "body": "[body]"
    }
  ],
  "tests": [
    {
      "testId": "r3",
      "title": [
        "suite 1",
        "test 1"
      ],
      "state": "passed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": 1,
            "afterFnDuration": 1
          },
          {
            "hookId": "h3",
            "fnDuration": 1,
            "afterFnDuration": 1
          },
          {
            "hookId": "h4",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        },
        "after each": [
          {
            "hookId": "h5",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "after all": [
          {
            "hookId": "h6",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null,
      "prevAttempts": [
        {
          "state": "failed",
          "stack": null,
          "error": null,
          "timings": {
            "lifecycle": 1,
            "before all": [
              {
                "hookId": "h1",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ],
            "before each": [
              {
                "hookId": "h2",
                "fnDuration": 1,
                "afterFnDuration": 1
              },
              {
                "hookId": "h3",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ],
            "test": {
              "fnDuration": 1,
              "afterFnDuration": 1
            }
          },
          "failedFromHookId": "h3",
          "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
          "wallClockDuration": 1,
          "videoTimestamp": null
        }
      ]
    }
  ]
}

exports['retry [beforeEach] runnables'] = {
  "r3": {
    "title": "test 1",
    "fn": "[Function fn]",
    "_trace": {},
    "pending": false,
    "type": "test",
    "body": "[body]",
    "state": "passed",
    "parent": "{Suite}",
    "id": "r3",
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
    "timings": {
      "lifecycle": 1,
      "before each": [
        {
          "hookId": "h2"
        },
        {
          "hookId": "h3"
        },
        {
          "hookId": "h4"
        }
      ],
      "test": {},
      "after each": [
        {
          "hookId": "h5"
        }
      ],
      "after all": [
        {
          "hookId": "h6"
        }
      ]
    },
    "prevAttempts": [
      {
        "title": "test 1",
        "fn": "[Function fn]",
        "_trace": {},
        "pending": false,
        "type": "test",
        "body": "[body]",
        "state": "failed",
        "parent": "{Suite}",
        "id": "r3",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
        "timings": {
          "lifecycle": 1,
          "before all": [
            {
              "hookId": "h1"
            }
          ],
          "before each": [
            {
              "hookId": "h2"
            },
            {
              "hookId": "h3"
            }
          ],
          "test": {}
        },
        "hookName": "before each",
        "err": "{Object 6}",
        "failedFromHookId": "h3"
      }
    ],
    "final": true,
    "speed": "fast"
  },
  "r2": {
    "title": "suite 1",
    "ctx": {},
    "suites": [],
    "tests": [
      {
        "title": "test 1",
        "fn": "[Function fn]",
        "_trace": {},
        "pending": false,
        "type": "test",
        "body": "[body]",
        "state": "passed",
        "parent": "{Suite}",
        "id": "r3",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
        "timings": {
          "lifecycle": 1,
          "before each": [
            {
              "hookId": "h2"
            },
            {
              "hookId": "h3"
            },
            {
              "hookId": "h4"
            }
          ],
          "test": {},
          "after each": [
            {
              "hookId": "h5"
            }
          ],
          "after all": [
            {
              "hookId": "h6"
            }
          ]
        },
        "prevAttempts": [
          {
            "title": "test 1",
            "fn": "[Function fn]",
            "_trace": {},
            "pending": false,
            "type": "test",
            "body": "[body]",
            "state": "failed",
            "parent": "{Suite}",
            "id": "r3",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "timings": {
              "lifecycle": 1,
              "before all": [
                {
                  "hookId": "h1"
                }
              ],
              "before each": [
                {
                  "hookId": "h2"
                },
                {
                  "hookId": "h3"
                }
              ],
              "test": {}
            },
            "hookName": "before each",
            "err": "{Object 6}",
            "failedFromHookId": "h3"
          }
        ],
        "final": true,
        "speed": "fast"
      }
    ],
    "pending": false,
    "root": false,
    "delayed": false,
    "parent": "{Suite}",
    "id": "r2",
    "type": "suite"
  },
  "r1": {
    "title": "",
    "ctx": {},
    "suites": [
      {
        "title": "suite 1",
        "ctx": {},
        "suites": [],
        "tests": [
          {
            "title": "test 1",
            "fn": "[Function fn]",
            "_trace": {},
            "pending": false,
            "type": "test",
            "body": "[body]",
            "state": "passed",
            "parent": "{Suite}",
            "id": "r3",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "timings": {
              "lifecycle": 1,
              "before each": [
                {
                  "hookId": "h2"
                },
                {
                  "hookId": "h3"
                },
                {
                  "hookId": "h4"
                }
              ],
              "test": {},
              "after each": [
                {
                  "hookId": "h5"
                }
              ],
              "after all": [
                {
                  "hookId": "h6"
                }
              ]
            },
            "prevAttempts": [
              {
                "title": "test 1",
                "fn": "[Function fn]",
                "_trace": {},
                "pending": false,
                "type": "test",
                "body": "[body]",
                "state": "failed",
                "parent": "{Suite}",
                "id": "r3",
                "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
                "timings": {
                  "lifecycle": 1,
                  "before all": [
                    {
                      "hookId": "h1"
                    }
                  ],
                  "before each": [
                    {
                      "hookId": "h2"
                    },
                    {
                      "hookId": "h3"
                    }
                  ],
                  "test": {}
                },
                "hookName": "before each",
                "err": "{Object 6}",
                "failedFromHookId": "h3"
              }
            ],
            "final": true,
            "speed": "fast"
          }
        ],
        "pending": false,
        "root": false,
        "delayed": false,
        "parent": "{Suite}",
        "id": "r2",
        "type": "suite"
      }
    ],
    "tests": [],
    "pending": false,
    "root": true,
    "delayed": false,
    "id": "r1",
    "type": "suite"
  },
  "h1": {
    "hookId": "h1",
    "type": "hook",
    "title": "\"before all\" hook",
    "body": "[body]",
    "hookName": "before all"
  },
  "h2": {
    "hookId": "h2",
    "type": "hook",
    "title": "\"before each\" hook",
    "body": "[body]",
    "hookName": "before each"
  },
  "h3": {
    "hookId": "h3",
    "type": "hook",
    "title": "\"before each\" hook",
    "body": "[body]",
    "hookName": "before each"
  },
  "h4": {
    "hookId": "h4",
    "type": "hook",
    "title": "\"before each\" hook",
    "body": "[body]",
    "hookName": "before each"
  },
  "h5": {
    "hookId": "h5",
    "type": "hook",
    "title": "\"after each\" hook",
    "body": "[body]",
    "hookName": "after each"
  },
  "h6": {
    "hookId": "h6",
    "type": "hook",
    "title": "\"after all\" hook",
    "body": "[body]",
    "hookName": "after all"
  }
}

exports['retry [beforeEach] runner emit'] = [
  [
    "start",
    null
  ],
  [
    "suite",
    "{Suite}"
  ],
  [
    "suite",
    "{Suite}"
  ],
  [
    "hook",
    "{Object 50}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "test",
    "{Test}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 53}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "hook",
    "{Object 55}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 54}"
  ],
  [
    "hook",
    "{Object 55}"
  ],
  [
    "hook end",
    "{Object 55}"
  ],
  [
    "hook",
    "{Object 54}"
  ],
  [
    "hook end",
    "{Object 54}"
  ],
  [
    "test end",
    "{Test}"
  ],
  [
    "hook",
    "{Object 54}"
  ],
  [
    "hook end",
    "{Object 54}"
  ],
  [
    "hook",
    "{Object 54}"
  ],
  [
    "hook end",
    "{Object 54}"
  ],
  [
    "suite end",
    "{Suite}"
  ],
  [
    "pass",
    "{Test}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "suite end",
    "{Suite}"
  ],
  [
    "end",
    null
  ]
]

exports['retry [beforeEach] stdout'] = `


  suite 1

  \u2713 test 1

  1 passing 


`

exports['simple_single_test reporter results'] = {
  "stats": {
    "suites": 1,
    "tests": 1,
    "passes": 1,
    "pending": 0,
    "skipped": 0,
    "failures": 0,
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
    "wallClockEndedAt": "1970-01-01T00:00:00.000Z",
    "wallClockDuration": 0
  },
  "reporter": "spec",
  "reporterStats": {
    "suites": 1,
    "tests": 1,
    "passes": 1,
    "pending": 0,
    "failures": 0,
    "start": "match.date",
    "end": "match.date",
    "duration": "match.number"
  },
  "hooks": [],
  "tests": [
    {
      "testId": "r3",
      "title": [
        "suite 1",
        "test 1"
      ],
      "state": "passed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        }
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null
    }
  ]
}

exports['simple_single_test runnables'] = {
  "r3": {
    "title": "test 1",
    "fn": "[Function fn]",
    "_trace": {},
    "pending": false,
    "type": "test",
    "body": "[body]",
    "state": "passed",
    "parent": "{Suite}",
    "id": "r3",
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
    "timings": {
      "lifecycle": 1,
      "test": {}
    },
    "final": true,
    "speed": "fast"
  },
  "r2": {
    "title": "suite 1",
    "ctx": {},
    "suites": [],
    "tests": [
      {
        "title": "test 1",
        "fn": "[Function fn]",
        "_trace": {},
        "pending": false,
        "type": "test",
        "body": "[body]",
        "state": "passed",
        "parent": "{Suite}",
        "id": "r3",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
        "timings": {
          "lifecycle": 1,
          "test": {}
        },
        "final": true,
        "speed": "fast"
      }
    ],
    "pending": false,
    "root": false,
    "delayed": false,
    "parent": "{Suite}",
    "id": "r2",
    "type": "suite"
  },
  "r1": {
    "title": "",
    "ctx": {},
    "suites": [
      {
        "title": "suite 1",
        "ctx": {},
        "suites": [],
        "tests": [
          {
            "title": "test 1",
            "fn": "[Function fn]",
            "_trace": {},
            "pending": false,
            "type": "test",
            "body": "[body]",
            "state": "passed",
            "parent": "{Suite}",
            "id": "r3",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "timings": {
              "lifecycle": 1,
              "test": {}
            },
            "final": true,
            "speed": "fast"
          }
        ],
        "pending": false,
        "root": false,
        "delayed": false,
        "parent": "{Suite}",
        "id": "r2",
        "type": "suite"
      }
    ],
    "tests": [],
    "pending": false,
    "root": true,
    "delayed": false,
    "id": "r1",
    "type": "suite"
  }
}

exports['simple_single_test runner emit'] = [
  [
    "start",
    null
  ],
  [
    "suite",
    "{Suite}"
  ],
  [
    "suite",
    "{Suite}"
  ],
  [
    "test",
    "{Test}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "test end",
    "{Test}"
  ],
  [
    "pass",
    "{Test}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "suite end",
    "{Suite}"
  ],
  [
    "suite end",
    "{Suite}"
  ],
  [
    "end",
    null
  ]
]

exports['three tests with retry reporter results'] = {
  "stats": {
    "suites": 1,
    "tests": 3,
    "passes": 3,
    "pending": 0,
    "skipped": 0,
    "failures": 0,
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
    "wallClockEndedAt": "1970-01-01T00:00:00.000Z",
    "wallClockDuration": 0
  },
  "reporter": "spec",
  "reporterStats": {
    "suites": 1,
    "tests": 3,
    "passes": 3,
    "pending": 0,
    "failures": 0,
    "start": "match.date",
    "end": "match.date",
    "duration": "match.number"
  },
  "hooks": [
    {
      "hookId": "h1",
      "hookName": "before all",
      "title": [
        "\"before all\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h2",
      "hookName": "before each",
      "title": [
        "\"before each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h3",
      "hookName": "after each",
      "title": [
        "\"after each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h4",
      "hookName": "after all",
      "title": [
        "\"after all\" hook"
      ],
      "body": "[body]"
    }
  ],
  "tests": [
    {
      "testId": "r3",
      "title": [
        "suite 1",
        "test 1"
      ],
      "state": "passed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null
    },
    {
      "testId": "r4",
      "title": [
        "suite 1",
        "test 2"
      ],
      "state": "passed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null,
      "prevAttempts": [
        {
          "state": "failed",
          "stack": null,
          "error": null,
          "timings": {
            "lifecycle": 1,
            "before each": [
              {
                "hookId": "h2",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ],
            "test": {
              "fnDuration": 1,
              "afterFnDuration": 1
            },
            "after each": [
              {
                "hookId": "h3",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ]
          },
          "failedFromHookId": null,
          "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
          "wallClockDuration": 1,
          "videoTimestamp": null
        },
        {
          "state": "failed",
          "stack": null,
          "error": null,
          "timings": {
            "lifecycle": 1,
            "before each": [
              {
                "hookId": "h2",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ],
            "test": {
              "fnDuration": 1,
              "afterFnDuration": 1
            },
            "after each": [
              {
                "hookId": "h3",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ]
          },
          "failedFromHookId": null,
          "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
          "wallClockDuration": 1,
          "videoTimestamp": null
        }
      ]
    },
    {
      "testId": "r5",
      "title": [
        "suite 1",
        "test 3"
      ],
      "state": "passed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null
    }
  ]
}

exports['three tests with retry runnables'] = {
  "r3": {
    "title": "test 1",
    "fn": "[Function fn]",
    "_trace": {},
    "pending": false,
    "type": "test",
    "body": "[body]",
    "state": "passed",
    "parent": "{Suite}",
    "id": "r3",
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
    "timings": {
      "lifecycle": 1,
      "before all": [
        {
          "hookId": "h1"
        }
      ],
      "before each": [
        {
          "hookId": "h2"
        }
      ],
      "test": {},
      "after each": [
        {
          "hookId": "h3"
        }
      ]
    },
    "final": true,
    "speed": "fast"
  },
  "r4": {
    "title": "test 2",
    "fn": "[Function fn]",
    "_trace": {},
    "pending": false,
    "type": "test",
    "body": "[body]",
    "state": "passed",
    "parent": "{Suite}",
    "id": "r4",
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
    "timings": {
      "lifecycle": 1,
      "before each": [
        {
          "hookId": "h2"
        }
      ],
      "test": {},
      "after each": [
        {
          "hookId": "h3"
        }
      ]
    },
    "prevAttempts": [
      {
        "title": "test 2",
        "fn": "[Function fn]",
        "_trace": {},
        "pending": false,
        "type": "test",
        "body": "[body]",
        "state": "failed",
        "parent": "{Suite}",
        "id": "r4",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
        "err": "{Object 6}",
        "timings": {
          "lifecycle": 1,
          "before each": [
            {
              "hookId": "h2"
            }
          ],
          "test": {},
          "after each": [
            {
              "hookId": "h3"
            }
          ]
        }
      },
      {
        "title": "test 2",
        "fn": "[Function fn]",
        "_trace": {},
        "pending": false,
        "type": "test",
        "body": "[body]",
        "state": "failed",
        "parent": "{Suite}",
        "id": "r4",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
        "timings": {
          "lifecycle": 1,
          "before each": [
            {
              "hookId": "h2"
            }
          ],
          "test": {},
          "after each": [
            {
              "hookId": "h3"
            }
          ]
        },
        "err": "{Object 6}"
      }
    ],
    "final": true,
    "speed": "fast"
  },
  "r5": {
    "title": "test 3",
    "fn": "[Function fn]",
    "_trace": {},
    "pending": false,
    "type": "test",
    "body": "[body]",
    "state": "passed",
    "parent": "{Suite}",
    "id": "r5",
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
    "timings": {
      "lifecycle": 1,
      "before each": [
        {
          "hookId": "h2"
        }
      ],
      "test": {},
      "after each": [
        {
          "hookId": "h3"
        }
      ],
      "after all": [
        {
          "hookId": "h4"
        }
      ]
    },
    "final": true,
    "speed": "fast"
  },
  "r2": {
    "title": "suite 1",
    "ctx": {},
    "suites": [],
    "tests": [
      {
        "title": "test 1",
        "fn": "[Function fn]",
        "_trace": {},
        "pending": false,
        "type": "test",
        "body": "[body]",
        "state": "passed",
        "parent": "{Suite}",
        "id": "r3",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
        "timings": {
          "lifecycle": 1,
          "before all": [
            {
              "hookId": "h1"
            }
          ],
          "before each": [
            {
              "hookId": "h2"
            }
          ],
          "test": {},
          "after each": [
            {
              "hookId": "h3"
            }
          ]
        },
        "final": true,
        "speed": "fast"
      },
      {
        "title": "test 2",
        "fn": "[Function fn]",
        "_trace": {},
        "pending": false,
        "type": "test",
        "body": "[body]",
        "state": "passed",
        "parent": "{Suite}",
        "id": "r4",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
        "timings": {
          "lifecycle": 1,
          "before each": [
            {
              "hookId": "h2"
            }
          ],
          "test": {},
          "after each": [
            {
              "hookId": "h3"
            }
          ]
        },
        "prevAttempts": [
          {
            "title": "test 2",
            "fn": "[Function fn]",
            "_trace": {},
            "pending": false,
            "type": "test",
            "body": "[body]",
            "state": "failed",
            "parent": "{Suite}",
            "id": "r4",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "err": "{Object 6}",
            "timings": {
              "lifecycle": 1,
              "before each": [
                {
                  "hookId": "h2"
                }
              ],
              "test": {},
              "after each": [
                {
                  "hookId": "h3"
                }
              ]
            }
          },
          {
            "title": "test 2",
            "fn": "[Function fn]",
            "_trace": {},
            "pending": false,
            "type": "test",
            "body": "[body]",
            "state": "failed",
            "parent": "{Suite}",
            "id": "r4",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "timings": {
              "lifecycle": 1,
              "before each": [
                {
                  "hookId": "h2"
                }
              ],
              "test": {},
              "after each": [
                {
                  "hookId": "h3"
                }
              ]
            },
            "err": "{Object 6}"
          }
        ],
        "final": true,
        "speed": "fast"
      },
      {
        "title": "test 3",
        "fn": "[Function fn]",
        "_trace": {},
        "pending": false,
        "type": "test",
        "body": "[body]",
        "state": "passed",
        "parent": "{Suite}",
        "id": "r5",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
        "timings": {
          "lifecycle": 1,
          "before each": [
            {
              "hookId": "h2"
            }
          ],
          "test": {},
          "after each": [
            {
              "hookId": "h3"
            }
          ],
          "after all": [
            {
              "hookId": "h4"
            }
          ]
        },
        "final": true,
        "speed": "fast"
      }
    ],
    "pending": false,
    "root": false,
    "delayed": false,
    "parent": "{Suite}",
    "id": "r2",
    "type": "suite"
  },
  "r1": {
    "title": "",
    "ctx": {},
    "suites": [
      {
        "title": "suite 1",
        "ctx": {},
        "suites": [],
        "tests": [
          {
            "title": "test 1",
            "fn": "[Function fn]",
            "_trace": {},
            "pending": false,
            "type": "test",
            "body": "[body]",
            "state": "passed",
            "parent": "{Suite}",
            "id": "r3",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "timings": {
              "lifecycle": 1,
              "before all": [
                {
                  "hookId": "h1"
                }
              ],
              "before each": [
                {
                  "hookId": "h2"
                }
              ],
              "test": {},
              "after each": [
                {
                  "hookId": "h3"
                }
              ]
            },
            "final": true,
            "speed": "fast"
          },
          {
            "title": "test 2",
            "fn": "[Function fn]",
            "_trace": {},
            "pending": false,
            "type": "test",
            "body": "[body]",
            "state": "passed",
            "parent": "{Suite}",
            "id": "r4",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "timings": {
              "lifecycle": 1,
              "before each": [
                {
                  "hookId": "h2"
                }
              ],
              "test": {},
              "after each": [
                {
                  "hookId": "h3"
                }
              ]
            },
            "prevAttempts": [
              {
                "title": "test 2",
                "fn": "[Function fn]",
                "_trace": {},
                "pending": false,
                "type": "test",
                "body": "[body]",
                "state": "failed",
                "parent": "{Suite}",
                "id": "r4",
                "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
                "err": "{Object 6}",
                "timings": {
                  "lifecycle": 1,
                  "before each": [
                    {
                      "hookId": "h2"
                    }
                  ],
                  "test": {},
                  "after each": [
                    {
                      "hookId": "h3"
                    }
                  ]
                }
              },
              {
                "title": "test 2",
                "fn": "[Function fn]",
                "_trace": {},
                "pending": false,
                "type": "test",
                "body": "[body]",
                "state": "failed",
                "parent": "{Suite}",
                "id": "r4",
                "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
                "timings": {
                  "lifecycle": 1,
                  "before each": [
                    {
                      "hookId": "h2"
                    }
                  ],
                  "test": {},
                  "after each": [
                    {
                      "hookId": "h3"
                    }
                  ]
                },
                "err": "{Object 6}"
              }
            ],
            "final": true,
            "speed": "fast"
          },
          {
            "title": "test 3",
            "fn": "[Function fn]",
            "_trace": {},
            "pending": false,
            "type": "test",
            "body": "[body]",
            "state": "passed",
            "parent": "{Suite}",
            "id": "r5",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "timings": {
              "lifecycle": 1,
              "before each": [
                {
                  "hookId": "h2"
                }
              ],
              "test": {},
              "after each": [
                {
                  "hookId": "h3"
                }
              ],
              "after all": [
                {
                  "hookId": "h4"
                }
              ]
            },
            "final": true,
            "speed": "fast"
          }
        ],
        "pending": false,
        "root": false,
        "delayed": false,
        "parent": "{Suite}",
        "id": "r2",
        "type": "suite"
      }
    ],
    "tests": [],
    "pending": false,
    "root": true,
    "delayed": false,
    "id": "r1",
    "type": "suite"
  },
  "h1": {
    "hookId": "h1",
    "type": "hook",
    "title": "\"before all\" hook",
    "body": "[body]",
    "hookName": "before all"
  },
  "h2": {
    "hookId": "h2",
    "type": "hook",
    "title": "\"before each\" hook",
    "body": "[body]",
    "hookName": "before each"
  },
  "h3": {
    "hookId": "h3",
    "type": "hook",
    "title": "\"after each\" hook",
    "body": "[body]",
    "hookName": "after each"
  },
  "h4": {
    "hookId": "h4",
    "type": "hook",
    "title": "\"after all\" hook",
    "body": "[body]",
    "hookName": "after all"
  }
}

exports['three tests with retry runner emit'] = [
  [
    "start",
    null
  ],
  [
    "suite",
    "{Suite}"
  ],
  [
    "suite",
    "{Suite}"
  ],
  [
    "hook",
    "{Object 50}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "test",
    "{Test}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "test end",
    "{Test}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "pass",
    "{Test}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "test",
    "{Test}"
  ],
  [
    "hook",
    "{Object 50}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "hook",
    "{Object 51}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "hook",
    "{Object 54}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 54}"
  ],
  [
    "hook",
    "{Object 54}"
  ],
  [
    "hook end",
    "{Object 54}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "hook",
    "{Object 55}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 54}"
  ],
  [
    "test end",
    "{Test}"
  ],
  [
    "hook",
    "{Object 54}"
  ],
  [
    "hook end",
    "{Object 54}"
  ],
  [
    "pass",
    "{Test}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "test",
    "{Test}"
  ],
  [
    "hook",
    "{Object 50}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "test end",
    "{Test}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "pass",
    "{Test}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "suite end",
    "{Suite}"
  ],
  [
    "suite end",
    "{Suite}"
  ],
  [
    "end",
    null
  ]
]
