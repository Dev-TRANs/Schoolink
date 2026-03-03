var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index2 = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index2) {
        throw new Error("next() called multiple times");
      }
      index2 = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    form[key] = value;
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index2) => {
    if (index2 === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match, index2) => {
    const mark = `@${index2}`;
    groups.push([mark, match]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match[1], new RegExp(`^${match[2]}(?=/${next})`)] : [label, match[1], new RegExp(`^${match[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match) => {
      try {
        return decoder(match);
      } catch {
        return match;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", 8);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? decodeURIComponent_(value) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf(`?${key}`, 8);
    if (keyIndex2 === -1) {
      keyIndex2 = url.indexOf(`&${key}`, 8);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param ? /\%/.test(param) ? tryDecodeURIComponent(param) : param : void 0;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value && typeof value === "string") {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  json() {
    return this.#cachedBody("json");
  }
  text() {
    return this.#cachedBody("text");
  }
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  blob() {
    return this.#cachedBody("blob");
  }
  formData() {
    return this.#cachedBody("formData");
  }
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setHeaders = /* @__PURE__ */ __name((headers, map = {}) => {
  for (const key of Object.keys(map)) {
    headers.set(key, map[key]);
  }
  return headers;
}, "setHeaders");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  env = {};
  #var;
  finalized = false;
  error;
  #status = 200;
  #executionCtx;
  #headers;
  #preparedHeaders;
  #res;
  #isFresh = true;
  #layout;
  #renderer;
  #notFoundHandler;
  #matchResult;
  #path;
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    this.#isFresh = false;
    return this.#res ||= new Response("404 Not Found", { status: 404 });
  }
  set res(_res) {
    this.#isFresh = false;
    if (this.#res && _res) {
      try {
        for (const [k, v] of this.#res.headers.entries()) {
          if (k === "content-type") {
            continue;
          }
          if (k === "set-cookie") {
            const cookies = this.#res.headers.getSetCookie();
            _res.headers.delete("set-cookie");
            for (const cookie of cookies) {
              _res.headers.append("set-cookie", cookie);
            }
          } else {
            _res.headers.set(k, v);
          }
        }
      } catch (e) {
        if (e instanceof TypeError && e.message.includes("immutable")) {
          this.res = new Response(_res.body, {
            headers: _res.headers,
            status: _res.status
          });
          return;
        } else {
          throw e;
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (value === void 0) {
      if (this.#headers) {
        this.#headers.delete(name);
      } else if (this.#preparedHeaders) {
        delete this.#preparedHeaders[name.toLocaleLowerCase()];
      }
      if (this.finalized) {
        this.res.headers.delete(name);
      }
      return;
    }
    if (options?.append) {
      if (!this.#headers) {
        this.#isFresh = false;
        this.#headers = new Headers(this.#preparedHeaders);
        this.#preparedHeaders = {};
      }
      this.#headers.append(name, value);
    } else {
      if (this.#headers) {
        this.#headers.set(name, value);
      } else {
        this.#preparedHeaders ??= {};
        this.#preparedHeaders[name.toLowerCase()] = value;
      }
    }
    if (this.finalized) {
      if (options?.append) {
        this.res.headers.append(name, value);
      } else {
        this.res.headers.set(name, value);
      }
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#isFresh = false;
    this.#status = status;
  }, "status");
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    if (this.#isFresh && !headers && !arg && this.#status === 200) {
      return new Response(data, {
        headers: this.#preparedHeaders
      });
    }
    if (arg && typeof arg !== "number") {
      const header = new Headers(arg.headers);
      if (this.#headers) {
        this.#headers.forEach((v, k) => {
          if (k === "set-cookie") {
            header.append(k, v);
          } else {
            header.set(k, v);
          }
        });
      }
      const headers2 = setHeaders(header, this.#preparedHeaders);
      return new Response(data, {
        headers: headers2,
        status: arg.status ?? this.#status
      });
    }
    const status = typeof arg === "number" ? arg : this.#status;
    this.#preparedHeaders ??= {};
    this.#headers ??= new Headers();
    setHeaders(this.#headers, this.#preparedHeaders);
    if (this.#res) {
      this.#res.headers.forEach((v, k) => {
        if (k === "set-cookie") {
          this.#headers?.append(k, v);
        } else {
          this.#headers?.set(k, v);
        }
      });
      setHeaders(this.#headers, this.#preparedHeaders);
    }
    headers ??= {};
    for (const [k, v] of Object.entries(headers)) {
      if (typeof v === "string") {
        this.#headers.set(k, v);
      } else {
        this.#headers.delete(k);
        for (const v2 of v) {
          this.#headers.append(k, v2);
        }
      }
    }
    return new Response(data, {
      status,
      headers: this.#headers
    });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  body = /* @__PURE__ */ __name((data, arg, headers) => {
    return typeof arg === "number" ? this.#newResponse(data, arg, headers) : this.#newResponse(data, arg);
  }, "body");
  text = /* @__PURE__ */ __name((text2, arg, headers) => {
    if (!this.#preparedHeaders) {
      if (this.#isFresh && !headers && !arg) {
        return new Response(text2);
      }
      this.#preparedHeaders = {};
    }
    this.#preparedHeaders["content-type"] = TEXT_PLAIN;
    if (typeof arg === "number") {
      return this.#newResponse(text2, arg, headers);
    }
    return this.#newResponse(text2, arg);
  }, "text");
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    const body = JSON.stringify(object);
    this.#preparedHeaders ??= {};
    this.#preparedHeaders["content-type"] = "application/json";
    return typeof arg === "number" ? this.#newResponse(body, arg, headers) : this.#newResponse(body, arg);
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    this.#preparedHeaders ??= {};
    this.#preparedHeaders["content-type"] = "text/html; charset=UTF-8";
    if (typeof html === "object") {
      return resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then((html2) => {
        return typeof arg === "number" ? this.#newResponse(html2, arg, headers) : this.#newResponse(html2, arg);
      });
    }
    return typeof arg === "number" ? this.#newResponse(html, arg, headers) : this.#newResponse(html, arg);
  }, "html");
  redirect = /* @__PURE__ */ __name((location, status) => {
    this.#headers ??= new Headers();
    this.#headers.set("Location", String(location));
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    return err.getResponse();
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class {
  static {
    __name(this, "Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  route(path, app12) {
    const subApp = this.basePath(path);
    app12.routes.map((r) => {
      let handler;
      if (app12.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app12.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        replaceRequest = options.replaceRequest;
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class {
  static {
    __name(this, "Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index2, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index2;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new Node();
      }
    }
    node.insert(restTokens, index2, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index2, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index2, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var emptyParam = [];
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes2) {
  const trie = new Trie();
  const handlerData = [];
  if (routes2.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes2.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes2 = this.#routes;
    if (!middleware || !routes2) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes2].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes2).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes2[m]).forEach(
            (p) => re.test(p) && routes2[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes2).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes2[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes2[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match(method, path) {
    clearWildcardRegExpCache();
    const matchers = this.#buildAllMatchers();
    this.match = (method2, path2) => {
      const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
      const staticMatch = matcher[2][path2];
      if (staticMatch) {
        return staticMatch;
      }
      const match = path2.match(matcher[0]);
      if (!match) {
        return [[], emptyParam];
      }
      const index2 = match.indexOf("", 1);
      return [matcher[1][index2], match];
    };
    return this.match(method, path);
  }
  #buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    return matchers;
  }
  #buildMatcher(method) {
    const routes2 = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes2.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes2.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes2);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes2 = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes2.length; i2 < len2; i2++) {
          router.add(...routes2[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class {
  static {
    __name(this, "Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (Object.keys(curNode.#children).includes(key)) {
        curNode = curNode.#children[key];
        const pattern2 = getPattern(p, nextP);
        if (pattern2) {
          possibleKeys.push(pattern2[1]);
        }
        continue;
      }
      curNode.#children[key] = new Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    const m = /* @__PURE__ */ Object.create(null);
    const handlerSet = {
      handler,
      possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
      score: this.#order
    };
    m[method] = handlerSet;
    curNode.#methods.push(m);
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          if (part === "") {
            continue;
          }
          const [key, name, matcher] = pattern;
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/drizzle-orm/entity.js
var entityKind = Symbol.for("drizzle:entityKind");
var hasOwnEntityKind = Symbol.for("drizzle:hasOwnEntityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}
__name(is, "is");

// node_modules/drizzle-orm/logger.js
var ConsoleLogWriter = class {
  static {
    __name(this, "ConsoleLogWriter");
  }
  static [entityKind] = "ConsoleLogWriter";
  write(message) {
    console.log(message);
  }
};
var DefaultLogger = class {
  static {
    __name(this, "DefaultLogger");
  }
  static [entityKind] = "DefaultLogger";
  writer;
  constructor(config) {
    this.writer = config?.writer ?? new ConsoleLogWriter();
  }
  logQuery(query, params) {
    const stringifiedParams = params.map((p) => {
      try {
        return JSON.stringify(p);
      } catch {
        return String(p);
      }
    });
    const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
    this.writer.write(`Query: ${query}${paramsStr}`);
  }
};
var NoopLogger = class {
  static {
    __name(this, "NoopLogger");
  }
  static [entityKind] = "NoopLogger";
  logQuery() {
  }
};

// node_modules/drizzle-orm/table.utils.js
var TableName = Symbol.for("drizzle:Name");

// node_modules/drizzle-orm/table.js
var Schema = Symbol.for("drizzle:Schema");
var Columns = Symbol.for("drizzle:Columns");
var ExtraConfigColumns = Symbol.for("drizzle:ExtraConfigColumns");
var OriginalName = Symbol.for("drizzle:OriginalName");
var BaseName = Symbol.for("drizzle:BaseName");
var IsAlias = Symbol.for("drizzle:IsAlias");
var ExtraConfigBuilder = Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = Symbol.for("drizzle:IsDrizzleTable");
var Table = class {
  static {
    __name(this, "Table");
  }
  static [entityKind] = "Table";
  /** @internal */
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  /**
   * @internal
   * Can be changed if the table is aliased.
   */
  [TableName];
  /**
   * @internal
   * Used to store the original name of the table, before any aliasing.
   */
  [OriginalName];
  /** @internal */
  [Schema];
  /** @internal */
  [Columns];
  /** @internal */
  [ExtraConfigColumns];
  /**
   *  @internal
   * Used to store the table name before the transformation via the `tableCreator` functions.
   */
  [BaseName];
  /** @internal */
  [IsAlias] = false;
  /** @internal */
  [IsDrizzleTable] = true;
  /** @internal */
  [ExtraConfigBuilder] = void 0;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
};
function getTableName(table) {
  return table[TableName];
}
__name(getTableName, "getTableName");
function getTableUniqueName(table) {
  return `${table[Schema] ?? "public"}.${table[TableName]}`;
}
__name(getTableUniqueName, "getTableUniqueName");

// node_modules/drizzle-orm/column.js
var Column = class {
  static {
    __name(this, "Column");
  }
  constructor(table, config) {
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.keyAsName = config.keyAsName;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.onUpdateFn = config.onUpdateFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
    this.generated = config.generated;
    this.generatedIdentity = config.generatedIdentity;
  }
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = void 0;
  generated = void 0;
  generatedIdentity = void 0;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
};

// node_modules/drizzle-orm/column-builder.js
var ColumnBuilder = class {
  static {
    __name(this, "ColumnBuilder");
  }
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $defaultFn}.
   */
  $default = this.$defaultFn;
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $onUpdateFn}.
   */
  $onUpdate = this.$onUpdateFn;
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
  setName(name) {
    if (this.config.name !== "")
      return;
    this.config.name = name;
  }
};

// node_modules/drizzle-orm/pg-core/foreign-keys.js
var ForeignKeyBuilder = class {
  static {
    __name(this, "ForeignKeyBuilder");
  }
  static [entityKind] = "PgForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate = "no action";
  /** @internal */
  _onDelete = "no action";
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action === void 0 ? "no action" : action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action === void 0 ? "no action" : action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
};
var ForeignKey = class {
  static {
    __name(this, "ForeignKey");
  }
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "PgForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};

// node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
  return fn(...args);
}
__name(iife, "iife");

// node_modules/drizzle-orm/pg-core/unique-constraint.js
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
__name(uniqueKeyName, "uniqueKeyName");
var UniqueConstraintBuilder = class {
  static {
    __name(this, "UniqueConstraintBuilder");
  }
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "PgUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  nullsNotDistinctConfig = false;
  nullsNotDistinct() {
    this.nullsNotDistinctConfig = true;
    return this;
  }
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
  }
};
var UniqueOnConstraintBuilder = class {
  static {
    __name(this, "UniqueOnConstraintBuilder");
  }
  static [entityKind] = "PgUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder(columns, this.name);
  }
};
var UniqueConstraint = class {
  static {
    __name(this, "UniqueConstraint");
  }
  constructor(table, columns, nullsNotDistinct, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
    this.nullsNotDistinct = nullsNotDistinct;
  }
  static [entityKind] = "PgUniqueConstraint";
  columns;
  name;
  nullsNotDistinct = false;
  getName() {
    return this.name;
  }
};

// node_modules/drizzle-orm/pg-core/utils/array.js
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i = startFrom; i < arrayString.length; i++) {
    const char = arrayString[i];
    if (char === "\\") {
      i++;
      continue;
    }
    if (char === '"') {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char === "," || char === "}") {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
__name(parsePgArrayValue, "parsePgArrayValue");
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i = startFrom;
  let lastCharIsComma = false;
  while (i < arrayString.length) {
    const char = arrayString[i];
    if (char === ",") {
      if (lastCharIsComma || i === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i++;
      continue;
    }
    lastCharIsComma = false;
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    if (char === "}") {
      return [result, i + 1];
    }
    if (char === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
    result.push(value);
    i = newStartFrom;
  }
  return [result, i];
}
__name(parsePgNestedArray, "parsePgNestedArray");
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
__name(parsePgArray, "parsePgArray");
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}
__name(makePgArray, "makePgArray");

// node_modules/drizzle-orm/pg-core/columns/common.js
var PgColumnBuilder = class extends ColumnBuilder {
  static {
    __name(this, "PgColumnBuilder");
  }
  foreignKeyConfigs = [];
  static [entityKind] = "PgColumnBuilder";
  array(size) {
    return new PgArrayBuilder(this.config.name, this, size);
  }
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name, config) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    this.config.uniqueType = config?.nulls;
    return this;
  }
  generatedAlwaysAs(as) {
    this.config.generated = {
      as,
      type: "always",
      mode: "stored"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return iife(
        (ref2, actions2) => {
          const builder = new ForeignKeyBuilder(() => {
            const foreignColumn = ref2();
            return { columns: [column], foreignColumns: [foreignColumn] };
          });
          if (actions2.onUpdate) {
            builder.onUpdate(actions2.onUpdate);
          }
          if (actions2.onDelete) {
            builder.onDelete(actions2.onDelete);
          }
          return builder.build(table);
        },
        ref,
        actions
      );
    });
  }
  /** @internal */
  buildExtraConfigColumn(table) {
    return new ExtraConfigColumn(table, this.config);
  }
};
var PgColumn = class extends Column {
  static {
    __name(this, "PgColumn");
  }
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "PgColumn";
};
var ExtraConfigColumn = class extends PgColumn {
  static {
    __name(this, "ExtraConfigColumn");
  }
  static [entityKind] = "ExtraConfigColumn";
  getSQLType() {
    return this.getSQLType();
  }
  indexConfig = {
    order: this.config.order ?? "asc",
    nulls: this.config.nulls ?? "last",
    opClass: this.config.opClass
  };
  defaultConfig = {
    order: "asc",
    nulls: "last",
    opClass: void 0
  };
  asc() {
    this.indexConfig.order = "asc";
    return this;
  }
  desc() {
    this.indexConfig.order = "desc";
    return this;
  }
  nullsFirst() {
    this.indexConfig.nulls = "first";
    return this;
  }
  nullsLast() {
    this.indexConfig.nulls = "last";
    return this;
  }
  /**
   * ### PostgreSQL documentation quote
   *
   * > An operator class with optional parameters can be specified for each column of an index.
   * The operator class identifies the operators to be used by the index for that column.
   * For example, a B-tree index on four-byte integers would use the int4_ops class;
   * this operator class includes comparison functions for four-byte integers.
   * In practice the default operator class for the column's data type is usually sufficient.
   * The main point of having operator classes is that for some data types, there could be more than one meaningful ordering.
   * For example, we might want to sort a complex-number data type either by absolute value or by real part.
   * We could do this by defining two operator classes for the data type and then selecting the proper class when creating an index.
   * More information about operator classes check:
   *
   * ### Useful links
   * https://www.postgresql.org/docs/current/sql-createindex.html
   *
   * https://www.postgresql.org/docs/current/indexes-opclass.html
   *
   * https://www.postgresql.org/docs/current/xindex.html
   *
   * ### Additional types
   * If you have the `pg_vector` extension installed in your database, you can use the
   * `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops`, `bit_hamming_ops`, `bit_jaccard_ops`, `halfvec_l2_ops`, `sparsevec_l2_ops` options, which are predefined types.
   *
   * **You can always specify any string you want in the operator class, in case Drizzle doesn't have it natively in its types**
   *
   * @param opClass
   * @returns
   */
  op(opClass) {
    this.indexConfig.opClass = opClass;
    return this;
  }
};
var IndexedColumn = class {
  static {
    __name(this, "IndexedColumn");
  }
  static [entityKind] = "IndexedColumn";
  constructor(name, keyAsName, type, indexConfig) {
    this.name = name;
    this.keyAsName = keyAsName;
    this.type = type;
    this.indexConfig = indexConfig;
  }
  name;
  keyAsName;
  type;
  indexConfig;
};
var PgArrayBuilder = class extends PgColumnBuilder {
  static {
    __name(this, "PgArrayBuilder");
  }
  static [entityKind] = "PgArrayBuilder";
  constructor(name, baseBuilder, size) {
    super(name, "array", "PgArray");
    this.config.baseBuilder = baseBuilder;
    this.config.size = size;
  }
  /** @internal */
  build(table) {
    const baseColumn = this.config.baseBuilder.build(table);
    return new PgArray(
      table,
      this.config,
      baseColumn
    );
  }
};
var PgArray = class _PgArray extends PgColumn {
  static {
    __name(this, "PgArray");
  }
  constructor(table, config, baseColumn, range) {
    super(table, config);
    this.baseColumn = baseColumn;
    this.range = range;
    this.size = config.size;
  }
  size;
  static [entityKind] = "PgArray";
  getSQLType() {
    return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      value = parsePgArray(value);
    }
    return value.map((v) => this.baseColumn.mapFromDriverValue(v));
  }
  mapToDriverValue(value, isNestedArray = false) {
    const a = value.map(
      (v) => v === null ? null : is(this.baseColumn, _PgArray) ? this.baseColumn.mapToDriverValue(v, true) : this.baseColumn.mapToDriverValue(v)
    );
    if (isNestedArray)
      return a;
    return makePgArray(a);
  }
};

// node_modules/drizzle-orm/pg-core/columns/enum.js
var isPgEnumSym = Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
__name(isPgEnum, "isPgEnum");
var PgEnumColumnBuilder = class extends PgColumnBuilder {
  static {
    __name(this, "PgEnumColumnBuilder");
  }
  static [entityKind] = "PgEnumColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumColumn(
      table,
      this.config
    );
  }
};
var PgEnumColumn = class extends PgColumn {
  static {
    __name(this, "PgEnumColumn");
  }
  static [entityKind] = "PgEnumColumn";
  enum = this.config.enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};

// node_modules/drizzle-orm/subquery.js
var Subquery = class {
  static {
    __name(this, "Subquery");
  }
  static [entityKind] = "Subquery";
  constructor(sql2, selection, alias, isWith = false) {
    this._ = {
      brand: "Subquery",
      sql: sql2,
      selectedFields: selection,
      alias,
      isWith
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
};
var WithSubquery = class extends Subquery {
  static {
    __name(this, "WithSubquery");
  }
  static [entityKind] = "WithSubquery";
};

// node_modules/drizzle-orm/version.js
var version = "0.41.0";

// node_modules/drizzle-orm/tracing.js
var otel;
var rawTracer;
var tracer = {
  startActiveSpan(name, fn) {
    if (!otel) {
      return fn();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version);
    }
    return iife(
      (otel2, rawTracer2) => rawTracer2.startActiveSpan(
        name,
        (span) => {
          try {
            return fn(span);
          } catch (e) {
            span.setStatus({
              code: otel2.SpanStatusCode.ERROR,
              message: e instanceof Error ? e.message : "Unknown error"
              // eslint-disable-line no-instanceof/no-instanceof
            });
            throw e;
          } finally {
            span.end();
          }
        }
      ),
      otel,
      rawTracer
    );
  }
};

// node_modules/drizzle-orm/view-common.js
var ViewBaseConfig = Symbol.for("drizzle:ViewBaseConfig");

// node_modules/drizzle-orm/sql/sql.js
var FakePrimitiveParam = class {
  static {
    __name(this, "FakePrimitiveParam");
  }
  static [entityKind] = "FakePrimitiveParam";
};
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
__name(isSQLWrapper, "isSQLWrapper");
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
__name(mergeQueries, "mergeQueries");
var StringChunk = class {
  static {
    __name(this, "StringChunk");
  }
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
};
var SQL = class _SQL {
  static {
    __name(this, "SQL");
  }
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
  }
  static [entityKind] = "SQL";
  /** @internal */
  decoder = noopDecoder;
  shouldInlineParams = false;
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if (is(chunk, _SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, _SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, _SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new _SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(condition) {
    return condition ? this : void 0;
  }
};
var Name = class {
  static {
    __name(this, "Name");
  }
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
__name(isDriverValueEncoder, "isDriverValueEncoder");
var noopDecoder = {
  mapFromDriverValue: /* @__PURE__ */ __name((value) => value, "mapFromDriverValue")
};
var noopEncoder = {
  mapToDriverValue: /* @__PURE__ */ __name((value) => value, "mapToDriverValue")
};
var noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};
var Param = class {
  static {
    __name(this, "Param");
  }
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
__name(sql, "sql");
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  __name(empty, "empty");
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  __name(fromList, "fromList");
  sql2.fromList = fromList;
  function raw2(str) {
    return new SQL([new StringChunk(str)]);
  }
  __name(raw2, "raw");
  sql2.raw = raw2;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  __name(join, "join");
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  __name(identifier, "identifier");
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  __name(placeholder2, "placeholder2");
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  __name(param2, "param2");
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  class Aliased {
    static {
      __name(this, "Aliased");
    }
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    /** @internal */
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
var Placeholder = class {
  static {
    __name(this, "Placeholder");
  }
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
};
function fillPlaceholders(params, values) {
  return params.map((p) => {
    if (is(p, Placeholder)) {
      if (!(p.name in values)) {
        throw new Error(`No value for placeholder "${p.name}" was provided`);
      }
      return values[p.name];
    }
    if (is(p, Param) && is(p.value, Placeholder)) {
      if (!(p.value.name in values)) {
        throw new Error(`No value for placeholder "${p.value.name}" was provided`);
      }
      return p.encoder.mapToDriverValue(values[p.value.name]);
    }
    return p;
  });
}
__name(fillPlaceholders, "fillPlaceholders");
var IsDrizzleView = Symbol.for("drizzle:IsDrizzleView");
var View = class {
  static {
    __name(this, "View");
  }
  static [entityKind] = "View";
  /** @internal */
  [ViewBaseConfig];
  /** @internal */
  [IsDrizzleView] = true;
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
};
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

// node_modules/drizzle-orm/utils.js
function mapResultRow(columns, row, joinsNotNullableMap) {
  const nullifyMap = {};
  const result = columns.reduce(
    (result2, { path, field }, columnIndex) => {
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      let node = result2;
      for (const [pathChunkIndex, pathChunk] of path.entries()) {
        if (pathChunkIndex < path.length - 1) {
          if (!(pathChunk in node)) {
            node[pathChunk] = {};
          }
          node = node[pathChunk];
        } else {
          const rawValue = row[columnIndex];
          const value = node[pathChunk] = rawValue === null ? null : decoder.mapFromDriverValue(rawValue);
          if (joinsNotNullableMap && is(field, Column) && path.length === 2) {
            const objectName = path[0];
            if (!(objectName in nullifyMap)) {
              nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
            } else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== getTableName(field.table)) {
              nullifyMap[objectName] = false;
            }
          }
        }
      }
      return result2;
    },
    {}
  );
  if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
      if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) {
        result[objectName] = null;
      }
    }
  }
  return result;
}
__name(mapResultRow, "mapResultRow");
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name, field]) => {
    if (typeof name !== "string") {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name] : [name];
    if (is(field, Column) || is(field, SQL) || is(field, SQL.Aliased)) {
      result.push({ path: newPath, field });
    } else if (is(field, Table)) {
      result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field, newPath));
    }
    return result;
  }, []);
}
__name(orderSelectedFields, "orderSelectedFields");
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index2, key] of leftKeys.entries()) {
    if (key !== rightKeys[index2]) {
      return false;
    }
  }
  return true;
}
__name(haveSameKeys, "haveSameKeys");
function mapUpdateSet(table, values) {
  const entries = Object.entries(values).filter(([, value]) => value !== void 0).map(([key, value]) => {
    if (is(value, SQL) || is(value, Column)) {
      return [key, value];
    } else {
      return [key, new Param(value, table[Table.Symbol.Columns][key])];
    }
  });
  if (entries.length === 0) {
    throw new Error("No values to set");
  }
  return Object.fromEntries(entries);
}
__name(mapUpdateSet, "mapUpdateSet");
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name === "constructor")
        continue;
      Object.defineProperty(
        baseClass.prototype,
        name,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || /* @__PURE__ */ Object.create(null)
      );
    }
  }
}
__name(applyMixins, "applyMixins");
function getTableColumns(table) {
  return table[Table.Symbol.Columns];
}
__name(getTableColumns, "getTableColumns");
function getTableLikeName(table) {
  return is(table, Subquery) ? table._.alias : is(table, View) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}
__name(getTableLikeName, "getTableLikeName");
function getColumnNameAndConfig(a, b) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b
  };
}
__name(getColumnNameAndConfig, "getColumnNameAndConfig");

// node_modules/drizzle-orm/pg-core/table.js
var InlineForeignKeys = Symbol.for("drizzle:PgInlineForeignKeys");
var EnableRLS = Symbol.for("drizzle:EnableRLS");
var PgTable = class extends Table {
  static {
    __name(this, "PgTable");
  }
  static [entityKind] = "PgTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys,
    EnableRLS
  });
  /**@internal */
  [InlineForeignKeys] = [];
  /** @internal */
  [EnableRLS] = false;
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
  /** @internal */
  [Table.Symbol.ExtraConfigColumns] = {};
};

// node_modules/drizzle-orm/pg-core/primary-keys.js
var PrimaryKeyBuilder = class {
  static {
    __name(this, "PrimaryKeyBuilder");
  }
  static [entityKind] = "PgPrimaryKeyBuilder";
  /** @internal */
  columns;
  /** @internal */
  name;
  constructor(columns, name) {
    this.columns = columns;
    this.name = name;
  }
  /** @internal */
  build(table) {
    return new PrimaryKey(table, this.columns, this.name);
  }
};
var PrimaryKey = class {
  static {
    __name(this, "PrimaryKey");
  }
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name;
  }
  static [entityKind] = "PgPrimaryKey";
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[PgTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
};

// node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
__name(bindIfParam, "bindIfParam");
var eq = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
}, "eq");
var ne = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} <> ${bindIfParam(right, left)}`;
}, "ne");
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
__name(and, "and");
function or(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" or ")),
    new StringChunk(")")
  ]);
}
__name(or, "or");
function not(condition) {
  return sql`not ${condition}`;
}
__name(not, "not");
var gt = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} > ${bindIfParam(right, left)}`;
}, "gt");
var gte = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} >= ${bindIfParam(right, left)}`;
}, "gte");
var lt = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} < ${bindIfParam(right, left)}`;
}, "lt");
var lte = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} <= ${bindIfParam(right, left)}`;
}, "lte");
function inArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`false`;
    }
    return sql`${column} in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} in ${bindIfParam(values, column)}`;
}
__name(inArray, "inArray");
function notInArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`true`;
    }
    return sql`${column} not in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} not in ${bindIfParam(values, column)}`;
}
__name(notInArray, "notInArray");
function isNull(value) {
  return sql`${value} is null`;
}
__name(isNull, "isNull");
function isNotNull(value) {
  return sql`${value} is not null`;
}
__name(isNotNull, "isNotNull");
function exists(subquery) {
  return sql`exists ${subquery}`;
}
__name(exists, "exists");
function notExists(subquery) {
  return sql`not exists ${subquery}`;
}
__name(notExists, "notExists");
function between(column, min, max) {
  return sql`${column} between ${bindIfParam(min, column)} and ${bindIfParam(
    max,
    column
  )}`;
}
__name(between, "between");
function notBetween(column, min, max) {
  return sql`${column} not between ${bindIfParam(
    min,
    column
  )} and ${bindIfParam(max, column)}`;
}
__name(notBetween, "notBetween");
function like(column, value) {
  return sql`${column} like ${value}`;
}
__name(like, "like");
function notLike(column, value) {
  return sql`${column} not like ${value}`;
}
__name(notLike, "notLike");
function ilike(column, value) {
  return sql`${column} ilike ${value}`;
}
__name(ilike, "ilike");
function notIlike(column, value) {
  return sql`${column} not ilike ${value}`;
}
__name(notIlike, "notIlike");

