import wixData from "wix-data";
import wixSeoFrontend from "wix-seo-frontend";

const floatingHomeId = "customElement1";
const floatingLoaderUrl = "https://floting.vercel.app/wix-loader.js";
const floatingManifestUrl = "https://floting.vercel.app/build-manifest.json";
const floatingAssetBase = "https://floting.vercel.app/";
const floatingBuildVersion = "20260607-01";
const floatingTranslationEndpoint = "https://floting.vercel.app/api/translate";
const floatingTranslationStaticBase = "https://floting.vercel.app/translations/";
const floatingTranslationShadowStaticBase = "https://floting.vercel.app/translations/wix/";
const floatingDomFallbackId = "floating-home-dom-fallback";
const cmsContentCollection = "Import1";
const cmsItemsCollection = "Import2";
const floatingSeoTitle = "Floating Counselling Community | Counselling, Therapy & Community Support in Croydon";
const floatingSeoDescription =
  "Floating Counselling Community provides affordable counselling, family therapy, parenting support, food bank, financial literacy and community hub services across Croydon, Redbridge, Newham, Durham and Southwark.";
const floatingSeoImage = "https://www.floatingcounselling.co.uk/images/og-cover.jpg";
const floatingSeoUrl = "https://www.floatingcounselling.co.uk/";

function asList(selector) {
  const elements = [];

  try {
    const selection = $w(selector);

    if (selection && typeof selection.forEach === "function") {
      selection.forEach(function (element) {
        elements.push(element);
      });
      return elements;
    }

    if (selection) {
      elements.push(selection);
    }
  } catch (error) {
    // Wix throws for selectors that do not exist on a page. Ignore them.
  }

  return elements;
}

function getElementKey(element) {
  return (element && (element.uniqueId || element.id)) || "";
}

function findFloatingHomeElement() {
  const configuredElement = asList("#" + floatingHomeId)[0];

  if (configuredElement) {
    return configuredElement;
  }

  const candidates = [];

  ["CustomElement", "HtmlComponent"].forEach(function (selector) {
    asList(selector).forEach(function (element) {
      if (element && candidates.indexOf(element) === -1) {
        candidates.push(element);
      }
    });
  });

  return candidates[0] || null;
}

function findFloatingHomeDomElement() {
  try {
    if (typeof document === "undefined") {
      return null;
    }

    return (
      document.getElementById(floatingDomFallbackId) ||
      document.querySelector("floating-home") ||
      null
    );
  } catch (error) {
    return null;
  }
}

function setFloatingAttributes(element) {
  if (!element || typeof element.setAttribute !== "function") {
    return;
  }

  try {
    element.setAttribute("data-floating-manifest-url", floatingManifestUrl);
    element.setAttribute("data-floating-asset-base", floatingAssetBase);
    element.setAttribute("data-floating-build", floatingBuildVersion);
    if (floatingTranslationEndpoint) {
      element.setAttribute("data-translation-endpoint", floatingTranslationEndpoint);
    }
    element.setAttribute("data-translation-static-base", floatingTranslationStaticBase);
    element.setAttribute("data-translation-shadow-static-base", floatingTranslationShadowStaticBase);

    if (typeof element.getAttribute !== "function" || !element.getAttribute("data-cms")) {
      element.setAttribute("data-cms", "");
    }
  } catch (error) {
    // Attribute support depends on the Wix render target.
  }
}

function ensureFloatingHomeDomFallback() {
  try {
    if (typeof document === "undefined" || !document.body) {
      return null;
    }

    let element = findFloatingHomeDomElement();

    if (!element) {
      element = document.createElement("floating-home");
      element.id = floatingDomFallbackId;
      document.body.insertBefore(element, document.body.firstChild);
    }

    setFloatingAttributes(element);
    element.style.setProperty("display", "block", "important");
    element.style.setProperty("width", "100vw", "important");
    element.style.setProperty("max-width", "100vw", "important");
    element.style.setProperty("min-height", "100vh", "important");
    element.style.setProperty("min-height", "100svh", "important");
    element.style.setProperty("position", "relative", "important");
    element.style.setProperty("z-index", "2147483647", "important");
    element.style.setProperty("background", "#f4efe3", "important");
    document.body.setAttribute("data-floating-dom-fallback", "active");

    return element;
  } catch (error) {
    return null;
  }
}

