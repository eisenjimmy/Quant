import json
import os
import sys
import unittest


sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from protocol import ProtocolError, _valid_candle, parse_request_line


class ProtocolTests(unittest.TestCase):
    def test_rejects_malformed_json(self):
        with self.assertRaises(ProtocolError):
            parse_request_line("{")

    def test_rejects_unknown_type(self):
        with self.assertRaises(ProtocolError):
            parse_request_line(json.dumps({"type": "unknown"}))

    def test_rejects_invalid_run_payload(self):
        with self.assertRaises(ProtocolError):
            parse_request_line(
                json.dumps(
                    {
                        "type": "run",
                        "jobId": "fc_test",
                        "payload": {"paths": 29},
                    }
                )
            )

    def test_accepts_cancel(self):
        value = parse_request_line(
            json.dumps({"type": "cancel", "jobId": "fc_test"})
        )
        self.assertEqual(value["jobId"], "fc_test")

    def test_rejects_non_v1_sampling_parameters(self):
        payload = {
            "symbol": "SPY",
            "paths": 30,
            "predLen": 24,
            "interval": "1h",
            "temperature": 0.5,
            "topP": 0.95,
            "topK": 0,
            "futureTimestamps": [
                "2026-02-%02dT14:30:00.000Z" % (index + 1)
                for index in range(24)
            ],
            "candles": [
                {
                    "timestamp": (
                        "2026-%02d-%02dT14:30:00.000Z"
                        % ((index // 28) + 1, (index % 28) + 1)
                    ),
                    "open": 100,
                    "high": 101,
                    "low": 99,
                    "close": 100,
                    "volume": 1,
                    "amount": 100,
                }
                for index in range(300)
            ],
        }
        with self.assertRaises(ProtocolError):
            parse_request_line(
                json.dumps(
                    {
                        "type": "run",
                        "jobId": "fc_sampling",
                        "payload": payload,
                    }
                )
            )

    def test_rejects_duplicate_future_timestamps(self):
        payload = {
            "symbol": "SPY",
            "paths": 30,
            "predLen": 24,
            "interval": "1h",
            "temperature": 1.0,
            "topP": 0.95,
            "topK": 0,
            "futureTimestamps": [
                "2026-02-%02dT14:30:00.000Z" % (index + 1)
                for index in range(24)
            ],
            "candles": [
                {
                    "timestamp": (
                        "2026-%02d-%02dT14:30:00.000Z"
                        % ((index // 28) + 1, (index % 28) + 1)
                    ),
                    "open": 100,
                    "high": 101,
                    "low": 99,
                    "close": 100,
                    "volume": 1,
                    "amount": 100,
                }
                for index in range(300)
            ],
        }
        payload["futureTimestamps"][1] = payload["futureTimestamps"][0]
        with self.assertRaises(ProtocolError):
            parse_request_line(
                json.dumps(
                    {
                        "type": "run",
                        "jobId": "fc_duplicate_future",
                        "payload": payload,
                    }
                )
            )

    def test_rejects_non_iso_candle_timestamp(self):
        self.assertFalse(
            _valid_candle(
                {
                    "timestamp": "1",
                    "open": 1,
                    "high": 1,
                    "low": 1,
                    "close": 1,
                    "volume": 1,
                    "amount": 1,
                }
            )
        )


if __name__ == "__main__":
    unittest.main()