// node_modules/drizzle-orm/sql/expressions/select.js
function asc(column) {
  return sql`${column} asc`;
}
__name(asc, "asc");
function desc(column) {
  return sql`${column} desc`;
}
__name(desc, "desc");

// node_modules/drizzle-orm/relations.js
var Relation = class {
  static {
    __name(this, "Relation");
  }
  constructor(sourceTable, referencedTable, relationName) {
    this.sourceTable = sourceTable;
    this.referencedTable = referencedTable;
    this.relationName = relationName;
    this.referencedTableName = referencedTable[Table.Symbol.Name];
  }
  static [entityKind] = "Relation";
  referencedTableName;
  fieldName;
};
var Relations = class {
  static {
    __name(this, "Relations");
  }
  constructor(table, config) {
    this.table = table;
    this.config = config;
  }
  static [entityKind] = "Relations";
};
var One = class _One extends Relation {
  static {
    __name(this, "One");
  }
  constructor(sourceTable, referencedTable, config, isNullable) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
    this.isNullable = isNullable;
  }
  static [entityKind] = "One";
  withFieldName(fieldName) {
    const relation = new _One(
      this.sourceTable,
      this.referencedTable,
      this.config,
      this.isNullable
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
var Many = class _Many extends Relation {
  static {
    __name(this, "Many");
  }
  constructor(sourceTable, referencedTable, config) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
  }
  static [entityKind] = "Many";
  withFieldName(fieldName) {
    const relation = new _Many(
      this.sourceTable,
      this.referencedTable,
      this.config
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
function getOperators() {
  return {
    and,
    between,
    eq,
    exists,
    gt,
    gte,
    ilike,
    inArray,
    isNull,
    isNotNull,
    like,
    lt,
    lte,
    ne,
    not,
    notBetween,
    notExists,
    notLike,
    notIlike,
    notInArray,
    or,
    sql
  };
}
__name(getOperators, "getOperators");
function getOrderByOperators() {
  return {
    sql,
    asc,
    desc
  };
}
__name(getOrderByOperators, "getOrderByOperators");
function extractTablesRelationalConfig(schema, configHelpers) {
  if (Object.keys(schema).length === 1 && "default" in schema && !is(schema["default"], Table)) {
    schema = schema["default"];
  }
  const tableNamesMap = {};
  const relationsBuffer = {};
  const tablesConfig = {};
  for (const [key, value] of Object.entries(schema)) {
    if (is(value, Table)) {
      const dbName = getTableUniqueName(value);
      const bufferedRelations = relationsBuffer[dbName];
      tableNamesMap[dbName] = key;
      tablesConfig[key] = {
        tsName: key,
        dbName: value[Table.Symbol.Name],
        schema: value[Table.Symbol.Schema],
        columns: value[Table.Symbol.Columns],
        relations: bufferedRelations?.relations ?? {},
        primaryKey: bufferedRelations?.primaryKey ?? []
      };
      for (const column of Object.values(
        value[Table.Symbol.Columns]
      )) {
        if (column.primary) {
          tablesConfig[key].primaryKey.push(column);
        }
      }
      const extraConfig = value[Table.Symbol.ExtraConfigBuilder]?.(value[Table.Symbol.ExtraConfigColumns]);
      if (extraConfig) {
        for (const configEntry of Object.values(extraConfig)) {
          if (is(configEntry, PrimaryKeyBuilder)) {
            tablesConfig[key].primaryKey.push(...configEntry.columns);
          }
        }
      }
    } else if (is(value, Relations)) {
      const dbName = getTableUniqueName(value.table);
      const tableName = tableNamesMap[dbName];
      const relations2 = value.config(
        configHelpers(value.table)
      );
      let primaryKey;
      for (const [relationName, relation] of Object.entries(relations2)) {
        if (tableName) {
          const tableConfig = tablesConfig[tableName];
          tableConfig.relations[relationName] = relation;
          if (primaryKey) {
            tableConfig.primaryKey.push(...primaryKey);
          }
        } else {
          if (!(dbName in relationsBuffer)) {
            relationsBuffer[dbName] = {
              relations: {},
              primaryKey
            };
          }
          relationsBuffer[dbName].relations[relationName] = relation;
        }
      }
    }
  }
  return { tables: tablesConfig, tableNamesMap };
}
__name(extractTablesRelationalConfig, "extractTablesRelationalConfig");
function createOne(sourceTable) {
  return /* @__PURE__ */ __name(function one(table, config) {
    return new One(
      sourceTable,
      table,
      config,
      config?.fields.reduce((res, f) => res && f.notNull, true) ?? false
    );
  }, "one");
}
__name(createOne, "createOne");
function createMany(sourceTable) {
  return /* @__PURE__ */ __name(function many(referencedTable, config) {
    return new Many(sourceTable, referencedTable, config);
  }, "many");
}
__name(createMany, "createMany");
function normalizeRelation(schema, tableNamesMap, relation) {
  if (is(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references
    };
  }
  const referencedTableTsName = tableNamesMap[getTableUniqueName(relation.referencedTable)];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const referencedTableConfig = schema[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[getTableUniqueName(sourceTable)];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations
  )) {
    if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName ? new Error(
      `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`
    ) : new Error(
      `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`
    );
  }
  if (reverseRelations[0] && is(reverseRelations[0], One) && reverseRelations[0].config) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`
  );
}
__name(normalizeRelation, "normalizeRelation");
function createTableRelationsHelpers(sourceTable) {
  return {
    one: createOne(sourceTable),
    many: createMany(sourceTable)
  };
}
__name(createTableRelationsHelpers, "createTableRelationsHelpers");
function mapRelationalRow(tablesConfig, tableConfig, row, buildQueryResultSelection, mapColumnValue = (value) => value) {
  const result = {};
  for (const [
    selectionItemIndex,
    selectionItem
  ] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey];
      const rawSubRows = row[selectionItemIndex];
      const subRows = typeof rawSubRows === "string" ? JSON.parse(rawSubRows) : rawSubRows;
      result[selectionItem.tsKey] = is(relation, One) ? subRows && mapRelationalRow(
        tablesConfig,
        tablesConfig[selectionItem.relationTableTsKey],
        subRows,
        selectionItem.selection,
        mapColumnValue
      ) : subRows.map(
        (subRow) => mapRelationalRow(
          tablesConfig,
          tablesConfig[selectionItem.relationTableTsKey],
          subRow,
          selectionItem.selection,
          mapColumnValue
        )
      );
    } else {
      const value = mapColumnValue(row[selectionItemIndex]);
      const field = selectionItem.field;
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      result[selectionItem.tsKey] = value === null ? null : decoder.mapFromDriverValue(value);
    }
  }
  return result;
}
__name(mapRelationalRow, "mapRelationalRow");

// node_modules/drizzle-orm/alias.js
var ColumnAliasProxyHandler = class {
  static {
    __name(this, "ColumnAliasProxyHandler");
  }
  constructor(table) {
    this.table = table;
  }
  static [entityKind] = "ColumnAliasProxyHandler";
  get(columnObj, prop) {
    if (prop === "table") {
      return this.table;
    }
    return columnObj[prop];
  }
};
var TableAliasProxyHandler = class {
  static {
    __name(this, "TableAliasProxyHandler");
  }
  constructor(alias, replaceOriginalName) {
    this.alias = alias;
    this.replaceOriginalName = replaceOriginalName;
  }
  static [entityKind] = "TableAliasProxyHandler";
  get(target, prop) {
    if (prop === Table.Symbol.IsAlias) {
      return true;
    }
    if (prop === Table.Symbol.Name) {
      return this.alias;
    }
    if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) {
      return this.alias;
    }
    if (prop === ViewBaseConfig) {
      return {
        ...target[ViewBaseConfig],
        name: this.alias,
        isAlias: true
      };
    }
    if (prop === Table.Symbol.Columns) {
      const columns = target[Table.Symbol.Columns];
      if (!columns) {
        return columns;
      }
      const proxiedColumns = {};
      Object.keys(columns).map((key) => {
        proxiedColumns[key] = new Proxy(
          columns[key],
          new ColumnAliasProxyHandler(new Proxy(target, this))
        );
      });
      return proxiedColumns;
    }
    const value = target[prop];
    if (is(value, Column)) {
      return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
    }
    return value;
  }
};
var RelationTableAliasProxyHandler = class {
  static {
    __name(this, "RelationTableAliasProxyHandler");
  }
  constructor(alias) {
    this.alias = alias;
  }
  static [entityKind] = "RelationTableAliasProxyHandler";
  get(target, prop) {
    if (prop === "sourceTable") {
      return aliasedTable(target.sourceTable, this.alias);
    }
    return target[prop];
  }
};
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
__name(aliasedTable, "aliasedTable");
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)))
  );
}
__name(aliasedTableColumn, "aliasedTableColumn");
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new SQL.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
__name(mapColumnsInAliasedSQLToAlias, "mapColumnsInAliasedSQLToAlias");
function mapColumnsInSQLToAlias(query, alias) {
  return sql.join(query.queryChunks.map((c) => {
    if (is(c, Column)) {
      return aliasedTableColumn(c, alias);
    }
    if (is(c, SQL)) {
      return mapColumnsInSQLToAlias(c, alias);
    }
    if (is(c, SQL.Aliased)) {
      return mapColumnsInAliasedSQLToAlias(c, alias);
    }
    return c;
  }));
}
__name(mapColumnsInSQLToAlias, "mapColumnsInSQLToAlias");

// node_modules/drizzle-orm/selection-proxy.js
var SelectionProxyHandler = class _SelectionProxyHandler {
  static {
    __name(this, "SelectionProxyHandler");
  }
  static [entityKind] = "SelectionProxyHandler";
  config;
  constructor(config) {
    this.config = { ...config };
  }
  get(subquery, prop) {
    if (prop === "_") {
      return {
        ...subquery["_"],
        selectedFields: new Proxy(
          subquery._.selectedFields,
          this
        )
      };
    }
    if (prop === ViewBaseConfig) {
      return {
        ...subquery[ViewBaseConfig],
        selectedFields: new Proxy(
          subquery[ViewBaseConfig].selectedFields,
          this
        )
      };
    }
    if (typeof prop === "symbol") {
      return subquery[prop];
    }
    const columns = is(subquery, Subquery) ? subquery._.selectedFields : is(subquery, View) ? subquery[ViewBaseConfig].selectedFields : subquery;
    const value = columns[prop];
    if (is(value, SQL.Aliased)) {
      if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) {
        return value.sql;
      }
      const newValue = value.clone();
      newValue.isSelectionField = true;
      return newValue;
    }
    if (is(value, SQL)) {
      if (this.config.sqlBehavior === "sql") {
        return value;
      }
      throw new Error(
        `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
      );
    }
    if (is(value, Column)) {
      if (this.config.alias) {
        return new Proxy(
          value,
          new ColumnAliasProxyHandler(
            new Proxy(
              value.table,
              new TableAliasProxyHandler(this.config.alias, this.config.replaceOriginalName ?? false)
            )
          )
        );
      }
      return value;
    }
    if (typeof value !== "object" || value === null) {
      return value;
    }
    return new Proxy(value, new _SelectionProxyHandler(this.config));
  }
};

// node_modules/drizzle-orm/query-promise.js
var QueryPromise = class {
  static {
    __name(this, "QueryPromise");
  }
  static [entityKind] = "QueryPromise";
  [Symbol.toStringTag] = "QueryPromise";
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
};

// node_modules/drizzle-orm/sqlite-core/foreign-keys.js
var ForeignKeyBuilder2 = class {
  static {
    __name(this, "ForeignKeyBuilder");
  }
  static [entityKind] = "SQLiteForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate;
  /** @internal */
  _onDelete;
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey2(table, this);
  }
};
var ForeignKey2 = class {
  static {
    __name(this, "ForeignKey");
  }
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "SQLiteForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};

// node_modules/drizzle-orm/sqlite-core/unique-constraint.js
function uniqueKeyName2(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
__name(uniqueKeyName2, "uniqueKeyName");
var UniqueConstraintBuilder2 = class {
  static {
    __name(this, "UniqueConstraintBuilder");
  }
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "SQLiteUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  build(table) {
    return new UniqueConstraint2(table, this.columns, this.name);
  }
};
var UniqueOnConstraintBuilder2 = class {
  static {
    __name(this, "UniqueOnConstraintBuilder");
  }
  static [entityKind] = "SQLiteUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder2(columns, this.name);
  }
};
var UniqueConstraint2 = class {
  static {
    __name(this, "UniqueConstraint");
  }
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName2(this.table, this.columns.map((column) => column.name));
  }
  static [entityKind] = "SQLiteUniqueConstraint";
  columns;
  name;
  getName() {
    return this.name;
  }
};

// node_modules/drizzle-orm/sqlite-core/columns/common.js
var SQLiteColumnBuilder = class extends ColumnBuilder {
  static {
    __name(this, "SQLiteColumnBuilder");
  }
  static [entityKind] = "SQLiteColumnBuilder";
  foreignKeyConfigs = [];
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    return this;
  }
  generatedAlwaysAs(as, config) {
    this.config.generated = {
      as,
      type: "always",
      mode: config?.mode ?? "virtual"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return ((ref2, actions2) => {
        const builder = new ForeignKeyBuilder2(() => {
          const foreignColumn = ref2();
          return { columns: [column], foreignColumns: [foreignColumn] };
        });
        if (actions2.onUpdate) {
          builder.onUpdate(actions2.onUpdate);
        }
        if (actions2.onDelete) {
          builder.onDelete(actions2.onDelete);
        }
        return builder.build(table);
      })(ref, actions);
    });
  }
};
var SQLiteColumn = class extends Column {
  static {
    __name(this, "SQLiteColumn");
  }
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName2(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "SQLiteColumn";
};

// node_modules/drizzle-orm/sqlite-core/columns/blob.js
var SQLiteBigIntBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBigIntBuilder");
  }
  static [entityKind] = "SQLiteBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteBigInt(table, this.config);
  }
};
var SQLiteBigInt = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBigInt");
  }
  static [entityKind] = "SQLiteBigInt";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (Buffer.isBuffer(value)) {
      return BigInt(value.toString());
    }
    if (value instanceof ArrayBuffer) {
      const decoder = new TextDecoder();
      return BigInt(decoder.decode(value));
    }
    return BigInt(String.fromCodePoint(...value));
  }
  mapToDriverValue(value) {
    return Buffer.from(value.toString());
  }
};
var SQLiteBlobJsonBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBlobJsonBuilder");
  }
  static [entityKind] = "SQLiteBlobJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteBlobJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobJson(
      table,
      this.config
    );
  }
};
var SQLiteBlobJson = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBlobJson");
  }
  static [entityKind] = "SQLiteBlobJson";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (Buffer.isBuffer(value)) {
      return JSON.parse(value.toString());
    }
    if (value instanceof ArrayBuffer) {
      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(value));
    }
    return JSON.parse(String.fromCodePoint(...value));
  }
  mapToDriverValue(value) {
    return Buffer.from(JSON.stringify(value));
  }
};
var SQLiteBlobBufferBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBlobBufferBuilder");
  }
  static [entityKind] = "SQLiteBlobBufferBuilder";
  constructor(name) {
    super(name, "buffer", "SQLiteBlobBuffer");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobBuffer(table, this.config);
  }
};
var SQLiteBlobBuffer = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBlobBuffer");
  }
  static [entityKind] = "SQLiteBlobBuffer";
  mapFromDriverValue(value) {
    if (Buffer.isBuffer(value)) {
      return value;
    }
    return Buffer.from(value);
  }
  getSQLType() {
    return "blob";
  }
};
function blob(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "json") {
    return new SQLiteBlobJsonBuilder(name);
  }
  if (config?.mode === "bigint") {
    return new SQLiteBigIntBuilder(name);
  }
  return new SQLiteBlobBufferBuilder(name);
}
__name(blob, "blob");

// node_modules/drizzle-orm/sqlite-core/columns/custom.js
var SQLiteCustomColumnBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteCustomColumnBuilder");
  }
  static [entityKind] = "SQLiteCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "SQLiteCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  /** @internal */
  build(table) {
    return new SQLiteCustomColumn(
      table,
      this.config
    );
  }
};
var SQLiteCustomColumn = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteCustomColumn");
  }
  static [entityKind] = "SQLiteCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config) {
    super(table, config);
    this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
    this.mapTo = config.customTypeParams.toDriver;
    this.mapFrom = config.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
};
function customType(customTypeParams) {
  return (a, b) => {
    const { name, config } = getColumnNameAndConfig(a, b);
    return new SQLiteCustomColumnBuilder(
      name,
      config,
      customTypeParams
    );
  };
}
__name(customType, "customType");

// node_modules/drizzle-orm/sqlite-core/columns/integer.js
var SQLiteBaseIntegerBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBaseIntegerBuilder");
  }
  static [entityKind] = "SQLiteBaseIntegerBuilder";
  constructor(name, dataType, columnType) {
    super(name, dataType, columnType);
    this.config.autoIncrement = false;
  }
  primaryKey(config) {
    if (config?.autoIncrement) {
      this.config.autoIncrement = true;
    }
    this.config.hasDefault = true;
    return super.primaryKey();
  }
};
var SQLiteBaseInteger = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBaseInteger");
  }
  static [entityKind] = "SQLiteBaseInteger";
  autoIncrement = this.config.autoIncrement;
  getSQLType() {
    return "integer";
  }
};
var SQLiteIntegerBuilder = class extends SQLiteBaseIntegerBuilder {
  static {
    __name(this, "SQLiteIntegerBuilder");
  }
  static [entityKind] = "SQLiteIntegerBuilder";
  constructor(name) {
    super(name, "number", "SQLiteInteger");
  }
  build(table) {
    return new SQLiteInteger(
      table,
      this.config
    );
  }
};
var SQLiteInteger = class extends SQLiteBaseInteger {
  static {
    __name(this, "SQLiteInteger");
  }
  static [entityKind] = "SQLiteInteger";
};
var SQLiteTimestampBuilder = class extends SQLiteBaseIntegerBuilder {
  static {
    __name(this, "SQLiteTimestampBuilder");
  }
  static [entityKind] = "SQLiteTimestampBuilder";
  constructor(name, mode) {
    super(name, "date", "SQLiteTimestamp");
    this.config.mode = mode;
  }
  /**
   * @deprecated Use `default()` with your own expression instead.
   *
   * Adds `DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))` to the column, which is the current epoch timestamp in milliseconds.
   */
  defaultNow() {
    return this.default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`);
  }
  build(table) {
    return new SQLiteTimestamp(
      table,
      this.config
    );
  }
};
var SQLiteTimestamp = class extends SQLiteBaseInteger {
  static {
    __name(this, "SQLiteTimestamp");
  }
  static [entityKind] = "SQLiteTimestamp";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    if (this.config.mode === "timestamp") {
      return new Date(value * 1e3);
    }
    return new Date(value);
  }
  mapToDriverValue(value) {
    const unix = value.getTime();
    if (this.config.mode === "timestamp") {
      return Math.floor(unix / 1e3);
    }
    return unix;
  }
};
var SQLiteBooleanBuilder = class extends SQLiteBaseIntegerBuilder {
  static {
    __name(this, "SQLiteBooleanBuilder");
  }
  static [entityKind] = "SQLiteBooleanBuilder";
  constructor(name, mode) {
    super(name, "boolean", "SQLiteBoolean");
    this.config.mode = mode;
  }
  build(table) {
    return new SQLiteBoolean(
      table,
      this.config
    );
  }
};
var SQLiteBoolean = class extends SQLiteBaseInteger {
  static {
    __name(this, "SQLiteBoolean");
  }
  static [entityKind] = "SQLiteBoolean";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    return Number(value) === 1;
  }
  mapToDriverValue(value) {
    return value ? 1 : 0;
  }
};
function integer(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "timestamp" || config?.mode === "timestamp_ms") {
    return new SQLiteTimestampBuilder(name, config.mode);
  }
  if (config?.mode === "boolean") {
    return new SQLiteBooleanBuilder(name, config.mode);
  }
  return new SQLiteIntegerBuilder(name);
}
__name(integer, "integer");

// node_modules/drizzle-orm/sqlite-core/columns/numeric.js
var SQLiteNumericBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteNumericBuilder");
  }
  static [entityKind] = "SQLiteNumericBuilder";
  constructor(name) {
    super(name, "string", "SQLiteNumeric");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumeric(
      table,
      this.config
    );
  }
};
var SQLiteNumeric = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteNumeric");
  }
  static [entityKind] = "SQLiteNumeric";
  mapFromDriverValue(value) {
    if (typeof value === "string")
      return value;
    return String(value);
  }
  getSQLType() {
    return "numeric";
  }
};
var SQLiteNumericNumberBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteNumericNumberBuilder");
  }
  static [entityKind] = "SQLiteNumericNumberBuilder";
  constructor(name) {
    super(name, "number", "SQLiteNumericNumber");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericNumber(
      table,
      this.config
    );
  }
};
var SQLiteNumericNumber = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteNumericNumber");
  }
  static [entityKind] = "SQLiteNumericNumber";
  mapFromDriverValue(value) {
    if (typeof value === "number")
      return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
};
var SQLiteNumericBigIntBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteNumericBigIntBuilder");
  }
  static [entityKind] = "SQLiteNumericBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteNumericBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericBigInt(
      table,
      this.config
    );
  }
};
var SQLiteNumericBigInt = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteNumericBigInt");
  }
  static [entityKind] = "SQLiteNumericBigInt";
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
};
function numeric(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  const mode = config?.mode;
  return mode === "number" ? new SQLiteNumericNumberBuilder(name) : mode === "bigint" ? new SQLiteNumericBigIntBuilder(name) : new SQLiteNumericBuilder(name);
}
__name(numeric, "numeric");

// node_modules/drizzle-orm/sqlite-core/columns/real.js
var SQLiteRealBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteRealBuilder");
  }
  static [entityKind] = "SQLiteRealBuilder";
  constructor(name) {
    super(name, "number", "SQLiteReal");
  }
  /** @internal */
  build(table) {
    return new SQLiteReal(table, this.config);
  }
};
var SQLiteReal = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteReal");
  }
  static [entityKind] = "SQLiteReal";
  getSQLType() {
    return "real";
  }
};
function real(name) {
  return new SQLiteRealBuilder(name ?? "");
}
__name(real, "real");

// node_modules/drizzle-orm/sqlite-core/columns/text.js
var SQLiteTextBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteTextBuilder");
  }
  static [entityKind] = "SQLiteTextBuilder";
  constructor(name, config) {
    super(name, "string", "SQLiteText");
    this.config.enumValues = config.enum;
    this.config.length = config.length;
  }
  /** @internal */
  build(table) {
    return new SQLiteText(
      table,
      this.config
    );
  }
};
var SQLiteText = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteText");
  }
  static [entityKind] = "SQLiteText";
  enumValues = this.config.enumValues;
  length = this.config.length;
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return `text${this.config.length ? `(${this.config.length})` : ""}`;
  }
};
var SQLiteTextJsonBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteTextJsonBuilder");
  }
  static [entityKind] = "SQLiteTextJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteTextJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteTextJson(
      table,
      this.config
    );
  }
};
var SQLiteTextJson = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteTextJson");
  }
  static [entityKind] = "SQLiteTextJson";
  getSQLType() {
    return "text";
  }
  mapFromDriverValue(value) {
    return JSON.parse(value);
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
};
function text(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config.mode === "json") {
    return new SQLiteTextJsonBuilder(name);
  }
  return new SQLiteTextBuilder(name, config);
}
__name(text, "text");

// node_modules/drizzle-orm/sqlite-core/columns/all.js
function getSQLiteColumnBuilders() {
  return {
    blob,
    customType,
    integer,
    numeric,
    real,
    text
  };
}
__name(getSQLiteColumnBuilders, "getSQLiteColumnBuilders");

// node_modules/drizzle-orm/sqlite-core/table.js
var InlineForeignKeys2 = Symbol.for("drizzle:SQLiteInlineForeignKeys");
var SQLiteTable = class extends Table {
  static {
    __name(this, "SQLiteTable");
  }
  static [entityKind] = "SQLiteTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys: InlineForeignKeys2
  });
  /** @internal */
  [Table.Symbol.Columns];
  /** @internal */
  [InlineForeignKeys2] = [];
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
};
function sqliteTableBase(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new SQLiteTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getSQLiteColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys2].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumns;
  if (extraConfig) {
    table[SQLiteTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return table;
}
__name(sqliteTableBase, "sqliteTableBase");
var sqliteTable = /* @__PURE__ */ __name((name, columns, extraConfig) => {
  return sqliteTableBase(name, columns, extraConfig);
}, "sqliteTable");

// node_modules/drizzle-orm/sqlite-core/query-builders/delete.js
var SQLiteDeleteBase = class extends QueryPromise {
  static {
    __name(this, "SQLiteDeleteBase");
  }
  constructor(table, session, dialect, withList) {
    super();
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.config = { table, withList };
  }
  static [entityKind] = "SQLiteDelete";
  /** @internal */
  config;
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will delete only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be deleted.
   *
   * ```ts
   * // Delete all cars with green color
   * db.delete(cars).where(eq(cars.color, 'green'));
   * // or
   * db.delete(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Delete all BMW cars with a green color
   * db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Delete all cars with the green or blue color
   * db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.table[Table.Symbol.Columns],
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      this.config.orderBy = orderByArray;
    } else {
      const orderByArray = columns;
      this.config.orderBy = orderByArray;
    }
    return this;
  }
  limit(limit) {
    this.config.limit = limit;
    return this;
  }
  returning(fields = this.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildDeleteQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute(placeholderValues) {
    return this._prepare().execute(placeholderValues);
  }
  $dynamic() {
    return this;
  }
};

// node_modules/drizzle-orm/casing.js
function toSnakeCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.map((word) => word.toLowerCase()).join("_");
}
__name(toSnakeCase, "toSnakeCase");
function toCamelCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.reduce((acc, word, i) => {
    const formattedWord = i === 0 ? word.toLowerCase() : `${word[0].toUpperCase()}${word.slice(1)}`;
    return acc + formattedWord;
  }, "");
}
__name(toCamelCase, "toCamelCase");
function noopCase(input) {
  return input;
}
__name(noopCase, "noopCase");
var CasingCache = class {
  static {
    __name(this, "CasingCache");
  }
  static [entityKind] = "CasingCache";
  /** @internal */
  cache = {};
  cachedTables = {};
  convert;
  constructor(casing) {
    this.convert = casing === "snake_case" ? toSnakeCase : casing === "camelCase" ? toCamelCase : noopCase;
  }
  getColumnCasing(column) {
    if (!column.keyAsName)
      return column.name;
    const schema = column.table[Table.Symbol.Schema] ?? "public";
    const tableName = column.table[Table.Symbol.OriginalName];
    const key = `${schema}.${tableName}.${column.name}`;
    if (!this.cache[key]) {
      this.cacheTable(column.table);
    }
    return this.cache[key];
  }
  cacheTable(table) {
    const schema = table[Table.Symbol.Schema] ?? "public";
    const tableName = table[Table.Symbol.OriginalName];
    const tableKey = `${schema}.${tableName}`;
    if (!this.cachedTables[tableKey]) {
      for (const column of Object.values(table[Table.Symbol.Columns])) {
        const columnKey = `${tableKey}.${column.name}`;
        this.cache[columnKey] = this.convert(column.name);
      }
      this.cachedTables[tableKey] = true;
    }
  }
  clearCache() {
    this.cache = {};
    this.cachedTables = {};
  }
};