function addKeepPath(element, keepIds) {
  let current = element;
  let guard = 0;

  while (current && guard < 32) {
    const key = getElementKey(current);

    if (key) {
      keepIds[key] = true;
    }

    current = current.parent;
    guard += 1;
  }
}

function getChildren(element) {
  const children = [];

  try {
    const elementChildren = element && element.children;

    if (!elementChildren) {
      return children;
    }

    if (typeof elementChildren.forEach === "function") {
      elementChildren.forEach(function (child) {
        children.push(child);
      });
      return children;
    }

    if (typeof elementChildren.length === "number") {
      for (let index = 0; index < elementChildren.length; index += 1) {
        children.push(elementChildren[index]);
      }
    }
  } catch (error) {
    // Not every Wix element exposes children consistently in editor preview.
  }

  return children;
}

function hideUnkeptChildren(element, keepIds, stopAtKey) {
  getChildren(element).forEach(function (child) {
    const key = getElementKey(child);
    const shouldKeep = key && keepIds[key];

    if (shouldKeep) {
      showElement(child);
      if (key !== stopAtKey) {
        hideUnkeptChildren(child, keepIds, stopAtKey);
      }
      return;
    }

    hideElement(child);
  });
}

function hideUnkeptAncestorChildren(element, keepIds, stopAtKey) {
  let current = element && element.parent;
  let guard = 0;

  while (current && guard < 32) {
    hideUnkeptChildren(current, keepIds, stopAtKey);
    current = current.parent;
    guard += 1;
  }
}

function safeCall(element, methodName) {
  try {
    if (element && typeof element[methodName] === "function") {
      element[methodName]();
    }
  } catch (error) {
    // Some Wix structural elements expose a method but reject it at runtime.
  }
}

function showElement(element) {
  safeCall(element, "expand");
  safeCall(element, "show");
}

function hideElement(element) {
  safeCall(element, "hide");
  safeCall(element, "collapse");
}

function installFloatingPageGuards() {
  try {
    if (typeof document === "undefined") {
      return;
    }

    const styleId = "floating-page-guards";
    let style = document.getElementById(styleId);

    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }

    style.textContent = [
      "html,body{background:#f4efe3!important;overflow-x:hidden!important;}",
      "[id*='poptin' i],[class*='poptin' i],iframe[src*='poptin' i],a[href*='poptin.com' i]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}",
      "[data-floating-home-hidden='true']{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;overflow:hidden!important;}",
      "body[data-floating-dom-fallback='active']>*:not(#" + floatingDomFallbackId + "):not(script):not(style){display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;overflow:hidden!important;}",
      "floating-home{display:block!important;width:100vw!important;max-width:100vw!important;min-height:100vh!important;min-height:100svh!important;background:#f4efe3!important;}",
    ].join("");
  } catch (error) {
    // Wix can restrict direct document access in some editor contexts.
  }
}

function refreshFloatingHomeScript() {
  try {
    if (typeof document === "undefined") {
      return;
    }

    const legacyScript = document.getElementById("floating-home-script-refresh");

    if (legacyScript) {
      legacyScript.remove();
    }

    const scriptId = "floating-home-vercel-loader";
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = floatingLoaderUrl;
    script.defer = true;
    script.setAttribute("data-manifest-url", floatingManifestUrl);
    document.head.appendChild(script);
  } catch (error) {
    // Wix may restrict direct document access in some preview contexts.
  }
}

function collectPageElements() {
  const selectors = [
    "*",
    "Box",
    "Button",
    "ColumnStrip",
    "Container",
    "CustomElement",
    "Footer",
    "Header",
    "HtmlComponent",
    "Image",
    "Iframe",
    "Line",
    "Menu",
    "Repeater",
    "Section",
    "Text",
    "VectorImage",
  ];

  const seen = {};
  const elements = [];

  selectors.forEach(function (selector) {
    asList(selector).forEach(function (element) {
      const key = getElementKey(element);

      if (!key || seen[key]) {
        return;
      }

      seen[key] = true;
      elements.push(element);
    });
  });

  return elements;
}

function isStructuralPageElement(element) {
  const type = String((element && element.type) || "").toLowerCase();

  return type.indexOf("page") !== -1 || type.indexOf("document") !== -1;
}

function isCustomRenderElement(element) {
  const type = String((element && element.type) || "").toLowerCase();

  return type.indexOf("html") !== -1 || type.indexOf("iframe") !== -1;
}

