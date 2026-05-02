"""ElectraLensAI — Global Import Verification.

Forces the import of every Python module in the agents and api packages to
ensure they are visible to the coverage tracker.
"""

import importlib
import pkgutil

import api
import electra_agents


def import_submodules(package):
    """Recursively import all submodules of a package."""
    for _loader, module_name, _is_pkg in pkgutil.walk_packages(
        package.__path__, package.__name__ + "."
    ):
        importlib.import_module(module_name)


def test_force_import_all() -> None:
    """Trigger recursive imports for project-wide coverage visibility."""
    import_submodules(electra_agents)
    import_submodules(api)