// node_modules/drizzle-orm/errors.js
var DrizzleError = class extends Error {
  static {
    __name(this, "DrizzleError");
  }
  static [entityKind] = "DrizzleError";
  constructor({ message, cause }) {
    super(message);
    this.name = "DrizzleError";
    this.cause = cause;
  }
};
var TransactionRollbackError = class extends DrizzleError {
  static {
    __name(this, "TransactionRollbackError");
  }
  static [entityKind] = "TransactionRollbackError";
  constructor() {
    super({ message: "Rollback" });
  }
};

// node_modules/drizzle-orm/sqlite-core/view-base.js
var SQLiteViewBase = class extends View {
  static {
    __name(this, "SQLiteViewBase");
  }
  static [entityKind] = "SQLiteViewBase";
};

// node_modules/drizzle-orm/sqlite-core/dialect.js
var SQLiteDialect = class {
  static {
    __name(this, "SQLiteDialect");
  }
  static [entityKind] = "SQLiteDialect";
  /** @internal */
  casing;
  constructor(config) {
    this.casing = new CasingCache(config?.casing);
  }
  escapeName(name) {
    return `"${name}"`;
  }
  escapeParam(_num) {
    return "?";
  }
  escapeString(str) {
    return `'${str.replace(/'/g, "''")}'`;
  }
  buildWithCTE(queries) {
    if (!queries?.length)
      return void 0;
    const withSqlChunks = [sql`with `];
    for (const [i, w] of queries.entries()) {
      withSqlChunks.push(sql`${sql.identifier(w._.alias)} as (${w._.sql})`);
      if (i < queries.length - 1) {
        withSqlChunks.push(sql`, `);
      }
    }
    withSqlChunks.push(sql` `);
    return sql.join(withSqlChunks);
  }
  buildDeleteQuery({ table, where, returning, withList, limit, orderBy }) {
    const withSql = this.buildWithCTE(withList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return sql`${withSql}delete from ${table}${whereSql}${returningSql}${orderBySql}${limitSql}`;
  }
  buildUpdateSet(table, set) {
    const tableColumns = table[Table.Symbol.Columns];
    const columnNames = Object.keys(tableColumns).filter(
      (colName) => set[colName] !== void 0 || tableColumns[colName]?.onUpdateFn !== void 0
    );
    const setSize = columnNames.length;
    return sql.join(columnNames.flatMap((colName, i) => {
      const col = tableColumns[colName];
      const value = set[colName] ?? sql.param(col.onUpdateFn(), col);
      const res = sql`${sql.identifier(this.casing.getColumnCasing(col))} = ${value}`;
      if (i < setSize - 1) {
        return [res, sql.raw(", ")];
      }
      return [res];
    }));
  }
  buildUpdateQuery({ table, set, where, returning, withList, joins, from, limit, orderBy }) {
    const withSql = this.buildWithCTE(withList);
    const setSql = this.buildUpdateSet(table, set);
    const fromSql = from && sql.join([sql.raw(" from "), this.buildFromTable(from)]);
    const joinsSql = this.buildJoins(joins);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return sql`${withSql}update ${table} set ${setSql}${fromSql}${joinsSql}${whereSql}${returningSql}${orderBySql}${limitSql}`;
  }
  /**
   * Builds selection SQL with provided fields/expressions
   *
   * Examples:
   *
   * `select <selection> from`
   *
   * `insert ... returning <selection>`
   *
   * If `isSingleTable` is true, then columns won't be prefixed with table name
   */
  buildSelection(fields, { isSingleTable = false } = {}) {
    const columnsLen = fields.length;
    const chunks = fields.flatMap(({ field }, i) => {
      const chunk = [];
      if (is(field, SQL.Aliased) && field.isSelectionField) {
        chunk.push(sql.identifier(field.fieldAlias));
      } else if (is(field, SQL.Aliased) || is(field, SQL)) {
        const query = is(field, SQL.Aliased) ? field.sql : field;
        if (isSingleTable) {
          chunk.push(
            new SQL(
              query.queryChunks.map((c) => {
                if (is(c, Column)) {
                  return sql.identifier(this.casing.getColumnCasing(c));
                }
                return c;
              })
            )
          );
        } else {
          chunk.push(query);
        }
        if (is(field, SQL.Aliased)) {
          chunk.push(sql` as ${sql.identifier(field.fieldAlias)}`);
        }
      } else if (is(field, Column)) {
        const tableName = field.table[Table.Symbol.Name];
        if (field.columnType === "SQLiteNumericBigInt") {
          if (isSingleTable) {
            chunk.push(sql`cast(${sql.identifier(this.casing.getColumnCasing(field))} as text)`);
          } else {
            chunk.push(
              sql`cast(${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))} as text)`
            );
          }
        } else {
          if (isSingleTable) {
            chunk.push(sql.identifier(this.casing.getColumnCasing(field)));
          } else {
            chunk.push(sql`${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))}`);
          }
        }
      }
      if (i < columnsLen - 1) {
        chunk.push(sql`, `);
      }
      return chunk;
    });
    return sql.join(chunks);
  }
  buildJoins(joins) {
    if (!joins || joins.length === 0) {
      return void 0;
    }
    const joinsArray = [];
    if (joins) {
      for (const [index2, joinMeta] of joins.entries()) {
        if (index2 === 0) {
          joinsArray.push(sql` `);
        }
        const table = joinMeta.table;
        if (is(table, SQLiteTable)) {
          const tableName = table[SQLiteTable.Symbol.Name];
          const tableSchema = table[SQLiteTable.Symbol.Schema];
          const origTableName = table[SQLiteTable.Symbol.OriginalName];
          const alias = tableName === origTableName ? void 0 : joinMeta.alias;
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join ${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(origTableName)}${alias && sql` ${sql.identifier(alias)}`} on ${joinMeta.on}`
          );
        } else {
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join ${table} on ${joinMeta.on}`
          );
        }
        if (index2 < joins.length - 1) {
          joinsArray.push(sql` `);
        }
      }
    }
    return sql.join(joinsArray);
  }
  buildLimit(limit) {
    return typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
  }
  buildOrderBy(orderBy) {
    const orderByList = [];
    if (orderBy) {
      for (const [index2, orderByValue] of orderBy.entries()) {
        orderByList.push(orderByValue);
        if (index2 < orderBy.length - 1) {
          orderByList.push(sql`, `);
        }
      }
    }
    return orderByList.length > 0 ? sql` order by ${sql.join(orderByList)}` : void 0;
  }
  buildFromTable(table) {
    if (is(table, Table) && table[Table.Symbol.IsAlias]) {
      return sql`${sql`${sql.identifier(table[Table.Symbol.Schema] ?? "")}.`.if(table[Table.Symbol.Schema])}${sql.identifier(table[Table.Symbol.OriginalName])} ${sql.identifier(table[Table.Symbol.Name])}`;
    }
    return table;
  }
  buildSelectQuery({
    withList,
    fields,
    fieldsFlat,
    where,
    having,
    table,
    joins,
    orderBy,
    groupBy,
    limit,
    offset,
    distinct,
    setOperators
  }) {
    const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
    for (const f of fieldsList) {
      if (is(f.field, Column) && getTableName(f.field.table) !== (is(table, Subquery) ? table._.alias : is(table, SQLiteViewBase) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : getTableName(table)) && !((table2) => joins?.some(
        ({ alias }) => alias === (table2[Table.Symbol.IsAlias] ? getTableName(table2) : table2[Table.Symbol.BaseName])
      ))(f.field.table)) {
        const tableName = getTableName(f.field.table);
        throw new Error(
          `Your "${f.path.join("->")}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`
        );
      }
    }
    const isSingleTable = !joins || joins.length === 0;
    const withSql = this.buildWithCTE(withList);
    const distinctSql = distinct ? sql` distinct` : void 0;
    const selection = this.buildSelection(fieldsList, { isSingleTable });
    const tableSql = this.buildFromTable(table);
    const joinsSql = this.buildJoins(joins);
    const whereSql = where ? sql` where ${where}` : void 0;
    const havingSql = having ? sql` having ${having}` : void 0;
    const groupByList = [];
    if (groupBy) {
      for (const [index2, groupByValue] of groupBy.entries()) {
        groupByList.push(groupByValue);
        if (index2 < groupBy.length - 1) {
          groupByList.push(sql`, `);
        }
      }
    }
    const groupBySql = groupByList.length > 0 ? sql` group by ${sql.join(groupByList)}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    const finalQuery = sql`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}`;
    if (setOperators.length > 0) {
      return this.buildSetOperations(finalQuery, setOperators);
    }
    return finalQuery;
  }
  buildSetOperations(leftSelect, setOperators) {
    const [setOperator, ...rest] = setOperators;
    if (!setOperator) {
      throw new Error("Cannot pass undefined values to any set operator");
    }
    if (rest.length === 0) {
      return this.buildSetOperationQuery({ leftSelect, setOperator });
    }
    return this.buildSetOperations(
      this.buildSetOperationQuery({ leftSelect, setOperator }),
      rest
    );
  }
  buildSetOperationQuery({
    leftSelect,
    setOperator: { type, isAll, rightSelect, limit, orderBy, offset }
  }) {
    const leftChunk = sql`${leftSelect.getSQL()} `;
    const rightChunk = sql`${rightSelect.getSQL()}`;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      const orderByValues = [];
      for (const singleOrderBy of orderBy) {
        if (is(singleOrderBy, SQLiteColumn)) {
          orderByValues.push(sql.identifier(singleOrderBy.name));
        } else if (is(singleOrderBy, SQL)) {
          for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
            const chunk = singleOrderBy.queryChunks[i];
            if (is(chunk, SQLiteColumn)) {
              singleOrderBy.queryChunks[i] = sql.identifier(this.casing.getColumnCasing(chunk));
            }
          }
          orderByValues.push(sql`${singleOrderBy}`);
        } else {
          orderByValues.push(sql`${singleOrderBy}`);
        }
      }
      orderBySql = sql` order by ${sql.join(orderByValues, sql`, `)}`;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
    const operatorChunk = sql.raw(`${type} ${isAll ? "all " : ""}`);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    return sql`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
  }
  buildInsertQuery({ table, values: valuesOrSelect, onConflict, returning, withList, select }) {
    const valuesSqlList = [];
    const columns = table[Table.Symbol.Columns];
    const colEntries = Object.entries(columns).filter(
      ([_, col]) => !col.shouldDisableInsert()
    );
    const insertOrder = colEntries.map(([, column]) => sql.identifier(this.casing.getColumnCasing(column)));
    if (select) {
      const select2 = valuesOrSelect;
      if (is(select2, SQL)) {
        valuesSqlList.push(select2);
      } else {
        valuesSqlList.push(select2.getSQL());
      }
    } else {
      const values = valuesOrSelect;
      valuesSqlList.push(sql.raw("values "));
      for (const [valueIndex, value] of values.entries()) {
        const valueList = [];
        for (const [fieldName, col] of colEntries) {
          const colValue = value[fieldName];
          if (colValue === void 0 || is(colValue, Param) && colValue.value === void 0) {
            let defaultValue;
            if (col.default !== null && col.default !== void 0) {
              defaultValue = is(col.default, SQL) ? col.default : sql.param(col.default, col);
            } else if (col.defaultFn !== void 0) {
              const defaultFnResult = col.defaultFn();
              defaultValue = is(defaultFnResult, SQL) ? defaultFnResult : sql.param(defaultFnResult, col);
            } else if (!col.default && col.onUpdateFn !== void 0) {
              const onUpdateFnResult = col.onUpdateFn();
              defaultValue = is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col);
            } else {
              defaultValue = sql`null`;
            }
            valueList.push(defaultValue);
          } else {
            valueList.push(colValue);
          }
        }
        valuesSqlList.push(valueList);
        if (valueIndex < values.length - 1) {
          valuesSqlList.push(sql`, `);
        }
      }
    }
    const withSql = this.buildWithCTE(withList);
    const valuesSql = sql.join(valuesSqlList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const onConflictSql = onConflict?.length ? sql.join(onConflict) : void 0;
    return sql`${withSql}insert into ${table} ${insertOrder} ${valuesSql}${onConflictSql}${returningSql}`;
  }
  sqlToQuery(sql2, invokeSource) {
    return sql2.toQuery({
      casing: this.casing,
      escapeName: this.escapeName,
      escapeParam: this.escapeParam,
      escapeString: this.escapeString,
      invokeSource
    });
  }
  buildRelationalQuery({
    fullSchema,
    schema,
    tableNamesMap,
    table,
    tableConfig,
    queryConfig: config,
    tableAlias,
    nestedQueryRelation,
    joinOn
  }) {
    let selection = [];
    let limit, offset, orderBy = [], where;
    const joins = [];
    if (config === true) {
      const selectionEntries = Object.entries(tableConfig.columns);
      selection = selectionEntries.map(([key, value]) => ({
        dbKey: value.name,
        tsKey: key,
        field: aliasedTableColumn(value, tableAlias),
        relationTableTsKey: void 0,
        isJson: false,
        selection: []
      }));
    } else {
      const aliasedColumns = Object.fromEntries(
        Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)])
      );
      if (config.where) {
        const whereSql = typeof config.where === "function" ? config.where(aliasedColumns, getOperators()) : config.where;
        where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
      }
      const fieldsSelection = [];
      let selectedColumns = [];
      if (config.columns) {
        let isIncludeMode = false;
        for (const [field, value] of Object.entries(config.columns)) {
          if (value === void 0) {
            continue;
          }
          if (field in tableConfig.columns) {
            if (!isIncludeMode && value === true) {
              isIncludeMode = true;
            }
            selectedColumns.push(field);
          }
        }
        if (selectedColumns.length > 0) {
          selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config.columns?.[c] === true) : Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
        }
      } else {
        selectedColumns = Object.keys(tableConfig.columns);
      }
      for (const field of selectedColumns) {
        const column = tableConfig.columns[field];
        fieldsSelection.push({ tsKey: field, value: column });
      }
      let selectedRelations = [];
      if (config.with) {
        selectedRelations = Object.entries(config.with).filter((entry) => !!entry[1]).map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey] }));
      }
      let extras;
      if (config.extras) {
        extras = typeof config.extras === "function" ? config.extras(aliasedColumns, { sql }) : config.extras;
        for (const [tsKey, value] of Object.entries(extras)) {
          fieldsSelection.push({
            tsKey,
            value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
          });
        }
      }
      for (const { tsKey, value } of fieldsSelection) {
        selection.push({
          dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
          tsKey,
          field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
          relationTableTsKey: void 0,
          isJson: false,
          selection: []
        });
      }
      let orderByOrig = typeof config.orderBy === "function" ? config.orderBy(aliasedColumns, getOrderByOperators()) : config.orderBy ?? [];
      if (!Array.isArray(orderByOrig)) {
        orderByOrig = [orderByOrig];
      }
      orderBy = orderByOrig.map((orderByValue) => {
        if (is(orderByValue, Column)) {
          return aliasedTableColumn(orderByValue, tableAlias);
        }
        return mapColumnsInSQLToAlias(orderByValue, tableAlias);
      });
      limit = config.limit;
      offset = config.offset;
      for (const {
        tsKey: selectedRelationTsKey,
        queryConfig: selectedRelationConfigValue,
        relation
      } of selectedRelations) {
        const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
        const relationTableName = getTableUniqueName(relation.referencedTable);
        const relationTableTsName = tableNamesMap[relationTableName];
        const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
        const joinOn2 = and(
          ...normalizedRelation.fields.map(
            (field2, i) => eq(
              aliasedTableColumn(normalizedRelation.references[i], relationTableAlias),
              aliasedTableColumn(field2, tableAlias)
            )
          )
        );
        const builtRelation = this.buildRelationalQuery({
          fullSchema,
          schema,
          tableNamesMap,
          table: fullSchema[relationTableTsName],
          tableConfig: schema[relationTableTsName],
          queryConfig: is(relation, One) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
          tableAlias: relationTableAlias,
          joinOn: joinOn2,
          nestedQueryRelation: relation
        });
        const field = sql`(${builtRelation.sql})`.as(selectedRelationTsKey);
        selection.push({
          dbKey: selectedRelationTsKey,
          tsKey: selectedRelationTsKey,
          field,
          relationTableTsKey: relationTableTsName,
          isJson: true,
          selection: builtRelation.selection
        });
      }
    }
    if (selection.length === 0) {
      throw new DrizzleError({
        message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}"). You need to have at least one item in "columns", "with" or "extras". If you need to select all columns, omit the "columns" key or set it to undefined.`
      });
    }
    let result;
    where = and(joinOn, where);
    if (nestedQueryRelation) {
      let field = sql`json_array(${sql.join(
        selection.map(
          ({ field: field2 }) => is(field2, SQLiteColumn) ? sql.identifier(this.casing.getColumnCasing(field2)) : is(field2, SQL.Aliased) ? field2.sql : field2
        ),
        sql`, `
      )})`;
      if (is(nestedQueryRelation, Many)) {
        field = sql`coalesce(json_group_array(${field}), json_array())`;
      }
      const nestedSelection = [{
        dbKey: "data",
        tsKey: "data",
        field: field.as("data"),
        isJson: true,
        relationTableTsKey: tableConfig.tsName,
        selection
      }];
      const needsSubquery = limit !== void 0 || offset !== void 0 || orderBy.length > 0;
      if (needsSubquery) {
        result = this.buildSelectQuery({
          table: aliasedTable(table, tableAlias),
          fields: {},
          fieldsFlat: [
            {
              path: [],
              field: sql.raw("*")
            }
          ],
          where,
          limit,
          offset,
          orderBy,
          setOperators: []
        });
        where = void 0;
        limit = void 0;
        offset = void 0;
        orderBy = void 0;
      } else {
        result = aliasedTable(table, tableAlias);
      }
      result = this.buildSelectQuery({
        table: is(result, SQLiteTable) ? result : new Subquery(result, {}, tableAlias),
        fields: {},
        fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
          path: [],
          field: is(field2, Column) ? aliasedTableColumn(field2, tableAlias) : field2
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    } else {
      result = this.buildSelectQuery({
        table: aliasedTable(table, tableAlias),
        fields: {},
        fieldsFlat: selection.map(({ field }) => ({
          path: [],
          field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    }
    return {
      tableTsKey: tableConfig.tsName,
      sql: result,
      selection
    };
  }
};
var SQLiteSyncDialect = class extends SQLiteDialect {
  static {
    __name(this, "SQLiteSyncDialect");
  }
  static [entityKind] = "SQLiteSyncDialect";
  migrate(migrations, session, config) {
    const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
    session.run(migrationTableCreate);
    const dbMigrations = session.values(
      sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;
    session.run(sql`BEGIN`);
    try {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            session.run(sql.raw(stmt));
          }
          session.run(
            sql`INSERT INTO ${sql.identifier(migrationsTable)} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
      session.run(sql`COMMIT`);
    } catch (e) {
      session.run(sql`ROLLBACK`);
      throw e;
    }
  }
};
var SQLiteAsyncDialect = class extends SQLiteDialect {
  static {
    __name(this, "SQLiteAsyncDialect");
  }
  static [entityKind] = "SQLiteAsyncDialect";
  async migrate(migrations, session, config) {
    const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
    await session.run(migrationTableCreate);
    const dbMigrations = await session.values(
      sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;
    await session.transaction(async (tx) => {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            await tx.run(sql.raw(stmt));
          }
          await tx.run(
            sql`INSERT INTO ${sql.identifier(migrationsTable)} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
    });
  }
};

// node_modules/drizzle-orm/query-builders/query-builder.js
var TypedQueryBuilder = class {
  static {
    __name(this, "TypedQueryBuilder");
  }
  static [entityKind] = "TypedQueryBuilder";
  /** @internal */
  getSelectedFields() {
    return this._.selectedFields;
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/select.js
var SQLiteSelectBuilder = class {
  static {
    __name(this, "SQLiteSelectBuilder");
  }
  static [entityKind] = "SQLiteSelectBuilder";
  fields;
  session;
  dialect;
  withList;
  distinct;
  constructor(config) {
    this.fields = config.fields;
    this.session = config.session;
    this.dialect = config.dialect;
    this.withList = config.withList;
    this.distinct = config.distinct;
  }
  from(source) {
    const isPartialSelect = !!this.fields;
    let fields;
    if (this.fields) {
      fields = this.fields;
    } else if (is(source, Subquery)) {
      fields = Object.fromEntries(
        Object.keys(source._.selectedFields).map((key) => [key, source[key]])
      );
    } else if (is(source, SQLiteViewBase)) {
      fields = source[ViewBaseConfig].selectedFields;
    } else if (is(source, SQL)) {
      fields = {};
    } else {
      fields = getTableColumns(source);
    }
    return new SQLiteSelectBase({
      table: source,
      fields,
      isPartialSelect,
      session: this.session,
      dialect: this.dialect,
      withList: this.withList,
      distinct: this.distinct
    });
  }
};
var SQLiteSelectQueryBuilderBase = class extends TypedQueryBuilder {
  static {
    __name(this, "SQLiteSelectQueryBuilderBase");
  }
  static [entityKind] = "SQLiteSelectQueryBuilder";
  _;
  /** @internal */
  config;
  joinsNotNullableMap;
  tableName;
  isPartialSelect;
  session;
  dialect;
  constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct }) {
    super();
    this.config = {
      withList,
      table,
      fields: { ...fields },
      distinct,
      setOperators: []
    };
    this.isPartialSelect = isPartialSelect;
    this.session = session;
    this.dialect = dialect;
    this._ = {
      selectedFields: fields
    };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
  }
  createJoin(joinType) {
    return (table, on) => {
      const baseTableName = this.tableName;
      const tableName = getTableLikeName(table);
      if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (!this.isPartialSelect) {
        if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") {
          this.config.fields = {
            [baseTableName]: this.config.fields
          };
        }
        if (typeof tableName === "string" && !is(table, SQL)) {
          const selection = is(table, Subquery) ? table._.selectedFields : is(table, View) ? table[ViewBaseConfig].selectedFields : table[Table.Symbol.Columns];
          this.config.fields[tableName] = selection;
        }
      }
      if (typeof on === "function") {
        on = on(
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      if (!this.config.joins) {
        this.config.joins = [];
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  /**
   * Executes a `left join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet | null }[] = await db.select()
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number | null }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  leftJoin = this.createJoin("left");
  /**
   * Executes a `right join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet }[] = await db.select()
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  rightJoin = this.createJoin("right");
  /**
   * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet }[] = await db.select()
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  innerJoin = this.createJoin("inner");
  /**
   * Executes a `full join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet | null }[] = await db.select()
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number | null }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  fullJoin = this.createJoin("full");
  createSetOperator(type, isAll) {
    return (rightSelection) => {
      const rightSelect = typeof rightSelection === "function" ? rightSelection(getSQLiteSetOperators()) : rightSelection;
      if (!haveSameKeys(this.getSelectedFields(), rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
      this.config.setOperators.push({ type, isAll, rightSelect });
      return this;
    };
  }
  /**
   * Adds `union` set operator to the query.
   *
   * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
   *
   * @example
   *
   * ```ts
   * // Select all unique names from customers and users tables
   * await db.select({ name: users.name })
   *   .from(users)
   *   .union(
   *     db.select({ name: customers.name }).from(customers)
   *   );
   * // or
   * import { union } from 'drizzle-orm/sqlite-core'
   *
   * await union(
   *   db.select({ name: users.name }).from(users),
   *   db.select({ name: customers.name }).from(customers)
   * );
   * ```
   */
  union = this.createSetOperator("union", false);
  /**
   * Adds `union all` set operator to the query.
   *
   * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
   *
   * @example
   *
   * ```ts
   * // Select all transaction ids from both online and in-store sales
   * await db.select({ transaction: onlineSales.transactionId })
   *   .from(onlineSales)
   *   .unionAll(
   *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   *   );
   * // or
   * import { unionAll } from 'drizzle-orm/sqlite-core'
   *
   * await unionAll(
   *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
   *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   * );
   * ```
   */
  unionAll = this.createSetOperator("union", true);
  /**
   * Adds `intersect` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
   *
   * @example
   *
   * ```ts
   * // Select course names that are offered in both departments A and B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .intersect(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { intersect } from 'drizzle-orm/sqlite-core'
   *
   * await intersect(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  intersect = this.createSetOperator("intersect", false);
  /**
   * Adds `except` set operator to the query.
   *
   * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
   *
   * @example
   *
   * ```ts
   * // Select all courses offered in department A but not in department B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .except(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { except } from 'drizzle-orm/sqlite-core'
   *
   * await except(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  except = this.createSetOperator("except", false);
  /** @internal */
  addSetOperators(setOperators) {
    this.config.setOperators.push(...setOperators);
    return this;
  }
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be selected.
   *
   * ```ts
   * // Select all cars with green color
   * await db.select().from(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Select all BMW cars with a green color
   * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Select all cars with the green or blue color
   * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    if (typeof where === "function") {
      where = where(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.where = where;
    return this;
  }
  /**
   * Adds a `having` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
   *
   * @param having the `having` clause.
   *
   * @example
   *
   * ```ts
   * // Select all brands with more than one car
   * await db.select({
   * 	brand: cars.brand,
   * 	count: sql<number>`cast(count(${cars.id}) as int)`,
   * })
   *   .from(cars)
   *   .groupBy(cars.brand)
   *   .having(({ count }) => gt(count, 1));
   * ```
   */
  having(having) {
    if (typeof having === "function") {
      having = having(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.having = having;
    return this;
  }
  groupBy(...columns) {
    if (typeof columns[0] === "function") {
      const groupBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
    } else {
      this.config.groupBy = columns;
    }
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    } else {
      const orderByArray = columns;
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    }
    return this;
  }
  /**
   * Adds a `limit` clause to the query.
   *
   * Calling this method will set the maximum number of rows that will be returned by this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param limit the `limit` clause.
   *
   * @example
   *
   * ```ts
   * // Get the first 10 people from this query.
   * await db.select().from(people).limit(10);
   * ```
   */
  limit(limit) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).limit = limit;
    } else {
      this.config.limit = limit;
    }
    return this;
  }
  /**
   * Adds an `offset` clause to the query.
   *
   * Calling this method will skip a number of rows when returning results from this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param offset the `offset` clause.
   *
   * @example
   *
   * ```ts
   * // Get the 10th-20th people from this query.
   * await db.select().from(people).offset(10).limit(10);
   * ```
   */
  offset(offset) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).offset = offset;
    } else {
      this.config.offset = offset;
    }
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildSelectQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  as(alias) {
    return new Proxy(
      new Subquery(this.getSQL(), this.config.fields, alias),
      new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  /** @internal */
  getSelectedFields() {
    return new Proxy(
      this.config.fields,
      new SelectionProxyHandler({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  $dynamic() {
    return this;
  }
};
var SQLiteSelectBase = class extends SQLiteSelectQueryBuilderBase {
  static {
    __name(this, "SQLiteSelectBase");
  }
  static [entityKind] = "SQLiteSelect";
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    if (!this.session) {
      throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
    }
    const fieldsList = orderSelectedFields(this.config.fields);
    const query = this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      fieldsList,
      "all",
      true
    );
    query.joinsNotNullableMap = this.joinsNotNullableMap;
    return query;
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute() {
    return this.all();
  }
};
applyMixins(SQLiteSelectBase, [QueryPromise]);
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select) => ({
      type,
      isAll,
      rightSelect: select
    }));
    for (const setOperator of setOperators) {
      if (!haveSameKeys(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
__name(createSetOperator, "createSetOperator");
var getSQLiteSetOperators = /* @__PURE__ */ __name(() => ({
  union,
  unionAll,
  intersect,
  except
}), "getSQLiteSetOperators");
var union = createSetOperator("union", false);
var unionAll = createSetOperator("union", true);
var intersect = createSetOperator("intersect", false);
var except = createSetOperator("except", false);

// node_modules/drizzle-orm/sqlite-core/query-builders/query-builder.js
var QueryBuilder = class {
  static {
    __name(this, "QueryBuilder");
  }
  static [entityKind] = "SQLiteQueryBuilder";
  dialect;
  dialectConfig;
  constructor(dialect) {
    this.dialect = is(dialect, SQLiteDialect) ? dialect : void 0;
    this.dialectConfig = is(dialect, SQLiteDialect) ? void 0 : dialect;
  }
  $with = /* @__PURE__ */ __name((alias, selection) => {
    const queryBuilder = this;
    const as = /* @__PURE__ */ __name((qb) => {
      if (typeof qb === "function") {
        qb = qb(queryBuilder);
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    }, "as");
    return { as };
  }, "$with");
  with(...queries) {
    const self = this;
    function select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries
      });
    }
    __name(select, "select");
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries,
        distinct: true
      });
    }
    __name(selectDistinct, "selectDistinct");
    return { select, selectDistinct };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: void 0, dialect: this.getDialect() });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: true
    });
  }
  // Lazy load dialect to avoid circular dependency
  getDialect() {
    if (!this.dialect) {
      this.dialect = new SQLiteSyncDialect(this.dialectConfig);
    }
    return this.dialect;
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/insert.js
var SQLiteInsertBuilder = class {
  static {
    __name(this, "SQLiteInsertBuilder");
  }
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "SQLiteInsertBuilder";
  values(values) {
    values = Array.isArray(values) ? values : [values];
    if (values.length === 0) {
      throw new Error("values() must be called with at least one value");
    }
    const mappedValues = values.map((entry) => {
      const result = {};
      const cols = this.table[Table.Symbol.Columns];
      for (const colKey of Object.keys(entry)) {
        const colValue = entry[colKey];
        result[colKey] = is(colValue, SQL) ? colValue : new Param(colValue, cols[colKey]);
      }
      return result;
    });
    return new SQLiteInsertBase(this.table, mappedValues, this.session, this.dialect, this.withList);
  }
  select(selectQuery) {
    const select = typeof selectQuery === "function" ? selectQuery(new QueryBuilder()) : selectQuery;
    if (!is(select, SQL) && !haveSameKeys(this.table[Columns], select._.selectedFields)) {
      throw new Error(
        "Insert select error: selected fields are not the same or are in a different order compared to the table definition"
      );
    }
    return new SQLiteInsertBase(this.table, select, this.session, this.dialect, this.withList, true);
  }
};
var SQLiteInsertBase = class extends QueryPromise {
  static {
    __name(this, "SQLiteInsertBase");
  }
  constructor(table, values, session, dialect, withList, select) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, values, withList, select };
  }
  static [entityKind] = "SQLiteInsert";
  /** @internal */
  config;
  returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /**
   * Adds an `on conflict do nothing` clause to the query.
   *
   * Calling this method simply avoids inserting a row as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
   *
   * @param config The `target` and `where` clauses.
   *
   * @example
   * ```ts
   * // Insert one row and cancel the insert if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing();
   *
   * // Explicitly specify conflict target
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing({ target: cars.id });
   * ```
   */
  onConflictDoNothing(config = {}) {
    if (!this.config.onConflict)
      this.config.onConflict = [];
    if (config.target === void 0) {
      this.config.onConflict.push(sql` on conflict do nothing`);
    } else {
      const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
      const whereSql = config.where ? sql` where ${config.where}` : sql``;
      this.config.onConflict.push(sql` on conflict ${targetSql} do nothing${whereSql}`);
    }
    return this;
  }
  /**
   * Adds an `on conflict do update` clause to the query.
   *
   * Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
   *
   * @param config The `target`, `set` and `where` clauses.
   *
   * @example
   * ```ts
   * // Update the row if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'Porsche' }
   *   });
   *
   * // Upsert with 'where' clause
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'newBMW' },
   *     where: sql`${cars.createdAt} > '2023-01-01'::date`,
   *   });
   * ```
   */
  onConflictDoUpdate(config) {
    if (config.where && (config.targetWhere || config.setWhere)) {
      throw new Error(
        'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.'
      );
    }
    if (!this.config.onConflict)
      this.config.onConflict = [];
    const whereSql = config.where ? sql` where ${config.where}` : void 0;
    const targetWhereSql = config.targetWhere ? sql` where ${config.targetWhere}` : void 0;
    const setWhereSql = config.setWhere ? sql` where ${config.setWhere}` : void 0;
    const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
    const setSql = this.dialect.buildUpdateSet(this.config.table, mapUpdateSet(this.config.table, config.set));
    this.config.onConflict.push(
      sql` on conflict ${targetSql}${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`
    );
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildInsertQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/update.js
var SQLiteUpdateBuilder = class {
  static {
    __name(this, "SQLiteUpdateBuilder");
  }
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "SQLiteUpdateBuilder";
  set(values) {
    return new SQLiteUpdateBase(
      this.table,
      mapUpdateSet(this.table, values),
      this.session,
      this.dialect,
      this.withList
    );
  }
};
var SQLiteUpdateBase = class extends QueryPromise {
  static {
    __name(this, "SQLiteUpdateBase");
  }
  constructor(table, set, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { set, table, withList, joins: [] };
  }
  static [entityKind] = "SQLiteUpdate";
  /** @internal */
  config;
  from(source) {
    this.config.from = source;
    return this;
  }
  createJoin(joinType) {
    return (table, on) => {
      const tableName = getTableLikeName(table);
      if (typeof tableName === "string" && this.config.joins.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (typeof on === "function") {
        const from = this.config.from ? is(table, SQLiteTable) ? table[Table.Symbol.Columns] : is(table, Subquery) ? table._.selectedFields : is(table, SQLiteViewBase) ? table[ViewBaseConfig].selectedFields : void 0 : void 0;
        on = on(
          new Proxy(
            this.config.table[Table.Symbol.Columns],
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          ),
          from && new Proxy(
            from,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      return this;
    };
  }
  leftJoin = this.createJoin("left");
  rightJoin = this.createJoin("right");
  innerJoin = this.createJoin("inner");
  fullJoin = this.createJoin("full");
  /**
   * Adds a 'where' clause to the query.
   *
   * Calling this method will update only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param where the 'where' clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be updated.
   *
   * ```ts
   * // Update all cars with green color
   * db.update(cars).set({ color: 'red' })
   *   .where(eq(cars.color, 'green'));
   * // or
   * db.update(cars).set({ color: 'red' })
   *   .where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Update all BMW cars with a green color
   * db.update(cars).set({ color: 'red' })
   *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Update all cars with the green or blue color
   * db.update(cars).set({ color: 'red' })
   *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.table[Table.Symbol.Columns],
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      this.config.orderBy = orderByArray;
    } else {
      const orderByArray = columns;
      this.config.orderBy = orderByArray;
    }
    return this;
  }
  limit(limit) {
    this.config.limit = limit;
    return this;
  }
  returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildUpdateQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/count.js
var SQLiteCountBuilder = class _SQLiteCountBuilder extends SQL {
  static {
    __name(this, "SQLiteCountBuilder");
  }
  constructor(params) {
    super(_SQLiteCountBuilder.buildEmbeddedCount(params.source, params.filters).queryChunks);
    this.params = params;
    this.session = params.session;
    this.sql = _SQLiteCountBuilder.buildCount(
      params.source,
      params.filters
    );
  }
  sql;
  static [entityKind] = "SQLiteCountBuilderAsync";
  [Symbol.toStringTag] = "SQLiteCountBuilderAsync";
  session;
  static buildEmbeddedCount(source, filters) {
    return sql`(select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters})`;
  }
  static buildCount(source, filters) {
    return sql`select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters}`;
  }
  then(onfulfilled, onrejected) {
    return Promise.resolve(this.session.count(this.sql)).then(
      onfulfilled,
      onrejected
    );
  }
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/query.js
var RelationalQueryBuilder = class {
  static {
    __name(this, "RelationalQueryBuilder");
  }
  constructor(mode, fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session) {
    this.mode = mode;
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
  }
  static [entityKind] = "SQLiteAsyncRelationalQueryBuilder";
  findMany(config) {
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    ) : new SQLiteRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    );
  }
  findFirst(config) {
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    ) : new SQLiteRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    );
  }
};
var SQLiteRelationalQuery = class extends QueryPromise {
  static {
    __name(this, "SQLiteRelationalQuery");
  }
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session, config, mode) {
    super();
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
    this.config = config;
    this.mode = mode;
  }
  static [entityKind] = "SQLiteAsyncRelationalQuery";
  /** @internal */
  mode;
  /** @internal */
  getSQL() {
    return this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    }).sql;
  }
  /** @internal */
  _prepare(isOneTimeQuery = false) {
    const { query, builtQuery } = this._toSQL();
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      builtQuery,
      void 0,
      this.mode === "first" ? "get" : "all",
      true,
      (rawRows, mapColumnValue) => {
        const rows = rawRows.map(
          (row) => mapRelationalRow(this.schema, this.tableConfig, row, query.selection, mapColumnValue)
        );
        if (this.mode === "first") {
          return rows[0];
        }
        return rows;
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  _toSQL() {
    const query = this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    });
    const builtQuery = this.dialect.sqlToQuery(query.sql);
    return { query, builtQuery };
  }
  toSQL() {
    return this._toSQL().builtQuery;
  }
  /** @internal */
  executeRaw() {
    if (this.mode === "first") {
      return this._prepare(false).get();
    }
    return this._prepare(false).all();
  }
  async execute() {
    return this.executeRaw();
  }
};
var SQLiteSyncRelationalQuery = class extends SQLiteRelationalQuery {
  static {
    __name(this, "SQLiteSyncRelationalQuery");
  }
  static [entityKind] = "SQLiteSyncRelationalQuery";
  sync() {
    return this.executeRaw();
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/raw.js
var SQLiteRaw = class extends QueryPromise {
  static {
    __name(this, "SQLiteRaw");
  }
  constructor(execute, getSQL, action, dialect, mapBatchResult) {
    super();
    this.execute = execute;
    this.getSQL = getSQL;
    this.dialect = dialect;
    this.mapBatchResult = mapBatchResult;
    this.config = { action };
  }
  static [entityKind] = "SQLiteRaw";
  /** @internal */
  config;
  getQuery() {
    return { ...this.dialect.sqlToQuery(this.getSQL()), method: this.config.action };
  }
  mapResult(result, isFromBatch) {
    return isFromBatch ? this.mapBatchResult(result) : result;
  }
  _prepare() {
    return this;
  }
  /** @internal */
  isResponseInArrayMode() {
    return false;
  }
};

// node_modules/drizzle-orm/sqlite-core/db.js
var BaseSQLiteDatabase = class {
  static {
    __name(this, "BaseSQLiteDatabase");
  }
  constructor(resultKind, dialect, session, schema) {
    this.resultKind = resultKind;
    this.dialect = dialect;
    this.session = session;
    this._ = schema ? {
      schema: schema.schema,
      fullSchema: schema.fullSchema,
      tableNamesMap: schema.tableNamesMap
    } : {
      schema: void 0,
      fullSchema: {},
      tableNamesMap: {}
    };
    this.query = {};
    const query = this.query;
    if (this._.schema) {
      for (const [tableName, columns] of Object.entries(this._.schema)) {
        query[tableName] = new RelationalQueryBuilder(
          resultKind,
          schema.fullSchema,
          this._.schema,
          this._.tableNamesMap,
          schema.fullSchema[tableName],
          columns,
          dialect,
          session
        );
      }
    }
  }
  static [entityKind] = "BaseSQLiteDatabase";
  query;
  /**
   * Creates a subquery that defines a temporary named result set as a CTE.
   *
   * It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param alias The alias for the subquery.
   *
   * Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
   *
   * @example
   *
   * ```ts
   * // Create a subquery with alias 'sq' and use it in the select query
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * const result = await db.with(sq).select().from(sq);
   * ```
   *
   * To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
   *
   * ```ts
   * // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
   * const sq = db.$with('sq').as(db.select({
   *   name: sql<string>`upper(${users.name})`.as('name'),
   * })
   * .from(users));
   *
   * const result = await db.with(sq).select({ name: sq.name }).from(sq);
   * ```
   */
  $with = /* @__PURE__ */ __name((alias, selection) => {
    const self = this;
    const as = /* @__PURE__ */ __name((qb) => {
      if (typeof qb === "function") {
        qb = qb(new QueryBuilder(self.dialect));
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    }, "as");
    return { as };
  }, "$with");
  $count(source, filters) {
    return new SQLiteCountBuilder({ source, filters, session: this.session });
  }
  /**
   * Incorporates a previously defined CTE (using `$with`) into the main query.
   *
   * This method allows the main query to reference a temporary named result set.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param queries The CTEs to incorporate into the main query.
   *
   * @example
   *
   * ```ts
   * // Define a subquery 'sq' as a CTE using $with
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * // Incorporate the CTE 'sq' into the main query and select from it
   * const result = await db.with(sq).select().from(sq);
   * ```
   */
  with(...queries) {
    const self = this;
    function select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries
      });
    }
    __name(select, "select");
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: true
      });
    }
    __name(selectDistinct, "selectDistinct");
    function update(table) {
      return new SQLiteUpdateBuilder(table, self.session, self.dialect, queries);
    }
    __name(update, "update");
    function insert(into) {
      return new SQLiteInsertBuilder(into, self.session, self.dialect, queries);
    }
    __name(insert, "insert");
    function delete_(from) {
      return new SQLiteDeleteBase(from, self.session, self.dialect, queries);
    }
    __name(delete_, "delete_");
    return { select, selectDistinct, update, insert, delete: delete_ };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: this.session, dialect: this.dialect });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: true
    });
  }
  /**
   * Creates an update query.
   *
   * Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
   *
   * Use `.set()` method to specify which values to update.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param table The table to update.
   *
   * @example
   *
   * ```ts
   * // Update all rows in the 'cars' table
   * await db.update(cars).set({ color: 'red' });
   *
   * // Update rows with filters and conditions
   * await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
   *
   * // Update with returning clause
   * const updatedCar: Car[] = await db.update(cars)
   *   .set({ color: 'red' })
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  update(table) {
    return new SQLiteUpdateBuilder(table, this.session, this.dialect);
  }
  /**
   * Creates an insert query.
   *
   * Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert}
   *
   * @param table The table to insert into.
   *
   * @example
   *
   * ```ts
   * // Insert one row
   * await db.insert(cars).values({ brand: 'BMW' });
   *
   * // Insert multiple rows
   * await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
   *
   * // Insert with returning clause
   * const insertedCar: Car[] = await db.insert(cars)
   *   .values({ brand: 'BMW' })
   *   .returning();
   * ```
   */
  insert(into) {
    return new SQLiteInsertBuilder(into, this.session, this.dialect);
  }
  /**
   * Creates a delete query.
   *
   * Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param table The table to delete from.
   *
   * @example
   *
   * ```ts
   * // Delete all rows in the 'cars' table
   * await db.delete(cars);
   *
   * // Delete rows with filters and conditions
   * await db.delete(cars).where(eq(cars.color, 'green'));
   *
   * // Delete with returning clause
   * const deletedCar: Car[] = await db.delete(cars)
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  delete(from) {
    return new SQLiteDeleteBase(from, this.session, this.dialect);
  }
  run(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.run(sequel),
        () => sequel,
        "run",
        this.dialect,
        this.session.extractRawRunValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.run(sequel);
  }
  all(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.all(sequel),
        () => sequel,
        "all",
        this.dialect,
        this.session.extractRawAllValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.all(sequel);
  }
  get(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.get(sequel),
        () => sequel,
        "get",
        this.dialect,
        this.session.extractRawGetValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.get(sequel);
  }
  values(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.values(sequel),
        () => sequel,
        "values",
        this.dialect,
        this.session.extractRawValuesValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.values(sequel);
  }
  transaction(transaction, config) {
    return this.session.transaction(transaction, config);
  }
};

// node_modules/drizzle-orm/sqlite-core/checks.js
var CheckBuilder = class {
  static {
    __name(this, "CheckBuilder");
  }
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }
  static [entityKind] = "SQLiteCheckBuilder";
  brand;
  build(table) {
    return new Check(table, this);
  }
};
var Check = class {
  static {
    __name(this, "Check");
  }
  constructor(table, builder) {
    this.table = table;
    this.name = builder.name;
    this.value = builder.value;
  }
  static [entityKind] = "SQLiteCheck";
  name;
  value;
};
function check(name, value) {
  return new CheckBuilder(name, value);
}
__name(check, "check");

// node_modules/drizzle-orm/sqlite-core/indexes.js
var IndexBuilderOn = class {
  static {
    __name(this, "IndexBuilderOn");
  }
  constructor(name, unique) {
    this.name = name;
    this.unique = unique;
  }
  static [entityKind] = "SQLiteIndexBuilderOn";
  on(...columns) {
    return new IndexBuilder(this.name, columns, this.unique);
  }
};
var IndexBuilder = class {
  static {
    __name(this, "IndexBuilder");
  }
  static [entityKind] = "SQLiteIndexBuilder";
  /** @internal */
  config;
  constructor(name, columns, unique) {
    this.config = {
      name,
      columns,
      unique,
      where: void 0
    };
  }
  /**
   * Condition for partial index.
   */
  where(condition) {
    this.config.where = condition;
    return this;
  }
  /** @internal */
  build(table) {
    return new Index(this.config, table);
  }
};
var Index = class {
  static {
    __name(this, "Index");
  }
  static [entityKind] = "SQLiteIndex";
  config;
  constructor(config, table) {
    this.config = { ...config, table };
  }
};
function index(name) {
  return new IndexBuilderOn(name, false);
}
__name(index, "index");
function uniqueIndex(name) {
  return new IndexBuilderOn(name, true);
}
__name(uniqueIndex, "uniqueIndex");

