const fs = require("fs");
const path = require("path");

function sanitizeReportName(input) {
  const raw = String(input || "").trim().toLowerCase().replace(/\s+/g, "-");
  const cleaned = raw.replace(/[^a-z0-9-_]/g, "");
  if (cleaned.length > 0) {
    return cleaned;
  }
  return `report-${Date.now()}`;
}

function buildEvidenceCatalog(runSummary, runId) {
  const steps = Array.isArray(runSummary.steps) ? runSummary.steps : [];
  return {
    runId,
    steps: steps.map((step) => {
      const outputs = step.outputs || {};
      const stepDir = typeof outputs.stepDir === "string" ? outputs.stepDir : "";
      const artifacts = [];
      addArtifact(artifacts, "evidence", outputs.evidence, runId, stepDir);
      addArtifact(artifacts, "screenshot", outputs.screenshot, runId, stepDir);
      addArtifactList(artifacts, "screenshot", outputs.screenshots, runId, stepDir);
      addArtifact(artifacts, "query", outputs.query, runId, stepDir);
      addArtifact(artifacts, "result", outputs.result, runId, stepDir);
      addArtifact(artifacts, "stdout", outputs.stdout, runId, stepDir);
      addArtifact(artifacts, "stderr", outputs.stderr, runId, stepDir);
      addArtifact(artifacts, "file", outputs.file, runId, stepDir);
      addArtifact(artifacts, "viewer", outputs.viewer, runId, stepDir);
      addArtifact(artifacts, "source", outputs.source, runId, stepDir);
      return {
        id: step.id,
        type: step.type,
        status: step.status,
        stepDir,
        artifacts
      };
    })
  };
}

function addArtifact(list, label, filename, runId, stepDir) {
  if (typeof filename !== "string" || filename.length === 0 || !stepDir) {
    return;
  }
  list.push({
    label,
    filename,
    url: `/runs/${runId}/${stepDir}/${filename}`,
    kind: guessKind(filename)
  });
}

function addArtifactList(list, label, filenames, runId, stepDir) {
  if (!Array.isArray(filenames)) {
    return;
  }
  filenames.forEach((name) => addArtifact(list, label, name, runId, stepDir));
}

function guessKind(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return "image";
  }
  if (lower.endsWith(".html")) {
    return "html";
  }
  return "file";
}

function normalizeReport(report) {
  const blocks = Array.isArray(report?.blocks) ? report.blocks : [];
  return {
    name: String(report?.name || "report"),
    runId: String(report?.runId || ""),
    blocks: blocks.map((block) => ({
      id: String(block.id || ""),
      type: String(block.type || "p"),
      text: block.text !== undefined ? String(block.text) : "",
      label: block.label !== undefined ? String(block.label) : "",
      caption: block.caption !== undefined ? String(block.caption) : "",
      runId: block.runId !== undefined ? String(block.runId) : "",
      stepId: block.stepId !== undefined ? String(block.stepId) : "",
      filename: block.filename !== undefined ? String(block.filename) : "",
      stepDir: block.stepDir !== undefined ? String(block.stepDir) : "",
      enabled: block.enabled !== false
    }))
  };
}

