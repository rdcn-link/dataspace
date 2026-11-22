# dataset-vfs-v2 – single-purpose FUSE image (connects to MongoDB directly)
#
# No separate metadata-service container needed anymore.  The image is
# intentionally minimal: it installs libfuse2 for the kernel FUSE
# interface, the Python deps from requirements.txt, and copies the
# application source.  Docker Compose configures the privileged flags
# and the MongoDB connection string at runtime.

FROM python:3.12-slim

# ── System deps ────────────────────────────────────────────────────
# libfuse2 is REQUIRED – fusepy talks to /dev/fuse via this userspace lib
RUN apt-get update \
 && apt-get install -y --no-install-recommends fuse libfuse2 \
 && rm -rf /var/lib/apt/lists/* \
 && apt-get clean

# Pre-create the mount point
RUN mkdir -p /mnt/fairspace

# ── Python deps ────────────────────────────────────────────────────
WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# ── Application code ───────────────────────────────────────────────
COPY app/ /app/app/
COPY scripts/ /app/scripts/

# Default command: mount FUSE using env-var configuration
CMD ["python", "-c", "from app.main import run_fuse; run_fuse()"]
