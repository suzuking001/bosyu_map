(() => {
  window.App = window.App || {};
  const {
    MARKER_STYLE_DEFAULT,
    MARKER_STYLE_FULL,
    MARKER_STYLE_LIMITED,
    MARKER_STYLE_AVAILABLE,
  } = (window.App.config || {});

function parseCount(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/[^\d.-]/g, "");
  if (!normalized) return null;
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

function getRecruitmentCounts(recruitmentRows, selectedAge) {
  if (!recruitmentRows.length) {
    return { recruit: null, apply: null };
  }
  if (selectedAge) {
    const targetAge = Number(selectedAge);
    const row = recruitmentRows.find(item => item.age === targetAge);
    if (!row) {
      return { recruit: null, apply: null };
    }
    return {
      recruit: parseCount(row.recruit),
      apply: parseCount(row.apply),
    };
  }

  let recruitSum = 0;
  let applySum = 0;
  let hasRecruit = false;
  let hasApply = false;
  recruitmentRows.forEach(row => {
    const recruit = parseCount(row.recruit);
    if (recruit != null) {
      recruitSum += recruit;
      hasRecruit = true;
    }
    const apply = parseCount(row.apply);
    if (apply != null) {
      applySum += apply;
      hasApply = true;
    }
  });
  return {
    recruit: hasRecruit ? recruitSum : null,
    apply: hasApply ? applySum : null,
  };
}

function getRecruitmentStatus(recruitCount, applyCount) {
  if (recruitCount == null) {
    return "";
  }
  if (recruitCount <= 0) {
    return "full";
  }
  if (applyCount == null) {
    return "";
  }
  const diff = recruitCount - applyCount;
  if (diff === 1) {
    return "limited";
  }
  return diff > 1 ? "available" : "full";
}

function resolveMarkerStyle(statusValue) {
  if (statusValue === "available") {
    return MARKER_STYLE_AVAILABLE;
  }
  if (statusValue === "limited") {
    return MARKER_STYLE_LIMITED;
  }
  if (statusValue === "full") {
    return MARKER_STYLE_FULL;
  }
  return MARKER_STYLE_DEFAULT;
}

function destinationPoint(lat, lon, distanceMeters, bearingDegrees) {
  const radius = 6378137;
  const bearing = (bearingDegrees * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lon * Math.PI) / 180;
  const angularDistance = distanceMeters / radius;

  const sinLat1 = Math.sin(lat1);
  const cosLat1 = Math.cos(lat1);
  const sinAd = Math.sin(angularDistance);
  const cosAd = Math.cos(angularDistance);

  const lat2 = Math.asin(
    sinLat1 * cosAd + cosLat1 * sinAd * Math.cos(bearing)
  );
  const lon2 = lon1 + Math.atan2(
    Math.sin(bearing) * sinAd * cosLat1,
    cosAd - sinLat1 * Math.sin(lat2)
  );

  return {
    lat: (lat2 * 180) / Math.PI,
    lon: (lon2 * 180) / Math.PI,
  };
}

function createRangeLabel(map, center, radiusMeters, label, className, offsetRatio = 0.97) {
  const point = destinationPoint(center.lat, center.lng, radiusMeters * offsetRatio, 45);
  return L.marker([point.lat, point.lon], { opacity: 0, interactive: false })
    .addTo(map)
    .bindTooltip(label, {
      permanent: true,
      direction: "center",
      className,
    });
}

function getPopupOptions() {
  const width = window.innerWidth || 360;
  const height = window.innerHeight || 640;
  return {
    maxWidth: Math.min(360, Math.max(240, width - 40)),
    maxHeight: Math.floor(height * 0.6),
    autoPan: true,
    keepInView: true,
    autoPanPadding: [16, 16],
    closeButton: true,
  };
}

function isMobileView() {
  return window.matchMedia("(max-width: 768px)").matches;
}

  window.App.mapUtils = {
    parseCount,
    getRecruitmentCounts,
    getRecruitmentStatus,
    resolveMarkerStyle,
    destinationPoint,
    createRangeLabel,
    getPopupOptions,
    isMobileView,
  };
})();
