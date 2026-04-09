#!/usr/bin/env python3
"""Replyr — High-Converting DM Generator

Usage:
    python main.py

Set ANTHROPIC_API_KEY in your environment before running.
"""

import sys
from generator import generate_dms


def prompt_field(label: str, required: bool = True) -> str:
    while True:
        value = input(f"{label}: ").strip()
        if value or not required:
            return value
        print(f"  '{label}' is required. Please enter a value.")


def main() -> None:
    print("=" * 50)
    print("  Replyr — High-Converting DM Generator")
    print("=" * 50)
    print()

    try:
        intent = prompt_field("Intent (e.g. sell, collaborate, network)")
        target = prompt_field("Target person (who are you messaging?)")
        goal = prompt_field("Goal (what do you want to happen?)")
        tone = prompt_field("Tone (e.g. confident, friendly, direct)")
        platform = prompt_field("Platform (e.g. Instagram, LinkedIn, WhatsApp)")
        sender_info = prompt_field("Sender info (brief description of you / your offer)")
        target_context = prompt_field(
            "Extra context about target (optional, press Enter to skip)",
            required=False,
        )
    except (KeyboardInterrupt, EOFError):
        print("\nAborted.")
        sys.exit(0)

    print()
    print("-" * 50)
    print()

    try:
        generate_dms(
            intent=intent,
            target=target,
            goal=goal,
            tone=tone,
            platform=platform,
            sender_info=sender_info,
            target_context=target_context,
        )
    except Exception as e:
        print(f"\nError generating DMs: {e}", file=sys.stderr)
        sys.exit(1)

    print()
    print("-" * 50)


if __name__ == "__main__":
    main()
