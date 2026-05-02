"""Unit tests for validating the structural integrity of the i18n translation system.

This suite ensures that all 12 supported locales maintain 100% key parity with the
master English schema and that dynamic interpolation placeholders are preserved.
"""

import json
import re
from pathlib import Path

import pytest

# Define the locales directory relative to the project root
LOCALES_DIR = Path("web/src/locales")
MASTER_LOCALE = "en"
TARGET_LOCALES = ["hi", "ta", "te", "kn", "ml", "bn", "gu", "mr", "es", "fr", "de"]


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_all_keys(d, parent_key=""):
    """Recursively get all keys from a nested dictionary."""
    keys = set()
    for k, v in d.items():
        new_key = f"{parent_key}.{k}" if parent_key else k
        if isinstance(v, dict):
            keys.update(get_all_keys(v, new_key))
        else:
            keys.add(new_key)
    return keys


def get_placeholders(s):
    """Find all {{placeholder}} patterns in a string."""
    return set(re.findall(r"\{\{(.*?)\}\}", s))


@pytest.fixture
def master_data():
    path = LOCALES_DIR / MASTER_LOCALE / "translation.json"
    return load_json(path)


@pytest.fixture
def master_keys(master_data):
    return get_all_keys(master_data)


@pytest.mark.parametrize("locale", TARGET_LOCALES)
def test_locale_completeness(locale, master_keys):
    """Verify that the target locale has all keys present in the master locale."""
    path = LOCALES_DIR / locale / "translation.json"
    assert path.exists(), f"Locale file missing for: {locale}"

    target_data = load_json(path)
    target_keys = get_all_keys(target_data)

    missing_keys = master_keys - target_keys
    extra_keys = target_keys - master_keys

    assert not missing_keys, f"Locale '{locale}' is missing keys: {missing_keys}"
    assert not extra_keys, f"Locale '{locale}' has unexpected keys: {extra_keys}"


@pytest.mark.parametrize("locale", TARGET_LOCALES)
def test_placeholder_consistency(locale, master_data):
    """Verify that placeholders like {{count}} are preserved in translations."""
    path = LOCALES_DIR / locale / "translation.json"
    target_data = load_json(path)

    master_keys_list = list(get_all_keys(master_data))

    for key in master_keys_list:
        # Traverse both dictionaries to get the string value
        m_val = master_data
        t_val = target_data
        for part in key.split("."):
            m_val = m_val[part]
            t_val = t_val[part]

        if isinstance(m_val, str) and isinstance(t_val, str):
            m_placeholders = get_placeholders(m_val)
            t_placeholders = get_placeholders(t_val)
            assert m_placeholders == t_placeholders, (
                f"Placeholder mismatch in '{locale}' for key '{key}'. "
                f"Expected {m_placeholders}, got {t_placeholders}"
            )


def test_all_locales_accounted_for():
    """Verify that all folders in the locales directory are tested."""
    found_locales = {p.name for p in LOCALES_DIR.iterdir() if p.is_dir()}
    tested_locales = set([MASTER_LOCALE] + TARGET_LOCALES)
    assert found_locales == tested_locales, (
        f"Untested locales found: {found_locales - tested_locales}"
    )