// node_modules/drizzle-orm/sqlite-core/session.js
var ExecuteResultSync = class extends QueryPromise {
  static {
    __name(this, "ExecuteResultSync");
  }
  constructor(resultCb) {
    super();
    this.resultCb = resultCb;
  }
  static [entityKind] = "ExecuteResultSync";
  async execute() {
    return this.resultCb();
  }
  sync() {
    return this.resultCb();
  }
};
var SQLitePreparedQuery = class {
  static {
    __name(this, "SQLitePreparedQuery");
  }
  constructor(mode, executeMethod, query) {
    this.mode = mode;
    this.executeMethod = executeMethod;
    this.query = query;
  }
  static [entityKind] = "PreparedQuery";
  /** @internal */
  joinsNotNullableMap;
  getQuery() {
    return this.query;
  }
  mapRunResult(result, _isFromBatch) {
    return result;
  }
  mapAllResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  mapGetResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  execute(placeholderValues) {
    if (this.mode === "async") {
      return this[this.executeMethod](placeholderValues);
    }
    return new ExecuteResultSync(() => this[this.executeMethod](placeholderValues));
  }
  mapResult(response, isFromBatch) {
    switch (this.executeMethod) {
      case "run": {
        return this.mapRunResult(response, isFromBatch);
      }
      case "all": {
        return this.mapAllResult(response, isFromBatch);
      }
      case "get": {
        return this.mapGetResult(response, isFromBatch);
      }
    }
  }
};
var SQLiteSession = class {
  static {
    __name(this, "SQLiteSession");
  }
  constructor(dialect) {
    this.dialect = dialect;
  }
  static [entityKind] = "SQLiteSession";
  prepareOneTimeQuery(query, fields, executeMethod, isResponseInArrayMode) {
    return this.prepareQuery(query, fields, executeMethod, isResponseInArrayMode);
  }
  run(query) {
    const staticQuery = this.dialect.sqlToQuery(query);
    try {
      return this.prepareOneTimeQuery(staticQuery, void 0, "run", false).run();
    } catch (err) {
      throw new DrizzleError({ cause: err, message: `Failed to run the query '${staticQuery.sql}'` });
    }
  }
  /** @internal */
  extractRawRunValueFromBatchResult(result) {
    return result;
  }
  all(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).all();
  }
  /** @internal */
  extractRawAllValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  get(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).get();
  }
  /** @internal */
  extractRawGetValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  values(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).values();
  }
  async count(sql2) {
    const result = await this.values(sql2);
    return result[0][0];
  }
  /** @internal */
  extractRawValuesValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
};
var SQLiteTransaction = class extends BaseSQLiteDatabase {
  static {
    __name(this, "SQLiteTransaction");
  }
  constructor(resultType, dialect, session, schema, nestedIndex = 0) {
    super(resultType, dialect, session, schema);
    this.schema = schema;
    this.nestedIndex = nestedIndex;
  }
  static [entityKind] = "SQLiteTransaction";
  rollback() {
    throw new TransactionRollbackError();
  }
};

