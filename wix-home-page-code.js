const floatingHomeId = "customElement1";
const floatingBuildVersion = "20260510-11";

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

$w.onReady(function () {
  [0, 80, 250, 700, 1500, 3000, 6000].forEach(function (delay) {
    setTimeout(applyFloatingHomeLayout, delay);
  });
});
