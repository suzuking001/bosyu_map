(() => {
  window.App = window.App || {};
  const { escapeHtml } = window.App.utils || {};
  const { getRecruitmentCounts, getRecruitmentStatus, parseCount } =
    window.App.mapUtils || {};

function formatCount(value) {
  const trimmed = String(value || "").trim();
  return trimmed ? escapeHtml(trimmed) : "-";
}

function buildRecruitmentTable(rows) {
  if (!rows.length) {
    return '<div class="empty">募集人数・申込人数の情報がありません。</div>';
  }

  const headerCells = [
    "<th>年齢</th>",
    "<th>募集人数</th>",
    "<th>申込人数</th>",
    "<th>状況</th>",
  ].join("");

  const bodyRows = rows
    .map(row => {
      const status = getRecruitmentStatus(parseCount(row.recruit), parseCount(row.apply));
      const statusLabel = status === "available"
        ? "空きあり"
        : status === "limited"
          ? "空き1"
          : status === "full"
            ? "空きなし/募集なし"
            : "情報なし";
      return `
      <tr>
        <td>${escapeHtml(String(row.age))}歳</td>
        <td>${formatCount(row.recruit)}</td>
        <td>${formatCount(row.apply)}</td>
        <td>${statusLabel}</td>
      </tr>
    `;
    })
    .join("");

  return `
    <div class="availability-wrap">
      <table>
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  `;
}

function buildSummaryHtml(recruitmentRows, selectedAge) {
  const { recruit, apply } = getRecruitmentCounts(recruitmentRows, selectedAge);
  if (recruit == null && apply == null) {
    return '<span class="label-empty">情報なし</span>';
  }
  const ageLabel = selectedAge ? `${selectedAge}歳` : "合計";
  const recruitLabel = recruit == null ? "-" : String(recruit);
  const applyLabel = apply == null ? "-" : String(apply);
  return `<span>${escapeHtml(ageLabel)} 募集:${escapeHtml(recruitLabel)} 申込:${escapeHtml(applyLabel)}</span>`;
}

function buildTooltipHtml(facility, recruitmentRows, selectedAge) {
  const name = escapeHtml(facility.name || "名称不明");
  const summaryHtml = buildSummaryHtml(recruitmentRows, selectedAge);
  return `
    <div class="label-title">${name}</div>
    <div class="label-status">${summaryHtml}</div>
  `;
}

function buildPopupHtml(facility, recruitmentRows, selectedAge) {
  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    `${facility.lat},${facility.lon}`
  )}`;
  const phoneRaw = String(facility.phone || "").trim();
  const phoneDigits = phoneRaw.replace(/[^\d+]/g, "");
  const phoneLabel = phoneRaw ? `電話をかける: ${escapeHtml(phoneRaw)}` : "電話をかける";
  const phoneLink = phoneDigits
    ? `<a class="popup-link" href="tel:${escapeHtml(phoneDigits)}">${phoneLabel}</a>`
    : "";
  const rawWebsite = String(facility.website || "").trim();
  const websiteUrl = rawWebsite
    ? (rawWebsite.startsWith("http://") || rawWebsite.startsWith("https://")
      ? rawWebsite
      : `https://${rawWebsite}`)
    : "";
  const websiteLink = websiteUrl
    ? `<a class="popup-link" href="${escapeHtml(websiteUrl)}" target="_blank" rel="noopener">公式サイトを開く</a>`
    : "";
  const summaryText = buildSummaryHtml(recruitmentRows, selectedAge);
  const metaLines = [
    facility.address && `所在地: ${escapeHtml(facility.address)}`,
    facility.phone && `電話番号: ${escapeHtml(facility.phone)}`,
    facility.operator && `設置主体: ${escapeHtml(facility.operator)}`,
    facility.capacity && `定員: ${escapeHtml(facility.capacity)}`,
    facility.type && `事業種別: ${escapeHtml(facility.type)}`,
    facility.days && `利用できる曜日: ${escapeHtml(facility.days)}`,
    (facility.timeStart || facility.timeEnd) &&
      `利用可能時間: ${escapeHtml(facility.timeStart || "")} ～ ${escapeHtml(facility.timeEnd || "")}`,
    (facility.openTime || facility.closeTime) &&
      `開所時間: ${escapeHtml(facility.openTime || "")} ～ ${escapeHtml(facility.closeTime || "")}`,
    (facility.standardStart || facility.standardEnd) &&
      `保育標準時間: ${escapeHtml(facility.standardStart || "")} ～ ${escapeHtml(facility.standardEnd || "")}`,
    (facility.shortStart || facility.shortEnd) &&
      `保育短時間: ${escapeHtml(facility.shortStart || "")} ～ ${escapeHtml(facility.shortEnd || "")}`,
    facility.ages && `対象年齢: ${escapeHtml(facility.ages)}`,
    facility.reserveStart && `予約開始目安: ${escapeHtml(facility.reserveStart)}`,
    facility.fee && `利用料・免除基準: ${escapeHtml(facility.fee)}`,
    facility.notes && `備考: ${escapeHtml(facility.notes)}`,
    facility.recruitMonth && `募集・申込の該当月: ${escapeHtml(facility.recruitMonth)}`,
    facility.applyDate && `申込数集計日: ${escapeHtml(facility.applyDate)}`,
    summaryText && `募集・申込の概要: ${summaryText}`,
  ]
    .filter(Boolean)
    .map(line => `<div class="meta">${line}</div>`)
    .join("");

  return `
        <div class="popup">
          <div class="title">${escapeHtml(facility.name || "名称不明")}</div>
          <div class="meta">施設No.: ${escapeHtml(facility.noRaw || facility.no)}</div>
          ${metaLines}
          <div class="section popup-actions">
            <a class="popup-link" href="${mapsUrl}" target="_blank" rel="noopener">Google Mapで開く</a>
            ${phoneLink}
            ${websiteLink}
          </div>
          <div class="section">
            ${buildRecruitmentTable(recruitmentRows)}
          </div>
        </div>
      `;
}

  window.App.availability = {
    buildRecruitmentTable,
    buildSummaryHtml,
    buildTooltipHtml,
    buildPopupHtml,
  };
})();
