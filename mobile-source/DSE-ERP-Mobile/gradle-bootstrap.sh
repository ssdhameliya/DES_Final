#!/usr/bin/env sh
set -eu
VERSION="9.5.0"
CACHE_ROOT="${HOME}/.dse-erp-mobile/gradle/${VERSION}"
DIST_DIR="${CACHE_ROOT}/gradle-${VERSION}"
ZIP_FILE="${CACHE_ROOT}/gradle-${VERSION}-bin.zip"
URL="https://services.gradle.org/distributions/gradle-${VERSION}-bin.zip"

if [ ! -x "${DIST_DIR}/bin/gradle" ]; then
  mkdir -p "${CACHE_ROOT}"
  if [ ! -f "${ZIP_FILE}" ]; then
    echo "Downloading Gradle ${VERSION}..."
    curl -fL "${URL}" -o "${ZIP_FILE}"
  fi
  rm -rf "${DIST_DIR}"
  unzip -q "${ZIP_FILE}" -d "${CACHE_ROOT}"
fi

exec "${DIST_DIR}/bin/gradle" "$@"
