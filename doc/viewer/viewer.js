const STUDIES = {
  "20250305141211": {
    label: "Mar 5, 2025",
    series: {
      "SN-0001": { count: 1, first: 1, description: "CT Localizer" },
      "SN-0002": { count: 125, first: 1, description: "CE Axial 5.0" },
      "SN-0003": { count: 70, first: 1, description: "CE Axial 5.0" },
      "SN-0004": { count: 101, first: 1, description: "CE Axial 5.0" },
      "SN-30000": { count: 1, first: 1, description: "Summary" },
      "SN-9000": { count: 4, first: 1, description: "Report Image" },
    },
  },
  "20240905180436": {
    label: "Sep 5, 2024",
    series: {
      "SN-13001": { count: 2, first: 13001, description: "Reference Image" },
    },
  },
  "20240514153719": {
    label: "May 14, 2024",
    series: {
      "ct-abdomen-c4kc-kits-series": { count: 101, first: 1, filePrefix: "instance-", digits: 4, description: "CT Abdomen C4KC/KiTS" },
      "ct-chest-lidc-idri-series": { count: 250, first: 1, filePrefix: "instance-", digits: 4, description: "CT Chest LIDC-IDRI" },
      "ct-lung-screening-nlst-series": { count: 150, first: 1, filePrefix: "instance-", digits: 4, description: "CT Lung Screening NLST" },
      "ct-pancreas-pancreas-ct-series": { count: 218, first: 1, filePrefix: "instance-", digits: 4, description: "CT Pancreas" },
    },
  },
  "20240514133325": {
    label: "May 14, 2024",
    series: {
      "SN-0001": { count: 43, first: 1, description: "CT Series" },
    },
  },
  "20240425123158": {
    label: "Apr 25, 2024",
    series: {
      "SN-1001": { count: 3, first: 1001, description: "Scout / Reference" },
    },
  },
};

const DEFAULT_TIMEPOINTS = [
  { id: "t0", date: "2024-06-24", name: "登録時", win: "[-4w,+0w]", phase: "e" },
  { id: "t1", date: "2024-08-19", name: "治療開始後8w", win: "[-2w,+2w]", phase: "t" },
  { id: "t2", date: "2024-10-14", name: "治療開始後16w", win: "[-2w,+2w]", phase: "t" },
  { id: "t3", date: "2024-12-09", name: "治療開始後24w", win: "[-2w,+2w]", phase: "t" },
  { id: "t4", date: "2025-02-03", name: "治療開始後32w", win: "[-2w,+2w]", phase: "t" },
  { id: "t5", date: "2025-03-31", name: "治療開始後40w", win: "[-2w,+2w]", phase: "t" },
  { id: "t6", date: "2025-06-26", name: "増悪時", win: "[-2w,+2w]", phase: "t" },
  { id: "t7", date: "2025-07-21", name: "治療開始後56w", win: "[-2w,+2w]", phase: "f" },
];

const EXAM_TYPES = ["PET-CT", "CT", "MRI", "コンピュータX線撮影", "内視鏡検査"];
const TIMEPOINT_STUDIES = {
  CT: {
    t0: { study: "20240514153719", series: "ct-chest-lidc-idri-series" },
    t3: { study: "20240514153719", series: "ct-lung-screening-nlst-series" },
    t6: { study: "20240514153719", series: "ct-abdomen-c4kc-kits-series" },
    t7: { study: "20240514153719", series: "ct-pancreas-pancreas-ct-series" },
  },
};

let timepoints = DEFAULT_TIMEPOINTS;
const params = new URLSearchParams(location.search);

const state = {
  examType: params.get("exam") || "CT",
  timepoint: params.get("timepoint") || "t0",
  study: params.get("study") || "20240514153719",
  series: params.get("series") || "ct-chest-lidc-idri-series",
  index: 0,
  cache: new Map(),
  localFiles: [],
  localSeriesFiles: new Map(),
  localMode: false,
  renderSeq: 0,
  center: 40,
  width: 400,
  scale: 1,
  panX: 0,
  panY: 0,
  dragging: false,
  dragMode: "window",
  lastX: 0,
  lastY: 0,
};

