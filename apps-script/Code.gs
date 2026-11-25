const STUDENT_PROJECTS = {
  "1oZOoKTzFxk-FcZC2aclAcqhRd_ox5G2-": "Tausif Reza",
  "1n9WWjvUDuvzLban_UomPvqBnxgkwD05k": "Shaharir Hossen",
  "1ZqTGwGMF1LUIClRNCmRDMYCyUetd-oy2": "Wakiya Islam",
  "1ro7Fk4pJSvawH-LlrhmoKsMtIhzrJwut": "Sumaiya Sultana",
  "1VewitpPJcFD7sbInu6FOo949j3Ljk9Qf": "Dristy Sultana",
  "1OQXNad-G7hCM_ARf5V0wog0dPoWMV9ru": "Kazi Al-Asad Ahad"
};

function doGet(event) {
  const parameters = event && event.parameter ? event.parameter : {};
  const folderId = parameters.folderId || "";
  const projectName = STUDENT_PROJECTS[folderId];

  if (!projectName) {
    return errorPage("Unknown student project. Check the folder ID in the link.");
  }

  try {
    const filePath = normalizeRequestedPath(parameters.file || "index.html");
    if (!filePath || !/\.html?$/i.test(filePath)) {
      return errorPage("Only HTML pages can be opened as a student website.");
    }

    const files = getProjectFiles(folderId);
    const pageFile = files[filePath];
    if (!pageFile) {
      return errorPage("Could not find " + filePath + " in " + projectName + "'s Drive folder.");
    }

    const appUrl = ScriptApp.getService().getUrl();
    if (!appUrl) {
      return errorPage("Deploy this Apps Script as a web app before opening student websites.");
    }

    let html = pageFile.getBlob().getDataAsString("UTF-8");
    html = inlineStylesheets(html, filePath, files);
    html = rewriteInlineStyles(html, filePath, files);
    html = inlineScripts(html, filePath, files);
    html = rewriteLocalReferences(html, filePath, folderId, appUrl, files);

    return HtmlService.createHtmlOutput(html).setTitle(projectName);
  } catch (error) {
    return errorPage("Unable to load " + projectName + "'s website: " + error.message);
  }
}

function getProjectFiles(folderId) {
  const files = Object.create(null);
  const visitedFolders = Object.create(null);
  addFolderFiles(DriveApp.getFolderById(folderId), "", files, visitedFolders);
  return files;
}

function addFolderFiles(folder, prefix, files, visitedFolders) {
  const folderId = folder.getId();
  if (visitedFolders[folderId]) return;
  visitedFolders[folderId] = true;

  const fileIterator = folder.getFiles();
  while (fileIterator.hasNext()) {
    const file = fileIterator.next();
    const path = prefix + file.getName();
    if (files[path]) {
      throw new Error("Duplicate file path in Drive folder: " + path);
    }
    files[path] = file;
  }

  const folderIterator = folder.getFolders();
  while (folderIterator.hasNext()) {
    const child = folderIterator.next();
    addFolderFiles(child, prefix + child.getName() + "/", files, visitedFolders);
  }
}

function normalizeRequestedPath(path) {
  if (path.indexOf("\\") !== -1 || path.indexOf("\0") !== -1) return "";
  const parts = path.split("/");
  if (parts.some(function (part) { return part === "." || part === ".."; })) return "";
  return parts.filter(Boolean).join("/");
}

function inlineStylesheets(html, currentPath, files) {
  return html.replace(/<link\b[^>]*>/gi, function (tag) {
    const rel = getAttribute(tag, "rel");
    const href = getAttribute(tag, "href");
    if (!rel || !/\bstylesheet\b/i.test(rel) || !href || isExternalReference(href)) return tag;

    const path = resolveProjectPath(currentPath, href);
    const file = path && files[path];
    if (!file) throw new Error("Missing stylesheet: " + href);

    let css = file.getBlob().getDataAsString("UTF-8");
    css = rewriteCssUrls(css, path, files);
    css = css.replace(/<\/style/gi, "\\3C /style");
    return "<style>" + css + "</style>";
  });
}

function rewriteInlineStyles(html, currentPath, files) {
  return html.replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, function (tag) {
    const openingTag = tag.match(/^<style\b[^>]*>/i)[0];
    const css = tag.substring(openingTag.length).replace(/<\/style\s*>$/i, "");
    return openingTag + rewriteCssUrls(css, currentPath, files)
      .replace(/<\/style/gi, "\\3C /style") + "</style>";
  });
}

