import sys
from unittest.mock import patch


def test_main_vertex_mode() -> None:
    """Test main.py initialization in Vertex mode."""
    with (
        patch("os.getenv") as mock_getenv,
        patch("api.app.create_app") as mock_create_app,
        patch("builtins.print") as mock_print,
    ):
        # Branch 1: Vertex AI
        mock_getenv.side_effect = lambda k, d=None: (
            "1" if k == "GOOGLE_GENAI_USE_VERTEXAI" else None
        )

        # We need to reload main to re-execute top-level code
        if "main" in sys.modules:
            del sys.modules["main"]
        import main  # noqa: F401

        mock_print.assert_any_call("Initializing in Vertex AI Mode (Enterprise Auth)")
        assert mock_create_app.called


def test_main_developer_mode() -> None:
    """Test main.py initialization in Developer mode."""
    with (
        patch("os.getenv") as mock_getenv,
        patch("os.environ.pop") as mock_pop,
        patch("api.app.create_app") as mock_create_app,
        patch("builtins.print") as mock_print,
    ):
        # Branch 2: Developer API
        def side_effect(k, d=None) -> str | None:
            if k == "GEMINI_API_KEY":
                return "secret"
            return None

        mock_getenv.side_effect = side_effect

        if "main" in sys.modules:
            del sys.modules["main"]
        import main  # noqa: F401

        mock_print.assert_any_call("Initializing in Developer API Mode (AI Studio Auth)")
        mock_pop.assert_any_call("GOOGLE_CLOUD_PROJECT", None)
        mock_pop.assert_any_call("GOOGLE_CLOUD_LOCATION", None)
        assert mock_create_app.called


def test_main_cli_execution() -> None:
    """Test main.py when run as a script."""
    with patch("uvicorn.run") as mock_run, patch("api.app.create_app"):
        if "main" in sys.modules:
            del sys.modules["main"]

        with patch("main.__name__", "__main__"):
            # This is tricky because main.py already executed on import.
            # But the if __name__ == "__main__" block only runs if __name__ is __main__.
            # We can use runpy or just manually call the block logic if we had it in a function.
            # Since it's at top-level, we use runpy.
            import runpy

            runpy.run_module("main", run_name="__main__")

        assert mock_run.called


def test_main_no_auth() -> None:
    """Test main.py when no auth is set."""
    with patch("os.getenv") as mock_getenv, patch("api.app.create_app"):
        mock_getenv.return_value = None

        if "main" in sys.modules:
            del sys.modules["main"]

        # Just ensure it imports without error
