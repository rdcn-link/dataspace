"""Recursive navigator for MongoDB ``fileTree`` structures.

Background
----------
Each dataset document in ``scidb_dataseek_filePath`` carries a nested
``fileTree`` dict whose depth is **arbitrary** (no fixed levels).  The
three node shapes are:

1. **Leaf dict**  ``{"filename．csv": "/mnt/real/path.csv"}``
   – a file → realPath mapping.

2. **Directory list**   ``["childA", "childB", ...]``
   – ordered container of children (each child is itself a leaf dict
     or another directory dict, but wrapped as a 1-entry dict whose
     *key* is the subdirectory name).

3. **Directory dict**   ``{"subdir": <directory-list-or-dict>}``
   – a named subdirectory mapping.

All file *names* contain their own full-width Unicode characters (e.g.
``algorithm_detection_202405．csv`` uses U+FF0E full-width dot, not the
ASCII ``.``).  The navigator performs **exact string matching** – no
Unicode normalisation.

Design
------
Three pure-functional entry points (no I/O, no DB dependency):

* :func:`walk_children` – list the *immediate* child names at a tree
  position (used by FUSE ``readdir``).  Returns a mix of subdirectory
  names and file names.
* :func:`resolve_path`  – follow ``segments`` to a leaf and return the
  real absolute path (used by FUSE ``getattr`` / ``open``).
* :func:`tree_to_plain` – flatten the whole tree into a single flat
  ``{virtual_relative_path: real_path}`` mapping.  **O(n) memory,
  call sparingly** – useful for diagnostics but NOT for hot paths.
"""

from __future__ import annotations

from typing import Any, Dict, List, Tuple


# ── Node classification ──────────────────────────────────────────────

def _is_leaf(node: Any) -> bool:
    """A leaf maps filename(s) → realPath string(s)."""
    return (
        isinstance(node, dict)
        and node
        and all(isinstance(k, str) and isinstance(v, str) for k, v in node.items())
    )


def _is_dir_list(node: Any) -> bool:
    return isinstance(node, list)


def _is_dir_dict(node: Any) -> bool:
    """Non-leaf dict whose values are not all str."""
    return isinstance(node, dict) and not _is_leaf(node)


# ── Public API ──────────────────────────────────────────────────────

def walk_children(file_tree: Dict, segments: List[str]) -> List[str]:
    """Return the names of **immediate** children at ``segments``.

    *  If ``segments`` is empty → list *top-level* entries of ``fileTree``.
    *  Each child that is itself a subdirectory (list-wrapped or
       dict-wrapped) contributes its *name* (the key) to the result.
    *  Each leaf dict contributes its *key* (the filename) to the result.

    Raises
    ------
    FileNotFoundError
        If ``segments`` cannot be resolved inside ``fileTree``.
    """
    node = _navigate_to(file_tree, segments)
    children: List[str] = []

    if _is_dir_list(node):
        for child in node:
            children.extend(_extract_child_names(child))
    elif _is_dir_dict(node):
        # node = {"subdir": <child>}
        for key in node.keys():
            children.append(key)
    elif _is_leaf(node):
        # leaf node at this level – treat its keys as filenames
        children.extend(node.keys())
    else:
        raise FileNotFoundError(
            f"unexpected node type at segments={segments!r}: {type(node).__name__}"
        )
    return children


def resolve_path(file_tree: Dict, segments: List[str]) -> str:
    """Follow ``segments`` and return the leaf's *real* path.

    The **last** segment must be a file name (leaf dict key).  All
    preceding segments must resolve to subdirectories.

    Raises :class:`FileNotFoundError` if any segment is missing or if
    the final node is not a leaf.
    """
    if not segments:
        raise FileNotFoundError("empty segments – cannot resolve a file path")

    parent = _navigate_to(file_tree, segments[:-1])
    last = segments[-1]

    # parent is one of: list-wrapped children / dict-wrapped child / leaf
    candidates = _collect_leaves_at(parent)
    if last in candidates:
        return candidates[last]

    # Maybe last is a dict key at this level too
    if isinstance(parent, dict) and isinstance(parent.get(last), str):
        return parent[last]

    raise FileNotFoundError(
        f"leaf {last!r} not found under segments={segments[:-1]!r}"
    )


