import re
import time

EMOTION_KEYS = frozenset(
    {"trust", "attachment", "awkwardness", "resentment", "comfort"}
)


def coerce_emotion_value(value):
    """Normalize LLM emotion values to int 0-100."""
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return max(0, min(100, int(round(value))))
    if isinstance(value, str):
        cleaned = value.strip().rstrip("%")
        try:
            return max(0, min(100, int(round(float(cleaned)))))
        except ValueError:
            return None
    if isinstance(value, dict):
        for key in ("new", "value", "score", "level"):
            if key in value:
                return coerce_emotion_value(value[key])
    return None


def compute_emotion_deltas(current_state, updated_emotions):
    deltas = {}
    if not isinstance(updated_emotions, dict):
        return deltas

    for key, raw in updated_emotions.items():
        if key not in EMOTION_KEYS or key not in current_state:
            continue
        new_val = coerce_emotion_value(raw)
        curr_val = coerce_emotion_value(current_state.get(key))
        if new_val is not None and curr_val is not None:
            deltas[key] = new_val - curr_val
    return deltas


def _parse_retry_seconds(error_message):
    match = re.search(r"try again in ([\d.]+)s", str(error_message), re.IGNORECASE)
    if match:
        return float(match.group(1)) + 0.25
    return None


def _is_rate_limit_error(exc):
    msg = str(exc).lower()
    return "429" in msg or "rate_limit" in msg or "rate limit" in msg


def groq_chat_completion(client, *, max_retries=4, **kwargs):
    """Call Groq chat completions with automatic retry on rate limits."""
    last_error = None
    for attempt in range(max_retries):
        try:
            return client.chat.completions.create(**kwargs)
        except Exception as exc:
            last_error = exc
            if not _is_rate_limit_error(exc) or attempt >= max_retries - 1:
                raise
            wait = _parse_retry_seconds(exc) or (2.5 * (attempt + 1))
            print(
                f"Groq rate limit hit, retrying in {wait:.1f}s "
                f"(attempt {attempt + 1}/{max_retries})..."
            )
            time.sleep(wait)
    raise last_error


def truncate_for_analysis(text, max_chars=1200):
    if not text or len(text) <= max_chars:
        return text or ""
    return text[:max_chars] + "\n... [truncated for analysis]"