const els = {
  canvas: document.getElementById("dicomCanvas"),
  wrap: document.getElementById("canvasWrap"),
  loading: document.getElementById("loading"),
  slider: document.getElementById("sliceSlider"),
  sliceCount: document.getElementById("sliceCount"),
  patientSelect: document.getElementById("patientSelect"),
  examTypeSelect: document.getElementById("examTypeSelect"),
  timepointSelect: document.getElementById("timepointSelect"),
  seriesSectionTitle: document.getElementById("seriesSectionTitle"),
  centerInput: document.getElementById("centerInput"),
  widthInput: document.getElementById("widthInput"),
  resetBtn: document.getElementById("resetBtn"),
  localOpenBtn: document.getElementById("localOpenBtn"),
  localFileInput: document.getElementById("localFileInput"),
  seriesList: document.getElementById("seriesList"),
  patientValue: document.getElementById("patientValue"),
  seriesValue: document.getElementById("seriesValue"),
  modalityValue: document.getElementById("modalityValue"),
  imageValue: document.getElementById("imageValue"),
  pixelValue: document.getElementById("pixelValue"),
  thicknessValue: document.getElementById("thicknessValue"),
  locationValue: document.getElementById("locationValue"),
  timeValue: document.getElementById("timeValue"),
  transferValue: document.getElementById("transferValue"),
  overlayLeft: document.getElementById("overlayLeft"),
  overlayRight: document.getElementById("overlayRight"),
  overlayBottom: document.getElementById("overlayBottom"),
  viewportSeriesTitle: document.getElementById("viewportSeriesTitle"),
  tagSummary: document.getElementById("tagSummary"),
  toolDrawer: document.getElementById("toolDrawer"),
  toolDrawerTitle: document.getElementById("toolDrawerTitle"),
  toolDrawerBody: document.getElementById("toolDrawerBody"),
  toolDrawerClose: document.getElementById("toolDrawerClose"),
};
const ctx = els.canvas.getContext("2d", { willReadFrequently: true });