function applyFloatingHomeLayout() {
  installFloatingPageGuards();

  const floatingHome = findFloatingHomeElement();

  if (!floatingHome) {
    ensureFloatingHomeDomFallback();
    return;
  }

  showElement(floatingHome);

  setFloatingAttributes(floatingHome);

  const keepIds = {};
  const floatingHomeKey = getElementKey(floatingHome);

  addKeepPath(floatingHome, keepIds);
  hideUnkeptChildren(asList("Page")[0], keepIds, floatingHomeKey);
  hideUnkeptAncestorChildren(floatingHome, keepIds, floatingHomeKey);

  collectPageElements().forEach(function (element) {
    if (!element || isStructuralPageElement(element)) {
      return;
    }

    if (isCustomRenderElement(element)) {
      showElement(element);
      return;
    }

    const key = getElementKey(element);

    if (key && keepIds[key]) {
      showElement(element);
      return;
    }

    hideElement(element);
  });

  showElement(floatingHome);
}

function normaliseCmsImage(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.src || value.url || value.fileUrl || value.value || "";
}

function normaliseCmsContentItem(item) {
  return {
    key: item.key || item.title || "",
    value: item.value || item.text || item.body || item.description || "",
    image: normaliseCmsImage(item.image || item.imageUrl || item.photo || item.logo),
    alt: item.alt || item.altText || "",
    url: item.url || item.link || item.href || "",
    enabled: item.enabled !== false,
  };
}

function normaliseCmsListItem(item) {
  return {
    section: item.section || "",
    order: Number(item.order || item.sortOrder || 0),
    title: item.title || item.name || "",
    subtitle: item.subtitle || item.tag || item.label || "",
    tag: item.tag || item.subtitle || item.label || "",
    body: item.body || item.description || item.text || item.quote || "",
    quote: item.quote || item.body || item.description || "",
    image: normaliseCmsImage(item.image || item.imageUrl || item.photo || item.logo),
    alt: item.alt || item.altText || item.title || item.name || "",
    url: item.url || item.link || item.href || "",
    ctaLabel: item.ctaLabel || item.buttonLabel || item.linkLabel || "",
    email: item.email || "",
    role: item.role || "",
    initials: item.initials || "",
    enabled: item.enabled !== false,
  };
}

function queryCollection(collectionName) {
  return wixData
    .query(collectionName)
    .limit(1000)
    .find({ suppressAuth: true, consistentRead: true })
    .then(function (result) {
      return result.items || [];
    })
    .catch(function () {
      return [];
    });
}

function loadFloatingCms() {
  return Promise.all([
    queryCollection(cmsContentCollection),
    queryCollection(cmsItemsCollection),
  ]).then(function (results) {
    return {
      content: results[0]
        .map(normaliseCmsContentItem)
        .filter(function (item) {
          return item.enabled && item.key;
        }),
      items: results[1]
        .map(normaliseCmsListItem)
        .filter(function (item) {
          return item.enabled && item.section;
        }),
    };
  });
}

function applyFloatingCms(payload) {
  const floatingHome = findFloatingHomeElement() || findFloatingHomeDomElement();

  if (!floatingHome || !payload) {
    return;
  }

  if (!payload.content.length && !payload.items.length) {
    if (typeof floatingHome.setAttribute === "function") {
      try {
        floatingHome.setAttribute("data-cms-status", "empty");
        floatingHome.setAttribute("data-cms-content-count", "0");
        floatingHome.setAttribute("data-cms-items-count", "0");
      } catch (error) {
        // Attribute support depends on the Wix render target.
      }
    }
    return;
  }

  if (typeof floatingHome.setAttribute === "function") {
    try {
      floatingHome.setAttribute("data-cms", JSON.stringify(payload));
      floatingHome.setAttribute("data-cms-status", "loaded");
      floatingHome.setAttribute("data-cms-content-count", String(payload.content.length));
      floatingHome.setAttribute("data-cms-items-count", String(payload.items.length));
    } catch (error) {
      // Keep the static fallback if Wix rejects a large attribute update.
      try {
        floatingHome.setAttribute("data-cms-status", "attribute-error");
      } catch (attributeError) {
        // Ignore secondary diagnostics failures.
      }
    }
  }
}

