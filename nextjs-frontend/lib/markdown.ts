const escapeHtml = (input: string) =>
  input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const formatInline = (input: string) => {
  let formatted = escapeHtml(input);
  formatted = formatted.replace(/`([^`]+)`/g, "<code>$1</code>");
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  formatted = formatted.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  formatted = formatted.replace(/_([^_]+)_/g, "<em>$1</em>");
  return formatted;
};

export const renderMarkdown = (markdown: string) => {
  const lines = markdown.split(/\r?\n/);
  const html: string[] = [];
  let inList = false;

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      return;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      const level = Math.min(headingMatch[1].length, 3);
      html.push(`<h${level}>${formatInline(headingMatch[2].trim())}</h${level}>`);
      return;
    }

    if (/^\s*-\s+/.test(line)) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      const content = line.replace(/^\s*-\s+/, "");
      html.push(`<li>${formatInline(content)}</li>`);
      return;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    html.push(`<p>${formatInline(line)}</p>`);
  });

  if (inList) {
    html.push("</ul>");
  }

  return html.join("");
};
