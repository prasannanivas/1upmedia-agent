import { htmlToText } from "html-to-text";

export class ContentFormatter {
  static parseMetadata(text) {
    const dateMatch = text.match(/UTC.*?(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
    const userMatch = text.match(/Login:\s*(\S+)/);

    return {
      date: dateMatch ? dateMatch[1] : null,
      user: userMatch ? userMatch[1] : null,
    };
  }

  static format(htmlContent, options = {}) {
    const {
      maxLength = 2200,
      preserveLinks = true,
      addSpacing = true,
    } = options;

    const formatted = htmlToText(htmlContent, {
      selectors: [
        { selector: "head", format: "skip" }, // Skip head section
        { selector: "title", format: "skip" }, // Skip title tag
        { selector: "h1", format: "heading" },
        { selector: "h2", format: "heading" },
        { selector: "h3", format: "heading" },
        { selector: "p", format: "paragraph" },
        {
          selector: "a",
          format: "anchor",
          options: {
            ignoreHref: false,
            baseUrl: null,
          },
        },
        { selector: "strong", format: "bold" },
      ],
      wordwrap: false,
      preserveNewlines: true,
      formatters: {
        heading: (elem, walk, builder) => {
          builder.addInline("\n");
          walk(elem.children, builder);
          builder.addInline("\n\n");
        },
        paragraph: (elem, walk, builder) => {
          walk(elem.children, builder);
          builder.addInline("\n\n");
        },
        anchor: (elem, walk, builder) => {
          const href = elem.attribs.href;
          const text = elem.children[0]?.data || "";
          if (preserveLinks && href) {
            if (text === href) {
              builder.addInline(href);
            } else {
              builder.addInline(`${text} (${href})`);
            }
          } else {
            walk(elem.children, builder);
          }
        },
        bold: (elem, walk, builder) => {
          builder.addInline("*");
          walk(elem.children, builder);
          builder.addInline("*");
        },
      },
    });

    // Clean up the formatted text
    let cleanText = formatted.replace(/\n{3,}/g, "\n\n").trim();

    // Add spacing if requested
    if (addSpacing) {
      cleanText = cleanText.split("\n\n").filter(Boolean).join("\n\n");
    }

    // Truncate if needed
    if (cleanText.length > maxLength) {
      cleanText = cleanText.slice(0, maxLength - 3) + "...";
    }

    return cleanText;
  }
}
