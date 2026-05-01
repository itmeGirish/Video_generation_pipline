"""Configuration loading and management."""

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
import yaml
from pydantic import BaseModel, Field

# Load .env file from project root (won't override existing env vars)
load_dotenv(Path(__file__).parent.parent / ".env")


class VideoConfig(BaseModel):
    """Video output configuration."""

    width: int = 1920
    height: int = 1080
    fps: int = 30
    format: str = "mp4"
    codec: str = "h264"


class LLMConfig(BaseModel):
    """LLM provider configuration."""

    provider: str = "claude-code"
    model: str = os.environ.get("LLM_DEFAULT_MODEL", "claude-sonnet-4-20250514")
    factcheck_model: str = os.environ.get("FACTCHECK_MODEL", "claude-opus-4-5-20251101")
    max_tokens: int = 4096
    temperature: float = 0.7


class ElevenLabsConfig(BaseModel):
    """ElevenLabs-specific TTS configuration."""

    base_url: str = os.environ.get("ELEVENLABS_BASE_URL", "https://api.elevenlabs.io/v1")
    default_voice_id: str = os.environ.get("ELEVENLABS_DEFAULT_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
    stability: float = 0.38       # Lower = more expressive (0.5 was too monotone)
    similarity_boost: float = 0.78  # Slightly higher for consistency
    cost_per_character: float = 0.0003
    request_timeout: float = 60.0
    stream_timeout: float = 60.0
    list_voices_timeout: float = 30.0
    timestamps_timeout: float = 120.0


class TTSConfig(BaseModel):
    """Text-to-speech configuration."""

    provider: str = "elevenlabs"
    voice_id: str | None = None
    model: str = "eleven_multilingual_v2"
    output_format: str = "mp3_44100_128"
    elevenlabs: ElevenLabsConfig = Field(default_factory=ElevenLabsConfig)


class TimeoutsConfig(BaseModel):
    """Timeout configuration for various operations (in seconds)."""

    llm: int = 600
    tts_request: float = 60.0
    tts_stream: float = 60.0
    tts_list_voices: float = 30.0
    tts_timestamps: float = 120.0
    render: int = 600
    scene_generation: int = 300
    refine: int = 600
    narration_refine: int = 300
    factcheck: int = 600
    ffprobe: int = 10
    ffmpeg: int = 60
    screenshot_navigate: int = 20000  # milliseconds for Playwright


class RemotionConfig(BaseModel):
    """Remotion dev server and rendering configuration."""

    dev_url: str = os.environ.get("REMOTION_DEV_URL", "http://localhost:3000")
    default_composition: str = "ScenePlayer"


class SpeechConfig(BaseModel):
    """Speech estimation parameters."""

    words_per_minute: int = 150
    inter_word_gap: float = 0.05
    word_duration_base: float = 0.5
    word_duration_length_factor: float = 0.5
    word_length_reference: int = 6
    voiceover_duration_buffer: float = 0.5


class ThemeConfig(BaseModel):
    """Visual theme configuration for generated scenes."""

    background: str = "#0A0A1A"
    surface: str = "#FFFFFF"
    surface_alt: str = "#F5F5F7"
    text: str = "#1A1A1A"
    text_dim: str = "#555555"
    text_muted: str = "#888888"
    primary: str = "#0066FF"
    primary_glow: str = "#0088FF"
    secondary: str = "#FF6600"
    secondary_glow: str = "#FF8800"
    success: str = "#00AA55"
    warning: str = "#F5A623"
    error: str = "#E53935"
    purple: str = "#8844FF"
    cyan: str = "#00BCD4"
    pink: str = "#E91E63"
    lime: str = "#76B900"
    border: str = "#E0E0E5"
    font_family: str = "Inter"


class BudgetConfig(BaseModel):
    """Budget limits in USD."""

    llm_per_video: float = 50.0
    tts_per_video: float = 10.0
    image_gen_per_video: float = 20.0
    total_per_video: float = 100.0


class PathsConfig(BaseModel):
    """Path configuration."""

    output_dir: str = "output"
    templates_dir: str = "templates"
    animations_dir: str = "animations"


class ReviewConfig(BaseModel):
    """Human review configuration."""

    enabled: bool = True
    checkpoints: list[str] = Field(default_factory=lambda: ["script", "storyboard", "final"])


class Config(BaseModel):
    """Main application configuration."""

    video: VideoConfig = Field(default_factory=VideoConfig)
    llm: LLMConfig = Field(default_factory=LLMConfig)
    tts: TTSConfig = Field(default_factory=TTSConfig)
    budget: BudgetConfig = Field(default_factory=BudgetConfig)
    paths: PathsConfig = Field(default_factory=PathsConfig)
    review: ReviewConfig = Field(default_factory=ReviewConfig)
    timeouts: TimeoutsConfig = Field(default_factory=TimeoutsConfig)
    remotion: RemotionConfig = Field(default_factory=RemotionConfig)
    speech: SpeechConfig = Field(default_factory=SpeechConfig)
    theme: ThemeConfig = Field(default_factory=ThemeConfig)

    @classmethod
    def from_yaml(cls, path: Path | str) -> "Config":
        """Load configuration from a YAML file."""
        path = Path(path)
        if not path.exists():
            return cls()

        with open(path) as f:
            data = yaml.safe_load(f)

        if data is None:
            return cls()

        # Flatten nested resolution config
        if "video" in data and "resolution" in data["video"]:
            res = data["video"].pop("resolution")
            data["video"]["width"] = res.get("width", 1920)
            data["video"]["height"] = res.get("height", 1080)

        return cls(**data)

    def to_yaml(self, path: Path | str) -> None:
        """Save configuration to a YAML file."""
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)

        data = self.model_dump()
        with open(path, "w") as f:
            yaml.dump(data, f, default_flow_style=False)


def load_config(config_path: Path | str | None = None) -> Config:
    """Load configuration from file or use defaults."""
    if config_path is None:
        # Look for config.yaml in current directory or project root
        candidates = [Path("config.yaml"), Path(__file__).parent.parent / "config.yaml"]
        for candidate in candidates:
            if candidate.exists():
                config_path = candidate
                break

    if config_path is not None:
        return Config.from_yaml(config_path)

    return Config()