// node_modules/drizzle-orm/d1/session.js
var SQLiteD1Session = class extends SQLiteSession {
  static {
    __name(this, "SQLiteD1Session");
  }
  constructor(client, dialect, schema, options = {}) {
    super(dialect);
    this.client = client;
    this.schema = schema;
    this.options = options;
    this.logger = options.logger ?? new NoopLogger();
  }
  static [entityKind] = "SQLiteD1Session";
  logger;
  prepareQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper) {
    const stmt = this.client.prepare(query.sql);
    return new D1PreparedQuery(
      stmt,
      query,
      this.logger,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper
    );
  }
  async batch(queries) {
    const preparedQueries = [];
    const builtQueries = [];
    for (const query of queries) {
      const preparedQuery = query._prepare();
      const builtQuery = preparedQuery.getQuery();
      preparedQueries.push(preparedQuery);
      if (builtQuery.params.length > 0) {
        builtQueries.push(preparedQuery.stmt.bind(...builtQuery.params));
      } else {
        const builtQuery2 = preparedQuery.getQuery();
        builtQueries.push(
          this.client.prepare(builtQuery2.sql).bind(...builtQuery2.params)
        );
      }
    }
    const batchResults = await this.client.batch(builtQueries);
    return batchResults.map((result, i) => preparedQueries[i].mapResult(result, true));
  }
  extractRawAllValueFromBatchResult(result) {
    return result.results;
  }
  extractRawGetValueFromBatchResult(result) {
    return result.results[0];
  }
  extractRawValuesValueFromBatchResult(result) {
    return d1ToRawMapping(result.results);
  }
  async transaction(transaction, config) {
    const tx = new D1Transaction("async", this.dialect, this, this.schema);
    await this.run(sql.raw(`begin${config?.behavior ? " " + config.behavior : ""}`));
    try {
      const result = await transaction(tx);
      await this.run(sql`commit`);
      return result;
    } catch (err) {
      await this.run(sql`rollback`);
      throw err;
    }
  }
};
var D1Transaction = class _D1Transaction extends SQLiteTransaction {
  static {
    __name(this, "D1Transaction");
  }
  static [entityKind] = "D1Transaction";
  async transaction(transaction) {
    const savepointName = `sp${this.nestedIndex}`;
    const tx = new _D1Transaction("async", this.dialect, this.session, this.schema, this.nestedIndex + 1);
    await this.session.run(sql.raw(`savepoint ${savepointName}`));
    try {
      const result = await transaction(tx);
      await this.session.run(sql.raw(`release savepoint ${savepointName}`));
      return result;
    } catch (err) {
      await this.session.run(sql.raw(`rollback to savepoint ${savepointName}`));
      throw err;
    }
  }
};
function d1ToRawMapping(results) {
  const rows = [];
  for (const row of results) {
    const entry = Object.keys(row).map((k) => row[k]);
    rows.push(entry);
  }
  return rows;
}
__name(d1ToRawMapping, "d1ToRawMapping");
var D1PreparedQuery = class extends SQLitePreparedQuery {
  static {
    __name(this, "D1PreparedQuery");
  }
  constructor(stmt, query, logger, fields, executeMethod, _isResponseInArrayMode, customResultMapper) {
    super("async", executeMethod, query);
    this.logger = logger;
    this._isResponseInArrayMode = _isResponseInArrayMode;
    this.customResultMapper = customResultMapper;
    this.fields = fields;
    this.stmt = stmt;
  }
  static [entityKind] = "D1PreparedQuery";
  /** @internal */
  customResultMapper;
  /** @internal */
  fields;
  /** @internal */
  stmt;
  run(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return this.stmt.bind(...params).run();
  }
  async all(placeholderValues) {
    const { fields, query, logger, stmt, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      const params = fillPlaceholders(query.params, placeholderValues ?? {});
      logger.logQuery(query.sql, params);
      return stmt.bind(...params).all().then(({ results }) => this.mapAllResult(results));
    }
    const rows = await this.values(placeholderValues);
    return this.mapAllResult(rows);
  }
  mapAllResult(rows, isFromBatch) {
    if (isFromBatch) {
      rows = d1ToRawMapping(rows.results);
    }
    if (!this.fields && !this.customResultMapper) {
      return rows;
    }
    if (this.customResultMapper) {
      return this.customResultMapper(rows);
    }
    return rows.map((row) => mapResultRow(this.fields, row, this.joinsNotNullableMap));
  }
  async get(placeholderValues) {
    const { fields, joinsNotNullableMap, query, logger, stmt, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      const params = fillPlaceholders(query.params, placeholderValues ?? {});
      logger.logQuery(query.sql, params);
      return stmt.bind(...params).all().then(({ results }) => results[0]);
    }
    const rows = await this.values(placeholderValues);
    if (!rows[0]) {
      return void 0;
    }
    if (customResultMapper) {
      return customResultMapper(rows);
    }
    return mapResultRow(fields, rows[0], joinsNotNullableMap);
  }
  mapGetResult(result, isFromBatch) {
    if (isFromBatch) {
      result = d1ToRawMapping(result.results)[0];
    }
    if (!this.fields && !this.customResultMapper) {
      return result;
    }
    if (this.customResultMapper) {
      return this.customResultMapper([result]);
    }
    return mapResultRow(this.fields, result, this.joinsNotNullableMap);
  }
  values(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return this.stmt.bind(...params).raw();
  }
  /** @internal */
  isResponseInArrayMode() {
    return this._isResponseInArrayMode;
  }
};

// node_modules/drizzle-orm/d1/driver.js
var DrizzleD1Database = class extends BaseSQLiteDatabase {
  static {
    __name(this, "DrizzleD1Database");
  }
  static [entityKind] = "D1Database";
  async batch(batch) {
    return this.session.batch(batch);
  }
};
function drizzle(client, config = {}) {
  const dialect = new SQLiteAsyncDialect({ casing: config.casing });
  let logger;
  if (config.logger === true) {
    logger = new DefaultLogger();
  } else if (config.logger !== false) {
    logger = config.logger;
  }
  let schema;
  if (config.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config.schema,
      createTableRelationsHelpers
    );
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const session = new SQLiteD1Session(client, dialect, schema, { logger });
  const db = new DrizzleD1Database("async", dialect, session, schema);
  db.$client = client;
  return db;
}
__name(drizzle, "drizzle");