function inlineScripts(html, currentPath, files) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, function (tag) {
    const src = getAttribute(tag, "src");
    if (!src || isExternalReference(src)) return tag;

    const path = resolveProjectPath(currentPath, src);
    const file = path && files[path];
    if (!file) throw new Error("Missing JavaScript file: " + src);

    const openingTag = tag.match(/^<script\b[^>]*>/i)[0];
    const attributes = openingTag
      .replace(/^<script\b/i, "")
      .replace(/>$/, "")
      .replace(/\s+src\s*=\s*(["']).*?\1/i, "")
      .replace(/\s+src\s*=\s*[^\s>]+/i, "");
    const source = file.getBlob().getDataAsString("UTF-8")
      .replace(/<\/script/gi, "<\\/script");
    return "<script" + attributes + ">" + source + "</script>";
  });
}

function rewriteLocalReferences(html, currentPath, folderId, appUrl, files) {
  return html.replace(/<[a-z][^>]*>/gi, function (tag) {
    const tagName = tag.match(/^<([a-z]+)/i)[1].toLowerCase();
    return tag.replace(/\b(href|src|poster|background|style)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
      function (attribute, name, doubleQuoted, singleQuoted, unquoted) {
        const value = doubleQuoted !== undefined ? doubleQuoted
          : singleQuoted !== undefined ? singleQuoted
            : unquoted;
        const quote = doubleQuoted !== undefined ? '"' : singleQuoted !== undefined ? "'" : '"';
        if (name.toLowerCase() === "style") {
          return name + "=" + quote + rewriteCssUrls(value, currentPath, files) + quote;
        }
        if (isExternalReference(value)) return attribute;
        const path = resolveProjectPath(currentPath, value);
        if (!path) return attribute;

        if (tagName === "a" && name.toLowerCase() === "href" && /\.html?$/i.test(path)) {
          const suffix = getReferenceSuffix(value);
          const url = appUrl + "?folderId=" + encodeURIComponent(folderId) +
            "&file=" + encodeURIComponent(path) + suffix;
          return name + "=" + quote + escapeAttribute(url) + quote;
        }

        const file = files[path];
        if (!file) throw new Error("Missing project asset: " + value);
        return name + "=" + quote + toDataUrl(file) + quote;
      });
  });
}

function rewriteCssUrls(css, currentPath, files) {
  return css.replace(/url\(\s*(["']?)(.*?)\1\s*\)/gi, function (match, quote, value) {
    if (isExternalReference(value)) return match;
    const path = resolveProjectPath(currentPath, value);
    const file = path && files[path];
    if (!file) throw new Error("Missing CSS asset: " + value);
    return 'url("' + toDataUrl(file) + '")';
  });
}

function resolveProjectPath(currentPath, reference) {
  const path = reference.split(/[?#]/, 1)[0];
  if (!path) return "";

  let decoded;
  try {
    decoded = decodeURIComponent(path);
  } catch (error) {
    return "";
  }

  const parts = decoded.charAt(0) === "/"
    ? []
    : currentPath.split("/").slice(0, -1);
  decoded.replace(/\\/g, "/").split("/").forEach(function (part) {
    if (!part || part === ".") return;
    if (part === "..") {
      if (parts.length) parts.pop();
      return;
    }
    parts.push(part);
  });
  return parts.join("/");
}

function toDataUrl(file) {
  const blob = file.getBlob();
  const contentType = blob.getContentType() || "application/octet-stream";
  return "data:" + contentType + ";base64," + Utilities.base64Encode(blob.getBytes());
}

function getAttribute(tag, name) {
  const match = tag.match(new RegExp("\\b" + name + "\\s*=\\s*(?:([\"'])(.*?)\\1|([^\\s>]+))", "i"));
  return match ? (match[2] !== undefined ? match[2] : match[3]) : "";
}

function isExternalReference(value) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value.trim());
}

function getReferenceSuffix(value) {
  const index = value.search(/[?#]/);
  return index === -1 ? "" : value.substring(index);
}

function escapeAttribute(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function errorPage(message) {
  const escaped = message.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  return HtmlService.createHtmlOutput(
    "<!doctype html><html><head><meta charset=\"utf-8\"><title>Student website unavailable</title>" +
    "<style>body{font:16px sans-serif;max-width:42rem;margin:10vh auto;padding:0 1rem;color:#222}" +
    "h1{font-size:1.4rem}</style></head><body><h1>Student website unavailable</h1><p>" +
    escaped + "</p></body></html>"
  ).setTitle("Student website unavailable");
}
