import { htmlToText } from "html-to-text";

export const formatContent = (htmlContent) => {
  return htmlToText(htmlContent, {
    selectors: [
      { selector: "h1", format: "text" },
      { selector: "h2", format: "text" },
      { selector: "h3", format: "text" },
      { selector: "p", format: "text" },
      { selector: "a", options: { ignoreHref: true } },
      { selector: "strong", format: "text" },
    ],
    wordwrap: false,
    preserveNewlines: true,
    formatters: {
      text: (elem, walk, builder, options) => {
        let prefix = "";
        let suffix = "\n\n";

        // Special handling for headers
        if (
          elem.tagName === "h1" ||
          elem.tagName === "h2" ||
          elem.tagName === "h3"
        ) {
          suffix = "\n\n";
        }

        builder.openBlock({ leadingLineBreaks: 1 });
        builder.addInline(prefix);
        walk(elem.children, builder);
        builder.addInline(suffix);
        builder.closeBlock({ trailingLineBreaks: 1 });
      },
    },
  })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

// For date and user parsing
export const parseMetadata = (text) => {
  const dateMatch = text.match(/UTC.*?(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
  const userMatch = text.match(/Login: (\w+)/);

  return {
    date: dateMatch ? dateMatch[1] : null,
    user: userMatch ? userMatch[1] : null,
  };
};
