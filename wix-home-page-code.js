import wixData from "wix-data";

const floatingHomeId = "customElement1";
const floatingBuildVersion = "20260510-12";
const cmsContentCollection = "FloatingHomeContent";
const cmsItemsCollection = "FloatingHomeItems";

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

function addKeepPath(element, keepIds) {
  let current = element;
  let guard = 0;

  while (current && guard < 32) {
    if (current.id) {
      keepIds[current.id] = true;
    }

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
      const key = element && (element.uniqueId || element.id);

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

function applyFloatingHomeLayout() {
  const floatingHome = asList("#" + floatingHomeId)[0];

  if (!floatingHome) {
    return;
  }

  const keepIds = {};
  addKeepPath(floatingHome, keepIds);

  collectPageElements().forEach(function (element) {
    if (!element || isStructuralPageElement(element)) {
      return;
    }

    if (element.id && keepIds[element.id]) {
      showElement(element);
      return;
    }

    hideElement(element);
  });

  showElement(floatingHome);

  if (typeof floatingHome.setAttribute === "function") {
    try {
      floatingHome.setAttribute("data-floating-build", floatingBuildVersion);
    } catch (error) {
      // Attribute support depends on the Wix custom element render target.
    }
  }
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
  const floatingHome = asList("#" + floatingHomeId)[0];

  if (!floatingHome || !payload) {
    return;
  }

  if (!payload.content.length && !payload.items.length) {
    return;
  }

  if (typeof floatingHome.setAttribute === "function") {
    try {
      floatingHome.setAttribute("data-cms", JSON.stringify(payload));
    } catch (error) {
      // Keep the static fallback if Wix rejects a large attribute update.
    }
  }
}

$w.onReady(function () {
  [0, 80, 250, 700, 1500, 3000, 6000].forEach(function (delay) {
    setTimeout(applyFloatingHomeLayout, delay);
  });

  loadFloatingCms().then(function (payload) {
    applyFloatingCms(payload);

    [120, 600, 1600].forEach(function (delay) {
      setTimeout(function () {
        applyFloatingCms(payload);
      }, delay);
    });
  });
});
