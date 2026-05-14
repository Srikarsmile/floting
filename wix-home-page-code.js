import wixData from "wix-data";

const floatingHomeId = "customElement1";
const floatingBuildVersion = "20260514-04";
const cmsContentCollection = "Import1";
const cmsItemsCollection = "Import2";

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
  const floatingHome = findFloatingHomeElement();

  if (!floatingHome) {
    return;
  }

  showElement(floatingHome);

  if (typeof floatingHome.setAttribute === "function") {
    try {
      floatingHome.setAttribute("data-floating-build", floatingBuildVersion);
    } catch (error) {
      // Attribute support depends on the Wix custom element render target.
    }
  }

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
  const floatingHome = findFloatingHomeElement();

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
    applyFloatingHomeLayout();
    applyFloatingCms(payload);

    [120, 600, 1600].forEach(function (delay) {
      setTimeout(function () {
        applyFloatingCms(payload);
      }, delay);
    });
  });
});
