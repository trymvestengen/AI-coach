from app.main import build_cors_config


def test_default_origins_when_env_unset():
    config = build_cors_config({})
    assert config["allow_origins"] == [
        "http://localhost:3000",
        "http://localhost:3001",
    ]
    assert config["allow_origin_regex"] is None


def test_custom_origins_from_env():
    config = build_cors_config({"CORS_ORIGINS": "https://foo.com,https://bar.com"})
    assert config["allow_origins"] == ["https://foo.com", "https://bar.com"]


def test_regex_from_env():
    config = build_cors_config({
        "CORS_ORIGIN_REGEX": r"^https://.*\.vercel\.app$",
    })
    assert config["allow_origin_regex"] == r"^https://.*\.vercel\.app$"


def test_empty_entries_filtered_out():
    config = build_cors_config({"CORS_ORIGINS": "https://foo.com,,https://bar.com,"})
    assert config["allow_origins"] == ["https://foo.com", "https://bar.com"]


def test_whitespace_trimmed():
    config = build_cors_config({"CORS_ORIGINS": "https://foo.com , https://bar.com"})
    assert config["allow_origins"] == ["https://foo.com", "https://bar.com"]


def test_empty_regex_treated_as_none():
    config = build_cors_config({"CORS_ORIGIN_REGEX": ""})
    assert config["allow_origin_regex"] is None