function buildReportHtml(report, runSummary, runId) {
  const normalized = normalizeReport(report);
  const body = normalized.blocks
    .filter((block) => block.enabled)
    .map((block) => renderHtmlBlock(block, runSummary, runId))
    .join("\n");
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(normalized.name)}</title>
  <style>
    body { font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; padding: 32px; color: #1d2126; line-height: 1.5; }
    h1 { font-size: 26px; margin: 0 0 8px; letter-spacing: 0.3px; color: #101827; }
    h2 { font-size: 18px; margin: 18px 0 6px; letter-spacing: 0.2px; color: #101827; }
    p { margin: 6px 0 12px; font-size: 14px; }
    small { display: block; font-size: 12px; color: #5f6368; margin-bottom: 10px; }
    .evidence { padding: 12px; border: 1px solid #dcd6cc; border-radius: 12px; margin: 12px 0; }
    .caption { color: #6c6f74; font-size: 12px; margin-top: 6px; }
    img { max-width: 100%; border-radius: 8px; }
    iframe { width: 100%; height: 360px; border: 1px solid #ddd; border-radius: 8px; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

function renderHtmlBlock(block, runSummary, runId) {
  if (block.type === "h1") {
    return `<h1>${escapeHtml(block.text)}</h1>`;
  }
  if (block.type === "h2") {
    return `<h2>${escapeHtml(block.text)}</h2>`;
  }
  if (block.type === "p") {
    return `<p>${escapeHtml(block.text)}</p>`;
  }
  if (block.type === "small") {
    return `<small>${escapeHtml(block.text)}</small>`;
  }
  if (block.type === "evidence") {
    const selection = resolveEvidence(block, runSummary, runId);
    if (!selection) {
      return `<div class="evidence"><strong>${escapeHtml(block.label || "Evidence")}</strong><p>Sem evidencia selecionada.</p></div>`;
    }
    const filename = `<div>${escapeHtml(selection.filename)}</div>`;
    const caption = block.caption ? `<div class="caption">${escapeHtml(block.caption)}</div>` : "";
    const preview =
      selection.kind === "image"
        ? `<div><img src="${selection.url}" alt="${escapeHtml(selection.filename)}" /></div>`
        : selection.kind === "html"
        ? `<div><iframe src="${selection.url}"></iframe></div>`
        : filename;
    return `<div class="evidence"><strong>${escapeHtml(block.label || "Evidence")}</strong>${preview}${caption}</div>`;
  }
  return "";
}

function resolveEvidence(block, runSummary, runId) {
  if (!block.stepId || !block.filename) {
    return null;
  }
  if (block.runId && block.stepDir) {
    const url = `/runs/${block.runId}/${block.stepDir}/${block.filename}`;
    return {
      filename: block.filename,
      url,
      kind: guessKind(block.filename),
      filePath: resolveEvidencePath(url)
    };
  }
  const steps = Array.isArray(runSummary.steps) ? runSummary.steps : [];
  const sourceRunId = block.runId || runId;
  const summarySteps = block.runId && block.runId !== runId && runSummary.byRun
    ? runSummary.byRun[block.runId]?.steps ?? []
    : steps;
  const step = summarySteps.find((item) => item.id === block.stepId);
  if (!step || !step.outputs || typeof step.outputs.stepDir !== "string") {
    return null;
  }
  const filename = block.filename;
  const url = `/runs/${sourceRunId}/${step.outputs.stepDir}/${filename}`;
  return {
    filename,
    url,
    kind: guessKind(filename),
    filePath: resolveEvidencePath(url)
  };
}

function resolveEvidencePath(url) {
  if (!url || typeof url !== "string") {
    return "";
  }
  const cleaned = url.startsWith("/") ? url.slice(1) : url;
  return path.join(process.cwd(), cleaned);
}

function buildReportDocx(report, runSummary, runId) {
  const normalized = normalizeReport(report);
  const document = buildDocumentXml(normalized, runSummary, runId);
  const images = document.images;
  const entries = [
    {
      name: "[Content_Types].xml",
      data: Buffer.from(buildContentTypesXml(images), "utf-8")
    },
    {
      name: "_rels/.rels",
      data: Buffer.from(buildRelsXml(), "utf-8")
    },
    {
      name: "word/document.xml",
      data: Buffer.from(document.xml, "utf-8")
    },
    {
      name: "word/_rels/document.xml.rels",
      data: Buffer.from(buildDocumentRelsXml(images), "utf-8")
    }
  ];
  images.forEach((image) => {
    entries.push({
      name: `word/media/${image.name}`,
      data: image.data
    });
  });
  return createZip(entries);
}

function buildDocumentXml(report, runSummary, runId) {
  const images = [];
  let imageIndex = 1;
  let docPrId = 1;
  const paragraphs = report.blocks
    .filter((block) => block.enabled)
    .map((block) => {
      if (block.type === "h1") {
        return buildParagraph(block.text, "Heading1");
      }
      if (block.type === "h2") {
        return buildParagraph(block.text, "Heading2");
      }
      if (block.type === "p") {
        return buildParagraph(block.text);
      }
      if (block.type === "small") {
        return buildParagraph(block.text);
      }
      if (block.type === "evidence") {
        const selection = resolveEvidence(block, runSummary, runId);
        const label = block.label || "Evidence";
        if (!selection) {
          const text = `${label}: sem evidencia selecionada`;
          return buildParagraph(text);
        }
        const parts = [buildParagraph(label)];
        if (selection.kind === "image" && selection.filePath && fs.existsSync(selection.filePath)) {
          const imageEntry = buildImageEntry(selection, imageIndex, docPrId);
          if (imageEntry) {
            images.push(imageEntry);
            parts.push(buildImageParagraph(imageEntry));
            imageIndex += 1;
            docPrId += 1;
          } else {
            parts.push(buildParagraph(`${selection.url}`));
          }
        } else {
          parts.push(buildParagraph(`${selection.url}`));
        }
        if (block.caption) {
          parts.push(buildParagraph(block.caption));
        }
        return parts.join("");
      }
      return "";
    })
    .join("");
  return {
    xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    ${paragraphs}
    <w:sectPr />
  </w:body>
</w:document>`,
    images
  };
}

function buildParagraph(text, style) {
  const safe = escapeXml(text || "");
  const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
  return `<w:p>${styleXml}<w:r><w:t xml:space="preserve">${safe}</w:t></w:r></w:p>`;
}

function buildContentTypesXml(images) {
  const extensions = new Set(
    Array.isArray(images)
      ? images.map((image) => path.extname(image.name).slice(1).toLowerCase()).filter(Boolean)
      : []
  );
  const imageDefaults = [];
  if (extensions.has("png")) {
    imageDefaults.push(`<Default Extension="png" ContentType="image/png"/>`);
  }
  if (extensions.has("jpg") || extensions.has("jpeg")) {
    imageDefaults.push(`<Default Extension="jpg" ContentType="image/jpeg"/>`);
    imageDefaults.push(`<Default Extension="jpeg" ContentType="image/jpeg"/>`);
  }
  const extra = imageDefaults.length > 0 ? `\n  ${imageDefaults.join("\n  ")}` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  ${extra}
</Types>`;
}

function buildRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
}

function buildDocumentRelsXml(images) {
  const rels = Array.isArray(images)
    ? images
        .map(
          (image) =>
            `<Relationship Id="${image.relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${image.name}"/>`
        )
        .join("")
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`;
}

function buildImageEntry(selection, imageIndex, docPrId) {
  const buffer = readImage(selection.filePath);
  if (!buffer) {
    return null;
  }
  const ext = path.extname(selection.filePath || "").toLowerCase() || ".png";
  const name = `image${imageIndex}${ext}`;
  const { widthEmu, heightEmu } = resolveImageSize(buffer);
  return {
    name,
    data: buffer,
    relId: `rId${imageIndex}`,
    docPrId,
    widthEmu,
    heightEmu
  };
}

function buildImageParagraph(image) {
  return `<w:p>
  <w:r>
    <w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0">
        <wp:extent cx="${image.widthEmu}" cy="${image.heightEmu}"/>
        <wp:docPr id="${image.docPrId}" name="Picture ${image.docPrId}"/>
        <a:graphic>
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic>
              <pic:nvPicPr>
                <pic:cNvPr id="0" name="${escapeXml(image.name)}"/>
                <pic:cNvPicPr/>
              </pic:nvPicPr>
              <pic:blipFill>
                <a:blip r:embed="${image.relId}"/>
                <a:stretch><a:fillRect/></a:stretch>
              </pic:blipFill>
              <pic:spPr>
                <a:xfrm>
                  <a:off x="0" y="0"/>
                  <a:ext cx="${image.widthEmu}" cy="${image.heightEmu}"/>
                </a:xfrm>
                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
              </pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>
  </w:r>
</w:p>`;
}

function readImage(filePath) {
  try {
    return fs.readFileSync(filePath);
  } catch (error) {
    return null;
  }
}

function resolveImageSize(buffer) {
  const fallback = { widthPx: 600, heightPx: 360 };
  const size = readPngSize(buffer) || readJpegSize(buffer) || fallback;
  const maxWidthPx = 600;
  const scale = size.widthPx > maxWidthPx ? maxWidthPx / size.widthPx : 1;
  const widthPx = Math.round(size.widthPx * scale);
  const heightPx = Math.round(size.heightPx * scale);
  return {
    widthEmu: pxToEmu(widthPx),
    heightEmu: pxToEmu(heightPx)
  };
}

function pxToEmu(px) {
  return Math.round(px * 9525);
}

function readPngSize(buffer) {
  if (!buffer || buffer.length < 24) {
    return null;
  }
  const signature = buffer.toString("hex", 0, 8);
  if (signature !== "89504e470d0a1a0a") {
    return null;
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (!width || !height) {
    return null;
  }
  return { widthPx: width, heightPx: height };
}

function readJpegSize(buffer) {
  if (!buffer || buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      if (!width || !height) {
        return null;
      }
      return { widthPx: width, heightPx: height };
    }
    offset += 2 + length;
  }
  return null;
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeHtml(text) {
  return escapeXml(text);
}

function createZip(entries) {
  const files = [];
  const central = [];
  let offset = 0;

  entries.forEach((entry) => {
    const name = entry.name.replace(/\\/g, "/");
    const nameBuf = Buffer.from(name, "utf-8");
    const dataBuf = Buffer.isBuffer(entry.data)
      ? entry.data
      : Buffer.from(String(entry.data || ""), "utf-8");
    const crc = crc32(dataBuf);
    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(dataBuf.length, 18);
    localHeader.writeUInt32LE(dataBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    nameBuf.copy(localHeader, 30);

    files.push(localHeader, dataBuf);

    const centralHeader = Buffer.alloc(46 + nameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(dataBuf.length, 20);
    centralHeader.writeUInt32LE(dataBuf.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    nameBuf.copy(centralHeader, 46);

    central.push(centralHeader);
    offset += localHeader.length + dataBuf.length;
  });

  const centralSize = central.reduce((acc, buf) => acc + buf.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...files, ...central, end]);
}

const CRC_TABLE = buildCrcTable();

function buildCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
}

function crc32(buffer) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

module.exports = {
  sanitizeReportName,
  buildEvidenceCatalog,
  buildReportHtml,
  buildReportDocx
};
