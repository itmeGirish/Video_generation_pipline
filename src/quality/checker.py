"""YouTube-ready quality checker for generated videos.

Validates that a rendered video meets YouTube production standards:
- Resolution and aspect ratio
- Audio loudness (LUFS)
- Frame rate
- File format and codec
- Duration sanity check
"""

import json
import subprocess
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class QualityIssue:
    """A quality issue found during checking."""

    category: str  # "video", "audio", "format", "content"
    severity: str  # "error", "warning", "info"
    message: str
    metric: str = ""
    value: str = ""
    target: str = ""


@dataclass
class QualityReport:
    """Full quality report for a video."""

    passed: bool = True
    score: int = 100  # 0-100
    issues: list[QualityIssue] = field(default_factory=list)
    metrics: dict = field(default_factory=dict)

    def add_issue(self, issue: QualityIssue) -> None:
        self.issues.append(issue)
        if issue.severity == "error":
            self.passed = False
            self.score -= 15
        elif issue.severity == "warning":
            self.score -= 5
        self.score = max(0, self.score)


class YouTubeQualityChecker:
    """Check if a video meets YouTube production standards."""

    # YouTube recommended specs
    YOUTUBE_SPECS = {
        "min_width": 1920,
        "min_height": 1080,
        "aspect_ratio": 16 / 9,
        "min_fps": 24,
        "recommended_fps": 30,
        "audio_sample_rate": 48000,
        "audio_channels": 2,
        "target_lufs": -14,  # YouTube loudness target
        "lufs_tolerance": 3,  # +/- 3 LUFS
        "max_true_peak": -1,  # dBTP
        "min_audio_bitrate": 128000,
        "recommended_audio_bitrate": 256000,
        "min_duration": 10,  # seconds
        "max_duration": 43200,  # 12 hours
    }

    def check(self, video_path: Path) -> QualityReport:
        """Run all quality checks on a video file.

        Args:
            video_path: Path to the video file

        Returns:
            QualityReport with all findings
        """
        report = QualityReport()
        video_path = Path(video_path)

        if not video_path.exists():
            report.add_issue(QualityIssue(
                category="format", severity="error",
                message=f"Video file not found: {video_path}",
            ))
            return report

        # Get video metadata via ffprobe
        metadata = self._get_metadata(video_path)
        if not metadata:
            report.add_issue(QualityIssue(
                category="format", severity="error",
                message="Could not read video metadata with ffprobe",
            ))
            return report

        report.metrics = metadata

        # Check video stream
        self._check_video(metadata, report)

        # Check audio stream
        self._check_audio(metadata, report)

        # Check format
        self._check_format(metadata, report)

        # Check loudness (requires processing the whole file)
        self._check_loudness(video_path, report)

        return report

    def _get_metadata(self, video_path: Path) -> dict | None:
        """Extract video metadata using ffprobe."""
        cmd = [
            "ffprobe", "-v", "quiet",
            "-print_format", "json",
            "-show_format", "-show_streams",
            str(video_path),
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode != 0:
                return None
            return json.loads(result.stdout)
        except (subprocess.TimeoutExpired, json.JSONDecodeError):
            return None

    def _check_video(self, metadata: dict, report: QualityReport) -> None:
        """Check video stream quality."""
        video_stream = None
        for stream in metadata.get("streams", []):
            if stream.get("codec_type") == "video":
                video_stream = stream
                break

        if not video_stream:
            report.add_issue(QualityIssue(
                category="video", severity="error",
                message="No video stream found",
            ))
            return

        # Resolution
        width = int(video_stream.get("width", 0))
        height = int(video_stream.get("height", 0))
        specs = self.YOUTUBE_SPECS

        if width < specs["min_width"] or height < specs["min_height"]:
            report.add_issue(QualityIssue(
                category="video", severity="warning",
                message=f"Resolution {width}x{height} is below YouTube recommended {specs['min_width']}x{specs['min_height']}",
                metric="resolution", value=f"{width}x{height}", target=f"{specs['min_width']}x{specs['min_height']}",
            ))

        # Aspect ratio
        if height > 0:
            aspect = width / height
            if abs(aspect - specs["aspect_ratio"]) > 0.1:
                report.add_issue(QualityIssue(
                    category="video", severity="info",
                    message=f"Aspect ratio {aspect:.2f} differs from 16:9 ({specs['aspect_ratio']:.2f})",
                    metric="aspect_ratio", value=f"{aspect:.2f}", target="1.78",
                ))

        # Frame rate
        fps_str = video_stream.get("r_frame_rate", "0/1")
        try:
            num, den = fps_str.split("/")
            fps = int(num) / int(den) if int(den) > 0 else 0
        except (ValueError, ZeroDivisionError):
            fps = 0

        if fps < specs["min_fps"]:
            report.add_issue(QualityIssue(
                category="video", severity="error",
                message=f"Frame rate {fps:.1f} fps is below minimum {specs['min_fps']} fps",
                metric="fps", value=f"{fps:.1f}", target=str(specs["min_fps"]),
            ))
        elif fps < specs["recommended_fps"]:
            report.add_issue(QualityIssue(
                category="video", severity="warning",
                message=f"Frame rate {fps:.1f} fps is below recommended {specs['recommended_fps']} fps",
                metric="fps", value=f"{fps:.1f}", target=str(specs["recommended_fps"]),
            ))

        # Codec
        codec = video_stream.get("codec_name", "unknown")
        if codec not in ("h264", "hevc", "h265", "vp9", "av1"):
            report.add_issue(QualityIssue(
                category="video", severity="warning",
                message=f"Codec '{codec}' may not be optimal for YouTube (recommend h264/h265)",
                metric="codec", value=codec, target="h264/h265",
            ))

    def _check_audio(self, metadata: dict, report: QualityReport) -> None:
        """Check audio stream quality."""
        audio_stream = None
        for stream in metadata.get("streams", []):
            if stream.get("codec_type") == "audio":
                audio_stream = stream
                break

        if not audio_stream:
            report.add_issue(QualityIssue(
                category="audio", severity="error",
                message="No audio stream found",
            ))
            return

        specs = self.YOUTUBE_SPECS

        # Sample rate
        sample_rate = int(audio_stream.get("sample_rate", 0))
        if sample_rate < specs["audio_sample_rate"]:
            report.add_issue(QualityIssue(
                category="audio", severity="warning",
                message=f"Sample rate {sample_rate}Hz is below recommended {specs['audio_sample_rate']}Hz",
                metric="sample_rate", value=str(sample_rate), target=str(specs["audio_sample_rate"]),
            ))

        # Channels
        channels = int(audio_stream.get("channels", 0))
        if channels < specs["audio_channels"]:
            report.add_issue(QualityIssue(
                category="audio", severity="warning",
                message=f"Audio has {channels} channel(s), YouTube recommends stereo ({specs['audio_channels']})",
                metric="channels", value=str(channels), target=str(specs["audio_channels"]),
            ))

        # Bitrate
        bitrate = int(audio_stream.get("bit_rate", 0))
        if bitrate > 0 and bitrate < specs["min_audio_bitrate"]:
            report.add_issue(QualityIssue(
                category="audio", severity="warning",
                message=f"Audio bitrate {bitrate // 1000}kbps is below recommended {specs['recommended_audio_bitrate'] // 1000}kbps",
                metric="audio_bitrate", value=f"{bitrate // 1000}kbps",
                target=f"{specs['recommended_audio_bitrate'] // 1000}kbps",
            ))

    def _check_format(self, metadata: dict, report: QualityReport) -> None:
        """Check container format."""
        fmt = metadata.get("format", {})
        format_name = fmt.get("format_name", "unknown")

        if "mp4" not in format_name and "mov" not in format_name:
            report.add_issue(QualityIssue(
                category="format", severity="warning",
                message=f"Format '{format_name}' may not be optimal (recommend mp4)",
                metric="format", value=format_name, target="mp4",
            ))

        # Duration
        duration = float(fmt.get("duration", 0))
        specs = self.YOUTUBE_SPECS
        if duration < specs["min_duration"]:
            report.add_issue(QualityIssue(
                category="format", severity="warning",
                message=f"Duration {duration:.1f}s is very short",
                metric="duration", value=f"{duration:.1f}s", target=f">{specs['min_duration']}s",
            ))

    def _check_loudness(self, video_path: Path, report: QualityReport) -> None:
        """Check audio loudness using ffmpeg loudnorm filter."""
        cmd = [
            "ffmpeg", "-i", str(video_path),
            "-af", "loudnorm=print_format=json",
            "-f", "null", "-",
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            # loudnorm outputs JSON to stderr
            stderr = result.stderr
            # Find the JSON block in stderr
            json_start = stderr.rfind("{")
            json_end = stderr.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                loudness_data = json.loads(stderr[json_start:json_end])
                integrated_lufs = float(loudness_data.get("input_i", "-99"))
                true_peak = float(loudness_data.get("input_tp", "0"))

                report.metrics["loudness_lufs"] = integrated_lufs
                report.metrics["true_peak_dbtp"] = true_peak

                specs = self.YOUTUBE_SPECS
                target = specs["target_lufs"]
                tolerance = specs["lufs_tolerance"]

                if integrated_lufs < target - tolerance:
                    report.add_issue(QualityIssue(
                        category="audio", severity="warning",
                        message=f"Audio is too quiet: {integrated_lufs:.1f} LUFS (target: {target} LUFS +/- {tolerance})",
                        metric="loudness", value=f"{integrated_lufs:.1f} LUFS", target=f"{target} LUFS",
                    ))
                elif integrated_lufs > target + tolerance:
                    report.add_issue(QualityIssue(
                        category="audio", severity="warning",
                        message=f"Audio is too loud: {integrated_lufs:.1f} LUFS (target: {target} LUFS +/- {tolerance})",
                        metric="loudness", value=f"{integrated_lufs:.1f} LUFS", target=f"{target} LUFS",
                    ))

                if true_peak > specs["max_true_peak"]:
                    report.add_issue(QualityIssue(
                        category="audio", severity="warning",
                        message=f"True peak {true_peak:.1f} dBTP exceeds limit ({specs['max_true_peak']} dBTP)",
                        metric="true_peak", value=f"{true_peak:.1f} dBTP", target=f"{specs['max_true_peak']} dBTP",
                    ))
        except (subprocess.TimeoutExpired, json.JSONDecodeError, ValueError):
            report.add_issue(QualityIssue(
                category="audio", severity="info",
                message="Could not measure loudness (ffmpeg loudnorm failed)",
            ))


def check_video_quality(video_path: str | Path) -> QualityReport:
    """Convenience function to check a video's YouTube readiness.

    Args:
        video_path: Path to the video file

    Returns:
        QualityReport with score and issues
    """
    checker = YouTubeQualityChecker()
    return checker.check(Path(video_path))