function applyFloatingSeo() {
  try {
    wixSeoFrontend.setTitle(floatingSeoTitle).catch(function () {});
    wixSeoFrontend
      .setMetaTags([
        { name: "description", content: floatingSeoDescription },
        { name: "robots", content: "index, follow, max-image-preview:large" },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Floating Counselling" },
        { property: "og:title", content: "Floating Counselling - Counselling, Community & Compassion" },
        { property: "og:description", content: floatingSeoDescription },
        { property: "og:url", content: floatingSeoUrl },
        { property: "og:image", content: floatingSeoImage },
        {
          property: "og:image:alt",
          content: "Floating Counselling provides trauma-informed counselling and community support",
        },
        { property: "og:locale", content: "en_GB" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@FloatCounsellor" },
        { name: "twitter:title", content: "Floating Counselling - Counselling, Community & Compassion" },
        { name: "twitter:description", content: floatingSeoDescription },
        { name: "twitter:image", content: floatingSeoImage },
        {
          name: "twitter:image:alt",
          content: "Floating Counselling provides trauma-informed counselling and community support",
        },
      ])
      .catch(function () {});
    wixSeoFrontend
      .setStructuredData([
        {
          "@context": "https://schema.org",
          "@type": "NGO",
          "@id": "https://www.floatingcounselling.co.uk/#organization",
          name: "Floating Counselling",
          legalName: "FLOATING COUNSELLING COMMUNITY",
          alternateName: "Floating Counselling Community",
          url: floatingSeoUrl,
          logo: "https://www.floatingcounselling.co.uk/images/logo.png",
          image: floatingSeoImage,
          description:
            "UK-based grassroots charity delivering affordable counselling, family therapy, parenting support, food bank, financial literacy, employment support, holiday school and community hub services.",
          foundingDate: "2015",
          identifier: "Company limited by guarantee registered in England and Wales, company number 11334515",
          email: "info@floatingcounselling.co.uk",
          telephone: "+44-7305-882959",
          areaServed: ["Croydon", "Redbridge", "Newham", "Durham", "Southwark", "London", "United Kingdom"],
          knowsAbout: [
            "Counselling",
            "Psychotherapy",
            "Family therapy",
            "Parenting support",
            "Trauma-informed care",
            "Community hub support",
            "Food bank support",
            "Financial literacy",
            "Employment support",
            "Holiday school",
          ],
          sameAs: [
            "https://www.facebook.com/FloatingCounselling",
            "https://www.instagram.com/floating_bodymindsoul",
            "https://twitter.com/FloatCounsellor",
            "https://www.youtube.com/@floatingcounsellinguk",
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": "https://www.floatingcounselling.co.uk/#website",
          url: floatingSeoUrl,
          name: "Floating Counselling",
          publisher: { "@id": "https://www.floatingcounselling.co.uk/#organization" },
          inLanguage: "en-GB",
        },
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": "https://www.floatingcounselling.co.uk/#webpage",
          url: floatingSeoUrl,
          name: floatingSeoTitle,
          description: floatingSeoDescription,
          isPartOf: { "@id": "https://www.floatingcounselling.co.uk/#website" },
          about: { "@id": "https://www.floatingcounselling.co.uk/#organization" },
          inLanguage: "en-GB",
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": "https://www.floatingcounselling.co.uk/#faq-schema",
          mainEntity: [
            {
              "@type": "Question",
              name: "How much does counselling cost?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Sessions are free or low-cost for eligible individuals. Floating Counselling works on a sliding scale based on circumstances, with access as the priority.",
              },
            },
            {
              "@type": "Question",
              name: "Where does Floating Counselling work?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Floating Counselling serves Croydon, Redbridge, Newham, Durham and Southwark, with a Croydon hub at Ashburton Park Cafe Hall and additional project locations.",
              },
            },
          ],
        },
      ])
      .catch(function () {});
  } catch (error) {
    // SEO API availability can differ between editor, preview and published modes.
  }
}

$w.onReady(function () {
  applyFloatingSeo();
  refreshFloatingHomeScript();
  installFloatingPageGuards();

  [0, 40, 120, 250, 700, 1500, 3000, 6000, 10000].forEach(function (delay) {
    setTimeout(applyFloatingHomeLayout, delay);
  });

  loadFloatingCms().then(function (payload) {
    [0, 250, 1000, 2500].forEach(function (delay) {
      setTimeout(function () {
        applyFloatingCms(payload);
      }, delay);
    });
  });
});