// src/db/schema.ts
var organizations = sqliteTable(
  "organizations",
  {
    organizationUuid: text("organization_uuid").primaryKey(),
    organizationId: text("organization_id").unique().notNull(),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`)
  },
  (table) => [
    index("idx_organizations_organization_id").on(table.organizationId)
  ]
);
var users = sqliteTable(
  "users",
  {
    userUuid: text("user_uuid").primaryKey(),
    userId: text("user_id").unique().notNull(),
    hashedPassword: text("hashed_password").notNull(),
    isValid: integer("is_valid").notNull().default(1).$type(),
    isFrozen: integer("is_frozen").notNull().default(0).$type(),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`)
  },
  (table) => [
    index("idx_users_user_id").on(table.userId)
  ]
);
var memberships = sqliteTable(
  "memberships",
  {
    membershipUuid: text("membership_uuid").primaryKey(),
    organizationUuid: text("organization_uuid").notNull().references(() => organizations.organizationUuid, { onDelete: "cascade" }),
    userUuid: text("user_uuid").notNull().references(() => users.userUuid, { onDelete: "cascade" }),
    role: text("role").notNull().$type(),
    joinedAt: integer("joined_at").notNull().default(sql`(unixepoch())`)
  },
  (table) => [
    uniqueIndex("uniq_user_org").on(table.userUuid, table.organizationUuid),
    index("idx_memberships_user_uuid").on(table.userUuid),
    index("idx_memberships_organization_uuid").on(table.organizationUuid)
  ]
);
var profiles = sqliteTable(
  "profiles",
  {
    profileUuid: text("profile_uuid").primaryKey(),
    profileType: text("profile_type").notNull().$type(),
    organizationUuid: text("organization_uuid").references(() => organizations.organizationUuid, { onDelete: "cascade" }),
    userUuid: text("user_uuid").references(() => users.userUuid, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    bio: text("bio"),
    avatar: text("avatar").notNull().default("/img/default/avatar.png"),
    instagramId: text("instagram_id"),
    threadsId: text("threads_id"),
    twitterId: text("twitter_id"),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`)
  },
  (table) => [
    check("profile_check", sql`
			(${table.profileType} = 'organization' AND ${table.organizationUuid} IS NOT NULL AND ${table.userUuid} IS NULL) 
    		OR 
    		(${table.profileType} = 'user' AND ${table.userUuid} IS NOT NULL AND ${table.organizationUuid} IS NULL)
		`),
    index("idx_profiles_user_uuid").on(table.userUuid),
    index("idx_profiles_organization_uuid").on(table.organizationUuid)
  ]
);
var sessions = sqliteTable(
  "sessions",
  {
    sessionUuid: text("session_uuid").primaryKey(),
    userUuid: text("user_uuid").notNull().references(() => users.userUuid, { onDelete: "cascade" }),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    expiresAt: integer("expires_at").notNull(),
    lastActiveAt: integer("last_active_at").notNull().default(sql`(unixepoch())`),
    isValid: integer("is_valid").notNull().default(1).$type()
  },
  (table) => [
    index("idx_sessions_user_uuid").on(table.userUuid)
  ]
);
var projects = sqliteTable(
  "projects",
  {
    projectUuid: text("project_uuid").primaryKey(),
    projectId: text("project_id").unique().notNull(),
    membershipUuid: text("membership_uuid").notNull().references(() => memberships.membershipUuid),
    title: text("title").notNull(),
    description: text("description"),
    buttons: text("buttons", { mode: "json" }).notNull().$type(),
    thumbnail: text("thumbnail").notNull().default("/img/default/thumbnail.png"),
    isValid: integer("is_valid").notNull().default(1).$type(),
    postUuid: text("post_uuid").notNull().references(() => posts.postUuid),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`)
  },
  (table) => [
    index("idx_projects_membership_uuid").on(table.membershipUuid),
    index("idx_projects_project_id").on(table.projectId)
  ]
);
var events = sqliteTable(
  "events",
  {
    eventUuid: text("event_uuid").primaryKey(),
    eventId: text("event_id").unique().notNull(),
    membershipUuid: text("membership_uuid").notNull().references(() => memberships.membershipUuid),
    title: text("title").notNull(),
    description: text("description"),
    buttons: text("buttons", { mode: "json" }).notNull().$type(),
    thumbnail: text("thumbnail").notNull().default("/img/default/thumbnail.png"),
    startAt: integer("start_at").notNull(),
    endAt: integer("end_at").notNull(),
    place: text("place").notNull(),
    isValid: integer("is_valid").notNull().default(1).$type(),
    postUuid: text("post_uuid").notNull().references(() => posts.postUuid),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`)
  },
  (table) => [
    index("idx_events_membership_uuid").on(table.membershipUuid),
    index("idx_events_event_id").on(table.eventId),
    check("event_dates_check", sql`${table.endAt} > ${table.startAt}`)
  ]
);
var polls = sqliteTable(
  "polls",
  {
    pollUuid: text("poll_uuid").primaryKey(),
    pollId: text("poll_id").unique().notNull(),
    membershipUuid: text("membership_uuid").notNull().references(() => memberships.membershipUuid),
    title: text("title").notNull(),
    description: text("description"),
    choices: text("choices", { mode: "json" }).notNull().$type(),
    thumbnail: text("thumbnail").notNull().default("/img/default/thumbnail.png"),
    isValid: integer("is_valid").notNull().default(1).$type(),
    postUuid: text("post_uuid").notNull().references(() => posts.postUuid),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`)
  },
  (table) => [
    index("idx_polls_membership_uuid").on(table.membershipUuid),
    index("idx_polls_poll_id").on(table.pollId)
  ]
);
var votes = sqliteTable(
  "votes",
  {
    voteUuid: text("vote_uuid").primaryKey(),
    pollUuid: text("poll_uuid").notNull().references(() => polls.pollUuid),
    userUuid: text("user_uuid").notNull(),
    isGuest: integer("is_guest").notNull().default(1).$type(),
    choiceName: text("choice_name").notNull(),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`)
  },
  (table) => [
    index("idx_votes_poll_uuid").on(table.pollUuid),
    index("idx_votes_user_uuid").on(table.userUuid)
  ]
);
var questions = sqliteTable(
  "questions",
  {
    questionUuid: text("question_uuid").primaryKey(),
    questionId: text("question_id").unique().notNull(),
    membershipUuid: text("membership_uuid").notNull().references(() => memberships.membershipUuid),
    title: text("title").notNull(),
    description: text("description"),
    thumbnail: text("thumbnail").notNull().default("/img/default/thumbnail.png"),
    isValid: integer("is_valid").notNull().default(1).$type(),
    postUuid: text("post_uuid").notNull().references(() => posts.postUuid),
    bestCommentUuid: text("best_comment").references(() => comments.commentUuid),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`)
  },
  (table) => [
    index("idx_questions_membership_uuid").on(table.membershipUuid),
    index("idx_questions_question_id").on(table.questionId)
  ]
);
var posts = sqliteTable(
  "posts",
  {
    postUuid: text("post_uuid").primaryKey(),
    postType: text("post_type").notNull().$type(),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`)
  }
);
var comments = sqliteTable(
  "comments",
  {
    commentUuid: text("comment_uuid").primaryKey(),
    postUuid: text("post_uuid").notNull().references(() => posts.postUuid),
    membershipUuid: text("membership_uuid").notNull().references(() => memberships.membershipUuid),
    content: text("content").notNull(),
    isValid: integer("is_valid").notNull().default(1).$type(),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`)
  },
  (table) => [
    index("idx_comments_membership_uuid").on(table.membershipUuid),
    index("idx_comments_post_uuid").on(table.postUuid)
  ]
);
var replies = sqliteTable(
  "reqlies",
  {
    replyUuid: text("reply_uuid").primaryKey(),
    commentUuid: text("comment_uuid").notNull().references(() => comments.commentUuid),
    membershipUuid: text("membership_uuid").notNull().references(() => memberships.membershipUuid),
    content: text("content").notNull(),
    isValid: integer("is_valid").notNull().default(1).$type(),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`)
  },
  (table) => [
    index("idx_replies_membership_uuid").on(table.membershipUuid),
    index("idx_replies_comment_uuid").on(table.commentUuid)
  ]
);
var notifications = sqliteTable(
  "notifications",
  {
    notificationUuid: text("notification_uuid").primaryKey(),
    userUuid: text("user_uuid").notNull().references(() => users.userUuid),
    content: text("content").notNull(),
    href: text("href"),
    isOpened: integer("is_accepted").notNull().default(0).$type(),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    isValid: integer("is_valid").notNull().default(1).$type()
  },
  (table) => [
    index("idx_notifications_membership_uuid").on(table.userUuid)
  ]
);
var subscriptions = sqliteTable(
  "subscriptions",
  {
    subscriptionUuid: text("notification_uuid").primaryKey(),
    userUuid: text("user_uuid").notNull().references(() => users.userUuid),
    postUuid: text("post_uuid").notNull().references(() => posts.postUuid),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    isValid: integer("is_valid").notNull().default(1).$type()
  },
  (table) => [
    index("idx_subscriptions_user_uuid").on(table.userUuid),
    uniqueIndex("uniq_user_post").on(table.userUuid, table.postUuid)
  ]
);

// node_modules/zod/lib/index.mjs
var util;
(function(util2) {
  util2.assertEqual = (val) => val;
  function assertIs(_arg) {
  }
  __name(assertIs, "assertIs");
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  __name(assertNever, "assertNever");
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  __name(joinValues, "joinValues");
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = /* @__PURE__ */ __name((data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
}, "getParsedType");
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = /* @__PURE__ */ __name((obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
}, "quotelessJson");
var ZodError = class _ZodError extends Error {
  static {
    __name(this, "ZodError");
  }
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = /* @__PURE__ */ __name((error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    }, "processError");
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
        fieldErrors[sub.path[0]].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};
var errorMap = /* @__PURE__ */ __name((issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
}, "errorMap");
var overrideErrorMap = errorMap;
function setErrorMap(map) {
  overrideErrorMap = map;
}
__name(setErrorMap, "setErrorMap");
function getErrorMap() {
  return overrideErrorMap;
}
__name(getErrorMap, "getErrorMap");
var makeIssue = /* @__PURE__ */ __name((params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
}, "makeIssue");
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === errorMap ? void 0 : errorMap
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
__name(addIssueToContext, "addIssueToContext");
var ParseStatus = class _ParseStatus {
  static {
    __name(this, "ParseStatus");
  }
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = /* @__PURE__ */ __name((value) => ({ status: "dirty", value }), "DIRTY");
var OK = /* @__PURE__ */ __name((value) => ({ status: "valid", value }), "OK");
var isAborted = /* @__PURE__ */ __name((x) => x.status === "aborted", "isAborted");
var isDirty = /* @__PURE__ */ __name((x) => x.status === "dirty", "isDirty");
var isValid = /* @__PURE__ */ __name((x) => x.status === "valid", "isValid");
var isAsync = /* @__PURE__ */ __name((x) => typeof Promise !== "undefined" && x instanceof Promise, "isAsync");
function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}
__name(__classPrivateFieldGet, "__classPrivateFieldGet");
function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}
__name(__classPrivateFieldSet, "__classPrivateFieldSet");
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message === null || message === void 0 ? void 0 : message.message;
})(errorUtil || (errorUtil = {}));
var _ZodEnum_cache;
var _ZodNativeEnum_cache;
var ParseInputLazyPath = class {
  static {
    __name(this, "ParseInputLazyPath");
  }
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (this._key instanceof Array) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = /* @__PURE__ */ __name((ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
}, "handleResult");
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = /* @__PURE__ */ __name((iss, ctx) => {
    var _a, _b;
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message !== null && message !== void 0 ? message : ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: (_a = message !== null && message !== void 0 ? message : required_error) !== null && _a !== void 0 ? _a : ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: (_b = message !== null && message !== void 0 ? message : invalid_type_error) !== null && _b !== void 0 ? _b : ctx.defaultError };
  }, "customMap");
  return { errorMap: customMap, description };
}
__name(processCreateParams, "processCreateParams");
var ZodType = class {
  static {
    __name(this, "ZodType");
  }
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    var _a;
    const ctx = {
      common: {
        issues: [],
        async: (_a = params === null || params === void 0 ? void 0 : params.async) !== null && _a !== void 0 ? _a : false,
        contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap
      },
      path: (params === null || params === void 0 ? void 0 : params.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    var _a, _b;
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if ((_b = (_a = err === null || err === void 0 ? void 0 : err.message) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === null || _b === void 0 ? void 0 : _b.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
        async: true
      },
      path: (params === null || params === void 0 ? void 0 : params.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check2, message) {
    const getIssueProperties = /* @__PURE__ */ __name((val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    }, "getIssueProperties");
    return this._refinement((val, ctx) => {
      const result = check2(val);
      const setError = /* @__PURE__ */ __name(() => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      }), "setError");
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check2, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check2(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: /* @__PURE__ */ __name((data) => this["~validate"](data), "validate")
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let regex = `([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d`;
  if (args.precision) {
    regex = `${regex}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    regex = `${regex}(\\.\\d+)?`;
  }
  return regex;
}
__name(timeRegexSource, "timeRegexSource");
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
__name(timeRegex, "timeRegex");
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
__name(datetimeRegex, "datetimeRegex");
function isValidIP(ip, version2) {
  if ((version2 === "v4" || !version2) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version2 === "v6" || !version2) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
__name(isValidIP, "isValidIP");
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if (!decoded.typ || !decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch (_a) {
    return false;
  }
}
__name(isValidJWT, "isValidJWT");
function isValidCidr(ip, version2) {
  if ((version2 === "v4" || !version2) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version2 === "v6" || !version2) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
__name(isValidCidr, "isValidCidr");
var ZodString = class _ZodString extends ZodType {
  static {
    __name(this, "ZodString");
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check2 of this._def.checks) {
      if (check2.kind === "min") {
        if (input.data.length < check2.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check2.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "max") {
        if (input.data.length > check2.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check2.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "length") {
        const tooBig = input.data.length > check2.value;
        const tooSmall = input.data.length < check2.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check2.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check2.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check2.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check2.message
            });
          }
          status.dirty();
        }
      } else if (check2.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "url") {
        try {
          new URL(input.data);
        } catch (_a) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "regex") {
        check2.regex.lastIndex = 0;
        const testResult = check2.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "trim") {
        input.data = input.data.trim();
      } else if (check2.kind === "includes") {
        if (!input.data.includes(check2.value, check2.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check2.value, position: check2.position },
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check2.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check2.kind === "startsWith") {
        if (!input.data.startsWith(check2.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check2.value },
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "endsWith") {
        if (!input.data.endsWith(check2.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check2.value },
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "datetime") {
        const regex = datetimeRegex(check2);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "time") {
        const regex = timeRegex(check2);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "ip") {
        if (!isValidIP(input.data, check2.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "jwt") {
        if (!isValidJWT(input.data, check2.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "cidr") {
        if (!isValidCidr(input.data, check2.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check2.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check2);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check2) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check2]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    var _a, _b;
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
      offset: (_a = options === null || options === void 0 ? void 0 : options.offset) !== null && _a !== void 0 ? _a : false,
      local: (_b = options === null || options === void 0 ? void 0 : options.local) !== null && _b !== void 0 ? _b : false,
      ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
      ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options === null || options === void 0 ? void 0 : options.position,
      ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  var _a;
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / Math.pow(10, decCount);
}
__name(floatSafeRemainder, "floatSafeRemainder");
var ZodNumber = class _ZodNumber extends ZodType {
  static {
    __name(this, "ZodNumber");
  }
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check2 of this._def.checks) {
      if (check2.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "min") {
        const tooSmall = check2.inclusive ? input.data < check2.value : input.data <= check2.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check2.value,
            type: "number",
            inclusive: check2.inclusive,
            exact: false,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "max") {
        const tooBig = check2.inclusive ? input.data > check2.value : input.data >= check2.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check2.value,
            type: "number",
            inclusive: check2.inclusive,
            exact: false,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check2.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check2.value,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check2.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check2);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check2) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check2]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null, min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  static {
    __name(this, "ZodBigInt");
  }
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch (_a) {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check2 of this._def.checks) {
      if (check2.kind === "min") {
        const tooSmall = check2.inclusive ? input.data < check2.value : input.data <= check2.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check2.value,
            inclusive: check2.inclusive,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "max") {
        const tooBig = check2.inclusive ? input.data > check2.value : input.data >= check2.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check2.value,
            inclusive: check2.inclusive,
            message: check2.message
          });
          status.dirty();
        }
      } else if (check2.kind === "multipleOf") {
        if (input.data % check2.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check2.value,
            message: check2.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check2);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check2) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check2]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  var _a;
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  static {
    __name(this, "ZodBoolean");
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  static {
    __name(this, "ZodDate");
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check2 of this._def.checks) {
      if (check2.kind === "min") {
        if (input.data.getTime() < check2.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check2.message,
            inclusive: true,
            exact: false,
            minimum: check2.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check2.kind === "max") {
        if (input.data.getTime() > check2.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check2.message,
            inclusive: true,
            exact: false,
            maximum: check2.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check2);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check2) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check2]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  static {
    __name(this, "ZodSymbol");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  static {
    __name(this, "ZodUndefined");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  static {
    __name(this, "ZodNull");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  static {
    __name(this, "ZodAny");
  }
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  static {
    __name(this, "ZodUnknown");
  }
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  static {
    __name(this, "ZodNever");
  }
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  static {
    __name(this, "ZodVoid");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  static {
    __name(this, "ZodArray");
  }
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
__name(deepPartialify, "deepPartialify");
var ZodObject = class _ZodObject extends ZodType {
  static {
    __name(this, "ZodObject");
  }
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    return this._cached = { shape, keys };
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") ;
      else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: /* @__PURE__ */ __name((issue, ctx) => {
          var _a, _b, _c, _d;
          const defaultError = (_c = (_b = (_a = this._def).errorMap) === null || _b === void 0 ? void 0 : _b.call(_a, issue, ctx).message) !== null && _c !== void 0 ? _c : ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: (_d = errorUtil.errToObj(message).message) !== null && _d !== void 0 ? _d : defaultError
            };
          return {
            message: defaultError
          };
        }, "errorMap")
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => ({
        ...this._def.shape(),
        ...augmentation
      }), "shape")
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: /* @__PURE__ */ __name(() => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }), "shape"),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index2) {
    return new _ZodObject({
      ...this._def,
      catchall: index2
    });
  }
  pick(mask) {
    const shape = {};
    util.objectKeys(mask).forEach((key) => {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    });
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => shape, "shape")
    });
  }
  omit(mask) {
    const shape = {};
    util.objectKeys(this.shape).forEach((key) => {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    });
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => shape, "shape")
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    util.objectKeys(this.shape).forEach((key) => {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    });
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  }
  required(mask) {
    const newShape = {};
    util.objectKeys(this.shape).forEach((key) => {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    });
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: /* @__PURE__ */ __name(() => shape, "shape"),
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: /* @__PURE__ */ __name(() => shape, "shape"),
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  static {
    __name(this, "ZodUnion");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    __name(handleResults, "handleResults");
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = /* @__PURE__ */ __name((type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
}, "getDiscriminator");
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  static {
    __name(this, "ZodDiscriminatedUnion");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index2 = 0; index2 < a.length; index2++) {
      const itemA = a[index2];
      const itemB = b[index2];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
__name(mergeValues, "mergeValues");
var ZodIntersection = class extends ZodType {
  static {
    __name(this, "ZodIntersection");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = /* @__PURE__ */ __name((parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    }, "handleParsed");
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  static {
    __name(this, "ZodTuple");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  static {
    __name(this, "ZodRecord");
  }
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  static {
    __name(this, "ZodMap");
  }
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index2) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index2, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index2, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  static {
    __name(this, "ZodSet");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    __name(finalizeSet, "finalizeSet");
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  static {
    __name(this, "ZodFunction");
  }
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [
          ctx.common.contextualErrorMap,
          ctx.schemaErrorMap,
          getErrorMap(),
          errorMap
        ].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    __name(makeArgsIssue, "makeArgsIssue");
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [
          ctx.common.contextualErrorMap,
          ctx.schemaErrorMap,
          getErrorMap(),
          errorMap
        ].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    __name(makeReturnsIssue, "makeReturnsIssue");
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  static {
    __name(this, "ZodLazy");
  }
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  static {
    __name(this, "ZodLiteral");
  }
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
__name(createZodEnum, "createZodEnum");
var ZodEnum = class _ZodEnum extends ZodType {
  static {
    __name(this, "ZodEnum");
  }
  constructor() {
    super(...arguments);
    _ZodEnum_cache.set(this, void 0);
  }
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f")) {
      __classPrivateFieldSet(this, _ZodEnum_cache, new Set(this._def.values), "f");
    }
    if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f").has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
_ZodEnum_cache = /* @__PURE__ */ new WeakMap();
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  static {
    __name(this, "ZodNativeEnum");
  }
  constructor() {
    super(...arguments);
    _ZodNativeEnum_cache.set(this, void 0);
  }
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f")) {
      __classPrivateFieldSet(this, _ZodNativeEnum_cache, new Set(util.getValidEnumValues(this._def.values)), "f");
    }
    if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f").has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
_ZodNativeEnum_cache = /* @__PURE__ */ new WeakMap();
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  static {
    __name(this, "ZodPromise");
  }
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  static {
    __name(this, "ZodEffects");
  }
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: /* @__PURE__ */ __name((arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      }, "addIssue"),
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = /* @__PURE__ */ __name((acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      }, "executeRefinement");
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return base;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return base;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({ status: status.value, value: result }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  static {
    __name(this, "ZodOptional");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  static {
    __name(this, "ZodNullable");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  static {
    __name(this, "ZodDefault");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  static {
    __name(this, "ZodCatch");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  static {
    __name(this, "ZodNaN");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  static {
    __name(this, "ZodBranded");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  static {
    __name(this, "ZodPipeline");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = /* @__PURE__ */ __name(async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      }, "handleAsync");
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  static {
    __name(this, "ZodReadonly");
  }
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = /* @__PURE__ */ __name((data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    }, "freeze");
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
__name(cleanParams, "cleanParams");
function custom(check2, _params = {}, fatal) {
  if (check2)
    return ZodAny.create().superRefine((data, ctx) => {
      var _a, _b;
      const r = check2(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          var _a2, _b2;
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = (_b2 = (_a2 = params.fatal) !== null && _a2 !== void 0 ? _a2 : fatal) !== null && _b2 !== void 0 ? _b2 : true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = (_b = (_a = params.fatal) !== null && _a !== void 0 ? _a : fatal) !== null && _b !== void 0 ? _b : true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
__name(custom, "custom");
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = /* @__PURE__ */ __name((cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params), "instanceOfType");
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = /* @__PURE__ */ __name(() => stringType().optional(), "ostring");
var onumber = /* @__PURE__ */ __name(() => numberType().optional(), "onumber");
var oboolean = /* @__PURE__ */ __name(() => booleanType().optional(), "oboolean");
var coerce = {
  string: /* @__PURE__ */ __name(((arg) => ZodString.create({ ...arg, coerce: true })), "string"),
  number: /* @__PURE__ */ __name(((arg) => ZodNumber.create({ ...arg, coerce: true })), "number"),
  boolean: /* @__PURE__ */ __name(((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })), "boolean"),
  bigint: /* @__PURE__ */ __name(((arg) => ZodBigInt.create({ ...arg, coerce: true })), "bigint"),
  date: /* @__PURE__ */ __name(((arg) => ZodDate.create({ ...arg, coerce: true })), "date")
};
var NEVER = INVALID;
var z = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  defaultErrorMap: errorMap,
  setErrorMap,
  getErrorMap,
  makeIssue,
  EMPTY_PATH,
  addIssueToContext,
  ParseStatus,
  INVALID,
  DIRTY,
  OK,
  isAborted,
  isDirty,
  isValid,
  isAsync,
  get util() {
    return util;
  },
  get objectUtil() {
    return objectUtil;
  },
  ZodParsedType,
  getParsedType,
  ZodType,
  datetimeRegex,
  ZodString,
  ZodNumber,
  ZodBigInt,
  ZodBoolean,
  ZodDate,
  ZodSymbol,
  ZodUndefined,
  ZodNull,
  ZodAny,
  ZodUnknown,
  ZodNever,
  ZodVoid,
  ZodArray,
  ZodObject,
  ZodUnion,
  ZodDiscriminatedUnion,
  ZodIntersection,
  ZodTuple,
  ZodRecord,
  ZodMap,
  ZodSet,
  ZodFunction,
  ZodLazy,
  ZodLiteral,
  ZodEnum,
  ZodNativeEnum,
  ZodPromise,
  ZodEffects,
  ZodTransformer: ZodEffects,
  ZodOptional,
  ZodNullable,
  ZodDefault,
  ZodCatch,
  ZodNaN,
  BRAND,
  ZodBranded,
  ZodPipeline,
  ZodReadonly,
  custom,
  Schema: ZodType,
  ZodSchema: ZodType,
  late,
  get ZodFirstPartyTypeKind() {
    return ZodFirstPartyTypeKind;
  },
  coerce,
  any: anyType,
  array: arrayType,
  bigint: bigIntType,
  boolean: booleanType,
  date: dateType,
  discriminatedUnion: discriminatedUnionType,
  effect: effectsType,
  "enum": enumType,
  "function": functionType,
  "instanceof": instanceOfType,
  intersection: intersectionType,
  lazy: lazyType,
  literal: literalType,
  map: mapType,
  nan: nanType,
  nativeEnum: nativeEnumType,
  never: neverType,
  "null": nullType,
  nullable: nullableType,
  number: numberType,
  object: objectType,
  oboolean,
  onumber,
  optional: optionalType,
  ostring,
  pipeline: pipelineType,
  preprocess: preprocessType,
  promise: promiseType,
  record: recordType,
  set: setType,
  strictObject: strictObjectType,
  string: stringType,
  symbol: symbolType,
  transformer: effectsType,
  tuple: tupleType,
  "undefined": undefinedType,
  union: unionType,
  unknown: unknownType,
  "void": voidType,
  NEVER,
  ZodIssueCode,
  quotelessJson,
  ZodError
});

// node_modules/hono/dist/utils/cookie.js
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var parse = /* @__PURE__ */ __name((cookie, name) => {
  if (name && cookie.indexOf(name) === -1) {
    return {};
  }
  const pairs = cookie.trim().split(";");
  const parsedCookie = {};
  for (let pairStr of pairs) {
    pairStr = pairStr.trim();
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) {
      continue;
    }
    const cookieName = pairStr.substring(0, valueStartPos).trim();
    if (name && name !== cookieName || !validCookieNameRegEx.test(cookieName)) {
      continue;
    }
    let cookieValue = pairStr.substring(valueStartPos + 1).trim();
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = decodeURIComponent_(cookieValue);
      if (name) {
        break;
      }
    }
  }
  return parsedCookie;
}, "parse");

// node_modules/hono/dist/helper/cookie/index.js
var getCookie = /* @__PURE__ */ __name((c, key, prefix) => {
  const cookie = c.req.raw.headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return void 0;
    }
    let finalKey = key;
    if (prefix === "secure") {
      finalKey = "__Secure-" + key;
    } else if (prefix === "host") {
      finalKey = "__Host-" + key;
    }
    const obj2 = parse(cookie, finalKey);
    return obj2[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = parse(cookie);
  return obj;
}, "getCookie");

// node_modules/hono/dist/http-exception.js
var HTTPException = class extends Error {
  static {
    __name(this, "HTTPException");
  }
  res;
  status;
  constructor(status = 500, options) {
    super(options?.message, { cause: options?.cause });
    this.res = options?.res;
    this.status = status;
  }
  getResponse() {
    if (this.res) {
      const newResponse = new Response(this.res.body, {
        status: this.status,
        headers: this.res.headers
      });
      return newResponse;
    }
    return new Response(this.message, {
      status: this.status
    });
  }
};

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = /* @__PURE__ */ __name((arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      "Content-Type": contentType
    }
  });
  return response.formData();
}, "bufferToFormData");

// node_modules/hono/dist/validator/validator.js
var jsonRegex = /^application\/([a-z-\.]+\+)?json(;\s*[a-zA-Z0-9\-]+\=([^;]+))*$/;
var multipartRegex = /^multipart\/form-data(;\s?boundary=[a-zA-Z0-9'"()+_,\-./:=?]+)?$/;
var urlencodedRegex = /^application\/x-www-form-urlencoded(;\s*[a-zA-Z0-9\-]+\=([^;]+))*$/;
var validator = /* @__PURE__ */ __name((target, validationFunc) => {
  return async (c, next) => {
    let value = {};
    const contentType = c.req.header("Content-Type");
    switch (target) {
      case "json":
        if (!contentType || !jsonRegex.test(contentType)) {
          break;
        }
        try {
          value = await c.req.json();
        } catch {
          const message = "Malformed JSON in request body";
          throw new HTTPException(400, { message });
        }
        break;
      case "form": {
        if (!contentType || !(multipartRegex.test(contentType) || urlencodedRegex.test(contentType))) {
          break;
        }
        let formData;
        if (c.req.bodyCache.formData) {
          formData = await c.req.bodyCache.formData;
        } else {
          try {
            const arrayBuffer = await c.req.arrayBuffer();
            formData = await bufferToFormData(arrayBuffer, contentType);
            c.req.bodyCache.formData = formData;
          } catch (e) {
            let message = "Malformed FormData request.";
            message += e instanceof Error ? ` ${e.message}` : ` ${String(e)}`;
            throw new HTTPException(400, { message });
          }
        }
        const form = {};
        formData.forEach((value2, key) => {
          if (key.endsWith("[]")) {
            ;
            (form[key] ??= []).push(value2);
          } else if (Array.isArray(form[key])) {
            ;
            form[key].push(value2);
          } else if (key in form) {
            form[key] = [form[key], value2];
          } else {
            form[key] = value2;
          }
        });
        value = form;
        break;
      }
      case "query":
        value = Object.fromEntries(
          Object.entries(c.req.queries()).map(([k, v]) => {
            return v.length === 1 ? [k, v[0]] : [k, v];
          })
        );
        break;
      case "param":
        value = c.req.param();
        break;
      case "header":
        value = c.req.header();
        break;
      case "cookie":
        value = getCookie(c);
        break;
    }
    const res = await validationFunc(value, c);
    if (res instanceof Response) {
      return res;
    }
    c.req.addValidatedData(target, res);
    await next();
  };
}, "validator");

// node_modules/@hono/zod-validator/dist/index.js
var zValidator = /* @__PURE__ */ __name((target, schema, hook) => (
  // @ts-expect-error not typed well
  validator(target, async (value, c) => {
    let validatorValue = value;
    if (target === "header" && schema instanceof ZodObject) {
      const schemaKeys = Object.keys(schema.shape);
      const caseInsensitiveKeymap = Object.fromEntries(
        schemaKeys.map((key) => [key.toLowerCase(), key])
      );
      validatorValue = Object.fromEntries(
        Object.entries(value).map(([key, value2]) => [caseInsensitiveKeymap[key] || key, value2])
      );
    }
    const result = await schema.safeParseAsync(validatorValue);
    if (hook) {
      const hookResult = await hook({ data: validatorValue, ...result, target }, c);
      if (hookResult) {
        if (hookResult instanceof Response) {
          return hookResult;
        }
        if ("response" in hookResult) {
          return hookResult.response;
        }
      }
    }
    if (!result.success) {
      return c.json(result, 400);
    }
    return result.data;
  })
), "zValidator");

// src/middlewares/permission.ts
var checkOrgMembership = /* @__PURE__ */ __name((requiredRole = "member") => async (c, next) => {
  if (c.req.method == "GET") {
    return next();
  }
  let organizationId;
  const contentType = c.req.header("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const body = await c.req.parseBody();
    organizationId = body?.organizationId?.toLowerCase();
  } else if (contentType.includes("application/json")) {
    const jsonBody = await c.req.json();
    organizationId = jsonBody?.organizationId?.toLowerCase();
  } else {
    return c.json({ success: false, message: "Unsupported Content-Type" }, 415);
  }
  if (!organizationId) {
    organizationId = c.req.param("organization_id");
  }
  if (!organizationId) {
    return c.json({ success: false, message: "Organization ID is required" }, 400);
  }
  const db = drizzle(c.env.DB);
  const session = c.get("session");
  const [organization] = await db.select().from(organizations).where(eq(organizations.organizationId, organizationId.toLowerCase()));
  if (!organization) {
    return c.json(
      { success: false, message: "Organization not found" },
      404
    );
  }
  const [membership] = await db.select().from(memberships).where(and(eq(memberships.userUuid, session.userUuid), eq(memberships.organizationUuid, organization.organizationUuid))).execute();
  if (!membership) {
    return c.json(
      { success: false, message: "User is not a member of this organization" },
      403
    );
  }
  c.set("membership", membership);
  c.set("organization", organization);
  if (requiredRole === "admin" && membership.role !== "admin") {
    return c.json(
      { success: false, message: "Insufficient permissions" },
      403
    );
  }
  return next();
}, "checkOrgMembership");
var checkUserSession = /* @__PURE__ */ __name(async (c, next) => {
  if (c.req.method == "GET") {
    return next();
  }
  let userId;
  const contentType = c.req.header("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const body = await c.req.parseBody();
    userId = body?.userId?.toLowerCase();
  } else if (contentType.includes("application/json")) {
    const jsonBody = await c.req.json();
    userId = jsonBody?.userId?.toLowerCase();
  } else {
    return c.json({ success: false, message: "Unsupported Content-Type" }, 415);
  }
  if (!userId) {
    userId = c.req.param("user_id");
  }
  if (!userId) {
    return c.json({ success: false, message: "User ID is required" }, 400);
  }
  const db = drizzle(c.env.DB);
  const session = c.get("session");
  const [user] = await db.select().from(users).where(eq(users.userId, userId)).execute();
  if (user.userUuid !== session.userUuid) {
    return c.json(
      { success: false, message: "Forbidden" },
      403
    );
  }
  return next();
}, "checkUserSession");

// src/routes/auth.ts
var app = new Hono2();
app.post("/sign_in", zValidator("json", z.object({
  userId: z.string(),
  hashedPassword: z.string()
})), async (c) => {
  const { userId, hashedPassword } = c.req.valid("json");
  const db = drizzle(c.env.DB);
  const [user] = await db.select().from(users).where(eq(users.userId, userId.toLowerCase())).execute();
  if (!user || user.hashedPassword !== hashedPassword) {
    return c.json(
      { success: false, message: "Invalid credentials" },
      401
    );
  }
  const session = {
    sessionUuid: crypto.randomUUID(),
    userUuid: user.userUuid,
    userAgent: c.req.header("User-Agent"),
    ipAddress: c.req.header("X-Forwarded-For"),
    expiresAt: Math.floor((/* @__PURE__ */ new Date()).setMonth((/* @__PURE__ */ new Date()).getMonth() + 1) / 1e3)
  };
  await db.insert(sessions).values(session).execute();
  return c.json(
    { success: true, userUuid: user.userUuid, sessionUuid: session.sessionUuid, userId }
  );
});
app.post("/sign_out", zValidator("json", z.object({
  sessionUuid: z.string()
})), async (c) => {
  const { sessionUuid } = c.req.valid("json");
  const db = drizzle(c.env.DB);
  const session = c.get("session");
  if (session.sessionUuid !== sessionUuid) {
    return c.json(
      { success: false, message: "Forbidden" },
      403
    );
  }
  await db.update(sessions).set({ isValid: 0 }).where(eq(sessions.sessionUuid, sessionUuid)).execute();
  return c.json(
    { success: true }
  );
});
app.use("/create_account", checkOrgMembership("admin"));
app.post("/create_account", zValidator("json", z.object({
  newUserId: z.string(),
  organizationId: z.string(),
  hashedPassword: z.string(),
  displayName: z.string(),
  sessionUuid: z.string()
})), async (c) => {
  const { newUserId, hashedPassword, displayName } = c.req.valid("json");
  const db = drizzle(c.env.DB);
  const organization = c.get("organization");
  const user = {
    userUuid: crypto.randomUUID(),
    userId: newUserId.toLowerCase(),
    hashedPassword
  };
  const profile = {
    profileUuid: crypto.randomUUID(),
    profileType: "user",
    organizationUuid: null,
    userUuid: user.userUuid,
    displayName,
    bio: null,
    avatar: "/img/default/avatar.png",
    instagramId: null,
    threadsId: null,
    twitterId: null
  };
  const membership = {
    membershipUuid: crypto.randomUUID(),
    organizationUuid: organization.organizationUuid,
    userUuid: user.userUuid,
    role: "member"
  };
  await db.insert(users).values(user).execute();
  await db.insert(profiles).values(profile).execute();
  await db.insert(memberships).values(membership).execute();
  return c.json(
    { success: true }
  );
});
app.post("/change_password", zValidator("json", z.object({
  sessionUuid: z.string(),
  hashedCurrentPassword: z.string(),
  hashedNewPassword: z.string()
})), async (c) => {
  const { hashedCurrentPassword, hashedNewPassword } = c.req.valid("json");
  const db = drizzle(c.env.DB);
  const session = c.get("session");
  const [user] = await db.select().from(users).where(eq(users.userUuid, session.userUuid)).execute();
  if (user.hashedPassword !== hashedCurrentPassword) {
    return c.json(
      { success: false, message: "Invalid credentials" },
      401
    );
  }
  await db.update(users).set({ hashedPassword: hashedNewPassword }).where(eq(users.userUuid, session.userUuid)).execute();
  return c.json(
    { success: true }
  );
});
app.post("/session_check", zValidator("json", z.object({
  sessionUuid: z.string(),
  userId: z.string()
})), async (c) => {
  const { userId } = c.req.valid("json");
  const db = drizzle(c.env.DB);
  const session = c.get("session");
  const [user] = await db.select().from(users).where(eq(users.userUuid, session.userUuid)).execute();
  return c.json({
    success: true,
    isValid: session.isValid && user.userId === userId
  });
});
var auth_default = app;

// src/routes/organizations.ts
var app2 = new Hono2();
app2.get("/:organization_id", async (c) => {
  const organizationId = c.req.param("organization_id");
  const db = drizzle(c.env.DB);
  const [organization] = await db.select().from(organizations).where(eq(organizations.organizationId, organizationId)).execute();
  if (!organization) {
    return c.json(
      { success: false, message: "Organization not found" },
      404
    );
  }
  const [profile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, organization.organizationUuid)).execute();
  const organizationMemberships = await db.select().from(memberships).where(eq(memberships.organizationUuid, organization.organizationUuid));
  const organizationUsers = await Promise.all(organizationMemberships.map(async (organizationMembership) => {
    const [user] = await db.select().from(users).where(eq(users.userUuid, organizationMembership.userUuid)).execute();
    const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, organizationMembership.userUuid)).execute();
    const userData = {
      userId: user.userId,
      displayName: userProfile.displayName,
      bio: userProfile.bio,
      avatar: userProfile.avatar,
      instagramId: userProfile.instagramId,
      threadsId: userProfile.threadsId,
      twitterId: userProfile.twitterId,
      role: organizationMembership.role
    };
    return userData;
  }));
  const data = {
    organizationId: organization.organizationId,
    displayName: profile.displayName,
    bio: profile.bio,
    avatar: profile.avatar,
    instagramId: profile.instagramId,
    threadsId: profile.threadsId,
    twitterId: profile.twitterId,
    users: organizationUsers
  };
  return c.json(
    { success: true, data }
  );
});
app2.use("/:organization_id", checkOrgMembership("admin"));
app2.put("/:organization_id", zValidator("form", z.object({
  sessionUuid: z.string(),
  displayName: z.string(),
  bio: z.string(),
  instagramId: z.string(),
  threadsId: z.string(),
  twitterId: z.string()
}).partial()), async (c) => {
  const { displayName, bio, instagramId, threadsId, twitterId } = c.req.valid("form");
  const organization = c.get("organization");
  const db = drizzle(c.env.DB);
  const newProfile = {
    displayName,
    bio,
    instagramId,
    threadsId,
    twitterId,
    updatedAt: Math.floor(Date.now() / 1e3)
  };
  const updatedProfile = Object.fromEntries(
    Object.entries(newProfile).filter(([_, value]) => value !== null && value !== void 0)
  );
  await db.update(profiles).set(updatedProfile).where(eq(profiles.organizationUuid, organization.organizationUuid)).execute();
  return c.json(
    { success: true }
  );
});
app2.use("/:organization_id/id", checkOrgMembership("admin"));
app2.put("/:organization_id/id", zValidator("json", z.object({
  sessionUuid: z.string(),
  newOrganizationId: z.string()
})), async (c) => {
  const { newOrganizationId } = c.req.valid("json");
  const organization = c.get("organization");
  const db = drizzle(c.env.DB);
  await db.update(organizations).set({ organizationId: newOrganizationId.toLowerCase() }).where(eq(organizations.organizationUuid, organization.organizationUuid)).execute();
  return c.json(
    { success: true }
  );
});
app2.use("/:organization_id/avatar", checkOrgMembership("admin"));
app2.post("/:organization_id/avatar", zValidator("form", z.object({
  sessionUuid: z.string(),
  avatar: z.instanceof(File)
})), async (c) => {
  const { avatar } = await c.req.parseBody();
  const organization = c.get("organization");
  const db = drizzle(c.env.DB);
  const forwardFormData = new FormData();
  if (!(avatar instanceof File)) {
    return c.json(
      { success: false, message: "Avatar must be a file" },
      400
    );
  }
  forwardFormData.append("file", avatar);
  forwardFormData.append("scriptId", c.env.SCRIPT_ID);
  const response = await fetch("https://image.stki.org/", {
    method: "POST",
    body: forwardFormData
  });
  const data = await response.json();
  if (!response.ok) {
    return c.json(
      { success: false, message: `Image API Error (${response.status}): ${data.error}` },
      500
    );
  }
  await db.update(profiles).set({ avatar: data.url, updatedAt: Math.floor(Date.now() / 1e3) }).where(eq(profiles.organizationUuid, organization.organizationUuid)).execute();
  return c.json(
    { success: true }
  );
});
var organizations_default = app2;

// src/routes/users.ts
var app3 = new Hono2();
app3.get("/", zValidator("query", z.object({
  organizationId: z.string()
}).required()), async (c) => {
  const { organizationId } = c.req.valid("query");
  const db = drizzle(c.env.DB);
  const [organization] = await db.select().from(organizations).where(eq(organizations.organizationId, organizationId)).execute();
  const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, organization.organizationUuid)).execute();
  if (!organization) {
    return c.json(
      { success: false, message: "Organization not found" },
      404
    );
  }
  const membershipObject = await db.select().from(memberships).where(eq(memberships.organizationUuid, organization.organizationUuid));
  const usersObject = await Promise.all(membershipObject.map(async (membership) => {
    const [user] = await db.select().from(users).where(eq(users.userUuid, membership.userUuid)).execute();
    const [profile] = await db.select().from(profiles).where(eq(profiles.userUuid, user.userUuid)).execute();
    const data = {
      userId: user.userId,
      displayName: profile.displayName,
      bio: profile.bio,
      avatar: profile.avatar,
      instagramId: profile.instagramId,
      threadsId: profile.threadsId,
      twitterId: profile.twitterId,
      organizationId: organization.organizationId,
      organizationDisplayName: organizationProfile.displayName,
      organizationAvatar: organizationProfile.avatar,
      role: membership.role
    };
    return data;
  }));
  return c.json(
    { success: true, data: usersObject }
  );
});
app3.get("/:user_id", async (c) => {
  const userId = c.req.param("user_id");
  const db = drizzle(c.env.DB);
  const [user] = await db.select().from(users).where(eq(users.userId, userId)).execute();
  if (!user) {
    return c.json(
      { success: false, message: "User not found" },
      404
    );
  }
  const [profile] = await db.select().from(profiles).where(eq(profiles.userUuid, user.userUuid)).execute();
  const [membership] = await db.select().from(memberships).where(eq(memberships.userUuid, user.userUuid)).execute();
  const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, membership.organizationUuid)).execute();
  const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, organization.organizationUuid)).execute();
  const data = {
    userId: user.userId,
    displayName: profile.displayName,
    bio: profile.bio,
    avatar: profile.avatar,
    instagramId: profile.instagramId,
    threadsId: profile.threadsId,
    twitterId: profile.twitterId,
    organizationId: organization.organizationId,
    organizationDisplayName: organizationProfile.displayName,
    organizationAvatar: organizationProfile.avatar,
    role: membership.role
  };
  return c.json(
    { success: true, data }
  );
});
app3.use("/:user_id/id", checkUserSession);
app3.patch("/:user_id/id", zValidator("json", z.object({
  sessionUuid: z.string(),
  newUserId: z.string()
})), async (c) => {
  const { newUserId } = c.req.valid("json");
  const session = c.get("session");
  const db = drizzle(c.env.DB);
  await db.update(users).set({ userId: newUserId.toLowerCase() }).where(eq(users.userUuid, session.userUuid)).execute();
  return c.json(
    { success: true }
  );
});
app3.use("/:user_id", checkUserSession);
app3.put("/:user_id", zValidator("form", z.object({
  sessionUuid: z.string(),
  displayName: z.string(),
  bio: z.string(),
  instagramId: z.string(),
  threadsId: z.string(),
  twitterId: z.string()
}).partial()), async (c) => {
  const { displayName, bio, instagramId, threadsId, twitterId } = c.req.valid("form");
  const session = c.get("session");
  const db = drizzle(c.env.DB);
  const newProfile = {
    displayName,
    bio,
    instagramId,
    threadsId,
    twitterId,
    updatedAt: Math.floor(Date.now() / 1e3)
  };
  const updatedProfile = Object.fromEntries(
    Object.entries(newProfile).filter(([_, value]) => value !== null && value !== void 0)
  );
  await db.update(profiles).set(updatedProfile).where(eq(profiles.userUuid, session.userUuid)).execute();
  return c.json(
    { success: true }
  );
});
app3.use("/:user_id/avatar", checkUserSession);
app3.post("/:user_id/avatar", zValidator("form", z.object({
  sessionUuid: z.string(),
  avatar: z.instanceof(File)
})), async (c) => {
  const { avatar } = await c.req.parseBody();
  const session = c.get("session");
  const db = drizzle(c.env.DB);
  const forwardFormData = new FormData();
  if (!(avatar instanceof File)) {
    return c.json(
      { success: false, message: "Avatar must be a file" },
      400
    );
  }
  forwardFormData.append("file", avatar);
  forwardFormData.append("scriptId", c.env.SCRIPT_ID);
  const response = await fetch("https://image.stki.org/", {
    method: "POST",
    body: forwardFormData
  });
  const data = await response.json();
  if (!response.ok) {
    return c.json(
      { success: false, message: `Image API Error (${response.status}): ${data.error}` },
      500
    );
  }
  await db.update(profiles).set({ avatar: data.url, updatedAt: Math.floor(Date.now() / 1e3) }).where(eq(profiles.userUuid, session.userUuid)).execute();
  return c.json(
    { success: true }
  );
});
app3.use("/:user_id/role", checkOrgMembership("admin"));
app3.patch("/:user_id/role", zValidator("json", z.object({
  sessionUuid: z.string(),
  organizationId: z.string()
})), async (c) => {
  const targetUserId = c.req.param("user_id");
  const db = drizzle(c.env.DB);
  const requesterMembership = c.get("membership");
  const [targetUser] = await db.select().from(users).where(eq(users.userId, targetUserId)).execute();
  if (!targetUser) {
    return c.json(
      { success: false, message: "User not found" },
      404
    );
  }
  const [targetMembership] = await db.select().from(memberships).where(eq(memberships.userUuid, targetUser.userUuid)).execute();
  if (targetMembership.organizationUuid !== requesterMembership.organizationUuid) {
    return c.json(
      { success: false, message: "Forbidden" },
      403
    );
  }
  await db.update(memberships).set({ role: targetMembership.role == "member" ? "admin" : "member" }).where(eq(memberships.userUuid, targetUser.userUuid)).execute();
  return c.json(
    { success: true }
  );
});
app3.use("/:user_id/is_valid", checkOrgMembership("admin"));
app3.patch("/:user_id/is_valid", zValidator("json", z.object({
  sessionUuid: z.string(),
  organizationId: z.string()
})), async (c) => {
  const targetUserId = c.req.param("user_id");
  const db = drizzle(c.env.DB);
  const requesterMembership = c.get("membership");
  const [targetUser] = await db.select().from(users).where(eq(users.userId, targetUserId)).execute();
  if (!targetUser) {
    return c.json(
      { success: false, message: "User not found" },
      404
    );
  }
  const [targetMembership] = await db.select().from(memberships).where(eq(memberships.userUuid, targetUser.userUuid)).execute();
  if (targetMembership.organizationUuid !== requesterMembership.organizationUuid) {
    return c.json(
      { success: false, message: "Forbidden" },
      403
    );
  }
  await db.update(users).set({ isValid: targetUser.isValid == 1 ? 0 : 1 }).where(eq(users.userUuid, targetUser.userUuid)).execute();
  return c.json(
    { success: true }
  );
});
var users_default = app3;

// src/utils/index.ts
var generateId = /* @__PURE__ */ __name((length = 8) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}, "generateId");

// src/routes/projects.ts
var app4 = new Hono2();
app4.get("/", zValidator("query", z.object({
  userId: z.string()
}).partial()), async (c) => {
  const { userId } = c.req.valid("query");
  const db = drizzle(c.env.DB);
  let projectsBaseObject;
  if (userId) {
    const [user] = await db.select().from(users).where(eq(users.userId, userId));
    if (!user) {
      return c.json(
        { success: false, message: "User not found" },
        404
      );
    }
    const [membership] = await db.select().from(memberships).where(eq(memberships.userUuid, user.userUuid));
    projectsBaseObject = await db.select().from(projects).orderBy(desc(projects.createdAt)).where(and(eq(projects.membershipUuid, membership.membershipUuid), eq(projects.isValid, 1)));
  } else {
    projectsBaseObject = await db.select().from(projects).orderBy(desc(projects.createdAt)).where(eq(projects.isValid, 1));
  }
  const projectsObject = await Promise.all(projectsBaseObject.map(async (project) => {
    const [projectMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, project.membershipUuid));
    const [projectUser] = await db.select().from(users).where(eq(users.userUuid, projectMembership.userUuid));
    const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, projectMembership.userUuid));
    const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, projectMembership.organizationUuid));
    const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, projectMembership.organizationUuid));
    const data = {
      projectId: project.projectId,
      title: project.title,
      description: project.description,
      buttons: project.buttons,
      thumbnail: project.thumbnail,
      userId: projectUser.userId,
      userDisplayName: userProfile.displayName,
      userAvatar: userProfile.avatar,
      organizationId: organization.organizationId,
      organizationDisplayName: organizationProfile.displayName,
      organizationAvatar: organizationProfile.avatar
    };
    return data;
  }));
  return c.json(
    { success: true, data: projectsObject }
  );
});
app4.get("/:project_id", async (c) => {
  const projectId = c.req.param("project_id");
  const db = drizzle(c.env.DB);
  const [project] = await db.select().from(projects).where(eq(projects.projectId, projectId));
  if (!project) {
    return c.json(
      { success: false, message: "Project not found" },
      404
    );
  }
  const [membership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, project.membershipUuid));
  const [user] = await db.select().from(users).where(eq(users.userUuid, membership.userUuid));
  const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, membership.userUuid));
  const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, membership.organizationUuid));
  const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, membership.organizationUuid));
  const data = {
    projectId: project.projectId,
    postUuid: project.postUuid,
    title: project.title,
    description: project.description,
    buttons: project.buttons,
    thumbnail: project.thumbnail,
    userId: user.userId,
    userDisplayName: userProfile.displayName,
    userAvatar: userProfile.avatar,
    organizationId: organization.organizationId,
    organizationDisplayName: organizationProfile.displayName,
    organizationAvatar: organizationProfile.avatar
  };
  return c.json(
    { success: true, data }
  );
});
app4.use("/", checkOrgMembership("member"));
app4.post("/", zValidator("form", z.object({
  sessionUuid: z.string(),
  organizationId: z.string(),
  title: z.string(),
  description: z.string(),
  buttons: z.string().transform((str) => JSON.parse(str)).pipe(z.object({
    content: z.string(),
    url: z.string()
  }).array()),
  thumbnail: z.instanceof(File)
}).partial({
  description: true,
  thumbnail: true
})), async (c) => {
  const { title, description, buttons, thumbnail } = await c.req.parseBody();
  const db = drizzle(c.env.DB);
  const membership = c.get("membership");
  const forwardFormData = new FormData();
  let url;
  if (thumbnail) {
    if (thumbnail instanceof File) {
      forwardFormData.append("file", thumbnail);
    } else {
      return c.json(
        { success: false, message: "Thumbnail must be a file" },
        400
      );
    }
    forwardFormData.append("scriptId", c.env.SCRIPT_ID);
    const response = await fetch("https://image.stki.org/", {
      method: "POST",
      body: forwardFormData
    });
    const data = await response.json();
    if (!response.ok) {
      return c.json(
        { success: false, message: `Image API Error (${response.status}): ${data.error}` },
        500
      );
    }
    url = data.url;
  }
  const postUuid = crypto.randomUUID();
  const post = {
    postUuid,
    postType: "project"
  };
  await db.insert(posts).values(post).execute();
  const project = {
    projectUuid: crypto.randomUUID(),
    projectId: generateId(),
    membershipUuid: membership.membershipUuid,
    title,
    description,
    buttons: JSON.parse(buttons),
    thumbnail: url,
    postUuid
  };
  await db.insert(projects).values(project).execute();
  const subscription = {
    subscriptionUuid: crypto.randomUUID(),
    userUuid: membership.userUuid,
    postUuid
  };
  await db.insert(subscriptions).values(subscription).execute();
  return c.json(
    { success: true, projectId: project.projectId }
  );
});
app4.patch("/:project_id", zValidator("form", z.object({
  sessionUuid: z.string(),
  title: z.string(),
  description: z.string(),
  buttons: z.string().transform((str) => JSON.parse(str)).pipe(z.object({
    content: z.string(),
    url: z.string()
  }).array()),
  thumbnail: z.instanceof(File)
}).partial({
  title: true,
  description: true,
  buttons: true,
  thumbnail: true
})), async (c) => {
  const { title, description, buttons, thumbnail } = await c.req.parseBody();
  const projectId = c.req.param("project_id");
  const db = drizzle(c.env.DB);
  const session = c.get("session");
  const [project] = await db.select().from(projects).where(eq(projects.projectId, projectId));
  const [projectMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, project.membershipUuid));
  if (projectMembership.userUuid !== session.userUuid) {
    return c.json(
      { success: false, message: "Forbidden" },
      403
    );
  }
  const forwardFormData = new FormData();
  let url;
  if (thumbnail) {
    if (thumbnail instanceof File) {
      forwardFormData.append("file", thumbnail);
    } else {
      return c.json(
        { success: false, message: "Thumbnail must be a file" },
        400
      );
    }
    forwardFormData.append("scriptId", c.env.SCRIPT_ID);
    const response = await fetch("https://image.stki.org/", {
      method: "POST",
      body: forwardFormData
    });
    const data = await response.json();
    if (!response.ok) {
      return c.json(
        { success: false, message: `Image API Error (${response.status}): ${data.error}` },
        500
      );
    }
    url = data.url;
  }
  const newDetail = {
    title,
    description,
    buttons: JSON.parse(buttons),
    thumbnail: url,
    updatedAt: Math.floor(Date.now() / 1e3)
  };
  const updatedDetail = Object.fromEntries(
    Object.entries(newDetail).filter(([_, value]) => value !== null && value !== void 0)
  );
  await db.update(projects).set(updatedDetail).where(eq(projects.projectId, projectId)).execute();
  const postsSubscriptions = await db.select().from(subscriptions).where(eq(subscriptions.postUuid, project.postUuid));
  const newNotifications = postsSubscriptions.filter((postsSubscription) => postsSubscription.userUuid !== session.userUuid).map((postSubscription) => ({
    notificationUuid: crypto.randomUUID(),
    userUuid: postSubscription.userUuid,
    content: `\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8:${project.title}\u306B\u3042\u3089\u305F\u306A\u5909\u66F4\u304C\u3042\u308A\u307E\u3057\u305F\u3002`,
    href: `/projects/${project.projectId}`
  }));
  await db.insert(notifications).values(newNotifications).execute();
  return c.json(
    { success: true }
  );
});
app4.patch("/:project_id/is_valid", zValidator("json", z.object({
  sessionUuid: z.string()
})), async (c) => {
  const db = drizzle(c.env.DB);
  const projectId = c.req.param("project_id");
  const session = c.get("session");
  const [project] = await db.select().from(projects).where(eq(projects.projectId, projectId));
  const [projectMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, project.membershipUuid));
  if (projectMembership.userUuid !== session.userUuid) {
    return c.json(
      { success: false, message: "Forbidden" },
      403
    );
  }
  await db.update(projects).set({ isValid: project.isValid ? 0 : 1 }).where(eq(projects.projectId, projectId)).execute();
  return c.json(
    { success: true }
  );
});
var projects_default = app4;