def classify_children(file_tree: Dict, segments: List[str]) -> List[Tuple[str, bool]]:
    """List immediate children at ``segments`` with **type classification**.

    Returns a list of ``(child_name, is_dir)`` tuples where ``is_dir`` is
    ``True`` for subdirectories and ``False`` for leaf files.  This is
    what FUSE ``readdir`` needs to distinguish nested directories from
    files at the same level.

    Raises :class:`FileNotFoundError` if ``segments`` cannot be resolved.
    """
    node = _navigate_to(file_tree, segments)
    result: List[Tuple[str, bool]] = []

    if _is_dir_list(node):
        for child in node:
            if not isinstance(child, dict):
                continue
            if _is_leaf(child):
                # leaf dict → each key is a file name
                for fname in child.keys():
                    result.append((fname, False))
            else:
                # 1-entry subdir dict → key is the subdir name
                for dname in child.keys():
                    result.append((dname, True))
        return result

    if _is_dir_dict(node):
        for k, v in node.items():
            # If value is a leaf-dict with only str values → it's a file
            if isinstance(v, str):
                result.append((k, False))
            elif isinstance(v, dict) and _is_leaf(v):
                result.append((k, False))
            else:
                result.append((k, True))
        return result

    if _is_leaf(node):
        # leaf at this level – treat keys as file names
        for fname in node.keys():
            result.append((fname, False))
        return result

    raise FileNotFoundError(
        f"unexpected node type at segments={segments!r}: {type(node).__name__}"
    )


def tree_to_plain(file_tree: Dict) -> Dict[str, str]:
    """Flatten the tree into ``{relative_path: real_path}``.

    **Memory warning**: for very large datasets this will be huge –
    call only for diagnostics or one-off operations.
    """
    result: Dict[str, str] = {}
    _flatten("", file_tree, result)
    return result


# ── Internal helpers ────────────────────────────────────────────────

def _navigate_to(file_tree: Dict, segments: List[str]) -> Any:
    """Walk ``segments`` starting from ``file_tree`` and return the
    node at that position (can be list / dict / leaf)."""
    node: Any = file_tree
    for seg in segments:
        node = _enter(node, seg)
    return node


def _enter(node: Any, name: str) -> Any:
    """Descend one level into ``node`` following ``name``.

    Returns the child subtree (list / dict / leaf).  Raises
    :class:`FileNotFoundError` if ``name`` is missing.
    """
    if _is_dir_list(node):
        # Look for a 1-entry dict whose sole key == name, or a leaf
        # whose dict has that name, or a plain dict with that name
        for child in node:
            if isinstance(child, dict):
                if name in child:
                    return child[name]
        # No such child
        raise FileNotFoundError(f"{name!r} not found in list")

    if _is_dir_dict(node):
        if name not in node:
            raise FileNotFoundError(f"{name!r} not found in dict")
        return node[name]

    if _is_leaf(node):
        # leaf nodes are terminals; cannot descend further
        raise FileNotFoundError(f"{name!r} – cannot descend through a leaf")

    raise FileNotFoundError(f"cannot enter {type(node).__name__} with {name!r}")


def _extract_child_names(child: Any) -> Iterable[str]:
    """Given one element from a directory list, yield its visible name(s).

    The shape ``[{subdir_name: <subtree>}]`` contributes ``subdir_name``.
    The shape ``{filename: real_path}`` contributes ``filename``.
    """
    if isinstance(child, dict):
        if _is_leaf(child):
            yield from child.keys()
        else:
            # dict-wrapped subdir
            yield from child.keys()
    # non-dict elements are ignored defensively
    return None


def _collect_leaves_at(node: Any) -> Dict[str, str]:
    """Return ``{filename: real_path}`` for every leaf reachable from
    ``node``, *directly* (one level only, not recursive)."""
    result: Dict[str, str] = {}
    if _is_leaf(node):
        result.update(node)
    elif _is_dir_list(node):
        for child in node:
            if isinstance(child, dict) and _is_leaf(child):
                result.update(child)
    elif _is_dir_dict(node):
        # dict values could be leaves
        for v in node.values():
            if isinstance(v, dict) and _is_leaf(v):
                result.update(v)
    return result


def _flatten(prefix: str, node: Any, out: Dict[str, str]) -> None:
    """Recursive helper for :func:`tree_to_plain`."""
    if _is_leaf(node):
        for fname, real_path in node.items():
            rel = f"{prefix}/{fname}" if prefix else fname
            out[rel] = real_path
        return

    if _is_dir_list(node):
        for child in node:
            if not isinstance(child, dict):
                continue
            # IMPORTANT: list elements can be EITHER a leaf dict
            # (``{"file.csv": "/real/path"}``) OR a 1-entry subdir dict
            # (``{"subdir_name": <subtree>}``).  We **must** check leaf
            # first – the two shapes look identical at first glance.
            if _is_leaf(child):
                for fname, real_path in child.items():
                    rel = f"{prefix}/{fname}" if prefix else fname
                    out[rel] = real_path
            else:
                for k, v in child.items():
                    _flatten(f"{prefix}/{k}" if prefix else k, v, out)
        return

    if _is_dir_dict(node):
        for k, v in node.items():
            _flatten(f"{prefix}/{k}" if prefix else k, v, out)
        return

    # unknown / empty / leaf-handled – no-op
    return None
