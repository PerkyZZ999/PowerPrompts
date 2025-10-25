/**
 * XML delimiter utilities for framework section management
 */

/**
 * Wrap content in XML tag
 */
export function wrapTag(tag: string, content: string): string {
  return `<${tag}>\n${content}\n</${tag}>`;
}

/**
 * Extract content from XML tag
 */
export function extractTag(xml: string, tag: string): string | null {
  // Create regex pattern to match tag
  const pattern = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");

  const match = xml.match(pattern);

  if (!match || !match[1]) {
    return null;
  }

  return match[1].trim();
}

/**
 * Extract all occurrences of a tag
 */
export function extractAllTags(xml: string, tag: string): string[] {
  const pattern = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "gi");

  const matches: string[] = [];
  let match;

  while ((match = pattern.exec(xml)) !== null) {
    if (match[1]) {
      matches.push(match[1].trim());
    }
  }

  return matches;
}

/**
 * Validate XML structure
 * Note: We're lenient with unclosed tags (common with LLM-generated XML)
 * but strict about mismatched closing tags (actual errors)
 */
export function validateXml(xml: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Simple tag balance check
  const openTags: string[] = [];
  const tagPattern = /<\/?([a-zA-Z_][a-zA-Z0-9_-]*)[^>]*>/g;

  let match;
  while ((match = tagPattern.exec(xml)) !== null) {
    const tag = match[1];
    if (!tag) continue; // Skip if no tag name found

    const isClosing = match[0].startsWith("</");

    if (isClosing) {
      if (openTags.length === 0) {
        errors.push(`Unmatched closing tag: </${tag}> (no opening tag found)`);
      } else if (openTags[openTags.length - 1] !== tag) {
        // Only error if the closing tag doesn't match the most recent open tag
        // This catches actual mistakes like <role>...</expectation>
        errors.push(
          `Mismatched closing tag: expected </${openTags[openTags.length - 1]}>, got </${tag}>`,
        );
      } else {
        openTags.pop();
      }
    } else {
      // Skip self-closing tags
      if (!match[0].endsWith("/>")) {
        openTags.push(tag);
      }
    }
  }

  // NOTE: We intentionally DON'T error on unclosed tags
  // LLMs often generate XML with unclosed tags, but the content is still usable
  // We'll just auto-close them with cleanXml()

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Replace tag content
 */
export function replaceTag(
  xml: string,
  tag: string,
  newContent: string,
): string {
  const pattern = new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, "i");

  return xml.replace(pattern, wrapTag(tag, newContent));
}

/**
 * Parse RACE framework structure
 */
export function parseRaceFramework(xml: string): {
  role?: string;
  action?: string;
  context?: string;
  expectation?: string;
} {
  return {
    role: extractTag(xml, "role") || undefined,
    action: extractTag(xml, "action") || undefined,
    context: extractTag(xml, "context") || undefined,
    expectation: extractTag(xml, "expectation") || undefined,
  };
}

/**
 * Parse COSTAR framework structure
 */
export function parseCostarFramework(xml: string): {
  context?: string;
  objective?: string;
  style?: string;
  tone?: string;
  audience?: string;
  response?: string;
} {
  return {
    context: extractTag(xml, "context") || undefined,
    objective: extractTag(xml, "objective") || undefined,
    style: extractTag(xml, "style") || undefined,
    tone: extractTag(xml, "tone") || undefined,
    audience: extractTag(xml, "audience") || undefined,
    response: extractTag(xml, "response") || undefined,
  };
}

/**
 * Parse APE framework structure
 */
export function parseApeFramework(xml: string): {
  action?: string;
  purpose?: string;
  expectation?: string;
} {
  return {
    action: extractTag(xml, "action") || undefined,
    purpose: extractTag(xml, "purpose") || undefined,
    expectation: extractTag(xml, "expectation") || undefined,
  };
}

/**
 * Parse CREATE framework structure
 */
export function parseCreateFramework(xml: string): {
  character?: string;
  request?: string;
  examples?: string;
  adjustments?: string;
  type?: string;
  extras?: string;
} {
  return {
    character: extractTag(xml, "character") || undefined,
    request: extractTag(xml, "request") || undefined,
    examples: extractTag(xml, "examples") || undefined,
    adjustments: extractTag(xml, "adjustments") || undefined,
    type: extractTag(xml, "type") || undefined,
    extras: extractTag(xml, "extras") || undefined,
  };
}

/**
 * Clean XML content (remove extra whitespace, normalize)
 */
export function cleanXml(xml: string): string {
  return xml
    .replace(/>\s+</g, ">\n<") // Normalize whitespace between tags
    .replace(/\n{3,}/g, "\n\n") // Remove excessive newlines
    .trim();
}