// src/routes/events.ts
var app5 = new Hono2();
app5.get("/", zValidator("query", z.object({
  userId: z.string()
}).partial()), async (c) => {
  const { userId } = c.req.valid("query");
  const db = drizzle(c.env.DB);
  let eventsBaseObject;
  if (userId) {
    const [user] = await db.select().from(users).where(eq(users.userId, userId));
    if (!user) {
      return c.json(
        { success: false, message: "User not found" },
        404
      );
    }
    const [membership] = await db.select().from(memberships).where(eq(memberships.userUuid, user.userUuid));
    eventsBaseObject = await db.select().from(events).orderBy(desc(events.createdAt)).where(and(eq(events.membershipUuid, membership.membershipUuid), eq(events.isValid, 1)));
  } else {
    eventsBaseObject = await db.select().from(events).orderBy(desc(events.createdAt)).where(eq(events.isValid, 1));
  }
  const eventsObject = await Promise.all(eventsBaseObject.map(async (event) => {
    const [eventMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, event.membershipUuid));
    const [eventUser] = await db.select().from(users).where(eq(users.userUuid, eventMembership.userUuid));
    const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, eventMembership.userUuid));
    const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, eventMembership.organizationUuid));
    const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, eventMembership.organizationUuid));
    const data = {
      eventId: event.eventId,
      title: event.title,
      description: event.description,
      buttons: event.buttons,
      thumbnail: event.thumbnail,
      place: event.place,
      startAt: event.startAt,
      endAt: event.endAt,
      userId: eventUser.userId,
      userDisplayName: userProfile.displayName,
      userAvatar: userProfile.avatar,
      organizationId: organization.organizationId,
      organizationDisplayName: organizationProfile.displayName,
      organizationAvatar: organizationProfile.avatar
    };
    return data;
  }));
  return c.json(
    { success: true, data: eventsObject }
  );
});
app5.get("/:event_id", async (c) => {
  const eventId = c.req.param("event_id");
  const db = drizzle(c.env.DB);
  const [event] = await db.select().from(events).where(eq(events.eventId, eventId));
  if (!event) {
    return c.json(
      { success: false, message: "Event not found" },
      404
    );
  }
  const [membership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, event.membershipUuid));
  const [user] = await db.select().from(users).where(eq(users.userUuid, membership.userUuid));
  const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, membership.userUuid));
  const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, membership.organizationUuid));
  const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, membership.organizationUuid));
  const data = {
    eventId: event.eventId,
    postUuid: event.postUuid,
    title: event.title,
    description: event.description,
    buttons: event.buttons,
    thumbnail: event.thumbnail,
    place: event.place,
    startAt: event.startAt,
    endAt: event.endAt,
    userId: user.userId,
    userDisplayName: userProfile.displayName,
    userAvatar: userProfile.avatar,
    organizationId: organization.organizationId,
    organizationDisplayName: organizationProfile.displayName,
    organizationAvatar: organizationProfile.avatar
  };
  return c.json(
    { success: true, data }
  );
});
app5.use("/", checkOrgMembership("member"));
app5.post("/", zValidator("form", z.object({
  sessionUuid: z.string(),
  organizationId: z.string(),
  title: z.string(),
  description: z.string(),
  buttons: z.string().transform((str) => JSON.parse(str)).pipe(z.object({
    content: z.string(),
    url: z.string()
  }).array()),
  thumbnail: z.instanceof(File),
  startAt: z.string(),
  endAt: z.string(),
  place: z.string()
}).partial({
  description: true,
  thumbnail: true
})), async (c) => {
  const { title, description, buttons, thumbnail, startAt, endAt, place } = await c.req.parseBody();
  const db = drizzle(c.env.DB);
  const membership = c.get("membership");
  const forwardFormData = new FormData();
  let url;
  if (thumbnail) {
    if (thumbnail instanceof File) {
      forwardFormData.append("file", thumbnail);
    } else {
      return c.json(
        { success: false, message: "Thumbnail must be a file" },
        400
      );
    }
    forwardFormData.append("scriptId", c.env.SCRIPT_ID);
    const response = await fetch("https://image.stki.org/", {
      method: "POST",
      body: forwardFormData
    });
    const data = await response.json();
    if (!response.ok) {
      return c.json(
        { success: false, message: `Image API Error (${response.status}): ${data.error}` },
        500
      );
    }
    url = data.url;
  }
  const postUuid = crypto.randomUUID();
  const post = {
    postUuid,
    postType: "event"
  };
  await db.insert(posts).values(post).execute();
  const event = {
    eventUuid: crypto.randomUUID(),
    eventId: generateId(),
    membershipUuid: membership.membershipUuid,
    title,
    description,
    buttons: JSON.parse(buttons),
    thumbnail: url,
    startAt: Number(startAt),
    endAt: Number(endAt),
    place,
    postUuid
  };
  await db.insert(events).values(event).execute();
  const subscription = {
    subscriptionUuid: crypto.randomUUID(),
    userUuid: membership.userUuid,
    postUuid
  };
  await db.insert(subscriptions).values(subscription).execute();
  return c.json(
    { success: true, eventId: event.eventId }
  );
});
app5.patch("/:event_id", zValidator("form", z.object({
  sessionUuid: z.string(),
  title: z.string(),
  description: z.string(),
  buttons: z.string().transform((str) => JSON.parse(str)).pipe(z.object({
    content: z.string(),
    url: z.string()
  }).array()),
  thumbnail: z.instanceof(File),
  startAt: z.string(),
  endAt: z.string(),
  place: z.string()
}).partial({
  title: true,
  description: true,
  buttons: true,
  thumbnail: true,
  startAt: true,
  endAt: true,
  place: true
})), async (c) => {
  const { title, description, buttons, thumbnail, startAt, endAt, place } = await c.req.parseBody();
  const eventId = c.req.param("event_id");
  const db = drizzle(c.env.DB);
  const session = c.get("session");
  const [event] = await db.select().from(events).where(eq(events.eventId, eventId));
  const [eventMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, event.membershipUuid));
  if (eventMembership.userUuid !== session.userUuid) {
    return c.json(
      { success: false, message: "Forbidden" },
      403
    );
  }
  const forwardFormData = new FormData();
  let url;
  if (thumbnail) {
    if (thumbnail instanceof File) {
      forwardFormData.append("file", thumbnail);
    } else {
      return c.json(
        { success: false, message: "Thumbnail must be a file" },
        400
      );
    }
    forwardFormData.append("scriptId", c.env.SCRIPT_ID);
    const response = await fetch("https://image.stki.org/", {
      method: "POST",
      body: forwardFormData
    });
    const data = await response.json();
    if (!response.ok) {
      return c.json(
        { success: false, message: `Image API Error (${response.status}): ${data.error}` },
        500
      );
    }
    url = data.url;
  }
  const newDetail = {
    title,
    description,
    buttons: JSON.parse(buttons),
    thumbnail: url,
    startAt: startAt && Number(startAt),
    endAt: endAt && Number(endAt),
    place,
    updatedAt: Math.floor(Date.now() / 1e3)
  };
  const updatedDetail = Object.fromEntries(
    Object.entries(newDetail).filter(([_, value]) => value !== null && value !== void 0)
  );
  await db.update(events).set(updatedDetail).where(eq(events.eventId, eventId)).execute();
  const postsSubscriptions = await db.select().from(subscriptions).where(eq(subscriptions.postUuid, event.postUuid));
  const newNotifications = postsSubscriptions.filter((postsSubscription) => postsSubscription.userUuid !== session.userUuid).map((postSubscription) => ({
    notificationUuid: crypto.randomUUID(),
    userUuid: postSubscription.userUuid,
    content: `\u30A4\u30D9\u30F3\u30C8:${event.title}\u306B\u3042\u3089\u305F\u306A\u5909\u66F4\u304C\u3042\u308A\u307E\u3057\u305F\u3002`,
    href: `/events/${event.eventId}`
  }));
  await db.insert(notifications).values(newNotifications).execute();
  return c.json(
    { success: true }
  );
});
app5.patch("/:event_id/is_valid", zValidator("json", z.object({
  sessionUuid: z.string()
})), async (c) => {
  const db = drizzle(c.env.DB);
  const eventId = c.req.param("event_id");
  const session = c.get("session");
  const [event] = await db.select().from(events).where(eq(events.eventId, eventId));
  const [eventMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, event.membershipUuid));
  if (eventMembership.userUuid !== session.userUuid) {
    return c.json(
      { success: false, message: "Forbidden" },
      403
    );
  }
  await db.update(events).set({ isValid: event.isValid ? 0 : 1 }).where(eq(events.eventId, eventId)).execute();
  return c.json(
    { success: true }
  );
});
var events_default = app5;

// src/routes/polls.ts
var app6 = new Hono2();
app6.get("/", zValidator("query", z.object({
  userId: z.string()
}).partial()), async (c) => {
  const { userId } = c.req.valid("query");
  const db = drizzle(c.env.DB);
  let pollsBaseObject;
  if (userId) {
    const [user] = await db.select().from(users).where(eq(users.userId, userId));
    if (!user) {
      return c.json(
        { success: false, message: "User not found" },
        404
      );
    }
    const [membership] = await db.select().from(memberships).where(eq(memberships.userUuid, user.userUuid));
    pollsBaseObject = await db.select().from(polls).orderBy(desc(polls.createdAt)).where(and(eq(polls.membershipUuid, membership.membershipUuid), eq(polls.isValid, 1)));
  } else {
    pollsBaseObject = await db.select().from(polls).orderBy(desc(polls.createdAt)).where(eq(polls.isValid, 1));
  }
  const pollsObject = await Promise.all(pollsBaseObject.map(async (poll) => {
    const [pollMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, poll.membershipUuid));
    const [pollUser] = await db.select().from(users).where(eq(users.userUuid, pollMembership.userUuid));
    const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, pollMembership.userUuid));
    const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, pollMembership.organizationUuid));
    const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, pollMembership.organizationUuid));
    const data = {
      pollId: poll.pollId,
      title: poll.title,
      description: poll.description,
      choices: poll.choices,
      thumbnail: poll.thumbnail,
      userId: pollUser.userId,
      userDisplayName: userProfile.displayName,
      userAvatar: userProfile.avatar,
      organizationId: organization.organizationId,
      organizationDisplayName: organizationProfile.displayName,
      organizationAvatar: organizationProfile.avatar
    };
    return data;
  }));
  return c.json(
    { success: true, data: pollsObject }
  );
});
app6.get("/:poll_id", async (c) => {
  const pollId = c.req.param("poll_id");
  const db = drizzle(c.env.DB);
  const [poll] = await db.select().from(polls).where(eq(polls.pollId, pollId));
  if (!poll) {
    return c.json(
      { success: false, message: "Interaction not found" },
      404
    );
  }
  const [membership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, poll.membershipUuid));
  const [user] = await db.select().from(users).where(eq(users.userUuid, membership.userUuid));
  const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, membership.userUuid));
  const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, membership.organizationUuid));
  const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, membership.organizationUuid));
  const pollVotes = await db.select().from(votes).where(eq(votes.pollUuid, poll.pollUuid));
  const pollChoices = poll.choices.map((name) => ({ name, count: pollVotes.filter((v) => v.choiceName === name).length }));
  const data = {
    pollId: poll.pollId,
    postUuid: poll.postUuid,
    title: poll.title,
    description: poll.description,
    pollChoices,
    thumbnail: poll.thumbnail,
    userId: user.userId,
    userDisplayName: userProfile.displayName,
    userAvatar: userProfile.avatar,
    organizationId: organization.organizationId,
    organizationDisplayName: organizationProfile.displayName,
    organizationAvatar: organizationProfile.avatar
  };
  return c.json(
    { success: true, data }
  );
});
app6.post("/:poll_id/vote", zValidator("json", z.object({
  choiceName: z.string().optional().nullable(),
  sessionUuid: z.string().optional().nullable(),
  clientUuid: z.string().optional().nullable()
})), async (c) => {
  const { choiceName, clientUuid } = c.req.valid("json");
  const pollId = c.req.param("poll_id");
  const userUuid = c.get("session")?.userUuid || clientUuid;
  if (!userUuid) {
    return c.json(
      { success: false, message: "Session Uuid is required" },
      400
    );
  }
  const db = drizzle(c.env.DB);
  const [user] = await db.select().from(users).where(eq(users.userUuid, userUuid));
  const [poll] = await db.select().from(polls).where(eq(polls.pollId, pollId));
  if (!poll) {
    return c.json(
      { success: false, message: "Interaction not found" },
      404
    );
  }
  const [vote] = await db.select().from(votes).where(and(eq(votes.pollUuid, poll.pollUuid), eq(votes.userUuid, userUuid)));
  if (!choiceName) {
    return c.json(
      { success: true, data: { choiceName: vote?.choiceName } }
    );
  }
  if (!vote) {
    const voteData = {
      voteUuid: crypto.randomUUID(),
      pollUuid: poll.pollUuid,
      userUuid,
      isGuest: user ? 0 : 1,
      choiceName
    };
    await db.insert(votes).values(voteData).execute();
    return c.json(
      { success: true }
    );
  }
  await db.update(votes).set({ choiceName, updatedAt: Math.floor(Date.now() / 1e3) }).where(and(eq(votes.pollUuid, poll.pollUuid), eq(votes.userUuid, userUuid))).execute();
  return c.json(
    { success: true }
  );
});
app6.use("/", checkOrgMembership("member"));
app6.post("/", zValidator("form", z.object({
  sessionUuid: z.string(),
  organizationId: z.string(),
  title: z.string(),
  description: z.string(),
  choices: z.string().transform((str) => JSON.parse(str)).pipe(z.string().array().nonempty()),
  thumbnail: z.instanceof(File)
}).partial({
  description: true,
  thumbnail: true
})), async (c) => {
  const { title, description, choices, thumbnail } = await c.req.parseBody();
  const db = drizzle(c.env.DB);
  const membership = c.get("membership");
  const forwardFormData = new FormData();
  let url;
  if (thumbnail) {
    if (thumbnail instanceof File) {
      forwardFormData.append("file", thumbnail);
    } else {
      return c.json(
        { success: false, message: "Thumbnail must be a file" },
        400
      );
    }
    forwardFormData.append("scriptId", c.env.SCRIPT_ID);
    const response = await fetch("https://image.stki.org/", {
      method: "POST",
      body: forwardFormData
    });
    const data = await response.json();
    if (!response.ok) {
      return c.json(
        { success: false, message: `Image API Error (${response.status}): ${data.error}` },
        500
      );
    }
    url = data.url;
  }
  const postUuid = crypto.randomUUID();
  const post = {
    postUuid,
    postType: "poll"
  };
  await db.insert(posts).values(post).execute();
  const poll = {
    pollUuid: crypto.randomUUID(),
    pollId: generateId(),
    membershipUuid: membership.membershipUuid,
    title,
    description,
    choices: JSON.parse(choices),
    thumbnail: url,
    postUuid
  };
  await db.insert(polls).values(poll).execute();
  const subscription = {
    subscriptionUuid: crypto.randomUUID(),
    userUuid: membership.userUuid,
    postUuid
  };
  await db.insert(subscriptions).values(subscription).execute();
  return c.json(
    { success: true, pollId: poll.pollId }
  );
});
app6.patch("/:poll_id", zValidator("form", z.object({
  sessionUuid: z.string(),
  title: z.string(),
  description: z.string(),
  choices: z.string().transform((str) => JSON.parse(str)).pipe(z.string().array()),
  thumbnail: z.instanceof(File)
}).partial({
  title: true,
  description: true,
  choices: true,
  thumbnail: true
})), async (c) => {
  const { title, description, choices, thumbnail } = await c.req.parseBody();
  const pollId = c.req.param("poll_id");
  const db = drizzle(c.env.DB);
  const session = c.get("session");
  const [poll] = await db.select().from(polls).where(eq(polls.pollId, pollId));
  const [pollMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, poll.membershipUuid));
  if (pollMembership.userUuid !== session.userUuid) {
    return c.json(
      { success: false, message: "Forbidden" },
      403
    );
  }
  const forwardFormData = new FormData();
  let url;
  if (thumbnail) {
    if (thumbnail instanceof File) {
      forwardFormData.append("file", thumbnail);
    } else {
      return c.json(
        { success: false, message: "Thumbnail must be a file" },
        400
      );
    }
    forwardFormData.append("scriptId", c.env.SCRIPT_ID);
    const response = await fetch("https://image.stki.org/", {
      method: "POST",
      body: forwardFormData
    });
    const data = await response.json();
    if (!response.ok) {
      return c.json(
        { success: false, message: `Image API Error (${response.status}): ${data.error}` },
        500
      );
    }
    url = data.url;
  }
  const newDetail = {
    title,
    description,
    choices: JSON.parse(choices),
    thumbnail: url,
    updatedAt: Math.floor(Date.now() / 1e3)
  };
  const updatedDetail = Object.fromEntries(
    Object.entries(newDetail).filter(([_, value]) => value !== null && value !== void 0)
  );
  await db.update(polls).set(updatedDetail).where(eq(polls.pollId, pollId)).execute();
  const postsSubscriptions = await db.select().from(subscriptions).where(eq(subscriptions.postUuid, poll.postUuid));
  const newNotifications = postsSubscriptions.filter((postsSubscription) => postsSubscription.userUuid !== session.userUuid).map((postSubscription) => ({
    notificationUuid: crypto.randomUUID(),
    userUuid: postSubscription.userUuid,
    content: `\u6295\u7968:${poll.title}\u306B\u3042\u3089\u305F\u306A\u5909\u66F4\u304C\u3042\u308A\u307E\u3057\u305F\u3002`,
    href: `/polls/${poll.pollId}`
  }));
  await db.insert(notifications).values(newNotifications).execute();
  return c.json(
    { success: true }
  );
});
app6.patch("/:poll_id/is_valid", zValidator("json", z.object({
  sessionUuid: z.string()
})), async (c) => {
  const db = drizzle(c.env.DB);
  const pollId = c.req.param("poll_id");
  const session = c.get("session");
  const [poll] = await db.select().from(polls).where(eq(polls.pollId, pollId));
  const [pollMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, poll.membershipUuid));
  if (pollMembership.userUuid !== session.userUuid) {
    return c.json(
      { success: false, message: "Forbidden" },
      403
    );
  }
  await db.update(polls).set({ isValid: poll.isValid ? 0 : 1 }).where(eq(polls.pollId, pollId)).execute();
  return c.json(
    { success: true }
  );
});
var polls_default = app6;

