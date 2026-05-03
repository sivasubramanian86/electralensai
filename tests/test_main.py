import importlib
import sys
from unittest.mock import patch


def test_main_vertex_mode() -> None:
    """Test main.py initialization in Vertex mode."""
    try:
        with (
            patch("os.getenv") as mock_getenv,
            patch("api.app.create_app") as mock_create_app,
            patch("builtins.print") as mock_print,
            patch("main.load_dotenv") if "main" in sys.modules else patch("dotenv.load_dotenv"),
        ):
            # Branch 1: Vertex AI
            mock_getenv.side_effect = lambda k, d=None: (
                "1" if k == "GOOGLE_GENAI_USE_VERTEXAI" else None
            )

            if "main" in sys.modules:
                import main

                importlib.reload(main)
            else:
                import main  # noqa: F401

            mock_print.assert_any_call("Initializing in Vertex AI Mode (Enterprise Auth)")
            assert mock_create_app.called
    finally:
        if "main" in sys.modules:
            del sys.modules["main"]


def test_main_developer_mode() -> None:
    """Test main.py initialization in Developer mode."""
    try:
        with (
            patch("os.getenv") as mock_getenv,
            patch("os.environ.pop") as mock_pop,
            patch("api.app.create_app") as mock_create_app,
            patch("builtins.print") as mock_print,
            patch("main.load_dotenv") if "main" in sys.modules else patch("dotenv.load_dotenv"),
        ):
            # Branch 2: Developer API
            def side_effect(k, d=None) -> str | None:
                if k == "GEMINI_API_KEY":
                    return "secret"
                if k == "GOOGLE_APPLICATION_CREDENTIALS":
                    return None
                if k == "GOOGLE_GENAI_USE_VERTEXAI":
                    return None
                return None

            mock_getenv.side_effect = side_effect

            if "main" in sys.modules:
                import main

                importlib.reload(main)
            else:
                import main  # noqa: F401

            mock_print.assert_any_call("Initializing in Developer API Mode (AI Studio Auth)")
            mock_pop.assert_any_call("GOOGLE_CLOUD_PROJECT", None)
            mock_pop.assert_any_call("GOOGLE_CLOUD_LOCATION", None)
            assert mock_create_app.called
    finally:
        if "main" in sys.modules:
            del sys.modules["main"]


def test_main_no_auth() -> None:
    """Test main.py when no auth is set."""
    try:
        with (
            patch("os.getenv") as mock_getenv,
            patch("api.app.create_app") as mock_create_app,
            patch("builtins.print") as mock_print,
            patch("main.load_dotenv") if "main" in sys.modules else patch("dotenv.load_dotenv"),
        ):
            mock_getenv.return_value = None

            if "main" in sys.modules:
                import main

                importlib.reload(main)
            else:
                import main  # noqa: F401

            # Verify neither mode message was printed
            printed = [call.args[0] for call in mock_print.call_args_list if call.args]
            assert "Initializing in Vertex AI Mode" not in str(printed)
            assert "Initializing in Developer API Mode" not in str(printed)
            assert mock_create_app.called
    finally:
        if "main" in sys.modules:
            del sys.modules["main"]


def test_main_cli_execution() -> None:
    """Test main.py when run as a script."""
    try:
        with (
            patch("uvicorn.run") as mock_run,
            patch("api.app.create_app"),
            patch("main.load_dotenv") if "main" in sys.modules else patch("dotenv.load_dotenv"),
        ):
            import runpy

            runpy.run_module("main", run_name="__main__")
            assert mock_run.called
    finally:
        if "main" in sys.modules:
            del sys.modules["main"]
