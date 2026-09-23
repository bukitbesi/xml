import fs from 'fs';

let xml = fs.readFileSync('blogger/backups/original-2026-07-23.xml', 'utf8');

// 1. Extract CSS to external file
let cssStartIndex = xml.indexOf('/*-- CSS Variables --*/');
let bskinEndIndex = xml.indexOf(']]></b:skin>', cssStartIndex);

if (cssStartIndex !== -1 && bskinEndIndex !== -1) {
    let cssContent = xml.substring(cssStartIndex, bskinEndIndex);
    fs.writeFileSync('blogger/v4-seo-pro/theme.css', cssContent);
    console.log('CSS extracted to theme.css');

    // Replace inline CSS with external CSS link inside the skin tag
    xml = xml.substring(0, cssStartIndex) + 
          '/* CSS hosted externally for Top-Tier LCP & Performance */\n    ]]></b:skin>' + 
          xml.substring(bskinEndIndex + ']]></b:skin>'.length);
}

// 2. Put <meta charset> first in <head> and load the extracted theme CSS.
// Titles, descriptions, OG/Twitter tags and JSON-LD are already emitted by the
// pbt-head includable and the schema block, so nothing is duplicated here.
xml = xml.replace(/\s*<meta charset='utf-8'\/>/, '');
const headBlock = `
      <meta charset='utf-8'/>
      <!-- Theme CSS hosted externally (extracted from b:skin) -->
      <link as='style' href='https://cdn.jsdelivr.net/gh/bukitbesi/blogger-xml@main/blogger/v4-seo-pro/theme.css' rel='preload'/>
      <link href='https://cdn.jsdelivr.net/gh/bukitbesi/blogger-xml@main/blogger/v4-seo-pro/theme.css' rel='stylesheet' type='text/css'/>
`;
xml = xml.replace(/<head>/, "<head>" + headBlock);

// Post/page descriptions: one tag each, falling back to the blog description.
const descFallback = "expr:content='data:view.description ? data:view.description.escaped : data:blog.metaDescription.escaped'";
xml = xml.replace(/(<b:elseif cond='data:view\.isPost'\/>\s*<title>[^\n]*\n\s*<meta )expr:content='data:view\.description\.escaped'/, '$1' + descFallback);
xml = xml.replace(/(<b:elseif cond='data:view\.isPage'\/>\s*<title>[^\n]*\n\s*<meta )expr:content='data:view\.description\.escaped'( name='description'\/>)\s*<meta expr:content='data:blog\.metaDescription\.escaped' name='description'\/>/, '$1' + descFallback + '$2');

// Drop the no-op "Force Canonical URL" script (its if-body is empty).
xml = xml.replace(/\s*<script type='text\/javascript'>\s*\/\/<!\[CDATA\[\s*\/\/ Force Canonical URL[\s\S]*?<\/script>/, '');

// 3. Prevent Blogger Default JS & CSS from ruining performance
// Only add attributes that are missing — a duplicate attribute makes the XML invalid.
xml = xml.replace(/<html([^>]*)>/, (m, attrs) =>
    '<html' + attrs +
    (/\bb:css=/.test(attrs) ? '' : " b:css='false'") +
    (/\bb:js=/.test(attrs) ? '' : " b:js='false'") + '>');

// 4. Strip jQuery scripts and inline dependencies completely
xml = xml.replace(/<b:tag name='script' src='https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/jquery\/[^']+' type='text\/javascript'\/>/g, '');

// Strip the big inline `<script>` tags carrying jQuery execution logic
let jqScriptStart = xml.indexOf('$(".main-search").each(function()');
if(jqScriptStart !== -1) {
    // The jQuery block is wrapped in <b:tag name='script'>…</b:tag>, not <script>.
    // Searching back for '<script' lands inside the footer ad's CDATA and deletes the footer.
    const openTag = "<b:tag name='script' type='text/javascript'>";
    let actualStart = xml.lastIndexOf(openTag, jqScriptStart);
    let closeIdx = xml.indexOf('</b:tag>', jqScriptStart);
    let actualEnd = closeIdx + '</b:tag>'.length;
    if (actualStart !== -1 && closeIdx !== -1) {
        xml = xml.substring(0, actualStart) + xml.substring(actualEnd);
        console.log("Removed embedded jQuery logic.");
    }
}

// 5. Inject our new Vanilla JS right before </body>
const vanillaJsBlock = `
  <!-- Vanilla JS Engine - Core Web Vitals Optimized -->
  <script defer="defer" src="https://cdn.jsdelivr.net/gh/bukitbesi/blogger-xml@main/blogger/v4-seo-pro/theme.js"></script>
`;
xml = xml.replace(/<\/body>/, vanillaJsBlock + '\n</body>');

// 6. Fix "Service worker or manifest references" (Rule constraint)
xml = xml.replace(/<link[^>]*manifest\.json[^>]*\/>/g, '');
xml = xml.replace(/<script[^>]*sw\.js[^>]*><\/script>/g, '');
// Remove the whole SW registration <script>; stripping only the register() call
// leaves a dangling `.then(...)` and a syntax error.
xml = xml.replace(/\s*<script type='text\/javascript'>\s*\/\/<!\[CDATA\[\s*if \('serviceWorker' in navigator\)[\s\S]*?<\/script>/, '');
xml = xml.replace(/navigator\.serviceWorker\.register\([^)]+\)/g, '');

// The table-wrapper script sits on the same line as `//<![CDATA[`, so it is
// commented out and never runs. Put the code on its own line.
xml = xml.replace(/\/\/<!\[CDATA\[(document\.addEventListener\("DOMContentLoaded"[^\n]*?)\/\/\]\]>/, '//<![CDATA[\n$1\n//]]>');

// 7. Fix "History manipulation used as canonicalization"
xml = xml.replace(/window\.history\.replaceState\([^)]+\);/g, '');

// 8. Remove duplicate hreflangs (English to same URL)
xml = xml.replace(/<link expr:href='data:view\.url\.canonical' hreflang='en' rel='alternate'\/>/g, '');
xml = xml.replace(/<link expr:href='data:view\.url\.canonical' hreflang='x-default' rel='alternate'\/>/g, '');

// 9. Remove outdated / messy article schema found at the bottom
let oldSchema = xml.indexOf('<!-- Enhanced NewsArticle JSON-LD');
if (oldSchema !== -1) {
    let oldSchemaEnd = xml.indexOf('</b:if>', oldSchema) + 7;
    xml = xml.substring(0, oldSchema) + xml.substring(oldSchemaEnd);
    console.log("Removed old schema.");
}

// Output final XML
fs.writeFileSync('blogger/v4-seo-pro/thebukitbesi.xml', xml);
console.log('Build complete. v4-seo-pro ready.');