// src/routes/notifications.ts
var app7 = new Hono2();
var postTargetDBs = {
  project: { db: projects, id: projects.projectId },
  event: { db: events, id: events.eventId },
  poll: { db: polls, id: polls.pollId },
  question: { db: questions, id: questions.questionId }
};
app7.post("/subscriptions", zValidator("json", z.object({
  sessionUuid: z.string(),
  postType: z.enum(["project", "event", "poll", "question"]),
  postId: z.string()
})), async (c) => {
  const { postType, postId } = c.req.valid("json");
  const db = drizzle(c.env.DB);
  const session = c.get("session");
  const [postTarget] = await db.select().from(postTargetDBs[postType].db).where(eq(postTargetDBs[postType].id, postId)).execute();
  if (!postTarget) return c.json({ success: false, message: "Post not found" }, 404);
  const [existing] = await db.select().from(subscriptions).where(and(eq(subscriptions.postUuid, postTarget.postUuid), eq(subscriptions.userUuid, session.userUuid))).execute();
  if (existing) {
    if (existing.isValid === 1) {
      return c.json({ success: true });
    }
    await db.update(subscriptions).set({ isValid: 1 }).where(and(eq(subscriptions.postUuid, postTarget.postUuid), eq(subscriptions.userUuid, session.userUuid))).execute();
    return c.json({ success: true });
  }
  const subscription = {
    subscriptionUuid: crypto.randomUUID(),
    userUuid: session.userUuid,
    postUuid: postTarget.postUuid
  };
  await db.insert(subscriptions).values(subscription).execute();
  return c.json({ success: true });
});
app7.patch("/subscriptions/:post_type/:post_id/is_valid", zValidator("json", z.object({
  sessionUuid: z.string()
})), zValidator("param", z.object({
  post_type: z.enum(["project", "event", "poll", "question"]),
  post_id: z.string()
})), async (c) => {
  const { post_type: postType, post_id: postId } = c.req.valid("param");
  const db = drizzle(c.env.DB);
  const session = c.get("session");
  const [postTarget] = await db.select().from(postTargetDBs[postType].db).where(eq(postTargetDBs[postType].id, postId)).execute();
  if (!postTarget) return c.json({ success: false, message: "Post not found" }, 404);
  const [currentSubscription] = await db.select().from(subscriptions).where(and(eq(subscriptions.postUuid, postTarget.postUuid), eq(subscriptions.userUuid, session.userUuid))).execute();
  if (!currentSubscription) {
    return c.json({ success: false, message: "Subscription not found" }, 404);
  }
  await db.update(subscriptions).set({ isValid: currentSubscription.isValid ? 0 : 1 }).where(and(eq(subscriptions.postUuid, postTarget.postUuid), eq(subscriptions.userUuid, session.userUuid))).execute();
  return c.json({ success: true });
});
app7.post("/subscriptions/query", zValidator("json", z.object({
  sessionUuid: z.string()
})), async (c) => {
  const db = drizzle(c.env.DB);
  const session = c.get("session");
  const userSubscriptions = await db.select().from(subscriptions).where(and(eq(subscriptions.userUuid, session.userUuid), eq(subscriptions.isValid, 1))).execute();
  return c.json({ success: true, data: userSubscriptions });
});
app7.post("/query", zValidator("json", z.object({
  sessionUuid: z.string()
})), async (c) => {
  const db = drizzle(c.env.DB);
  const session = c.get("session");
  const userNotifications = await db.select().from(notifications).where(and(eq(notifications.userUuid, session.userUuid), eq(notifications.isValid, 1))).execute();
  return c.json({ success: true, data: userNotifications });
});
app7.patch("/:notification_uuid/is_opened", async (c) => {
  const notificationUuid = c.req.param("notification_uuid");
  const db = drizzle(c.env.DB);
  const session = c.get("session");
  const [notification] = await db.select().from(notifications).where(and(eq(notifications.userUuid, session.userUuid), eq(notifications.notificationUuid, notificationUuid)));
  await db.update(notifications).set({ isOpened: notification.isOpened ? 0 : 1 }).where(and(eq(notifications.userUuid, session.userUuid), eq(notifications.notificationUuid, notificationUuid))).execute();
  return c.json({ success: true });
});
var notifications_default = app7;

// src/routes/questions.ts
var app8 = new Hono2();
app8.get("/", zValidator("query", z.object({
  userId: z.string()
}).partial()), async (c) => {
  const { userId } = c.req.valid("query");
  const db = drizzle(c.env.DB);
  let questionsBaseObject;
  if (userId) {
    const [user] = await db.select().from(users).where(eq(users.userId, userId));
    if (!user) {
      return c.json(
        { success: false, message: "User not found" },
        404
      );
    }
    const [membership] = await db.select().from(memberships).where(eq(memberships.userUuid, user.userUuid));
    questionsBaseObject = await db.select().from(questions).orderBy(desc(questions.createdAt)).where(and(eq(questions.membershipUuid, membership.membershipUuid), eq(questions.isValid, 1)));
  } else {
    questionsBaseObject = await db.select().from(questions).orderBy(desc(questions.createdAt)).where(eq(questions.isValid, 1));
  }
  const questionsObject = await Promise.all(questionsBaseObject.map(async (question) => {
    const [questionMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, question.membershipUuid));
    const [questionUser] = await db.select().from(users).where(eq(users.userUuid, questionMembership.userUuid));
    const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, questionMembership.userUuid));
    const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, questionMembership.organizationUuid));
    const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, questionMembership.organizationUuid));
    return {
      questionId: question.questionId,
      title: question.title,
      description: question.description,
      thumbnail: question.thumbnail,
      bestCommentUuid: question.bestCommentUuid,
      userId: questionUser.userId,
      userDisplayName: userProfile.displayName,
      userAvatar: userProfile.avatar,
      organizationId: organization.organizationId,
      organizationDisplayName: organizationProfile.displayName,
      organizationAvatar: organizationProfile.avatar,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    };
  }));
  return c.json({ success: true, data: questionsObject });
});
app8.get("/:question_id", async (c) => {
  const questionId = c.req.param("question_id");
  const db = drizzle(c.env.DB);
  const [question] = await db.select().from(questions).where(eq(questions.questionId, questionId));
  if (!question) {
    return c.json({ success: false, message: "Question not found" }, 404);
  }
  const [membership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, question.membershipUuid));
  const [user] = await db.select().from(users).where(eq(users.userUuid, membership.userUuid));
  const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, membership.userUuid));
  const [organization] = await db.select().from(organizations).where(eq(organizations.organizationUuid, membership.organizationUuid));
  const [organizationProfile] = await db.select().from(profiles).where(eq(profiles.organizationUuid, membership.organizationUuid));
  return c.json({
    success: true,
    data: {
      questionId: question.questionId,
      title: question.title,
      description: question.description,
      thumbnail: question.thumbnail,
      bestCommentUuid: question.bestCommentUuid,
      postUuid: question.postUuid,
      userId: user.userId,
      userDisplayName: userProfile.displayName,
      userAvatar: userProfile.avatar,
      organizationId: organization.organizationId,
      organizationDisplayName: organizationProfile.displayName,
      organizationAvatar: organizationProfile.avatar,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    }
  });
});
app8.use("/", checkOrgMembership("member"));
app8.post("/", zValidator("form", z.object({
  sessionUuid: z.string(),
  organizationId: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnail: z.instanceof(File)
}).partial({ description: true, thumbnail: true })), async (c) => {
  const { title, description, thumbnail } = await c.req.parseBody();
  const db = drizzle(c.env.DB);
  const membership = c.get("membership");
  let url;
  if (thumbnail) {
    if (!(thumbnail instanceof File)) {
      return c.json({ success: false, message: "Thumbnail must be a file" }, 400);
    }
    const forwardFormData = new FormData();
    forwardFormData.append("file", thumbnail);
    forwardFormData.append("scriptId", c.env.SCRIPT_ID);
    const response = await fetch("https://image.stki.org/", { method: "POST", body: forwardFormData });
    const data = await response.json();
    if (!response.ok) {
      return c.json({ success: false, message: `Image API Error (${response.status}): ${data.error}` }, 500);
    }
    url = data.url;
  }
  const postUuid = crypto.randomUUID();
  await db.insert(posts).values({ postUuid, postType: "question" }).execute();
  const question = {
    questionUuid: crypto.randomUUID(),
    questionId: generateId(),
    membershipUuid: membership.membershipUuid,
    title,
    description,
    thumbnail: url,
    postUuid
  };
  await db.insert(questions).values(question).execute();
  await db.insert(subscriptions).values({
    subscriptionUuid: crypto.randomUUID(),
    userUuid: membership.userUuid,
    postUuid
  }).execute();
  return c.json({ success: true, questionId: question.questionId });
});
app8.patch("/:question_id", zValidator("form", z.object({
  sessionUuid: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnail: z.instanceof(File)
}).partial({ title: true, description: true, thumbnail: true })), async (c) => {
  const { title, description, thumbnail } = await c.req.parseBody();
  const questionId = c.req.param("question_id");
  const db = drizzle(c.env.DB);
  const session = c.get("session");
  const [question] = await db.select().from(questions).where(eq(questions.questionId, questionId));
  if (!question) return c.json({ success: false, message: "Question not found" }, 404);
  const [questionMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, question.membershipUuid));
  if (questionMembership.userUuid !== session.userUuid) {
    return c.json({ success: false, message: "Forbidden" }, 403);
  }
  let url;
  if (thumbnail) {
    if (!(thumbnail instanceof File)) {
      return c.json({ success: false, message: "Thumbnail must be a file" }, 400);
    }
    const forwardFormData = new FormData();
    forwardFormData.append("file", thumbnail);
    forwardFormData.append("scriptId", c.env.SCRIPT_ID);
    const response = await fetch("https://image.stki.org/", { method: "POST", body: forwardFormData });
    const data = await response.json();
    if (!response.ok) {
      return c.json({ success: false, message: `Image API Error (${response.status}): ${data.error}` }, 500);
    }
    url = data.url;
  }
  const newDetail = { title, description, thumbnail: url, updatedAt: Math.floor(Date.now() / 1e3) };
  const updatedDetail = Object.fromEntries(Object.entries(newDetail).filter(([_, v]) => v !== void 0 && v !== null));
  await db.update(questions).set(updatedDetail).where(eq(questions.questionId, questionId)).execute();
  const postsSubscriptions = await db.select().from(subscriptions).where(eq(subscriptions.postUuid, question.postUuid));
  if (postsSubscriptions.length > 0) {
    const newNotifications = postsSubscriptions.filter((postsSubscription) => postsSubscription.userUuid !== session.userUuid).map((postsSubscription) => ({
      notificationUuid: crypto.randomUUID(),
      userUuid: postsSubscription.userUuid,
      content: `\u8CEA\u554F:${question.title}\u306B\u3042\u3089\u305F\u306A\u5909\u66F4\u304C\u3042\u308A\u307E\u3057\u305F\u3002`,
      href: `/questions/${question.questionId}`
    }));
    await db.insert(notifications).values(newNotifications).execute();
  }
  return c.json({ success: true });
});
app8.patch("/:question_id/best_comment", zValidator("json", z.object({
  sessionUuid: z.string(),
  commentUuid: z.string()
})), async (c) => {
  const { commentUuid } = c.req.valid("json");
  const questionId = c.req.param("question_id");
  const db = drizzle(c.env.DB);
  const session = c.get("session");
  const [question] = await db.select().from(questions).where(eq(questions.questionId, questionId));
  if (!question) return c.json({ success: false, message: "Question not found" }, 404);
  const [questionMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, question.membershipUuid));
  if (questionMembership.userUuid !== session.userUuid) {
    return c.json({ success: false, message: "Forbidden" }, 403);
  }
  await db.update(questions).set({ bestCommentUuid: commentUuid, updatedAt: Math.floor(Date.now() / 1e3) }).where(eq(questions.questionId, questionId)).execute();
  return c.json({ success: true });
});
app8.patch("/:question_id/is_valid", zValidator("json", z.object({
  sessionUuid: z.string()
})), async (c) => {
  const db = drizzle(c.env.DB);
  const questionId = c.req.param("question_id");
  const session = c.get("session");
  const [question] = await db.select().from(questions).where(eq(questions.questionId, questionId));
  if (!question) return c.json({ success: false, message: "Question not found" }, 404);
  const [questionMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, question.membershipUuid));
  if (questionMembership.userUuid !== session.userUuid) {
    return c.json({ success: false, message: "Forbidden" }, 403);
  }
  await db.update(questions).set({ isValid: question.isValid ? 0 : 1 }).where(eq(questions.questionId, questionId)).execute();
  return c.json({ success: true });
});
var questions_default = app8;

// src/routes/comments.ts
var app9 = new Hono2();
async function buildHref(db, postUuid, postType) {
  if (postType === "project") {
    const [row] = await db.select({ projectId: projects.projectId }).from(projects).where(eq(projects.postUuid, postUuid)).execute();
    return row ? `/projects/${row.projectId}` : void 0;
  }
  if (postType === "event") {
    const [row] = await db.select({ eventId: events.eventId }).from(events).where(eq(events.postUuid, postUuid)).execute();
    return row ? `/events/${row.eventId}` : void 0;
  }
  if (postType === "poll") {
    const [row] = await db.select({ pollId: polls.pollId }).from(polls).where(eq(polls.postUuid, postUuid)).execute();
    return row ? `/polls/${row.pollId}` : void 0;
  }
  if (postType === "question") {
    const [row] = await db.select({ questionId: questions.questionId }).from(questions).where(eq(questions.postUuid, postUuid)).execute();
    return row ? `/questions/${row.questionId}` : void 0;
  }
  return void 0;
}
__name(buildHref, "buildHref");
app9.get("/", zValidator("query", z.object({
  postUuid: z.string()
})), async (c) => {
  const { postUuid } = c.req.valid("query");
  const db = drizzle(c.env.DB);
  const commentsBaseObject = await db.select().from(comments).orderBy(desc(comments.createdAt)).where(and(eq(comments.postUuid, postUuid), eq(comments.isValid, 1)));
  const commentsObject = await Promise.all(commentsBaseObject.map(async (comment) => {
    const [commentMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, comment.membershipUuid));
    const [commentUser] = await db.select().from(users).where(eq(users.userUuid, commentMembership.userUuid));
    const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, commentMembership.userUuid));
    return {
      commentUuid: comment.commentUuid,
      postUuid: comment.postUuid,
      content: comment.content,
      userId: commentUser.userId,
      userDisplayName: userProfile.displayName,
      userAvatar: userProfile.avatar,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt
    };
  }));
  return c.json({ success: true, data: commentsObject });
});
app9.use("/", checkOrgMembership("member"));
app9.post("/", zValidator("json", z.object({
  sessionUuid: z.string(),
  organizationId: z.string(),
  postUuid: z.string(),
  content: z.string().min(1)
})), async (c) => {
  const { postUuid, content } = c.req.valid("json");
  const db = drizzle(c.env.DB);
  const membership = c.get("membership");
  const [post] = await db.select().from(posts).where(eq(posts.postUuid, postUuid)).execute();
  if (!post) {
    return c.json({ success: false, message: "Post not found" }, 404);
  }
  const comment = {
    commentUuid: crypto.randomUUID(),
    postUuid,
    membershipUuid: membership.membershipUuid,
    content
  };
  await db.insert(comments).values(comment).execute();
  const postsSubscriptions = await db.select().from(subscriptions).where(and(eq(subscriptions.postUuid, postUuid), eq(subscriptions.isValid, 1)));
  if (postsSubscriptions.length > 0) {
    const href = await buildHref(db, postUuid, post.postType);
    const newNotifications = postsSubscriptions.filter((s) => s.userUuid !== membership.userUuid).map((s) => ({
      notificationUuid: crypto.randomUUID(),
      userUuid: s.userUuid,
      content: `\u3042\u306A\u305F\u304C\u30B5\u30D6\u30B9\u30AF\u30E9\u30A4\u30D6\u3057\u3066\u3044\u308B\u6295\u7A3F\u306B\u65B0\u3057\u3044\u30B3\u30E1\u30F3\u30C8\u304C\u3042\u308A\u307E\u3057\u305F\u3002`,
      href
    }));
    if (newNotifications.length > 0) {
      await db.insert(notifications).values(newNotifications).execute();
    }
  }
  return c.json({ success: true, commentUuid: comment.commentUuid });
});
app9.patch("/:comment_uuid", zValidator("json", z.object({
  sessionUuid: z.string(),
  content: z.string().min(1)
})), async (c) => {
  const { content } = c.req.valid("json");
  const commentUuid = c.req.param("comment_uuid");
  const db = drizzle(c.env.DB);
  const session = c.get("session");
  const [comment] = await db.select().from(comments).where(eq(comments.commentUuid, commentUuid));
  if (!comment) return c.json({ success: false, message: "Comment not found" }, 404);
  const [commentMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, comment.membershipUuid));
  if (commentMembership.userUuid !== session.userUuid) {
    return c.json({ success: false, message: "Forbidden" }, 403);
  }
  await db.update(comments).set({ content, updatedAt: Math.floor(Date.now() / 1e3) }).where(eq(comments.commentUuid, commentUuid)).execute();
  return c.json({ success: true });
});
app9.patch("/:comment_uuid/is_valid", zValidator("json", z.object({
  sessionUuid: z.string()
})), async (c) => {
  const commentUuid = c.req.param("comment_uuid");
  const db = drizzle(c.env.DB);
  const session = c.get("session");
  const [comment] = await db.select().from(comments).where(eq(comments.commentUuid, commentUuid));
  if (!comment) return c.json({ success: false, message: "Comment not found" }, 404);
  const [commentMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, comment.membershipUuid));
  if (commentMembership.userUuid !== session.userUuid) {
    return c.json({ success: false, message: "Forbidden" }, 403);
  }
  await db.update(comments).set({ isValid: comment.isValid ? 0 : 1 }).where(eq(comments.commentUuid, commentUuid)).execute();
  return c.json({ success: true });
});
var comments_default = app9;

// src/routes/replies.ts
var app10 = new Hono2();
async function buildHref2(db, postUuid, postType) {
  if (postType === "project") {
    const [row] = await db.select({ projectId: projects.projectId }).from(projects).where(eq(projects.postUuid, postUuid)).execute();
    return row ? `/projects/${row.projectId}` : void 0;
  }
  if (postType === "event") {
    const [row] = await db.select({ eventId: events.eventId }).from(events).where(eq(events.postUuid, postUuid)).execute();
    return row ? `/events/${row.eventId}` : void 0;
  }
  if (postType === "poll") {
    const [row] = await db.select({ pollId: polls.pollId }).from(polls).where(eq(polls.postUuid, postUuid)).execute();
    return row ? `/polls/${row.pollId}` : void 0;
  }
  if (postType === "question") {
    const [row] = await db.select({ questionId: questions.questionId }).from(questions).where(eq(questions.postUuid, postUuid)).execute();
    return row ? `/questions/${row.questionId}` : void 0;
  }
  return void 0;
}
__name(buildHref2, "buildHref");
app10.get("/", zValidator("query", z.object({
  commentUuid: z.string()
})), async (c) => {
  const { commentUuid } = c.req.valid("query");
  const db = drizzle(c.env.DB);
  const repliesBaseObject = await db.select().from(replies).orderBy(desc(replies.createdAt)).where(and(eq(replies.commentUuid, commentUuid), eq(replies.isValid, 1)));
  const repliesObject = await Promise.all(repliesBaseObject.map(async (reply) => {
    const [replyMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, reply.membershipUuid));
    const [replyUser] = await db.select().from(users).where(eq(users.userUuid, replyMembership.userUuid));
    const [userProfile] = await db.select().from(profiles).where(eq(profiles.userUuid, replyMembership.userUuid));
    return {
      replyUuid: reply.replyUuid,
      commentUuid: reply.commentUuid,
      content: reply.content,
      userId: replyUser.userId,
      userDisplayName: userProfile.displayName,
      userAvatar: userProfile.avatar,
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt
    };
  }));
  return c.json({ success: true, data: repliesObject });
});
app10.use("/", checkOrgMembership("member"));
app10.post("/", zValidator("json", z.object({
  sessionUuid: z.string(),
  organizationId: z.string(),
  commentUuid: z.string(),
  content: z.string().min(1)
})), async (c) => {
  const { commentUuid, content } = c.req.valid("json");
  const db = drizzle(c.env.DB);
  const membership = c.get("membership");
  const [comment] = await db.select().from(comments).where(eq(comments.commentUuid, commentUuid)).execute();
  if (!comment) {
    return c.json({ success: false, message: "Comment not found" }, 404);
  }
  const reply = {
    replyUuid: crypto.randomUUID(),
    commentUuid,
    membershipUuid: membership.membershipUuid,
    content
  };
  await db.insert(replies).values(reply).execute();
  const [commentMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, comment.membershipUuid));
  if (commentMembership.userUuid !== membership.userUuid) {
    const [post] = await db.select().from(posts).where(eq(posts.postUuid, comment.postUuid)).execute();
    const href = post ? await buildHref2(db, comment.postUuid, post.postType) : void 0;
    const notification = {
      notificationUuid: crypto.randomUUID(),
      userUuid: commentMembership.userUuid,
      content: `\u3042\u306A\u305F\u306E\u30B3\u30E1\u30F3\u30C8\u306B\u8FD4\u4FE1\u304C\u3042\u308A\u307E\u3057\u305F\u3002`,
      href
    };
    await db.insert(notifications).values(notification).execute();
  }
  return c.json({ success: true, replyUuid: reply.replyUuid });
});
app10.patch("/:reply_uuid", zValidator("json", z.object({
  sessionUuid: z.string(),
  content: z.string().min(1)
})), async (c) => {
  const { content } = c.req.valid("json");
  const replyUuid = c.req.param("reply_uuid");
  const db = drizzle(c.env.DB);
  const session = c.get("session");
  const [reply] = await db.select().from(replies).where(eq(replies.replyUuid, replyUuid));
  if (!reply) return c.json({ success: false, message: "Reply not found" }, 404);
  const [replyMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, reply.membershipUuid));
  if (replyMembership.userUuid !== session.userUuid) {
    return c.json({ success: false, message: "Forbidden" }, 403);
  }
  await db.update(replies).set({ content, updatedAt: Math.floor(Date.now() / 1e3) }).where(eq(replies.replyUuid, replyUuid)).execute();
  return c.json({ success: true });
});
app10.patch("/:reply_uuid/is_valid", zValidator("json", z.object({
  sessionUuid: z.string()
})), async (c) => {
  const replyUuid = c.req.param("reply_uuid");
  const db = drizzle(c.env.DB);
  const session = c.get("session");
  const [reply] = await db.select().from(replies).where(eq(replies.replyUuid, replyUuid));
  if (!reply) return c.json({ success: false, message: "Reply not found" }, 404);
  const [replyMembership] = await db.select().from(memberships).where(eq(memberships.membershipUuid, reply.membershipUuid));
  if (replyMembership.userUuid !== session.userUuid) {
    return c.json({ success: false, message: "Forbidden" }, 403);
  }
  await db.update(replies).set({ isValid: reply.isValid ? 0 : 1 }).where(eq(replies.replyUuid, replyUuid)).execute();
  return c.json({ success: true });
});
var replies_default = app10;

// src/routes/index.ts
var routes = new Hono2();
routes.route("/auth", auth_default);
routes.route("/organizations", organizations_default);
routes.route("/users", users_default);
routes.route("/projects", projects_default);
routes.route("/events", events_default);
routes.route("/polls", polls_default);
routes.route("/notifications", notifications_default);
routes.route("/questions", questions_default);
routes.route("/comments", comments_default);
routes.route("/replies", replies_default);
var routes_default = routes;

// src/middlewares/auth.ts
var sessionChecker = /* @__PURE__ */ __name((isGuestAllowed = false) => async (c, next) => {
  if (c.req.method == "GET") {
    return next();
  }
  let sessionUuid;
  const contentType = c.req.header("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const body = await c.req.parseBody();
    sessionUuid = body?.sessionUuid?.toLowerCase();
  } else if (contentType.includes("application/json")) {
    const jsonBody = await c.req.json();
    sessionUuid = jsonBody?.sessionUuid?.toLowerCase();
  } else {
    return c.json({ success: false, message: "Unsupported Content-Type" }, 415);
  }
  if (!sessionUuid) {
    if (!isGuestAllowed) return c.json(
      { success: false, message: "Session Uuid is required" },
      401
    );
    const jsonBody = await c.req.json();
    const clientUuid = jsonBody?.clientUuid?.toLowerCase();
    if (!clientUuid) return c.json(
      { success: false, message: "Session Uuid is required" },
      401
    );
    return next();
  }
  const db = drizzle(c.env.DB);
  const [session] = await db.select().from(sessions).where(eq(sessions.sessionUuid, sessionUuid)).execute();
  if (!session || !session.isValid) {
    return c.json(
      { success: false, message: "Invalid session" },
      401
    );
  }
  c.set("session", session);
  return next();
}, "sessionChecker");

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.origin !== "*") {
      const existingVary = c.req.header("Vary");
      if (existingVary) {
        set("Vary", existingVary);
      } else {
        set("Vary", "Origin");
      }
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      if (opts.allowMethods?.length) {
        set("Access-Control-Allow-Methods", opts.allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
  }, "cors2");
}, "cors");

// src/index.ts
var app11 = new Hono2();
app11.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "https://schoolink.stki.org"]
  })
);
app11.onError((e, c) => {
  console.error("Error:", e);
  return c.json(
    { success: false, message: e.message || "Internal Server Error" },
    500
  );
});
app11.use("*", async (c, next) => {
  if (c.req.method == "GET") {
    return next();
  }
  if (c.req.path.startsWith("/auth/sign_in")) {
    return next();
  }
  let isGuestAllowed = false;
  if (c.req.path.endsWith("vote")) {
    isGuestAllowed = true;
  }
  return sessionChecker(isGuestAllowed)(c, next);
});
app11.route("/", routes_default);
var src_default = app11;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-6qVLyY/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-6qVLyY/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