async function loadTimepointsFromIndex() {
  try {
    const response = await fetch("../index.html", { cache: "no-store" });
    if (!response.ok) throw new Error("index.html not found");
    const html = await response.text();
    const matches = [...html.matchAll(/\{\s*id:'([^']+)'\s*,\s*date:'([^']+)'\s*,\s*name:'([^']+)'\s*,\s*win:'([^']+)'\s*,\s*phase:'([^']+)'\s*\}/g)];
    const parsed = matches.map((match) => ({
      id: match[1],
      date: match[2],
      name: match[3],
      win: match[4],
      phase: match[5],
    }));
    if (parsed.length) timepoints = parsed;
  } catch {
    timepoints = DEFAULT_TIMEPOINTS;
  }
}

function timepointOptionText(tp) {
  return `${tp.name} / ${tp.date}`;
}

function currentTimepoint() {
  return timepoints.find((tp) => tp.id === state.timepoint) || timepoints[0];
}

function currentStudySelection() {
  return TIMEPOINT_STUDIES[state.examType]?.[state.timepoint] || null;
}

function updateUrl() {
  if (location.protocol === "file:") return;
  const query = new URLSearchParams({
    exam: state.examType,
    timepoint: state.timepoint,
    study: state.study,
    series: state.series,
  });
  history.replaceState(null, "", `?${query.toString()}`);
}

function currentSeriesMap() {
  return STUDIES[state.study]?.series || {};
}

function currentSeriesInfo(series = state.series) {
  return currentSeriesMap()[series];
}

function seriesUrl(series, index) {
  const info = currentSeriesInfo(series) || { first: 1 };
  const fileNumber = (info.first || 1) + index;
  const prefix = info.filePrefix || "IN-";
  const digits = info.digits || 5;
  const file = `${prefix}${String(fileNumber).padStart(digits, "0")}.dcm`;
  return `/M30011111/${state.study}/${series}/${file}`;
}

function showNotice(message) {
  els.loading.className = "loading notice";
  els.loading.textContent = message;
}

function textValue(bytes, offset, length) {
  return new TextDecoder("latin1").decode(bytes.subarray(offset, offset + length)).replace(/\0/g, "").trim();
}

function tagKey(group, element) {
  return group.toString(16).padStart(4, "0").toUpperCase() + element.toString(16).padStart(4, "0").toUpperCase();
}

function numericText(value, fallback) {
  if (!value) return fallback;
  const first = String(value).split("\\")[0];
  const n = Number(first);
  return Number.isFinite(n) ? n : fallback;
}

function formatDicomDate(value) {
  if (!value || value.length < 8) return "-";
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function formatDicomTime(value) {
  if (!value || value.length < 6) return "-";
  return `${value.slice(0, 2)}:${value.slice(2, 4)}:${value.slice(4, 6)}`;
}

function findImplicitTag(bytes, view, group, element) {
  const pattern = [group & 255, group >> 8, element & 255, element >> 8];
  for (let i = 132; i < bytes.length - 8; i++) {
    if (
      bytes[i] === pattern[0] &&
      bytes[i + 1] === pattern[1] &&
      bytes[i + 2] === pattern[2] &&
      bytes[i + 3] === pattern[3]
    ) {
      const length = view.getUint32(i + 4, true);
      const valueOffset = i + 8;
      if (length !== 0xffffffff && valueOffset + length <= bytes.length) {
        return { offset: valueOffset, length };
      }
    }
  }
  return null;
}

function readImplicitText(bytes, view, group, element) {
  const found = findImplicitTag(bytes, view, group, element);
  return found ? textValue(bytes, found.offset, found.length) : "";
}

function readImplicitUint16(bytes, view, group, element) {
  const found = findImplicitTag(bytes, view, group, element);
  return found && found.length >= 2 ? view.getUint16(found.offset, true) : undefined;
}

function parseDicom(buffer) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const meta = {};
  let offset = 132;
  const longVR = new Set(["OB", "OD", "OF", "OL", "OW", "SQ", "UC", "UR", "UT", "UN"]);

  while (offset + 8 <= bytes.length) {
    const group = view.getUint16(offset, true);
    const element = view.getUint16(offset + 2, true);
    if (group !== 0x0002) break;
    offset += 4;
    const vr = textValue(bytes, offset, 2);
    offset += 2;
    let length;
    if (longVR.has(vr)) {
      offset += 2;
      length = view.getUint32(offset, true);
      offset += 4;
    } else {
      length = view.getUint16(offset, true);
      offset += 2;
    }
    const key = tagKey(group, element);
    if (key === "00020010") meta.transferSyntax = textValue(bytes, offset, length);
    offset += length + (length % 2);
  }

  const explicit = meta.transferSyntax !== "1.2.840.10008.1.2";
  let pixelOffset = -1;

  while (offset + 8 <= bytes.length) {
    const group = view.getUint16(offset, true);
    const element = view.getUint16(offset + 2, true);
    offset += 4;
    const key = tagKey(group, element);
    let length;

    if (explicit) {
      const vr = textValue(bytes, offset, 2);
      offset += 2;
      if (longVR.has(vr)) {
        offset += 2;
        length = view.getUint32(offset, true);
        offset += 4;
      } else {
        length = view.getUint16(offset, true);
        offset += 2;
      }
    } else {
      length = view.getUint32(offset, true);
      offset += 4;
    }

    if (length === 0xffffffff || offset + length > bytes.length) break;
    switch (key) {
      case "00100010": meta.patientName = textValue(bytes, offset, length); break;
      case "00100020": meta.patientId = textValue(bytes, offset, length); break;
      case "00080060": meta.modality = textValue(bytes, offset, length); break;
      case "00080008": meta.imageType = textValue(bytes, offset, length); break;
      case "00080020": meta.studyDate = textValue(bytes, offset, length); break;
      case "00080030": meta.studyTime = textValue(bytes, offset, length); break;
      case "00080022": meta.acquisitionDate = textValue(bytes, offset, length); break;
      case "00080032": meta.acquisitionTime = textValue(bytes, offset, length); break;
      case "0008103E": meta.seriesDescription = textValue(bytes, offset, length); break;
      case "00200011": meta.seriesNumber = textValue(bytes, offset, length); break;
      case "00200013": meta.instanceNumber = textValue(bytes, offset, length); break;
      case "00280010": meta.rows = view.getUint16(offset, true); break;
      case "00280011": meta.cols = view.getUint16(offset, true); break;
      case "00280030": meta.pixelSpacing = textValue(bytes, offset, length); break;
      case "00180050": meta.sliceThickness = textValue(bytes, offset, length); break;
      case "00180015": meta.bodyPart = textValue(bytes, offset, length); break;
      case "00180060": meta.kvp = textValue(bytes, offset, length); break;
      case "00181151": meta.tubeCurrent = textValue(bytes, offset, length); break;
      case "00181210": meta.kernel = textValue(bytes, offset, length); break;
      case "00189345": meta.ctdi = textValue(bytes, offset, length); break;
      case "00200032": meta.imagePosition = textValue(bytes, offset, length); break;
      case "00201041": meta.sliceLocation = textValue(bytes, offset, length); break;
      case "00280100": meta.bitsAllocated = view.getUint16(offset, true); break;
      case "00280103": meta.pixelRepresentation = view.getUint16(offset, true); break;
      case "00281050": meta.windowCenter = textValue(bytes, offset, length); break;
      case "00281051": meta.windowWidth = textValue(bytes, offset, length); break;
      case "00281052": meta.rescaleIntercept = textValue(bytes, offset, length); break;
      case "00281053": meta.rescaleSlope = textValue(bytes, offset, length); break;
      case "7FE00010":
        pixelOffset = offset;
        offset = bytes.length;
        break;
    }
    offset += length + (length % 2);
  }

  if (!meta.rows) meta.rows = readImplicitUint16(bytes, view, 0x0028, 0x0010);
  if (!meta.cols) meta.cols = readImplicitUint16(bytes, view, 0x0028, 0x0011);
  if (!meta.bitsAllocated) meta.bitsAllocated = readImplicitUint16(bytes, view, 0x0028, 0x0100);
  if (meta.pixelRepresentation === undefined) meta.pixelRepresentation = readImplicitUint16(bytes, view, 0x0028, 0x0103) || 0;
  if (!meta.patientName) meta.patientName = readImplicitText(bytes, view, 0x0010, 0x0010);
  if (!meta.patientId) meta.patientId = readImplicitText(bytes, view, 0x0010, 0x0020);
  if (!meta.modality) meta.modality = readImplicitText(bytes, view, 0x0008, 0x0060);
  if (!meta.imageType) meta.imageType = readImplicitText(bytes, view, 0x0008, 0x0008);
  if (!meta.studyDate) meta.studyDate = readImplicitText(bytes, view, 0x0008, 0x0020);
  if (!meta.studyTime) meta.studyTime = readImplicitText(bytes, view, 0x0008, 0x0030);
  if (!meta.acquisitionDate) meta.acquisitionDate = readImplicitText(bytes, view, 0x0008, 0x0022);
  if (!meta.acquisitionTime) meta.acquisitionTime = readImplicitText(bytes, view, 0x0008, 0x0032);
  if (!meta.seriesDescription) meta.seriesDescription = readImplicitText(bytes, view, 0x0008, 0x103e);
  if (!meta.seriesNumber) meta.seriesNumber = readImplicitText(bytes, view, 0x0020, 0x0011);
  if (!meta.pixelSpacing) meta.pixelSpacing = readImplicitText(bytes, view, 0x0028, 0x0030);
  if (!meta.sliceThickness) meta.sliceThickness = readImplicitText(bytes, view, 0x0018, 0x0050);
  if (!meta.bodyPart) meta.bodyPart = readImplicitText(bytes, view, 0x0018, 0x0015);
  if (!meta.kvp) meta.kvp = readImplicitText(bytes, view, 0x0018, 0x0060);
  if (!meta.tubeCurrent) meta.tubeCurrent = readImplicitText(bytes, view, 0x0018, 0x1151);
  if (!meta.kernel) meta.kernel = readImplicitText(bytes, view, 0x0018, 0x1210);
  if (!meta.ctdi) meta.ctdi = readImplicitText(bytes, view, 0x0018, 0x9345);
  if (!meta.imagePosition) meta.imagePosition = readImplicitText(bytes, view, 0x0020, 0x0032);
  if (!meta.sliceLocation) meta.sliceLocation = readImplicitText(bytes, view, 0x0020, 0x1041);
  if (!meta.windowCenter) meta.windowCenter = readImplicitText(bytes, view, 0x0028, 0x1050);
  if (!meta.windowWidth) meta.windowWidth = readImplicitText(bytes, view, 0x0028, 0x1051);
  if (!meta.rescaleIntercept) meta.rescaleIntercept = readImplicitText(bytes, view, 0x0028, 0x1052);
  if (!meta.rescaleSlope) meta.rescaleSlope = readImplicitText(bytes, view, 0x0028, 0x1053);
  if (pixelOffset < 0) {
    const pixelTag = findImplicitTag(bytes, view, 0x7fe0, 0x0010);
    if (pixelTag) pixelOffset = pixelTag.offset;
  }
  if (pixelOffset < 0) throw new Error("Pixel Data tag was not found");
  const rows = meta.rows || 512;
  const cols = meta.cols || 512;
  const pixelCount = rows * cols;
  const slope = numericText(meta.rescaleSlope, 1);
  const intercept = numericText(meta.rescaleIntercept, 0);
  const pixels = new Float32Array(pixelCount);

  if (meta.bitsAllocated === 8) {
    for (let i = 0; i < pixelCount; i++) pixels[i] = bytes[pixelOffset + i] * slope + intercept;
  } else {
    for (let i = 0; i < pixelCount; i++) {
      const at = pixelOffset + i * 2;
      const raw = meta.pixelRepresentation === 1 ? view.getInt16(at, true) : view.getUint16(at, true);
      pixels[i] = raw * slope + intercept;
    }
  }

  meta.windowCenterNumber = numericText(meta.windowCenter, 40);
  meta.windowWidthNumber = Math.max(1, numericText(meta.windowWidth, 400));
  return { meta, pixels };
}

async function loadSliceForSeries(series, index) {
  const key = `${state.study}:${series}:${index}`;
  if (state.cache.has(key)) return state.cache.get(key);
  if (state.localMode) {
    const files = state.localSeriesFiles.get(series) || state.localFiles;
    const file = files[index];
    if (!file) throw new Error(`Could not load local slice ${index + 1}`);
    const slice = parseDicom(await file.arrayBuffer());
    state.cache.set(key, slice);
    return slice;
  }
  const url = seriesUrl(series, index);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load slice ${index + 1} (${response.status}) from ${url}`);
  const slice = parseDicom(await response.arrayBuffer());
  state.cache.set(key, slice);
  return slice;
}

async function loadSlice(index) {
  return loadSliceForSeries(state.series, index);
}

function renderSlice(slice) {
  const { meta, pixels } = slice;
  const imageData = ctx.createImageData(meta.cols, meta.rows);
  const low = state.center - state.width / 2;
  const span = state.width || 1;

  for (let i = 0; i < pixels.length; i++) {
    const v = Math.max(0, Math.min(255, ((pixels[i] - low) / span) * 255));
    const p = i * 4;
    imageData.data[p] = v;
    imageData.data[p + 1] = v;
    imageData.data[p + 2] = v;
    imageData.data[p + 3] = 255;
  }

  const offscreen = document.createElement("canvas");
  offscreen.width = meta.cols;
  offscreen.height = meta.rows;
  offscreen.getContext("2d").putImageData(imageData, 0, 0);

  const rect = els.wrap.getBoundingClientRect();
  els.canvas.width = Math.floor(rect.width * devicePixelRatio);
  els.canvas.height = Math.floor(rect.height * devicePixelRatio);
  els.canvas.style.width = `${rect.width}px`;
  els.canvas.style.height = `${rect.height}px`;

  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.imageSmoothingEnabled = false;
  const baseScale = Math.min(rect.width / meta.cols, rect.height / meta.rows) * 0.92;
  const drawW = meta.cols * baseScale * state.scale;
  const drawH = meta.rows * baseScale * state.scale;
  const x = (rect.width - drawW) / 2 + state.panX;
  const y = (rect.height - drawH) / 2 + state.panY;
  ctx.drawImage(offscreen, x, y, drawW, drawH);

  els.patientValue.textContent = meta.patientId || meta.patientName || "-";
  const seriesInfo = currentSeriesInfo();
  els.seriesValue.textContent = `${state.series} ${seriesInfo?.description || ""}`;
  els.modalityValue.textContent = meta.modality || "-";
  els.imageValue.textContent = `${state.index + 1} / ${seriesInfo.count}`;
  const dateText = formatDicomDate(meta.acquisitionDate || meta.studyDate);
  const timeText = formatDicomTime(meta.acquisitionTime || meta.studyTime);
  const locationText = meta.sliceLocation || (meta.imagePosition ? meta.imagePosition.split("\\")[2] : "-");
  const locationNumber = Number(locationText);
  els.pixelValue.textContent = `${meta.rows} x ${meta.cols}`;
  els.thicknessValue.textContent = meta.sliceThickness ? `${meta.sliceThickness} mm` : "-";
  els.locationValue.textContent = Number.isFinite(locationNumber) ? `${locationNumber.toFixed(1)} mm` : "-";
  els.timeValue.textContent = `${dateText} ${timeText}`.trim();
  els.transferValue.textContent = meta.transferSyntax || "-";
  els.viewportSeriesTitle.textContent = state.series;
  els.tagSummary.innerHTML = [
    ["StudyDate", meta.studyDate || "-"],
    ["AcqTime", meta.acquisitionTime || meta.studyTime || "-"],
    ["ImageType", meta.imageType || "-"],
    ["BodyPart", meta.bodyPart || "-"],
    ["KVP", meta.kvp || "-"],
    ["Tube mA", meta.tubeCurrent || "-"],
    ["Kernel", meta.kernel || "-"],
    ["CTDIvol", meta.ctdi || "-"],
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
  els.overlayLeft.textContent = `${meta.patientName || "UNKNOWN"}\nID: ${meta.patientId || "M30011111"}\n${dateText} ${timeText}`;
  els.overlayRight.textContent = `Study: ${STUDIES[state.study]?.label || state.study}\nSeries: ${state.series}\n${meta.seriesDescription || seriesInfo?.description || "-"}\nWW ${Math.round(state.width)} / WL ${Math.round(state.center)}`;
  els.overlayBottom.textContent = `Image ${state.index + 1} / ${seriesInfo.count}\nPixel: ${meta.rows} x ${meta.cols}  Thickness: ${meta.sliceThickness || "-"} mm\nLocation: ${locationText || "-"}`;
}

async function showSlice(index) {
  const seq = ++state.renderSeq;
  const seriesInfo = currentSeriesInfo();
  state.index = Math.max(0, Math.min(seriesInfo.count - 1, index));
  els.slider.value = String(state.index);
  els.sliceCount.textContent = `${state.index + 1} / ${seriesInfo.count}`;
  els.loading.className = "loading";
  els.loading.textContent = "Loading DICOM slice...";
  try {
    const slice = await loadSlice(state.index);
    if (seq !== state.renderSeq) return;
    if (!state.windowInitialized) {
      state.center = slice.meta.windowCenterNumber;
      state.width = slice.meta.windowWidthNumber;
      state.windowInitialized = true;
      syncWindowInputs();
    }
    renderSlice(slice);
    els.loading.classList.add("hidden");
    preloadNeighbors();
  } catch (error) {
    els.loading.textContent = `${error.message}. Confirm the DICOM folder is included in the deployed site.`;
    els.loading.classList.add("error");
  }
}

function preloadNeighbors() {
  [state.index - 1, state.index + 1].forEach((i) => {
    if (i >= 0 && i < currentSeriesInfo().count) loadSlice(i).catch(() => {});
  });
}

function renderThumbnail(slice, canvas) {
  const tctx = canvas.getContext("2d");
  const width = 180;
  const height = 140;
  canvas.width = width;
  canvas.height = height;
  const { meta, pixels } = slice;
  const center = slice.meta.windowCenterNumber || 40;
  const win = slice.meta.windowWidthNumber || 400;
  const low = center - win / 2;
  const imageData = tctx.createImageData(meta.cols, meta.rows);
  for (let i = 0; i < pixels.length; i++) {
    const v = Math.max(0, Math.min(255, ((pixels[i] - low) / win) * 255));
    const p = i * 4;
    imageData.data[p] = v;
    imageData.data[p + 1] = v;
    imageData.data[p + 2] = v;
    imageData.data[p + 3] = 255;
  }
  const offscreen = document.createElement("canvas");
  offscreen.width = meta.cols;
  offscreen.height = meta.rows;
  offscreen.getContext("2d").putImageData(imageData, 0, 0);
  tctx.fillStyle = "#000";
  tctx.fillRect(0, 0, width, height);
  tctx.imageSmoothingEnabled = false;
  const scale = Math.min(width / meta.cols, height / meta.rows);
  const drawW = meta.cols * scale;
  const drawH = meta.rows * scale;
  tctx.drawImage(offscreen, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);
}

function buildSeriesList() {
  els.seriesList.innerHTML = "";
  const tp = currentTimepoint();
  els.seriesSectionTitle.textContent = `${state.examType} Series / ${tp ? tp.name : state.timepoint}`;
  if (!currentStudySelection()) {
    showNotice(`${state.examType} has no configured DICOM study for this timepoint.`);
    return;
  }
  Object.entries(currentSeriesMap()).forEach(([key, value]) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `series-card${key === state.series ? " active" : ""}`;
    card.dataset.series = key;
    card.innerHTML = `
      <span class="series-dot"></span>
      <canvas class="series-thumb" aria-hidden="true"></canvas>
      <div class="series-caption"><span>${value.description}</span><strong>${value.count}</strong></div>
    `;
    card.addEventListener("click", () => changeSeries(key));
    els.seriesList.appendChild(card);
    loadSliceForSeries(key, 0)
      .then((slice) => renderThumbnail(slice, card.querySelector("canvas")))
      .catch(() => {
        const canvas = card.querySelector("canvas");
        const tctx = canvas.getContext("2d");
        canvas.width = 180;
        canvas.height = 140;
        tctx.fillStyle = "#05070a";
        tctx.fillRect(0, 0, canvas.width, canvas.height);
        tctx.fillStyle = "#7b8794";
        tctx.fillText("No preview", 54, 72);
      });
  });
}

function updateSeriesListActive() {
  document.querySelectorAll(".series-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.series === state.series);
  });
}

function syncWindowInputs() {
  els.centerInput.value = String(Math.round(state.center));
  els.widthInput.value = String(Math.round(state.width));
}

function openToolPanel(panel) {
  if (!els.toolDrawer || !els.toolDrawerTitle || !els.toolDrawerBody) return;
  const panels = {
    display: {
      title: "Display",
      body: `
        <label class="check-row top-check"><input type="checkbox" checked><span>Apply to all Views</span></label>
        <div class="tree-box">
          <details open><summary><label class="check-row"><input type="checkbox" checked><span>Image</span></label></summary>
            <label class="check-row indent"><input type="checkbox" checked><span>Dicom Image Overlay</span></label>
            <label class="check-row indent"><input type="checkbox" checked><span>Shutter</span></label>
            <label class="check-row indent"><input type="checkbox" checked><span>Pixel Padding</span></label>
          </details>
          <details open><summary><label class="check-row"><input type="checkbox" checked><span>Dicom Annotations</span></label></summary>
            <label class="check-row indent"><input type="checkbox" checked><span>Annotations</span></label>
            <label class="check-row indent"><input type="checkbox"><span>Minimal Annotations</span></label>
            <label class="check-row indent"><input type="checkbox"><span>Anonymize</span></label>
            <label class="check-row indent"><input type="checkbox" checked><span>Scale</span></label>
            <label class="check-row indent"><input type="checkbox" checked><span>Lookup Table</span></label>
            <label class="check-row indent"><input type="checkbox" checked><span>Orientation</span></label>
            <label class="check-row indent"><input type="checkbox" checked><span>Window/Level</span></label>
            <label class="check-row indent"><input type="checkbox" checked><span>Zoom</span></label>
            <label class="check-row indent"><input type="checkbox" checked><span>Rotation</span></label>
            <label class="check-row indent"><input type="checkbox" checked><span>Frame Value</span></label>
            <label class="check-row indent"><input type="checkbox" checked><span>Pixel (Value/Position)</span></label>
          </details>
          <details open><summary><label class="check-row"><input type="checkbox" checked><span>Drawings</span></label></summary>
            <label class="check-row indent"><input type="checkbox" checked><span>Crosslines</span></label>
          </details>
        </div>`,
    },
    imageTools: {
      title: "Image Tools",
      body: `
        <fieldset class="tool-fieldset"><legend>Windowing and Rendering</legend>
          <label class="slider-field"><span>Window: 4,096</span><input type="range" min="1" max="4096" value="4096"></label>
          <label class="slider-field"><span>Level: 2,048</span><input type="range" min="-1024" max="3072" value="2048"></label>
          <label class="select-field"><span>Preset:</span><select><option>Default 1 [DICOM]</option><option>Lung</option><option>Bone</option></select></label>
          <label class="select-field"><span>LUT Shape:</span><select><option>Linear</option><option>Sigmoid</option></select></label>
          <label class="select-field"><span>LUT:</span><select><option>Default (image)</option><option>Gray</option><option>Hot Iron</option></select></label>
          <label class="select-field"><span>Filter:</span><select><option>None</option><option>Sharpen</option><option>Smooth</option></select></label>
        </fieldset>
        <fieldset class="tool-fieldset"><legend>Transform</legend>
          <label class="slider-field"><span>Zoom: 26.75%</span><input type="range" min="1" max="300" value="27"></label>
          <label class="slider-field"><span>Rotation: 0°</span><input type="range" min="0" max="360" value="0"></label>
          <label class="check-row"><input type="checkbox"><span>Flip Horizontally (after rotation)</span></label>
        </fieldset>
        <fieldset class="tool-fieldset"><legend>Cine</legend>
          <label class="slider-field"><span>Image: 1</span><input type="range" min="1" max="198" value="1"></label>
          <div class="cine-row"><span>Speed (fps):</span><input type="number" value="20"><button>▶</button><button>■</button><button>∞</button></div>
        </fieldset>
        <fieldset class="tool-fieldset"><legend>Reset</legend>
          <div class="reset-row"><select><option>All</option><option>Window</option><option>Transform</option></select><button>Reset</button></div>
        </fieldset>`,
    },
    measure: {
      title: "Draw & Measure",
      body: `
        <fieldset class="tool-fieldset"><legend>Measurement Tool</legend>
          <div class="icon-grid">
            <button class="icon-tool active">✣</button><button class="icon-tool">╱</button><button class="icon-tool">▱</button><button class="icon-tool">□</button><button class="icon-tool">○</button>
            <button class="icon-tool">◜</button><button class="icon-tool">◇</button><button class="icon-tool">⌁</button><button class="icon-tool">⟍</button><button class="icon-tool">△</button>
            <button class="icon-tool">⌞</button><button class="icon-tool">┐</button><button class="icon-tool">✕</button><button class="icon-tool">●</button>
          </div>
        </fieldset>
        <fieldset class="tool-fieldset"><legend>Drawings</legend>
          <div class="icon-grid">
            <button class="icon-tool active">✣</button><button class="icon-tool">╱</button><button class="icon-tool">▱</button><button class="icon-tool">□</button><button class="icon-tool">○</button>
            <button class="icon-tool">◜</button><button class="icon-tool">◇</button><button class="icon-tool text-tool">T</button>
          </div>
        </div>
        <label class="select-field line-field"><span>Line:</span><button class="small-tool">🖉</button><input type="number" value="1"></label>
        <label class="check-row"><input type="checkbox" checked><span>Draw only once</span></label>
        <label class="check-row"><input type="checkbox" checked><span>Pixel Statistics</span></label>
        <label class="select-field"><span>Unit:</span><select><option>millimeters</option><option>pixels</option></select></label>
        <button class="more-options">More Options</button>
        <fieldset class="tool-fieldset selected-box"><legend>Selected</legend></fieldset>`,
    },
    attributes: {
      title: "DICOM Attributes",
      body: `
        <div class="attribute-row"><span>(0010,0020)</span><strong>TST010001</strong></div>
        <div class="attribute-row"><span>(0008,0060)</span><strong>CT</strong></div>
        <div class="attribute-row"><span>(0008,103E)</span><strong>,CE,Axial,5.0,,</strong></div>
        <div class="attribute-row"><span>(0018,0050)</span><strong>5 mm</strong></div>
        <div class="attribute-row"><span>(0028,0030)</span><strong>0.625\\0.625</strong></div>
        <div class="attribute-row"><span>(0020,1041)</span><strong>Slice Location</strong></div>
        <div class="attribute-row"><span>(0028,1050)</span><strong>Window Center</strong></div>
        <div class="attribute-row"><span>(0028,1051)</span><strong>Window Width</strong></div>`,
    },
  };
  const selected = panels[panel] || panels.imageTools;
  els.toolDrawerTitle.textContent = selected.title;
  els.toolDrawerBody.innerHTML = selected.body;
  els.toolDrawer.classList.add("open");
  document.querySelectorAll(".rail-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.panel === panel);
  });
}

function resetView() {
  state.scale = 1;
  state.panX = 0;
  state.panY = 0;
  showSlice(state.index);
}

function changeSeries(series) {
  state.series = series;
  state.index = 0;
  state.windowInitialized = false;
  state.cache.clear();
  const count = currentSeriesInfo(series).count;
  els.slider.max = String(count - 1);
  updateUrl();
  updateSeriesListActive();
  showSlice(0);
}

function applyStudySelection() {
  const selected = currentStudySelection();
  if (!selected) {
    state.index = 0;
    state.windowInitialized = false;
    state.cache.clear();
    els.slider.max = "0";
    buildSeriesList();
    updateUrl();
    return false;
  }
  state.study = selected.study;
  state.series = selected.series;
  if (!currentSeriesInfo(state.series)) state.series = Object.keys(currentSeriesMap())[0];
  state.index = 0;
  state.windowInitialized = false;
  state.cache.clear();
  els.slider.max = String(currentSeriesInfo().count - 1);
  updateUrl();
  buildSeriesList();
  showSlice(0);
  return true;
}

function changeExamType(examType) {
  state.examType = examType;
  applyStudySelection();
}

function changeTimepoint(timepoint) {
  state.timepoint = timepoint;
  applyStudySelection();
}

function handleLocalFiles(files) {
  const all = Array.from(files).filter((file) => file.name.toLowerCase().endsWith(".dcm"));
  state.localSeriesFiles = new Map();
  all.forEach((file) => {
    const relative = (file.webkitRelativePath || file.name).replaceAll("\\", "/");
    const match = relative.match(/(SN-\d+)/);
    if (!match) return;
    const key = match[1];
    if (!state.localSeriesFiles.has(key)) state.localSeriesFiles.set(key, []);
    state.localSeriesFiles.get(key).push(file);
  });
  state.localSeriesFiles.forEach((items, key) => {
    items.sort((a, b) => (a.webkitRelativePath || a.name).localeCompare(b.webkitRelativePath || b.name, undefined, { numeric: true }));
    if (currentSeriesMap()[key]) currentSeriesMap()[key].count = items.length;
  });
  const inSelectedSeries = all.filter((file) => {
    const relative = file.webkitRelativePath || file.name;
    return relative.replaceAll("\\", "/").includes(`/${state.series}/`);
  });
  const selected = (inSelectedSeries.length ? inSelectedSeries : all)
    .sort((a, b) => (a.webkitRelativePath || a.name).localeCompare(b.webkitRelativePath || b.name, undefined, { numeric: true }));

  if (!selected.length) {
    showNotice("No .dcm files found. Please select one of the configured CT series folders or the parent 20240514153719 folder.");
    return;
  }

  state.localMode = true;
  state.localFiles = selected;
  state.index = 0;
  state.windowInitialized = false;
  state.cache.clear();
  currentSeriesInfo().count = selected.length;
  els.slider.max = String(selected.length - 1);
  buildSeriesList();
  showSlice(0);
}

function populateFilters() {
  els.patientSelect.textContent = "M30011111";
  els.examTypeSelect.textContent = state.examType || "CT";
  const tp = timepoints.find((item) => item.id === state.timepoint) || timepoints[0];
  els.timepointSelect.textContent = tp ? timepointOptionText(tp) : "";
}

async function init() {
  await loadTimepointsFromIndex();
  if (!EXAM_TYPES.includes(state.examType)) state.examType = "CT";
  if (!timepoints.some((tp) => tp.id === state.timepoint)) state.timepoint = timepoints[0]?.id || "t0";
  populateFilters();
  applyStudySelection();
  if (!STUDIES[state.study]) state.study = Object.keys(STUDIES)[0];
  if (!currentSeriesInfo(state.series)) state.series = Object.keys(currentSeriesMap())[0];
  els.slider.max = String(currentSeriesInfo().count - 1);
  syncWindowInputs();
  if (location.protocol === "file:") {
    showNotice("Direct local opening cannot automatically read DICOM files. Please open this viewer from the deployed site or a local web server.");
  }
}

if (els.localOpenBtn && els.localFileInput) {
  els.localOpenBtn.addEventListener("click", () => els.localFileInput.click());
  els.localFileInput.addEventListener("change", (event) => handleLocalFiles(event.target.files));
}
if (els.toolDrawerClose && els.toolDrawer) {
  els.toolDrawerClose.addEventListener("click", () => els.toolDrawer.classList.remove("open"));
}
document.querySelector(".right-toolbar")?.addEventListener("click", (event) => {
  const button = event.target.closest(".rail-button");
  if (button) openToolPanel(button.dataset.panel);
});
els.slider.addEventListener("input", (event) => showSlice(Number(event.target.value)));
els.centerInput.addEventListener("change", () => {
  state.center = Number(els.centerInput.value) || state.center;
  showSlice(state.index);
});
els.widthInput.addEventListener("change", () => {
  state.width = Math.max(1, Number(els.widthInput.value) || state.width);
  showSlice(state.index);
});
document.querySelectorAll(".preset").forEach((button) => {
  button.addEventListener("click", () => {
    state.center = Number(button.dataset.center);
    state.width = Number(button.dataset.width);
    syncWindowInputs();
    showSlice(state.index);
  });
});
els.resetBtn.addEventListener("click", resetView);
els.wrap.addEventListener("dblclick", resetView);
els.wrap.addEventListener("wheel", (event) => {
  event.preventDefault();
  showSlice(state.index + (event.deltaY > 0 ? 1 : -1));
}, { passive: false });
els.wrap.addEventListener("mousedown", (event) => {
  state.dragging = true;
  state.dragMode = event.shiftKey ? "pan" : "window";
  state.lastX = event.clientX;
  state.lastY = event.clientY;
});
window.addEventListener("mouseup", () => { state.dragging = false; });
window.addEventListener("mousemove", (event) => {
  if (!state.dragging) return;
  const dx = event.clientX - state.lastX;
  const dy = event.clientY - state.lastY;
  state.lastX = event.clientX;
  state.lastY = event.clientY;
  if (state.dragMode === "pan") {
    state.panX += dx;
    state.panY += dy;
  } else {
    state.center += dx * 2;
    state.width = Math.max(1, state.width + dy * 4);
    syncWindowInputs();
  }
  showSlice(state.index);
});
window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" || event.key === "ArrowRight") showSlice(state.index + 1);
  if (event.key === "ArrowUp" || event.key === "ArrowLeft") showSlice(state.index - 1);
  if (event.key === "+" || event.key === "=") { state.scale *= 1.1; showSlice(state.index); }
  if (event.key === "-") { state.scale /= 1.1; showSlice(state.index); }
});
window.addEventListener("resize", () => showSlice(state.index));

init();

