// ==UserScript==
// @name         Bilibili Fitness Timer
// @namespace    https://github.com/RyanChouHua/bili-fitness-timer
// @version      0.5.0
// @description  Turn Bilibili video clips into workout intervals with sets and rest timers.
// @match        https://www.bilibili.com/*
// @match        https://m.bilibili.com/*
// @match        https://bilibili.com/*
// @downloadURL  https://raw.githubusercontent.com/RyanChouHua/bili-fitness-timer/main/dist/bili-fitness-timer.user.js
// @updateURL    https://raw.githubusercontent.com/RyanChouHua/bili-fitness-timer/main/dist/bili-fitness-timer.meta.js
// @supportURL   https://github.com/RyanChouHua/bili-fitness-timer/issues
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
  "use strict";
  var _a;
  var n, l$1, u$2, i$1, r$1, o$1, e$1, f$2, c$1, a$1, s$1, h$1, p$1, v$1, d$1 = {}, w$1 = [], _ = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, g = Array.isArray;
  function m$1(n2, l2) {
    for (var u2 in l2) n2[u2] = l2[u2];
    return n2;
  }
  function b(n2) {
    n2 && n2.parentNode && n2.parentNode.removeChild(n2);
  }
  function k$1(l2, u2, t2) {
    var i2, r2, o2, e2 = {};
    for (o2 in u2) "key" == o2 ? i2 = u2[o2] : "ref" == o2 ? r2 = u2[o2] : e2[o2] = u2[o2];
    if (arguments.length > 2 && (e2.children = arguments.length > 3 ? n.call(arguments, 2) : t2), "function" == typeof l2 && null != l2.defaultProps) for (o2 in l2.defaultProps) void 0 === e2[o2] && (e2[o2] = l2.defaultProps[o2]);
    return x(l2, e2, i2, r2, null);
  }
  function x(n2, t2, i2, r2, o2) {
    var e2 = { type: n2, props: t2, key: i2, ref: r2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o2 ? ++u$2 : o2, __i: -1, __u: 0 };
    return null == o2 && null != l$1.vnode && l$1.vnode(e2), e2;
  }
  function S(n2) {
    return n2.children;
  }
  function C$1(n2, l2) {
    this.props = n2, this.context = l2;
  }
  function $(n2, l2) {
    if (null == l2) return n2.__ ? $(n2.__, n2.__i + 1) : null;
    for (var u2; l2 < n2.__k.length; l2++) if (null != (u2 = n2.__k[l2]) && null != u2.__e) return u2.__e;
    return "function" == typeof n2.type ? $(n2) : null;
  }
  function I(n2) {
    if (n2.__P && n2.__d) {
      var u2 = n2.__v, t2 = u2.__e, i2 = [], r2 = [], o2 = m$1({}, u2);
      o2.__v = u2.__v + 1, l$1.vnode && l$1.vnode(o2), q(n2.__P, o2, u2, n2.__n, n2.__P.namespaceURI, 32 & u2.__u ? [t2] : null, i2, null == t2 ? $(u2) : t2, !!(32 & u2.__u), r2), o2.__v = u2.__v, o2.__.__k[o2.__i] = o2, D$1(i2, o2, r2), u2.__e = u2.__ = null, o2.__e != t2 && P(o2);
    }
  }
  function P(n2) {
    if (null != (n2 = n2.__) && null != n2.__c) return n2.__e = n2.__c.base = null, n2.__k.some(function(l2) {
      if (null != l2 && null != l2.__e) return n2.__e = n2.__c.base = l2.__e;
    }), P(n2);
  }
  function A(n2) {
    (!n2.__d && (n2.__d = true) && i$1.push(n2) && !H.__r++ || r$1 != l$1.debounceRendering) && ((r$1 = l$1.debounceRendering) || o$1)(H);
  }
  function H() {
    try {
      for (var n2, l2 = 1; i$1.length; ) i$1.length > l2 && i$1.sort(e$1), n2 = i$1.shift(), l2 = i$1.length, I(n2);
    } finally {
      i$1.length = H.__r = 0;
    }
  }
  function L(n2, l2, u2, t2, i2, r2, o2, e2, f2, c2, a2) {
    var s2, h2, p2, v2, y2, _2, g2, m2 = t2 && t2.__k || w$1, b2 = l2.length;
    for (f2 = T$1(u2, l2, m2, f2, b2), s2 = 0; s2 < b2; s2++) null != (p2 = u2.__k[s2]) && (h2 = -1 != p2.__i && m2[p2.__i] || d$1, p2.__i = s2, _2 = q(n2, p2, h2, i2, r2, o2, e2, f2, c2, a2), v2 = p2.__e, p2.ref && h2.ref != p2.ref && (h2.ref && J(h2.ref, null, p2), a2.push(p2.ref, p2.__c || v2, p2)), null == y2 && null != v2 && (y2 = v2), (g2 = !!(4 & p2.__u)) || h2.__k === p2.__k ? (f2 = j$1(p2, f2, n2, g2), g2 && h2.__e && (h2.__e = null)) : "function" == typeof p2.type && void 0 !== _2 ? f2 = _2 : v2 && (f2 = v2.nextSibling), p2.__u &= -7);
    return u2.__e = y2, f2;
  }
  function T$1(n2, l2, u2, t2, i2) {
    var r2, o2, e2, f2, c2, a2 = u2.length, s2 = a2, h2 = 0;
    for (n2.__k = new Array(i2), r2 = 0; r2 < i2; r2++) null != (o2 = l2[r2]) && "boolean" != typeof o2 && "function" != typeof o2 ? ("string" == typeof o2 || "number" == typeof o2 || "bigint" == typeof o2 || o2.constructor == String ? o2 = n2.__k[r2] = x(null, o2, null, null, null) : g(o2) ? o2 = n2.__k[r2] = x(S, { children: o2 }, null, null, null) : void 0 === o2.constructor && o2.__b > 0 ? o2 = n2.__k[r2] = x(o2.type, o2.props, o2.key, o2.ref ? o2.ref : null, o2.__v) : n2.__k[r2] = o2, f2 = r2 + h2, o2.__ = n2, o2.__b = n2.__b + 1, e2 = null, -1 != (c2 = o2.__i = O(o2, u2, f2, s2)) && (s2--, (e2 = u2[c2]) && (e2.__u |= 2)), null == e2 || null == e2.__v ? (-1 == c2 && (i2 > a2 ? h2-- : i2 < a2 && h2++), "function" != typeof o2.type && (o2.__u |= 4)) : c2 != f2 && (c2 == f2 - 1 ? h2-- : c2 == f2 + 1 ? h2++ : (c2 > f2 ? h2-- : h2++, o2.__u |= 4))) : n2.__k[r2] = null;
    if (s2) for (r2 = 0; r2 < a2; r2++) null != (e2 = u2[r2]) && 0 == (2 & e2.__u) && (e2.__e == t2 && (t2 = $(e2)), K(e2, e2));
    return t2;
  }
  function j$1(n2, l2, u2, t2) {
    var i2, r2;
    if ("function" == typeof n2.type) {
      for (i2 = n2.__k, r2 = 0; i2 && r2 < i2.length; r2++) i2[r2] && (i2[r2].__ = n2, l2 = j$1(i2[r2], l2, u2, t2));
      return l2;
    }
    n2.__e != l2 && (t2 && (l2 && n2.type && !l2.parentNode && (l2 = $(n2)), u2.insertBefore(n2.__e, l2 || null)), l2 = n2.__e);
    do {
      l2 = l2 && l2.nextSibling;
    } while (null != l2 && 8 == l2.nodeType);
    return l2;
  }
  function O(n2, l2, u2, t2) {
    var i2, r2, o2, e2 = n2.key, f2 = n2.type, c2 = l2[u2], a2 = null != c2 && 0 == (2 & c2.__u);
    if (null === c2 && null == e2 || a2 && e2 == c2.key && f2 == c2.type) return u2;
    if (t2 > (a2 ? 1 : 0)) {
      for (i2 = u2 - 1, r2 = u2 + 1; i2 >= 0 || r2 < l2.length; ) if (null != (c2 = l2[o2 = i2 >= 0 ? i2-- : r2++]) && 0 == (2 & c2.__u) && e2 == c2.key && f2 == c2.type) return o2;
    }
    return -1;
  }
  function z$1(n2, l2, u2) {
    "-" == l2[0] ? n2.setProperty(l2, null == u2 ? "" : u2) : n2[l2] = null == u2 ? "" : "number" != typeof u2 || _.test(l2) ? u2 : u2 + "px";
  }
  function N(n2, l2, u2, t2, i2) {
    var r2, o2;
    n: if ("style" == l2) if ("string" == typeof u2) n2.style.cssText = u2;
    else {
      if ("string" == typeof t2 && (n2.style.cssText = t2 = ""), t2) for (l2 in t2) u2 && l2 in u2 || z$1(n2.style, l2, "");
      if (u2) for (l2 in u2) t2 && u2[l2] == t2[l2] || z$1(n2.style, l2, u2[l2]);
    }
    else if ("o" == l2[0] && "n" == l2[1]) r2 = l2 != (l2 = l2.replace(s$1, "$1")), o2 = l2.toLowerCase(), l2 = o2 in n2 || "onFocusOut" == l2 || "onFocusIn" == l2 ? o2.slice(2) : l2.slice(2), n2.l || (n2.l = {}), n2.l[l2 + r2] = u2, u2 ? t2 ? u2[a$1] = t2[a$1] : (u2[a$1] = h$1, n2.addEventListener(l2, r2 ? v$1 : p$1, r2)) : n2.removeEventListener(l2, r2 ? v$1 : p$1, r2);
    else {
      if ("http://www.w3.org/2000/svg" == i2) l2 = l2.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != l2 && "height" != l2 && "href" != l2 && "list" != l2 && "form" != l2 && "tabIndex" != l2 && "download" != l2 && "rowSpan" != l2 && "colSpan" != l2 && "role" != l2 && "popover" != l2 && l2 in n2) try {
        n2[l2] = null == u2 ? "" : u2;
        break n;
      } catch (n3) {
      }
      "function" == typeof u2 || (null == u2 || false === u2 && "-" != l2[4] ? n2.removeAttribute(l2) : n2.setAttribute(l2, "popover" == l2 && 1 == u2 ? "" : u2));
    }
  }
  function V(n2) {
    return function(u2) {
      if (this.l) {
        var t2 = this.l[u2.type + n2];
        if (null == u2[c$1]) u2[c$1] = h$1++;
        else if (u2[c$1] < t2[a$1]) return;
        return t2(l$1.event ? l$1.event(u2) : u2);
      }
    };
  }
  function q(n2, u2, t2, i2, r2, o2, e2, f2, c2, a2) {
    var s2, h2, p2, v2, y2, d2, _2, k2, x2, M, $2, I2, P2, A2, H2, T2, j2 = u2.type;
    if (void 0 !== u2.constructor) return null;
    128 & t2.__u && (c2 = !!(32 & t2.__u), o2 = [f2 = u2.__e = t2.__e]), (s2 = l$1.__b) && s2(u2);
    n: if ("function" == typeof j2) {
      h2 = e2.length;
      try {
        if (x2 = u2.props, M = j2.prototype && j2.prototype.render, $2 = (s2 = j2.contextType) && i2[s2.__c], I2 = s2 ? $2 ? $2.props.value : s2.__ : i2, t2.__c ? k2 = (p2 = u2.__c = t2.__c).__ = p2.__E : (M ? u2.__c = p2 = new j2(x2, I2) : (u2.__c = p2 = new C$1(x2, I2), p2.constructor = j2, p2.render = Q), $2 && $2.sub(p2), p2.state || (p2.state = {}), p2.__n = i2, v2 = p2.__d = true, p2.__h = [], p2._sb = []), M && null == p2.__s && (p2.__s = p2.state), M && null != j2.getDerivedStateFromProps && (p2.__s == p2.state && (p2.__s = m$1({}, p2.__s)), m$1(p2.__s, j2.getDerivedStateFromProps(x2, p2.__s))), y2 = p2.props, d2 = p2.state, p2.__v = u2, v2) M && null == j2.getDerivedStateFromProps && null != p2.componentWillMount && p2.componentWillMount(), M && null != p2.componentDidMount && p2.__h.push(p2.componentDidMount);
        else {
          if (M && null == j2.getDerivedStateFromProps && x2 !== y2 && null != p2.componentWillReceiveProps && p2.componentWillReceiveProps(x2, I2), u2.__v == t2.__v || !p2.__e && null != p2.shouldComponentUpdate && false === p2.shouldComponentUpdate(x2, p2.__s, I2)) {
            u2.__v != t2.__v && (p2.props = x2, p2.state = p2.__s, p2.__d = false), u2.__e = t2.__e, u2.__k = t2.__k, u2.__k.some(function(n3) {
              n3 && (n3.__ = u2);
            }), w$1.push.apply(p2.__h, p2._sb), p2._sb = [], p2.__h.length && e2.push(p2);
            break n;
          }
          null != p2.componentWillUpdate && p2.componentWillUpdate(x2, p2.__s, I2), M && null != p2.componentDidUpdate && p2.__h.push(function() {
            p2.componentDidUpdate(y2, d2, _2);
          });
        }
        if (p2.context = I2, p2.props = x2, p2.__P = n2, p2.__e = false, P2 = l$1.__r, A2 = 0, M) p2.state = p2.__s, p2.__d = false, P2 && P2(u2), s2 = p2.render(p2.props, p2.state, p2.context), w$1.push.apply(p2.__h, p2._sb), p2._sb = [];
        else do {
          p2.__d = false, P2 && P2(u2), s2 = p2.render(p2.props, p2.state, p2.context), p2.state = p2.__s;
        } while (p2.__d && ++A2 < 25);
        p2.state = p2.__s, null != p2.getChildContext && (i2 = m$1(m$1({}, i2), p2.getChildContext())), M && !v2 && null != p2.getSnapshotBeforeUpdate && (_2 = p2.getSnapshotBeforeUpdate(y2, d2)), H2 = null != s2 && s2.type === S && null == s2.key ? E(s2.props.children) : s2, f2 = L(n2, g(H2) ? H2 : [H2], u2, t2, i2, r2, o2, e2, f2, c2, a2), p2.base = u2.__e, u2.__u &= -161, p2.__h.length && e2.push(p2), k2 && (p2.__E = p2.__ = null);
      } catch (n3) {
        if (e2.length = h2, u2.__v = null, c2 || null != o2) {
          if (n3.then) {
            for (u2.__u |= c2 ? 160 : 128; f2 && 8 == f2.nodeType && f2.nextSibling; ) f2 = f2.nextSibling;
            null != o2 && (o2[o2.indexOf(f2)] = null), u2.__e = f2;
          } else if (null != o2) for (T2 = o2.length; T2--; ) b(o2[T2]);
        } else u2.__e = t2.__e;
        null == u2.__k && (u2.__k = t2.__k || []), n3.then || B$1(u2), l$1.__e(n3, u2, t2);
      }
    } else null == o2 && u2.__v == t2.__v ? (u2.__k = t2.__k, u2.__e = t2.__e) : f2 = u2.__e = G(t2.__e, u2, t2, i2, r2, o2, e2, c2, a2);
    return (s2 = l$1.diffed) && s2(u2), 128 & u2.__u ? void 0 : f2;
  }
  function B$1(n2) {
    n2 && (n2.__c && (n2.__c.__e = true), n2.__k && n2.__k.some(B$1));
  }
  function D$1(n2, u2, t2) {
    for (var i2 = 0; i2 < t2.length; i2++) J(t2[i2], t2[++i2], t2[++i2]);
    l$1.__c && l$1.__c(u2, n2), n2.some(function(u3) {
      try {
        n2 = u3.__h, u3.__h = [], n2.some(function(n3) {
          n3.call(u3);
        });
      } catch (n3) {
        l$1.__e(n3, u3.__v);
      }
    });
  }
  function E(n2) {
    return "object" != typeof n2 || null == n2 || n2.__b > 0 ? n2 : g(n2) ? n2.map(E) : void 0 !== n2.constructor ? null : m$1({}, n2);
  }
  function G(u2, t2, i2, r2, o2, e2, f2, c2, a2) {
    var s2, h2, p2, v2, y2, w2, _2, m2 = i2.props || d$1, k2 = t2.props, x2 = t2.type;
    if ("svg" == x2 ? o2 = "http://www.w3.org/2000/svg" : "math" == x2 ? o2 = "http://www.w3.org/1998/Math/MathML" : o2 || (o2 = "http://www.w3.org/1999/xhtml"), null != e2) {
      for (s2 = 0; s2 < e2.length; s2++) if ((y2 = e2[s2]) && "setAttribute" in y2 == !!x2 && (x2 ? y2.localName == x2 : 3 == y2.nodeType)) {
        u2 = y2, e2[s2] = null;
        break;
      }
    }
    if (null == u2) {
      if (null == x2) return document.createTextNode(k2);
      u2 = document.createElementNS(o2, x2, k2.is && k2), c2 && (l$1.__m && l$1.__m(t2, e2), c2 = false), e2 = null;
    }
    if (null == x2) m2 === k2 || c2 && u2.data == k2 || (u2.data = k2);
    else {
      if (e2 = "textarea" == x2 && null != k2.defaultValue ? null : e2 && n.call(u2.childNodes), !c2 && null != e2) for (m2 = {}, s2 = 0; s2 < u2.attributes.length; s2++) m2[(y2 = u2.attributes[s2]).name] = y2.value;
      for (s2 in m2) y2 = m2[s2], "dangerouslySetInnerHTML" == s2 ? p2 = y2 : "children" == s2 || s2 in k2 || "value" == s2 && "defaultValue" in k2 || "checked" == s2 && "defaultChecked" in k2 || N(u2, s2, null, y2, o2);
      for (s2 in k2) y2 = k2[s2], "children" == s2 ? v2 = y2 : "dangerouslySetInnerHTML" == s2 ? h2 = y2 : "value" == s2 ? w2 = y2 : "checked" == s2 ? _2 = y2 : c2 && "function" != typeof y2 || m2[s2] === y2 || N(u2, s2, y2, m2[s2], o2);
      if (h2) c2 || p2 && (h2.__html == p2.__html || h2.__html == u2.innerHTML) || (u2.innerHTML = h2.__html), t2.__k = [];
      else if (p2 && (u2.innerHTML = ""), L("template" == t2.type ? u2.content : u2, g(v2) ? v2 : [v2], t2, i2, r2, "foreignObject" == x2 ? "http://www.w3.org/1999/xhtml" : o2, e2, f2, e2 ? e2[0] : i2.__k && $(i2, 0), c2, a2), null != e2) for (s2 = e2.length; s2--; ) b(e2[s2]);
      c2 && "textarea" != x2 || (s2 = "value", "progress" == x2 && null == w2 ? u2.removeAttribute("value") : null != w2 && (w2 !== u2[s2] || "progress" == x2 && !w2 || "option" == x2 && w2 != m2[s2]) && N(u2, s2, w2, m2[s2], o2), s2 = "checked", null != _2 && _2 != u2[s2] && N(u2, s2, _2, m2[s2], o2));
    }
    return u2;
  }
  function J(n2, u2, t2) {
    try {
      if ("function" == typeof n2) {
        var i2 = "function" == typeof n2.__u;
        i2 && n2.__u(), i2 && null == u2 || (n2.__u = n2(u2));
      } else n2.current = u2;
    } catch (n3) {
      l$1.__e(n3, t2);
    }
  }
  function K(n2, u2, t2) {
    var i2, r2;
    if (l$1.unmount && l$1.unmount(n2), (i2 = n2.ref) && (i2.current && i2.current != n2.__e || J(i2, null, u2)), null != (i2 = n2.__c)) {
      if (i2.componentWillUnmount) try {
        i2.componentWillUnmount();
      } catch (n3) {
        l$1.__e(n3, u2);
      }
      i2.base = i2.__P = i2.__n = null;
    }
    if (i2 = n2.__k) for (r2 = 0; r2 < i2.length; r2++) i2[r2] && K(i2[r2], u2, t2 || "function" != typeof n2.type);
    t2 || b(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
  }
  function Q(n2, l2, u2) {
    return this.constructor(n2, u2);
  }
  function R(u2, t2, i2) {
    var r2, o2, e2, f2;
    t2 == document && (t2 = document.documentElement), l$1.__ && l$1.__(u2, t2), o2 = (r2 = false) ? null : t2.__k, e2 = [], f2 = [], q(t2, u2 = t2.__k = k$1(S, null, [u2]), o2 || d$1, d$1, t2.namespaceURI, o2 ? null : t2.firstChild ? n.call(t2.childNodes) : null, e2, o2 ? o2.__e : t2.firstChild, r2, f2), D$1(e2, u2, f2), u2.props.children = null;
  }
  n = w$1.slice, l$1 = { __e: function(n2, l2, u2, t2) {
    for (var i2, r2, o2; l2 = l2.__; ) if ((i2 = l2.__c) && !i2.__) try {
      if ((r2 = i2.constructor) && null != r2.getDerivedStateFromError && (i2.setState(r2.getDerivedStateFromError(n2)), o2 = i2.__d), null != i2.componentDidCatch && (i2.componentDidCatch(n2, t2 || {}), o2 = i2.__d), o2) return i2.__E = i2;
    } catch (l3) {
      n2 = l3;
    }
    throw n2;
  } }, u$2 = 0, C$1.prototype.setState = function(n2, l2) {
    var u2;
    u2 = null != this.__s && this.__s != this.state ? this.__s : this.__s = m$1({}, this.state), "function" == typeof n2 && (n2 = n2(m$1({}, u2), this.props)), n2 && m$1(u2, n2), null != n2 && this.__v && (l2 && this._sb.push(l2), A(this));
  }, C$1.prototype.forceUpdate = function(n2) {
    this.__v && (this.__e = true, n2 && this.__h.push(n2), A(this));
  }, C$1.prototype.render = S, i$1 = [], o$1 = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e$1 = function(n2, l2) {
    return n2.__v.__b - l2.__v.__b;
  }, H.__r = 0, f$2 = Math.random().toString(8), c$1 = "__d" + f$2, a$1 = "__a" + f$2, s$1 = /(PointerCapture)$|Capture$/i, h$1 = 0, p$1 = V(false), v$1 = V(true);
  const uiStyles = '.ui-shell {\n  --canvas: #e9edf0;\n  --panel: #ffffff;\n  --ink: #17232c;\n  --muted: #60707a;\n  --faint: #8b98a0;\n  --line: #dbe3e7;\n  --line-strong: #c5d0d5;\n  --pink: #fb7299;\n  --pink-dark: #d84d76;\n  --pink-soft: #fff0f4;\n  --teal: #0a8f87;\n  --teal-dark: #066b66;\n  --teal-soft: #e8f7f5;\n  --amber: #c46a11;\n  --amber-soft: #fff4e5;\n  --danger: #c34659;\n  --danger-soft: #fff0f2;\n  --shadow: 0 18px 45px rgba(23, 35, 44, 0.16), 0 2px 8px rgba(23, 35, 44, 0.08);\n  --radius-sm: 4px;\n  --radius-md: 6px;\n  --radius-lg: 8px;\n  --space-1: 4px;\n  --space-2: 8px;\n  --space-3: 12px;\n  --space-4: 16px;\n  --space-5: 20px;\n  --space-6: 24px;\n  --body-font: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;\n  --display-font: "Arial Narrow", Bahnschrift, "Microsoft YaHei", sans-serif;\n  --utility-font: "Cascadia Mono", Consolas, monospace;\n  position: absolute;\n  inset: 0;\n  color: var(--ink);\n  font-family: var(--body-font);\n  pointer-events: none;\n}\n\n.ui-shell *,\n.ui-shell *::before,\n.ui-shell *::after {\n  box-sizing: border-box;\n}\n\n.ui-shell button,\n.ui-shell textarea,\n.ui-shell input,\n.ui-shell select {\n  font: inherit;\n}\n\n.ui-shell button,\n.ui-shell input,\n.ui-shell textarea,\n.ui-shell select {\n  border-radius: var(--radius-sm);\n}\n\n.ui-shell button {\n  cursor: pointer;\n}\n\n.ui-shell button:disabled {\n  cursor: not-allowed;\n}\n\n.ui-shell button:focus-visible,\n.ui-shell textarea:focus-visible,\n.ui-shell input:focus-visible,\n.ui-shell select:focus-visible {\n  outline: 3px solid rgba(10, 143, 135, 0.32);\n  outline-offset: 2px;\n}\n\n.training-deck,\n.plan-workbench {\n  position: absolute;\n  inset: 0;\n  pointer-events: none;\n}\n\n.training-deck__scrim {\n  position: absolute;\n  z-index: 20;\n  inset: 0;\n  background: rgba(9, 16, 21, 0.9);\n  clip-path: polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, 8px 4px, 8px 68px, 340px 68px, 340px 4px, 8px 4px);\n  pointer-events: auto;\n}\n\n.ui-shell--connected .training-deck__scrim {\n  display: none;\n}\n\n.training-deck__panel {\n  position: absolute;\n  z-index: 60;\n  top: 0;\n  right: 0;\n  display: grid;\n  gap: var(--space-4);\n  width: min(420px, 90vw);\n  height: 100%;\n  max-height: none;\n  padding: var(--space-5);\n  overflow: auto;\n  --panel: #1b2a32;\n  --ink: #f4f7f8;\n  --muted: #b4c0c5;\n  --faint: #84959d;\n  --line: #3a4b54;\n  --line-strong: #52636c;\n  --pink-soft: #422333;\n  --teal-soft: #173b3d;\n  --amber-soft: #49341d;\n  color: var(--ink);\n  background: rgba(19, 32, 39, 0.98);\n  border: 0;\n  border-left: 1px solid #4c606a;\n  border-radius: 0;\n  box-shadow: -18px 0 45px rgba(0, 0, 0, 0.28);\n  pointer-events: auto;\n  scrollbar-color: var(--line-strong) transparent;\n}\n\n.training-deck--exercise .training-deck__panel,\n.training-deck--paused .training-deck__panel {\n  border-left-color: var(--teal);\n}\n\n.training-deck--rest .training-deck__panel {\n  border-left-color: var(--amber);\n}\n\n.training-deck--complete .training-deck__panel {\n  border-left-color: var(--teal-dark);\n}\n\n.training-deck--paused .training-deck__panel {\n  --pause: #91a8d0;\n  --pause-soft: #263752;\n  border-left-color: var(--pause);\n}\n\n.training-deck__panel .metric {\n  background: rgba(255, 255, 255, 0.05);\n  border-color: var(--line);\n}\n\n.training-deck__panel .metric--pink { background: rgba(251, 114, 153, 0.14); border-color: rgba(251, 114, 153, 0.42); }\n.training-deck__panel .metric--teal { background: rgba(10, 143, 135, 0.16); border-color: rgba(10, 143, 135, 0.48); }\n.training-deck__panel .metric--amber { background: rgba(196, 106, 17, 0.16); border-color: rgba(196, 106, 17, 0.48); }\n.training-deck__panel .control-button--quiet { color: #c2ccd1; background: rgba(255, 255, 255, 0.06); }\n.training-deck__panel .preview-item,\n.training-deck__panel .group-item,\n.training-deck__panel .setting-row,\n.training-deck__panel .safety-zone,\n.training-deck__panel .empty-state { background: rgba(255, 255, 255, 0.045); border-color: var(--line); }\n.training-deck__panel .preview-item--current { background: rgba(251, 114, 153, 0.14); border-color: rgba(251, 114, 153, 0.5); }\n.training-deck__panel .safety-zone--confirm { background: rgba(195, 70, 89, 0.18); border-color: rgba(239, 194, 202, 0.54); }\n.training-deck__panel .empty-state strong { color: var(--ink); }\n\n.training-deck--paused .training-deck__eyebrow span:first-child::before {\n  content: "PAUSED / ";\n  color: #b8caee;\n}\n\n.training-deck__rest-overlay {\n  position: absolute;\n  z-index: 50;\n  top: 14%;\n  left: 3%;\n  display: grid;\n  width: calc(100% - 458px);\n  aspect-ratio: 16 / 9;\n  place-content: center;\n  justify-items: center;\n  color: rgba(255, 255, 255, 0.92);\n  background: rgba(196, 106, 17, 0.18);\n  border: 1px solid rgba(255, 208, 137, 0.42);\n  pointer-events: none;\n}\n\n.ui-shell--connected .training-deck__rest-overlay {\n  top: var(--bft-video-top, 14%);\n  left: var(--bft-video-left, 3%);\n  width: var(--bft-video-width, calc(100% - 458px));\n  height: var(--bft-video-height, auto);\n  aspect-ratio: auto;\n}\n\n.training-deck__rest-overlay strong {\n  color: #ffe0aa;\n  font-family: var(--utility-font);\n  font-size: 76px;\n  font-weight: 700;\n  line-height: 1;\n  text-shadow: 0 3px 16px rgba(0, 0, 0, 0.45);\n}\n\n.training-deck__rest-overlay span {\n  margin-top: 8px;\n  color: #ffd59a;\n  font-size: 13px;\n  font-weight: 700;\n}\n\n.training-deck__eyebrow,\n.status-header__line,\n.section-heading,\n.safety-zone,\n.pagination,\n.setting-row,\n.drawer-header,\n.dock-bar,\n.dock-bar__brand,\n.dock-bar__actions {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: var(--space-3);\n}\n\n.training-deck__eyebrow {\n  color: var(--faint);\n  font-family: var(--utility-font);\n  font-size: 9px;\n  letter-spacing: 0;\n  text-transform: uppercase;\n}\n\n.training-progress {\n  display: grid;\n  gap: 7px;\n  padding-bottom: var(--space-3);\n  border-bottom: 1px solid var(--line);\n}\n\n.training-progress__copy {\n  display: grid;\n  grid-template-columns: auto minmax(0, 1fr) auto;\n  align-items: baseline;\n  gap: var(--space-2);\n}\n\n.training-progress__copy span,\n.training-progress__copy small {\n  color: var(--faint);\n  font-size: 10px;\n}\n\n.training-progress__copy strong {\n  min-width: 0;\n  font-size: 11px;\n  text-align: center;\n}\n\n.training-progress__copy small {\n  white-space: nowrap;\n}\n\n.training-progress__track {\n  height: 3px;\n  overflow: hidden;\n  background: rgba(255, 255, 255, 0.1);\n  border-radius: 2px;\n}\n\n.training-progress__track span {\n  display: block;\n  height: 100%;\n  background: var(--pink);\n  border-radius: inherit;\n  transition: width 180ms ease;\n}\n\n.runtime-recovery {\n  position: absolute;\n  z-index: 100;\n  inset: 0;\n  display: grid;\n  place-items: center;\n  padding: var(--space-4);\n  background: rgba(8, 15, 20, 0.82);\n  pointer-events: auto;\n}\n\n.runtime-recovery__dialog {\n  display: grid;\n  gap: var(--space-3);\n  width: min(360px, 100%);\n  padding: var(--space-5);\n  color: var(--ink);\n  background: var(--panel);\n  border: 1px solid var(--line-strong);\n  border-radius: var(--radius-lg);\n  box-shadow: var(--shadow);\n}\n\n.runtime-recovery__dialog h2,\n.runtime-recovery__dialog p {\n  margin: 0;\n}\n\n.runtime-recovery__dialog h2 {\n  font-size: 22px;\n}\n\n.runtime-recovery__dialog p {\n  font-size: 14px;\n  font-weight: 700;\n}\n\n.runtime-recovery__dialog > small {\n  color: var(--muted);\n  font-size: 11px;\n}\n\n.runtime-recovery__actions {\n  display: grid;\n  grid-template-columns: 1fr 1.4fr;\n  gap: var(--space-2);\n}\n\n.panel-kicker {\n  color: var(--faint);\n  font-family: var(--utility-font);\n  font-size: 10px;\n  font-weight: 700;\n  letter-spacing: 0;\n  line-height: 1.2;\n  text-transform: uppercase;\n}\n\n.status-header {\n  display: grid;\n  gap: var(--space-3);\n}\n\n.status-header__line {\n  align-items: flex-start;\n}\n\n.status-pill {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  min-height: 24px;\n  padding: 4px 8px;\n  color: var(--pink-dark);\n  background: var(--pink-soft);\n  border-radius: 999px;\n  font-size: 11px;\n  font-weight: 700;\n  white-space: nowrap;\n}\n\n.status-header--exercise .status-pill,\n.status-header--paused .status-pill,\n.status-header--complete .status-pill {\n  color: var(--teal-dark);\n  background: var(--teal-soft);\n}\n\n.status-header--rest .status-pill {\n  color: var(--amber);\n  background: var(--amber-soft);\n}\n\n.status-pill__dot {\n  width: 6px;\n  height: 6px;\n  background: currentColor;\n  border-radius: 50%;\n}\n\n.status-header__copy {\n  display: grid;\n  gap: 6px;\n  min-width: 0;\n}\n\n.status-header__group {\n  margin: 0 0 4px;\n  color: var(--teal-dark);\n  font-family: var(--utility-font);\n  font-size: 10px;\n}\n\n.status-header h1,\n.section-heading h2,\n.drawer-header h1 {\n  margin: 0;\n  color: var(--ink);\n  font-family: var(--display-font);\n  font-weight: 800;\n  letter-spacing: 0;\n}\n\n.status-header h1 {\n  max-width: 100%;\n  font-size: 28px;\n  line-height: 1.08;\n  overflow-wrap: anywhere;\n}\n\n.status-header__copy > p,\n.drawer-header p {\n  margin: 0;\n  color: var(--muted);\n  font-size: 12px;\n  line-height: 1.45;\n}\n\n.set-counter {\n  color: var(--teal-dark);\n  font-family: var(--utility-font);\n  font-size: 13px;\n}\n\n.metric-grid {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: var(--space-2);\n}\n\n.metric {\n  min-width: 0;\n  padding: var(--space-3);\n  background: #f5f7f8;\n  border: 1px solid var(--line);\n  border-radius: var(--radius-md);\n}\n\n.metric--pink { background: var(--pink-soft); border-color: #f8c9d6; }\n.metric--teal { background: var(--teal-soft); border-color: #b9e2de; }\n.metric--amber { background: var(--amber-soft); border-color: #efd4ad; }\n\n.metric__label,\n.metric__detail {\n  display: block;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.metric__label { color: var(--muted); font-size: 10px; }\n.metric__value { display: block; margin: 3px 0 1px; font-family: var(--utility-font); font-size: 19px; line-height: 1.15; }\n.metric__detail { color: var(--faint); font-size: 10px; }\n\n.primary-action-block { display: grid; gap: 7px; }\n\n.primary-action {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  width: 100%;\n  min-height: 70px;\n  padding: 14px 18px;\n  color: #fff;\n  background: var(--pink);\n  border: 0;\n  border-radius: var(--radius-md);\n  font-family: var(--display-font);\n  font-size: 22px;\n  font-weight: 800;\n  transition: transform 140ms ease, background-color 140ms ease;\n}\n\n.training-deck--exercise .primary-action,\n.training-deck--paused .primary-action { background: var(--teal); }\n.training-deck--rest .primary-action { color: var(--ink); background: var(--amber); }\n.training-deck--complete .primary-action { color: var(--teal-dark); background: var(--teal-soft); border: 1px solid #b9e2de; }\n.primary-action:hover:not(:disabled) { background: var(--pink-dark); transform: translateY(-1px); }\n.training-deck--exercise .primary-action:hover:not(:disabled),\n.training-deck--paused .primary-action:hover:not(:disabled) { background: var(--teal-dark); }\n.primary-action:disabled { opacity: 0.78; }\n.primary-action__arrow { font-family: var(--utility-font); font-size: 22px; font-weight: 400; }\n.primary-action__note { margin: 0; color: var(--muted); font-size: 11px; text-align: center; }\n\n.training-deck--paused .status-pill {\n  color: #12233e;\n  background: #b8caee;\n}\n\n.training-deck--paused .primary-action {\n  color: #f7faff;\n  background: #536d9d;\n}\n\n.training-deck--paused .primary-action:hover:not(:disabled) { background: #6a84b5; }\n\n.control-row,\n.section-actions,\n.data-actions,\n.insert-row,\n.safety-zone__actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: var(--space-2);\n}\n\n.control-row > *,\n.data-actions > * { flex: 1 1 0; }\n\n.control-button,\n.pagination__button,\n.dock-button,\n.icon-button {\n  min-width: 0;\n  min-height: 40px;\n  padding: 8px 11px;\n  color: var(--ink);\n  background: var(--panel);\n  border: 1px solid var(--line-strong);\n  border-radius: var(--radius-sm);\n  font-size: 12px;\n  font-weight: 700;\n  line-height: 1.25;\n  overflow-wrap: anywhere;\n}\n\n.control-button small { display: block; margin-top: 2px; color: var(--faint); font-size: 10px; font-weight: 500; }\n.control-button:hover:not(:disabled),\n.pagination__button:hover:not(:disabled) { color: var(--teal-dark); border-color: var(--teal); }\n.control-button--quiet { color: var(--muted); background: #f5f7f8; }\n.control-button--secondary { color: var(--teal-dark); background: var(--teal-soft); border-color: #b9e2de; }\n.control-button--danger { color: var(--danger); background: var(--danger-soft); border-color: #efc2ca; }\n.control-button--danger:hover:not(:disabled) { color: #9c2f43; border-color: var(--danger); }\n\n.safety-zone {\n  align-items: flex-end;\n  padding: var(--space-3);\n  background: #fbfbfa;\n  border: 1px solid var(--line);\n  border-radius: var(--radius-md);\n}\n\n.safety-zone > div:first-child { min-width: 0; }\n.safety-zone__label { display: block; margin-bottom: 3px; color: var(--danger); font-family: var(--utility-font); font-size: 9px; font-weight: 700; letter-spacing: 0; }\n.safety-zone strong { display: block; font-size: 12px; }\n.safety-zone p { margin: 3px 0 0; color: var(--muted); font-size: 11px; line-height: 1.4; }\n.safety-zone--confirm { background: var(--danger-soft); border-color: #efc2ca; }\n.safety-zone__actions { flex: 0 0 auto; justify-content: flex-end; }\n\n.content-section,\n.workbench-section { display: grid; gap: var(--space-3); }\n.content-section { padding-top: 2px; }\n.section-heading { align-items: flex-end; }\n.section-heading h2 { margin-top: 4px; font-size: 18px; line-height: 1.2; }\n.section-heading__count { flex: 0 0 auto; color: var(--faint); font-size: 10px; white-space: nowrap; }\n\n.preview-list,\n.group-list,\n.settings-list { display: grid; gap: var(--space-2); }\n\n.preview-item,\n.group-item,\n.setting-row {\n  min-width: 0;\n  padding: var(--space-3);\n  background: #fbfcfc;\n  border: 1px solid var(--line);\n  border-radius: var(--radius-md);\n}\n\n.preview-item {\n  display: grid;\n  grid-template-columns: 26px minmax(0, 1fr) auto;\n  align-items: center;\n  gap: var(--space-3);\n  width: 100%;\n  color: var(--ink);\n  text-align: left;\n}\n\nbutton.preview-item { cursor: pointer; }\nbutton.preview-item:hover { border-color: var(--teal); }\n.preview-item--current { background: var(--pink-soft); border-color: #f8c9d6; }\n.preview-item--done { opacity: 0.66; }\n.preview-item__index { color: var(--faint); font-family: var(--utility-font); font-size: 10px; }\n.preview-item--current .preview-item__index { color: var(--pink-dark); }\n.preview-item__body { min-width: 0; }\n.preview-item__body strong,\n.preview-item__body small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.preview-item__body strong { font-size: 12px; }\n.preview-item__body small { margin-top: 3px; color: var(--muted); font-size: 10px; }\n.preview-item__state { color: var(--faint); font-size: 10px; white-space: nowrap; }\n.preview-item--current .preview-item__state { color: var(--pink-dark); font-weight: 800; }\n\n.empty-state { display: grid; gap: 5px; padding: 18px; color: var(--muted); background: #f7f9f9; border: 1px dashed var(--line-strong); border-radius: var(--radius-md); }\n.empty-state strong { color: var(--ink); font-size: 13px; }\n.empty-state span { font-size: 11px; line-height: 1.45; }\n\n.field-label { display: block; color: var(--muted); font-size: 11px; font-weight: 700; }\n.plan-textarea,\n.form-grid textarea,\n.form-grid input,\n.setting-row select {\n  width: 100%;\n  color: var(--ink);\n  background: #fbfcfc;\n  border: 1px solid var(--line-strong);\n}\n\n.plan-textarea { min-height: 148px; resize: vertical; padding: 12px; font-family: var(--utility-font); font-size: 12px; line-height: 1.75; }\n.plan-textarea::placeholder { color: #9da8ae; }\n.plan-textarea--error { background: var(--danger-soft); border-color: var(--danger); }\n.field-helper { margin: 0; color: var(--faint); font-size: 11px; line-height: 1.5; }\n.entry-error { padding: 10px 12px; color: var(--danger); background: var(--danger-soft); border-left: 3px solid var(--danger); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }\n.entry-error strong,\n.entry-error p,\n.entry-error span { display: block; margin: 0; font-size: 11px; line-height: 1.5; }\n.entry-error strong { font-size: 12px; }\n.entry-error p,\n.entry-error span { margin-top: 3px; }\n.entry-error span { color: #963748; }\n.insert-row { align-items: center; }\n.insert-row > span { flex: 1 1 100%; color: var(--faint); font-family: var(--utility-font); font-size: 10px; }\n.insert-row .control-button { flex: 1 1 0; }\n\n.group-item-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: stretch; gap: var(--space-2); }\n.group-item { display: grid; grid-template-columns: 9px minmax(0, 1fr) auto 20px; align-items: center; gap: var(--space-3); width: 100%; color: var(--ink); text-align: left; }\n.group-item:hover,\n.group-item--active { background: var(--teal-soft); border-color: #b9e2de; }\n.group-item__marker { width: 7px; height: 7px; background: var(--line-strong); border-radius: 50%; }\n.group-item--active .group-item__marker { background: var(--teal); box-shadow: 0 0 0 3px rgba(10, 143, 135, 0.12); }\n.group-item__body { min-width: 0; }\n.group-item__body strong,\n.group-item__body small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.group-item__body strong { font-size: 12px; }\n.group-item__body small { margin-top: 3px; color: var(--muted); font-size: 10px; }\n.group-item__progress { color: var(--teal-dark); font-family: var(--utility-font); font-size: 10px; text-align: right; white-space: nowrap; }\n.group-item__progress small { display: block; margin-top: 3px; color: var(--faint); font-family: var(--body-font); font-size: 9px; }\n.group-item__more { color: var(--faint); font-size: 16px; letter-spacing: 0; }\n.group-item-actions { display: grid; grid-template-rows: repeat(2, minmax(0, 1fr)); gap: 4px; }\n.group-item-action { min-width: 44px; padding: 4px 8px; color: var(--teal-dark); background: var(--teal-soft); border-color: #b9e2de; font-size: 10px; }\n.group-item-action--danger { color: var(--danger); background: var(--danger-soft); border-color: #efb7c1; }\n\n.pagination { margin-top: 2px; color: var(--muted); font-family: var(--utility-font); font-size: 10px; }\n.pagination__button { color: var(--teal-dark); background: var(--teal-soft); border-color: #b9e2de; font-family: var(--body-font); font-size: 11px; }\n.pagination__button:disabled { color: var(--faint); background: #f5f7f8; border-color: var(--line); }\n\n.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); }\n.form-grid label { display: grid; gap: 6px; min-width: 0; color: var(--muted); font-size: 11px; font-weight: 700; }\n.form-grid__wide { grid-column: 1 / -1; }\n.form-grid input { min-height: 40px; padding: 8px 10px; }\n.form-grid textarea { min-height: 76px; resize: vertical; padding: 8px 10px; line-height: 1.5; }\n\n.setting-row { align-items: center; }\n.setting-row > span { min-width: 0; }\n.setting-row strong,\n.setting-row small { display: block; }\n.setting-row strong { font-size: 12px; }\n.setting-row small { margin-top: 3px; color: var(--muted); font-size: 10px; }\n.setting-row select { flex: 0 0 64px; min-height: 40px; padding: 6px 8px; }\n.setting-row input { flex: 0 0 auto; width: 18px; height: 18px; accent-color: var(--teal); }\n\n.plan-workbench__veil { position: absolute; z-index: 70; inset: 0; background: rgba(8, 15, 20, 0.78); clip-path: polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, 8px 4px, 8px 68px, 340px 68px, 340px 4px, 8px 4px); pointer-events: auto; }\n.plan-workbench__drawer { position: absolute; z-index: 80; top: 0; right: 0; display: flex; flex-direction: column; width: min(420px, 90vw); height: 100%; background: var(--panel); border-left: 1px solid var(--line-strong); box-shadow: -18px 0 45px rgba(23, 35, 44, 0.26); pointer-events: auto; }\n.drawer-header { flex: 0 0 auto; align-items: flex-start; padding: var(--space-5); border-bottom: 1px solid var(--line); }\n.drawer-header h1 { margin-top: 5px; font-size: 25px; }\n.drawer-header p { margin-top: 5px; }\n.icon-button { flex: 0 0 44px; width: 44px; min-height: 44px; padding: 0; color: var(--muted); background: #f5f7f8; font-size: 24px; font-weight: 400; line-height: 1; }\n.drawer-scroll { display: grid; gap: var(--space-6); padding: var(--space-5); overflow: auto; scrollbar-color: var(--line-strong) transparent; }\n.drawer-start { padding-bottom: var(--space-2); border-bottom: 1px solid var(--line); }\n\n.dock-bar { position: absolute; z-index: 10; top: 8px; left: 12px; min-height: 48px; padding: 6px 8px 6px 12px; color: #fff; background: #17232c; border: 1px solid #3b4a53; border-radius: var(--radius-md); box-shadow: 0 14px 30px rgba(23, 35, 44, 0.24); pointer-events: auto; }\n.dock-bar__brand { min-width: 0; }\n.dock-bar__brand strong { color: var(--pink); font-family: var(--utility-font); font-size: 13px; letter-spacing: 0; }\n.dock-bar__brand span { max-width: 160px; color: #d9e1e5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }\n.dock-bar__actions { gap: 5px; }\n.dock-button { min-height: 36px; padding: 6px 10px; color: #d9e1e5; background: #26343d; border-color: #3b4a53; font-size: 11px; }\n.dock-button:hover,\n.dock-button--active { color: var(--ink); background: #fff; border-color: #fff; }\n.dock-button--accent { color: #17232c; background: var(--pink); border-color: var(--pink); }\n\n@media (max-width: 640px) {\n  .training-deck__scrim,\n  .plan-workbench__veil { clip-path: polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, 4px 4px, 4px 70px, calc(100% - 4px) 70px, calc(100% - 4px) 4px, 4px 4px); }\n  .training-deck__panel { top: auto; right: 0; bottom: 0; width: 100%; height: auto; max-height: 58dvh; padding: var(--space-4); border-top: 1px solid #4c606a; border-left: 0; border-radius: var(--radius-md) var(--radius-md) 0 0; padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom)); }\n  .training-deck__rest-overlay { top: 8%; left: 4%; width: 92%; }\n  .training-deck__rest-overlay strong { font-size: 56px; }\n  .training-deck__eyebrow { font-size: 8px; }\n  .status-header h1 { font-size: 24px; }\n  .primary-action { min-height: 72px; font-size: 21px; }\n  .control-button,\n  .pagination__button,\n  .dock-button { min-height: 44px; }\n  .safety-zone { align-items: stretch; flex-direction: column; }\n  .safety-zone__actions { flex: 1 1 auto; }\n  .safety-zone__actions > * { flex: 1 1 0; }\n  .plan-workbench__drawer { top: auto; bottom: 0; width: 100%; height: min(90dvh, 820px); border-left: 0; border-top: 1px solid var(--line-strong); padding-bottom: env(safe-area-inset-bottom); }\n  .drawer-scroll { padding: var(--space-4); }\n  .dock-bar { top: 6px; right: 8px; left: 8px; }\n  .dock-bar__brand span { max-width: 110px; }\n  .dock-bar__actions { margin-left: auto; }\n  .dock-button { padding-inline: 9px; }\n  .form-grid { grid-template-columns: 1fr; }\n  .form-grid__wide { grid-column: auto; }\n}\n';
  var f$1 = 0;
  function u$1(e2, t2, n2, o2, i2, u2) {
    t2 || (t2 = {});
    var a2, c2, p2 = t2;
    if ("ref" in p2) for (c2 in p2 = {}, t2) "ref" == c2 ? a2 = t2[c2] : p2[c2] = t2[c2];
    var l2 = { type: e2, props: p2, key: n2, ref: a2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f$1, __i: -1, __u: 0, __source: i2, __self: u2 };
    if ("function" == typeof e2 && (a2 = e2.defaultProps)) for (c2 in a2) void 0 === p2[c2] && (p2[c2] = a2[c2]);
    return l$1.vnode && l$1.vnode(l2), l2;
  }
  var t, r, u, i, o = 0, f = [], c = l$1, e = c.__b, a = c.__r, v = c.diffed, l = c.__c, m = c.unmount, p = c.__;
  function s(n2, t2) {
    c.__h && c.__h(r, n2, o || t2), o = 0;
    var u2 = r.__H || (r.__H = { __: [], __h: [] });
    return n2 >= u2.__.length && u2.__.push({}), u2.__[n2];
  }
  function d(n2) {
    return o = 1, y(D, n2);
  }
  function y(n2, u2, i2) {
    var o2 = s(t++, 2);
    if (o2.t = n2, !o2.__c && (o2.__ = [D(void 0, u2), function(n3) {
      var t2 = o2.__N ? o2.__N[0] : o2.__[0], r2 = o2.t(t2, n3);
      t2 !== r2 && (o2.__N = [r2, o2.__[1]], o2.__c.setState({}));
    }], o2.__c = r, !r.__f)) {
      var f2 = function(n3, t2, r2) {
        if (!o2.__c.__H) return true;
        var u3 = false, i3 = o2.__c.props !== n3;
        if (o2.__c.__H.__.some(function(n4) {
          if (n4.__N) {
            u3 = true;
            var t3 = n4.__[0];
            n4.__ = n4.__N, n4.__N = void 0, t3 !== n4.__[0] && (i3 = true);
          }
        }), c2) {
          var f3 = c2.call(this, n3, t2, r2);
          return u3 ? f3 || i3 : f3;
        }
        return !u3 || i3;
      };
      r.__f = true;
      var c2 = r.shouldComponentUpdate, e2 = r.componentWillUpdate;
      r.componentWillUpdate = function(n3, t2, r2) {
        if (this.__e) {
          var u3 = c2;
          c2 = void 0, f2(n3, t2, r2), c2 = u3;
        }
        e2 && e2.call(this, n3, t2, r2);
      }, r.shouldComponentUpdate = f2;
    }
    return o2.__N || o2.__;
  }
  function h(n2, u2) {
    var i2 = s(t++, 3);
    !c.__s && C(i2.__H, u2) && (i2.__ = n2, i2.u = u2, r.__H.__h.push(i2));
  }
  function T(n2, r2) {
    var u2 = s(t++, 7);
    return C(u2.__H, r2) && (u2.__ = n2(), u2.__H = r2, u2.__h = n2), u2.__;
  }
  function j() {
    for (var n2; n2 = f.shift(); ) {
      var t2 = n2.__H;
      if (n2.__P && t2) try {
        t2.__h.some(z), t2.__h.some(B), t2.__h = [];
      } catch (r2) {
        t2.__h = [], c.__e(r2, n2.__v);
      }
    }
  }
  c.__b = function(n2) {
    r = null, e && e(n2);
  }, c.__ = function(n2, t2) {
    n2 && t2.__k && t2.__k.__m && (n2.__m = t2.__k.__m), p && p(n2, t2);
  }, c.__r = function(n2) {
    a && a(n2), t = 0;
    var i2 = (r = n2.__c).__H;
    i2 && (u === r ? (i2.__h = [], r.__h = [], i2.__.some(function(n3) {
      n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = void 0;
    })) : (i2.__h.some(z), i2.__h.some(B), i2.__h = [], t = 0)), u = r;
  }, c.diffed = function(n2) {
    v && v(n2);
    var t2 = n2.__c;
    t2 && t2.__H && (t2.__H.__h.length && (1 !== f.push(t2) && i === c.requestAnimationFrame || ((i = c.requestAnimationFrame) || w)(j)), t2.__H.__.some(function(n3) {
      n3.u && (n3.__H = n3.u, n3.u = void 0);
    })), u = r = null;
  }, c.__c = function(n2, t2) {
    t2.some(function(n3) {
      try {
        n3.__h.some(z), n3.__h = n3.__h.filter(function(n4) {
          return !n4.__ || B(n4);
        });
      } catch (r2) {
        t2.some(function(n4) {
          n4.__h && (n4.__h = []);
        }), t2 = [], c.__e(r2, n3.__v);
      }
    }), l && l(n2, t2);
  }, c.unmount = function(n2) {
    m && m(n2);
    var t2, r2 = n2.__c;
    r2 && r2.__H && (r2.__H.__.some(function(n3) {
      try {
        z(n3);
      } catch (n4) {
        t2 = n4;
      }
    }), r2.__H = void 0, t2 && c.__e(t2, r2.__v));
  };
  var k = "function" == typeof requestAnimationFrame;
  function w(n2) {
    var t2, r2 = function() {
      clearTimeout(u2), k && cancelAnimationFrame(t2), setTimeout(n2);
    }, u2 = setTimeout(r2, 35);
    k && (t2 = requestAnimationFrame(r2));
  }
  function z(n2) {
    var t2 = r, u2 = n2.__c;
    "function" == typeof u2 && (n2.__c = void 0, u2()), r = t2;
  }
  function B(n2) {
    var t2 = r;
    n2.__c = n2.__(), r = t2;
  }
  function C(n2, t2) {
    return !n2 || n2.length !== t2.length || t2.some(function(t3, r2) {
      return t3 !== n2[r2];
    });
  }
  function D(n2, t2) {
    return "function" == typeof t2 ? t2(n2) : t2;
  }
  const defaultSettings = {
    beepDuration: 2,
    pauseDuringRest: true
  };
  const colonTimestampPattern = String.raw`(?:\d{1,2}:)?\d{1,2}:\d{2}(?:\.\d+)?`;
  const chineseTimestampPattern = String.raw`(?:\d+\s*时(?:\s*\d+\s*分)?(?:(?:\s*\d+(?:\.\d+)?\s*秒)|\d+(?:\.\d+)?)?|\d+\s*分(?:(?:\s*\d+(?:\.\d+)?\s*秒)|\d+(?:\.\d+)?)?|\d+(?:\.\d+)?\s*秒)`;
  const timestampPattern = `(?:${colonTimestampPattern}|${chineseTimestampPattern})`;
  function parseTimestamp(value) {
    const text = value.trim();
    const chinese = text.match(
      /^(?:(\d+)\s*时)?(?:(\d+)\s*分)?(?:(?:\s*(\d+(?:\.\d+)?)\s*秒)|(\d+(?:\.\d+)?))?$/
    );
    if (chinese && /[时分秒]/.test(text) && (chinese[1] || chinese[2] || chinese[3] || chinese[4])) {
      return Number(chinese[1] ?? 0) * 3600 + Number(chinese[2] ?? 0) * 60 + Number(chinese[3] ?? chinese[4] ?? 0);
    }
    const parts = text.split(":");
    if (parts.length < 2 || parts.length > 3) {
      return null;
    }
    if (parts.some((part) => part.trim() === "" || Number.isNaN(Number(part)))) {
      return null;
    }
    const numbers = parts.map(Number);
    if (numbers.length === 2) {
      return numbers[0] * 60 + numbers[1];
    }
    return numbers[0] * 3600 + numbers[1] * 60 + numbers[2];
  }
  function formatTimestamp(seconds) {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const h2 = Math.floor(safeSeconds / 3600);
    const m2 = Math.floor(safeSeconds % 3600 / 60);
    const s2 = safeSeconds % 60;
    if (h2 > 0) {
      return `${h2}:${String(m2).padStart(2, "0")}:${String(s2).padStart(2, "0")}`;
    }
    return `${m2}:${String(s2).padStart(2, "0")}`;
  }
  function parsePlan(input) {
    const errors = [];
    const parsedExercises = [];
    const lines = input.split(/\r?\n/);
    lines.forEach((rawLine, index) => {
      const line = rawLine.trim();
      if (!line) {
        return;
      }
      const timeMatch = line.match(
        new RegExp(`(?<start>${timestampPattern})\\s*(?:-|~|至|到)\\s*(?<end>${timestampPattern})`)
      );
      const setMatch = line.match(
        /(?<sets>\d+)\s*(?:x|X|×|组)\s*(?<min>\d+)(?:\s*[-~]\s*(?<max>\d+))?/
      );
      const restMatch = line.match(/(?:rest|休息)\s*(?<rest>\d+)/i);
      if (!(timeMatch == null ? void 0 : timeMatch.groups)) {
        errors.push(`第 ${index + 1} 行：缺少时间段，例如 00:12-00:28`);
        return;
      }
      if (!(setMatch == null ? void 0 : setMatch.groups)) {
        errors.push(`第 ${index + 1} 行：缺少组数和次数，例如 3x8-12`);
        return;
      }
      const start = parseTimestamp(timeMatch.groups.start);
      const end = parseTimestamp(timeMatch.groups.end);
      if (start === null || end === null) {
        errors.push(`第 ${index + 1} 行：时间戳格式无法识别`);
        return;
      }
      if (end <= start) {
        errors.push(`第 ${index + 1} 行：结束时间必须晚于开始时间`);
        return;
      }
      const beforeTime = line.slice(0, timeMatch.index).trim();
      const name = beforeTime || `动作 ${parsedExercises.length + 1}`;
      const sets = Number(setMatch.groups.sets);
      const minReps = Number(setMatch.groups.min);
      const maxReps = Number(setMatch.groups.max ?? setMatch.groups.min);
      const restSeconds = (restMatch == null ? void 0 : restMatch.groups) ? Number(restMatch.groups.rest) : 45;
      if (sets <= 0 || minReps <= 0 || maxReps < minReps || restSeconds < 0) {
        errors.push(`第 ${index + 1} 行：组数、次数或休息时间无效`);
        return;
      }
      parsedExercises.push({
        id: `${index}-${start}-${end}`,
        name,
        start,
        end,
        sets,
        minReps,
        maxReps,
        restSeconds
      });
    });
    return {
      exercises: parsedExercises,
      errors
    };
  }
  function serializeExercises(items) {
    return items.map(
      (exercise) => `${exercise.name} ${formatTimestamp(exercise.start)}-${formatTimestamp(exercise.end)} ${exercise.sets}x${exercise.minReps}${exercise.maxReps === exercise.minReps ? "" : `-${exercise.maxReps}`} rest${exercise.restSeconds}`
    ).join("\n");
  }
  function normalizeExerciseIndex(exercises, exerciseIndex) {
    if (exercises.length === 0) {
      return 0;
    }
    const safeIndex = Number.isFinite(exerciseIndex) ? Math.trunc(exerciseIndex) : 0;
    return Math.min(Math.max(safeIndex, 0), exercises.length - 1);
  }
  function createIdleRuntime(exerciseIndex = 0) {
    const safeIndex = Number.isFinite(exerciseIndex) ? Math.max(0, Math.trunc(exerciseIndex)) : 0;
    return {
      mode: "idle",
      exerciseIndex: safeIndex,
      setIndex: 0,
      restRemaining: 0,
      beforePauseMode: "idle"
    };
  }
  function startTraining(exercises, exerciseIndex = 0) {
    if (exercises.length === 0) {
      return createIdleRuntime(exerciseIndex);
    }
    return {
      mode: "exercise",
      exerciseIndex: normalizeExerciseIndex(exercises, exerciseIndex),
      setIndex: 0,
      restRemaining: 0,
      beforePauseMode: "exercise"
    };
  }
  function hasNextUnit(exercises, runtime) {
    const exercise = exercises[runtime.exerciseIndex];
    if (!exercise) {
      return false;
    }
    return runtime.setIndex + 1 < exercise.sets || runtime.exerciseIndex + 1 < exercises.length;
  }
  function completeSet(exercises, runtime) {
    if (runtime.mode !== "exercise") {
      return { ...runtime };
    }
    const exercise = exercises[runtime.exerciseIndex];
    if (!exercise || !hasNextUnit(exercises, runtime)) {
      return {
        ...runtime,
        mode: "complete",
        restRemaining: 0,
        beforePauseMode: "complete"
      };
    }
    return {
      ...runtime,
      mode: "rest",
      restRemaining: exercise.restSeconds,
      beforePauseMode: "rest"
    };
  }
  function moveToNextUnit(exercises, runtime) {
    const exercise = exercises[runtime.exerciseIndex];
    if (!exercise) {
      return {
        ...runtime,
        mode: "complete",
        restRemaining: 0,
        beforePauseMode: "complete"
      };
    }
    if (runtime.setIndex + 1 < exercise.sets) {
      return {
        ...runtime,
        mode: "exercise",
        setIndex: runtime.setIndex + 1,
        restRemaining: 0,
        beforePauseMode: "exercise"
      };
    }
    if (runtime.exerciseIndex + 1 < exercises.length) {
      return {
        ...runtime,
        mode: "exercise",
        exerciseIndex: runtime.exerciseIndex + 1,
        setIndex: 0,
        restRemaining: 0,
        beforePauseMode: "exercise"
      };
    }
    return {
      ...runtime,
      mode: "complete",
      restRemaining: 0,
      beforePauseMode: "complete"
    };
  }
  function tickRest(exercises, runtime) {
    if (runtime.mode !== "rest") {
      return { ...runtime };
    }
    const restRemaining = Math.max(0, runtime.restRemaining - 1);
    if (restRemaining > 0) {
      return { ...runtime, restRemaining };
    }
    return moveToNextUnit(exercises, { ...runtime, restRemaining: 0 });
  }
  function skipRest(exercises, runtime) {
    if (runtime.mode !== "rest") {
      return { ...runtime };
    }
    return moveToNextUnit(exercises, runtime);
  }
  function pauseRuntime(runtime) {
    if (runtime.mode !== "exercise" && runtime.mode !== "rest") {
      return { ...runtime };
    }
    return {
      ...runtime,
      mode: "paused",
      beforePauseMode: runtime.mode
    };
  }
  function resumeRuntime(runtime) {
    if (runtime.mode !== "paused") {
      return { ...runtime };
    }
    return {
      ...runtime,
      mode: runtime.beforePauseMode
    };
  }
  function resetRuntime(exerciseIndex = 0) {
    return createIdleRuntime(exerciseIndex);
  }
  function switchToExercise(exercises, runtime, exerciseIndex) {
    if (!Number.isInteger(exerciseIndex) || !exercises[exerciseIndex]) {
      return { ...runtime };
    }
    if (runtime.mode === "paused") {
      return {
        ...runtime,
        exerciseIndex,
        setIndex: 0,
        restRemaining: 0,
        beforePauseMode: "exercise"
      };
    }
    const mode = runtime.mode === "exercise" || runtime.mode === "rest" ? "exercise" : runtime.mode === "complete" ? "idle" : runtime.mode;
    return {
      ...runtime,
      mode,
      exerciseIndex,
      setIndex: 0,
      restRemaining: 0,
      beforePauseMode: mode
    };
  }
  const planStoragePrefix = "bili-fitness-timer:";
  const defaultPreferencesStorageKey = `${planStoragePrefix}preferences`;
  const defaultRuntimeStorageKey = `${planStoragePrefix}session`;
  const timestampLibraryBaseUrl = "https://github.com/RyanChouHua/bili-fitness-timer/raw/refs/heads/main/timestamps";
  const bvidPattern$1 = /BV[0-9A-Za-z]{10}/i;
  function normalizeBvid$1(value) {
    const match = value.match(bvidPattern$1);
    if (!match) {
      return null;
    }
    return `BV${match[0].slice(2)}`;
  }
  function getTimestampLibraryUrl(bvid) {
    return `${timestampLibraryBaseUrl}/${encodeURIComponent(bvid)}.json`;
  }
  function getPlanStorageKey(id) {
    return `${planStoragePrefix}${id}`;
  }
  function booleanPreference(value, fallback) {
    return typeof value === "boolean" ? value : fallback;
  }
  function normalizeExercise(value, index = 0) {
    if (!value || typeof value !== "object") {
      return null;
    }
    const exercise = value;
    const id = typeof exercise.id === "string" ? exercise.id : `${index}-${Number(exercise.start)}-${Number(exercise.end)}`;
    if (typeof exercise.name !== "string" || typeof exercise.start !== "number" || typeof exercise.end !== "number" || typeof exercise.sets !== "number" || typeof exercise.minReps !== "number" || typeof exercise.maxReps !== "number" || typeof exercise.restSeconds !== "number") {
      return null;
    }
    if (!Number.isFinite(exercise.start) || !Number.isFinite(exercise.end) || !Number.isFinite(exercise.sets) || !Number.isFinite(exercise.minReps) || !Number.isFinite(exercise.maxReps) || !Number.isFinite(exercise.restSeconds) || exercise.end <= exercise.start || exercise.sets <= 0 || exercise.minReps <= 0 || exercise.maxReps < exercise.minReps || exercise.restSeconds < 0) {
      return null;
    }
    return {
      id,
      name: exercise.name,
      start: exercise.start,
      end: exercise.end,
      sets: exercise.sets,
      minReps: exercise.minReps,
      maxReps: exercise.maxReps,
      restSeconds: exercise.restSeconds
    };
  }
  function normalizeExerciseList(value) {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.map((item, index) => normalizeExercise(item, index)).filter((item) => item !== null);
  }
  function normalizeOptionalText(value) {
    if (typeof value !== "string") {
      return null;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  function normalizeImportedPlanGroup(value) {
    if (!value || typeof value !== "object") {
      throw new Error("子分组必须是对象");
    }
    const payload = value;
    const exercises = normalizeExerciseList(payload.exercises);
    const savedExercises = normalizeExerciseList(payload.savedExercises);
    const importedExercises = exercises.length > 0 ? exercises : savedExercises;
    const rawInput = typeof payload.rawInput === "string" && payload.rawInput.trim() ? payload.rawInput : serializeExercises(importedExercises);
    if (!rawInput.trim() && importedExercises.length === 0) {
      throw new Error("子分组缺少 rawInput 或 exercises");
    }
    return {
      id: normalizeOptionalText(payload.id),
      title: normalizeOptionalText(payload.title),
      author: normalizeOptionalText(payload.author),
      notes: normalizeOptionalText(payload.notes),
      rawInput,
      exercises: importedExercises,
      settings: payload.settings ?? null
    };
  }
  function normalizeImportedPlanData(value) {
    if (!value || typeof value !== "object") {
      throw new Error("JSON 必须是对象");
    }
    const payload = value;
    const groups = Array.isArray(payload.groups) ? payload.groups.map((group, index) => {
      try {
        return normalizeImportedPlanGroup(group);
      } catch (error) {
        const message = error instanceof Error ? error.message : "格式错误";
        throw new Error(`第 ${index + 1} 个子分组：${message}`);
      }
    }) : [normalizeImportedPlanGroup(value)];
    if (groups.length === 0) {
      throw new Error("JSON 缺少子分组");
    }
    const firstGroup = groups[0];
    return {
      bvid: typeof payload.bvid === "string" ? normalizeBvid$1(payload.bvid) : null,
      title: normalizeOptionalText(payload.title),
      author: normalizeOptionalText(payload.author),
      notes: normalizeOptionalText(payload.notes),
      rawInput: firstGroup.rawInput,
      exercises: firstGroup.exercises,
      groups
    };
  }
  function normalizeStoredPlan(value, fallbackTitle, index = 0, fallbackBvid = null) {
    var _a2, _b;
    if (!value || typeof value !== "object") {
      return null;
    }
    const parsed = value;
    const savedExercises = normalizeExerciseList(parsed.savedExercises);
    const id = normalizeOptionalText(parsed.id) ?? `legacy-${index + 1}`;
    const title = normalizeOptionalText(parsed.title) ?? fallbackTitle;
    return {
      id,
      rawInput: typeof parsed.rawInput === "string" ? parsed.rawInput : serializeExercises(savedExercises),
      settings: {
        beepDuration: typeof ((_a2 = parsed.settings) == null ? void 0 : _a2.beepDuration) === "number" ? parsed.settings.beepDuration : defaultSettings.beepDuration,
        pauseDuringRest: typeof ((_b = parsed.settings) == null ? void 0 : _b.pauseDuringRest) === "boolean" ? parsed.settings.pauseDuringRest : defaultSettings.pauseDuringRest
      },
      savedExercises,
      bvid: typeof parsed.bvid === "string" ? normalizeBvid$1(parsed.bvid) : fallbackBvid,
      title,
      author: normalizeOptionalText(parsed.author) ?? void 0,
      notes: normalizeOptionalText(parsed.notes) ?? void 0,
      createdAt: typeof parsed.createdAt === "number" ? parsed.createdAt : void 0,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : void 0
    };
  }
  function createLibraryFromLegacy(value, fallbackTitle = "子分组 1", fallbackBvid = null) {
    const normalizedFallbackBvid = fallbackBvid ? normalizeBvid$1(fallbackBvid) : null;
    const legacyGroup = normalizeStoredPlan(value, fallbackTitle, 0, normalizedFallbackBvid) ?? {
      id: "legacy-1",
      rawInput: "",
      settings: { ...defaultSettings },
      savedExercises: [],
      bvid: normalizedFallbackBvid,
      title: fallbackTitle
    };
    const bvid = normalizedFallbackBvid ?? legacyGroup.bvid ?? null;
    return {
      schemaVersion: 2,
      bvid,
      activeGroupId: legacyGroup.id,
      groups: [legacyGroup],
      updatedAt: legacyGroup.updatedAt
    };
  }
  const bvidPattern = /BV[0-9A-Za-z]{10}/i;
  const navigationPollIntervalMs = 1e3;
  const videoWaitTimeoutMs = 1e4;
  const takeoverZIndex = "2147483645";
  const takeoverBackground = "rgba(9, 16, 21, 0.9)";
  const videoContainerSelectors = [
    "#bilibili-player",
    ".bpx-player-container",
    ".bilibili-player",
    ".video-container-v1",
    ".player-wrap"
  ];
  const commentContainerSelectors = [
    "#commentapp",
    "#comment",
    ".comment-container",
    ".reply-warp",
    '[data-module="comment"]'
  ];
  const guardedVideos = /* @__PURE__ */ new WeakSet();
  const loopSegmentProviders = /* @__PURE__ */ new WeakMap();
  function normalizeBvid(value) {
    const match = value.match(bvidPattern);
    if (!match) {
      return null;
    }
    return `BV${match[0].slice(2)}`;
  }
  function isBilibiliUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname === "bilibili.com" || parsed.hostname.endsWith(".bilibili.com");
    } catch {
      return false;
    }
  }
  function extractBvidFromUrl(url) {
    try {
      const parsed = new URL(url);
      if (!isBilibiliUrl(url)) {
        return null;
      }
      for (const [key, value] of parsed.searchParams) {
        const normalizedKey = key.toLowerCase();
        if (normalizedKey === "bvid" || normalizedKey === "bv_id") {
          const queryBvid = normalizeBvid(value);
          if (queryBvid) {
            return queryBvid;
          }
        }
      }
      return normalizeBvid(`${parsed.pathname}${parsed.search}${parsed.hash}`);
    } catch {
      return normalizeBvid(url);
    }
  }
  function waitForVideo(timeoutMs = videoWaitTimeoutMs) {
    const existing = document.querySelector("video");
    if (existing) {
      return Promise.resolve(existing);
    }
    return new Promise((resolve) => {
      let timeoutId;
      const observer = new MutationObserver(() => {
        const video = document.querySelector("video");
        if (video) {
          finish(video);
        }
      });
      const finish = (video) => {
        observer.disconnect();
        if (timeoutId !== void 0) {
          window.clearTimeout(timeoutId);
        }
        resolve(video);
      };
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
      timeoutId = window.setTimeout(() => finish(null), timeoutMs);
    });
  }
  function watchBvidChanges(callback) {
    let previousBvid = extractBvidFromUrl(window.location.href);
    const intervalId = window.setInterval(() => {
      const bvid = extractBvidFromUrl(window.location.href);
      if (bvid === previousBvid) {
        return;
      }
      const change = { bvid, previousBvid };
      previousBvid = bvid;
      callback(change);
    }, navigationPollIntervalMs);
    return () => window.clearInterval(intervalId);
  }
  function bindVideoLoopGuard(video, getActiveSegment) {
    loopSegmentProviders.set(video, getActiveSegment);
    if (guardedVideos.has(video)) {
      return;
    }
    guardedVideos.add(video);
    video.addEventListener("timeupdate", () => {
      var _a2;
      const segment = (_a2 = loopSegmentProviders.get(video)) == null ? void 0 : _a2();
      if (!segment) {
        return;
      }
      if (video.currentTime >= segment.end || video.currentTime < segment.start - 0.25) {
        video.currentTime = segment.start;
        if (video.paused) {
          void video.play().catch(() => void 0);
        }
      }
    });
  }
  function findContainingElement(selectors, target) {
    for (const selector of selectors) {
      const closest = target.closest(selector);
      if (closest) {
        return closest;
      }
      const containing = Array.from(document.querySelectorAll(selector)).find(
        (element) => element.contains(target)
      );
      if (containing) {
        return containing;
      }
    }
    return null;
  }
  function findBilibiliPageRegions(targetVideo = document.querySelector("video")) {
    if (!targetVideo) {
      return null;
    }
    const video = findContainingElement(videoContainerSelectors, targetVideo) ?? targetVideo;
    const comments = commentContainerSelectors.map((selector) => document.querySelector(selector)).find((element) => element !== null);
    return comments ? { video, comments } : null;
  }
  function visibleRect(element) {
    const rect = element.getBoundingClientRect();
    const top = Math.max(0, Math.min(window.innerHeight, rect.top));
    const right = Math.max(0, Math.min(window.innerWidth, rect.right));
    const bottom = Math.max(0, Math.min(window.innerHeight, rect.bottom));
    const left = Math.max(0, Math.min(window.innerWidth, rect.left));
    if (right - left < 2 || bottom - top < 2) {
      return null;
    }
    return { top, right, bottom, left };
  }
  function mergeIntervals(intervals) {
    const sorted = intervals.filter(([start, end]) => end > start).sort((left, right) => left[0] - right[0]);
    const merged = [];
    for (const interval of sorted) {
      const previous = merged[merged.length - 1];
      if (!previous || interval[0] > previous[1]) {
        merged.push([...interval]);
      } else {
        previous[1] = Math.max(previous[1], interval[1]);
      }
    }
    return merged;
  }
  function createBlocker(container, left, top, width, height) {
    if (width < 1 || height < 1) {
      return;
    }
    const blocker = document.createElement("div");
    blocker.style.position = "absolute";
    blocker.style.left = `${left}px`;
    blocker.style.top = `${top}px`;
    blocker.style.width = `${width}px`;
    blocker.style.height = `${height}px`;
    blocker.style.background = takeoverBackground;
    blocker.style.pointerEvents = "auto";
    container.append(blocker);
  }
  function renderBlockers(container, holes) {
    container.replaceChildren();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const yEdges = Array.from(
      /* @__PURE__ */ new Set([0, height, ...holes.flatMap((rect) => [rect.top, rect.bottom])])
    ).sort((left, right) => left - right);
    for (let index = 0; index < yEdges.length - 1; index += 1) {
      const top = yEdges[index];
      const bottom = yEdges[index + 1];
      const intervals = mergeIntervals(
        holes.filter((rect) => rect.top < bottom && rect.bottom > top).map((rect) => [rect.left, rect.right])
      );
      let cursor = 0;
      for (const [left, right] of intervals) {
        createBlocker(container, cursor, top, left - cursor, bottom - top);
        cursor = Math.max(cursor, right);
      }
      createBlocker(container, cursor, top, width - cursor, bottom - top);
    }
  }
  function createPageTakeover(targetVideo, uiRoot) {
    const container = document.createElement("div");
    container.id = "bili-fitness-timer-takeover";
    container.setAttribute("aria-hidden", "true");
    Object.assign(container.style, {
      position: "fixed",
      inset: "0",
      zIndex: takeoverZIndex,
      pointerEvents: "none",
      display: "none"
    });
    document.body.append(container);
    let active = false;
    let destroyed = false;
    let frameId = null;
    const refreshNow = () => {
      frameId = null;
      if (!active || destroyed) {
        return;
      }
      const regions = findBilibiliPageRegions(targetVideo);
      if (!regions) {
        container.style.display = "none";
        container.replaceChildren();
        return;
      }
      const videoRect = visibleRect(regions.video);
      const commentsRect = visibleRect(regions.comments);
      const holes = [videoRect, commentsRect].filter((rect) => rect !== null);
      container.style.display = "block";
      renderBlockers(container, holes);
      if (uiRoot && videoRect) {
        uiRoot.style.setProperty("--bft-video-left", `${videoRect.left}px`);
        uiRoot.style.setProperty("--bft-video-top", `${videoRect.top}px`);
        uiRoot.style.setProperty("--bft-video-width", `${videoRect.right - videoRect.left}px`);
        uiRoot.style.setProperty("--bft-video-height", `${videoRect.bottom - videoRect.top}px`);
      }
    };
    const refresh = () => {
      if (frameId !== null || destroyed) {
        return;
      }
      frameId = window.requestAnimationFrame(refreshNow);
    };
    const observer = new MutationObserver((records) => {
      if (records.some((record) => !container.contains(record.target))) {
        refresh();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);
    return {
      setActive(nextActive) {
        active = nextActive;
        if (!active) {
          container.style.display = "none";
          container.replaceChildren();
          return;
        }
        refresh();
      },
      refresh,
      destroy() {
        if (destroyed) {
          return;
        }
        destroyed = true;
        observer.disconnect();
        window.removeEventListener("resize", refresh);
        window.removeEventListener("scroll", refresh, true);
        if (frameId !== null) {
          window.cancelAnimationFrame(frameId);
        }
        uiRoot == null ? void 0 : uiRoot.style.removeProperty("--bft-video-left");
        uiRoot == null ? void 0 : uiRoot.style.removeProperty("--bft-video-top");
        uiRoot == null ? void 0 : uiRoot.style.removeProperty("--bft-video-width");
        uiRoot == null ? void 0 : uiRoot.style.removeProperty("--bft-video-height");
        container.remove();
      }
    };
  }
  async function beep(durationSeconds) {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) {
      return;
    }
    const context = new AudioContextConstructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(1e-3, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(1e-3, context.currentTime + durationSeconds);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + durationSeconds);
    await new Promise((resolve) => {
      window.setTimeout(resolve, durationSeconds * 1e3 + 80);
    });
    await context.close();
  }
  const runtimeModes = /* @__PURE__ */ new Set([
    "idle",
    "exercise",
    "rest",
    "paused",
    "complete"
  ]);
  function getDefaultStorage() {
    if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) {
      return null;
    }
    try {
      return globalThis.localStorage;
    } catch {
      return null;
    }
  }
  function getDefaultNow() {
    return () => Date.now();
  }
  function getDefaultStorageId(bvid, storageId) {
    if (storageId) {
      return storageId;
    }
    if (bvid) {
      return bvid;
    }
    if (typeof globalThis !== "undefined" && "location" in globalThis) {
      return globalThis.location.pathname || "local";
    }
    return "local";
  }
  function getDefaultTitle() {
    if (typeof globalThis !== "undefined" && "document" in globalThis) {
      return globalThis.document.title || "子分组 1";
    }
    return "子分组 1";
  }
  function readPreviewLocked(storage) {
    if (!storage) {
      return true;
    }
    try {
      const parsed = JSON.parse(storage.getItem(defaultPreferencesStorageKey) ?? "null");
      return booleanPreference(parsed == null ? void 0 : parsed.previewLocked, true);
    } catch {
      return true;
    }
  }
  function readJsonFileFromPicker() {
    if (typeof document === "undefined" || !document.body) {
      return Promise.reject(new Error("当前环境不支持本地文件导入"));
    }
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json,.json";
      const cleanup = () => {
        input.remove();
      };
      const finish = (result) => {
        cleanup();
        resolve(result);
      };
      input.addEventListener("change", () => {
        var _a2;
        const file = (_a2 = input.files) == null ? void 0 : _a2[0];
        if (!file) {
          finish(null);
          return;
        }
        void file.text().then(finish).catch((error) => {
          cleanup();
          reject(error);
        });
      }, { once: true });
      input.addEventListener("cancel", () => finish(null), { once: true });
      input.style.display = "none";
      document.body.append(input);
      input.click();
    });
  }
  function downloadJsonFile(filename, contents) {
    if (typeof document === "undefined" || !document.body || typeof Blob === "undefined") {
      throw new Error("当前环境不支持 JSON 导出");
    }
    const urlApi = globalThis.URL;
    if (!urlApi || typeof urlApi.createObjectURL !== "function") {
      throw new Error("当前环境不支持 JSON 下载");
    }
    const blob = new Blob([contents], { type: "application/json;charset=utf-8" });
    const url = urlApi.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.append(link);
    link.click();
    link.remove();
    globalThis.setTimeout(() => urlApi.revokeObjectURL(url), 0);
  }
  function getDefaultJsonFetcher() {
    if (typeof globalThis.fetch !== "function") {
      return void 0;
    }
    return (url) => globalThis.fetch(url, { cache: "no-store" });
  }
  function importErrorMessage(error, fallback) {
    return error instanceof Error && error.message ? error.message : fallback;
  }
  function createGroupId() {
    if (typeof globalThis !== "undefined" && "crypto" in globalThis && typeof globalThis.crypto.randomUUID === "function") {
      return `group-${globalThis.crypto.randomUUID()}`;
    }
    return `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  function createEmptyGroup(bvid, title = "子分组 1", clock = Date.now) {
    const now = clock();
    return {
      id: createGroupId(),
      rawInput: "",
      settings: { ...defaultSettings },
      savedExercises: [],
      bvid,
      title,
      createdAt: now,
      updatedAt: now
    };
  }
  function normalizeRuntime(value) {
    if (!value || typeof value !== "object") {
      return null;
    }
    const candidate = value;
    if (!runtimeModes.has(candidate.mode) || candidate.beforePauseMode === "paused" || !runtimeModes.has(candidate.beforePauseMode) || !Number.isInteger(candidate.exerciseIndex) || !Number.isInteger(candidate.setIndex) || !Number.isFinite(candidate.restRemaining)) {
      return null;
    }
    return {
      mode: candidate.mode,
      exerciseIndex: Math.max(0, candidate.exerciseIndex),
      setIndex: Math.max(0, candidate.setIndex),
      restRemaining: Math.max(0, candidate.restRemaining),
      beforePauseMode: candidate.beforePauseMode
    };
  }
  function planFingerprint(exercises) {
    return JSON.stringify(
      exercises.map(({ id, name, start, end, sets, minReps, maxReps, restSeconds }) => ({
        id,
        name,
        start,
        end,
        sets,
        minReps,
        maxReps,
        restSeconds
      }))
    );
  }
  function isRecoverableRuntime(runtime) {
    return runtime.mode !== "idle" && runtime.mode !== "complete";
  }
  function isRuntimeSnapshotCompatible(snapshot, expected) {
    if (!snapshot || !isRecoverableRuntime(snapshot.runtime)) {
      return false;
    }
    const exercise = expected.exercises[snapshot.runtime.exerciseIndex];
    if (!exercise) {
      return false;
    }
    return snapshot.bvid === expected.bvid && snapshot.storageId === expected.storageId && snapshot.activeGroupId === expected.activeGroupId && snapshot.planFingerprint === planFingerprint(expected.exercises) && snapshot.runtime.setIndex < exercise.sets;
  }
  function readRuntimeSnapshot(storage, key = defaultRuntimeStorageKey) {
    if (!storage) {
      return null;
    }
    try {
      const parsed = JSON.parse(storage.getItem(key) ?? "null");
      const runtime = normalizeRuntime(parsed.runtime);
      if (parsed.schemaVersion !== 1 || typeof parsed.storageId !== "string" || typeof parsed.activeGroupId !== "string" || typeof parsed.planFingerprint !== "string" || typeof parsed.updatedAt !== "number" || !Number.isFinite(parsed.updatedAt) || !runtime) {
        return null;
      }
      return {
        schemaVersion: 1,
        bvid: typeof parsed.bvid === "string" ? normalizeBvid$1(parsed.bvid) : null,
        storageId: parsed.storageId,
        activeGroupId: parsed.activeGroupId,
        planFingerprint: parsed.planFingerprint,
        runtime,
        updatedAt: parsed.updatedAt
      };
    } catch {
      return null;
    }
  }
  function writeStorage(storage, key, value) {
    if (!storage) {
      return;
    }
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch {
    }
  }
  function readPlanLibrary(storage, storageKey, bvid, fallbackTitle, now) {
    const fallbackGroup = createEmptyGroup(bvid, fallbackTitle, now);
    const fallback = {
      schemaVersion: 2,
      bvid,
      activeGroupId: fallbackGroup.id,
      groups: [fallbackGroup],
      updatedAt: now()
    };
    if (!storage) {
      return fallback;
    }
    try {
      const saved = storage.getItem(storageKey);
      if (!saved) {
        writeStorage(storage, storageKey, fallback);
        return fallback;
      }
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed.groups)) {
        const migrated = createLibraryFromLegacy(parsed, fallbackTitle, bvid);
        writeStorage(storage, storageKey, migrated);
        return migrated;
      }
      const groups = parsed.groups.map((group, index) => normalizeStoredPlan(group, `子分组 ${index + 1}`, index, bvid)).filter((group) => group !== null);
      if (groups.length === 0) {
        writeStorage(storage, storageKey, fallback);
        return fallback;
      }
      const requestedActiveId = typeof parsed.activeGroupId === "string" ? parsed.activeGroupId : null;
      const activeGroupId = requestedActiveId && groups.some((group) => group.id === requestedActiveId) ? requestedActiveId : groups[0].id;
      const library = {
        schemaVersion: 2,
        bvid: typeof parsed.bvid === "string" ? normalizeBvid$1(parsed.bvid) ?? bvid : bvid,
        activeGroupId,
        groups,
        updatedAt: now()
      };
      writeStorage(storage, storageKey, library);
      return library;
    } catch {
      return fallback;
    }
  }
  function createWorkoutStore(options = {}) {
    var _a2, _b, _c;
    const bvid = options.bvid ? normalizeBvid$1(options.bvid) ?? options.bvid : null;
    const storage = options.storage === void 0 ? getDefaultStorage() : options.storage;
    const now = options.now ?? getDefaultNow();
    const storageId = getDefaultStorageId(bvid, options.storageId);
    const planKey = getPlanStorageKey(storageId);
    const runtimeKey = options.runtimeStorageKey ?? defaultRuntimeStorageKey;
    const timerSet = options.setInterval ?? ((handler, timeoutMs) => globalThis.setInterval(handler, timeoutMs));
    const timerClear = options.clearInterval ?? ((id) => globalThis.clearInterval(id));
    const beep$1 = options.beep ?? beep;
    const readJsonFile = ((_a2 = options.importExport) == null ? void 0 : _a2.readJsonFile) ?? readJsonFileFromPicker;
    const downloadJson = ((_b = options.importExport) == null ? void 0 : _b.downloadJson) ?? downloadJsonFile;
    const fetchJson = ((_c = options.importExport) == null ? void 0 : _c.fetchJson) ?? getDefaultJsonFetcher();
    const listeners = /* @__PURE__ */ new Set();
    let video = null;
    let restTimerId;
    let disposed = false;
    let importOperation = 0;
    const library = readPlanLibrary(storage, planKey, bvid, getDefaultTitle(), now);
    const activeGroup = library.groups.find((group) => group.id === library.activeGroupId) ?? library.groups[0];
    if (!activeGroup) {
      throw new Error("计划库缺少 active group");
    }
    const parsed = parsePlan(activeGroup.rawInput);
    const exercises = activeGroup.savedExercises.length > 0 ? activeGroup.savedExercises : parsed.exercises;
    let state = {
      bvid,
      storageId,
      library,
      activeGroup,
      activeGroupId: activeGroup.id,
      rawInput: activeGroup.rawInput,
      exercises,
      parseErrors: parsed.errors,
      settings: { ...activeGroup.settings },
      runtime: createIdleRuntime(0),
      selectedExerciseIndex: 0,
      previewLocked: readPreviewLocked(storage),
      currentVideoTime: 0,
      runtimeSnapshot: readRuntimeSnapshot(storage, runtimeKey),
      view: exercises.length > 0 ? "training" : "workbench",
      resetConfirmation: false,
      groupPage: Math.floor(Math.max(0, library.groups.findIndex((group) => group.id === activeGroup.id)) / 4) + 1,
      groupPageSize: 4,
      lastAction: null
    };
    const publish = () => {
      if (disposed) {
        return;
      }
      listeners.forEach((listener) => listener(state));
    };
    const saveLibrary = (nextGroup) => {
      const updatedAt = now();
      const nextGroups = state.library.groups.map(
        (group) => group.id === nextGroup.id ? nextGroup : group
      );
      const nextLibrary = {
        schemaVersion: 2,
        bvid,
        activeGroupId: nextGroup.id,
        groups: nextGroups,
        updatedAt
      };
      state = {
        ...state,
        library: nextLibrary,
        activeGroup: nextGroup,
        activeGroupId: nextGroup.id
      };
      writeStorage(storage, planKey, nextLibrary);
    };
    const groupPageFor = (groups, groupId) => {
      const index = groups.findIndex((group) => group.id === groupId);
      return Math.floor(Math.max(0, index) / state.groupPageSize) + 1;
    };
    const persistLibrary = (nextLibrary) => {
      state = {
        ...state,
        library: nextLibrary,
        groupPage: groupPageFor(nextLibrary.groups, nextLibrary.activeGroupId)
      };
      writeStorage(storage, planKey, nextLibrary);
    };
    const uniqueGroupTitle = (baseTitle, groups) => {
      const existingTitles = new Set(groups.map((group) => {
        var _a3;
        return (_a3 = group.title) == null ? void 0 : _a3.trim();
      }).filter(Boolean));
      const base = baseTitle.trim() || "子分组";
      if (!existingTitles.has(base)) {
        return base;
      }
      let suffix = 2;
      while (existingTitles.has(`${base} ${suffix}`)) {
        suffix += 1;
      }
      return `${base} ${suffix}`;
    };
    const activateGroup = (nextLibrary, nextGroup, actionLabel) => {
      const parsed2 = parsePlan(nextGroup.rawInput);
      const nextExercises = nextGroup.savedExercises.length > 0 ? nextGroup.savedExercises : parsed2.exercises;
      state = {
        ...state,
        library: nextLibrary,
        activeGroup: nextGroup,
        activeGroupId: nextGroup.id,
        rawInput: nextGroup.rawInput,
        exercises: nextExercises,
        parseErrors: parsed2.errors,
        settings: { ...nextGroup.settings },
        selectedExerciseIndex: 0,
        groupPage: groupPageFor(nextLibrary.groups, nextGroup.id),
        resetConfirmation: false
      };
      writeStorage(storage, planKey, nextLibrary);
      transition(resetRuntime(0));
      recordAction(actionLabel);
    };
    const persistRuntime = (runtime) => {
      const snapshot = {
        schemaVersion: 1,
        bvid,
        storageId,
        activeGroupId: state.activeGroupId,
        planFingerprint: planFingerprint(state.exercises),
        runtime,
        updatedAt: now()
      };
      writeStorage(storage, runtimeKey, snapshot);
      return snapshot;
    };
    const clearRuntimeSnapshot = () => {
      var _a3;
      try {
        (_a3 = storage == null ? void 0 : storage.removeItem) == null ? void 0 : _a3.call(storage, runtimeKey);
      } catch {
      }
      return null;
    };
    const clearRestTimer = () => {
      if (restTimerId !== void 0) {
        timerClear(restTimerId);
        restTimerId = void 0;
      }
    };
    const currentSegment = () => {
      if (state.runtime.mode !== "exercise") {
        return null;
      }
      const exercise = state.exercises[state.runtime.exerciseIndex];
      return exercise ? { start: exercise.start, end: exercise.end } : null;
    };
    const seekAndPlay = () => {
      const exercise = state.exercises[state.runtime.exerciseIndex];
      if (!video || !exercise) {
        return;
      }
      video.currentTime = exercise.start;
      try {
        void Promise.resolve(video.play()).catch(() => void 0);
      } catch {
      }
    };
    const syncVideo = (previous, next, beepOnExit) => {
      if (previous.mode === "rest" && next.mode !== "rest" && beepOnExit) {
        void Promise.resolve(beep$1(state.settings.beepDuration)).catch(() => void 0);
      }
      if (!video) {
        return;
      }
      if (next.mode === "rest" && state.settings.pauseDuringRest) {
        video.pause();
        return;
      }
      if (next.mode === "paused" || next.mode === "idle" || next.mode === "complete") {
        video.pause();
        return;
      }
      if (next.mode === "exercise" && (previous.mode !== "exercise" || previous.exerciseIndex !== next.exerciseIndex || previous.setIndex !== next.setIndex)) {
        seekAndPlay();
      }
    };
    const syncRestTimer = () => {
      if (state.runtime.mode !== "rest") {
        clearRestTimer();
        return;
      }
      if (restTimerId !== void 0) {
        return;
      }
      restTimerId = timerSet(() => {
        if (state.runtime.mode !== "rest") {
          clearRestTimer();
          return;
        }
        dispatch({ type: "tick-rest" });
      }, 1e3);
    };
    const transition = (nextRuntime, beepOnExit = false) => {
      const previous = state.runtime;
      const snapshot = isRecoverableRuntime(nextRuntime) ? persistRuntime(nextRuntime) : clearRuntimeSnapshot();
      state = {
        ...state,
        runtime: nextRuntime,
        runtimeSnapshot: snapshot,
        resetConfirmation: false
      };
      syncRestTimer();
      syncVideo(previous, nextRuntime, beepOnExit);
      publish();
    };
    const recordAction = (label) => {
      state = { ...state, lastAction: label };
      publish();
    };
    const setPlanInput = (rawInput) => {
      const result = parsePlan(rawInput);
      const nextExercises = result.errors.length === 0 ? result.exercises : state.exercises;
      const nextGroup = {
        ...state.activeGroup,
        rawInput,
        savedExercises: nextExercises,
        settings: { ...state.settings },
        bvid,
        updatedAt: now(),
        createdAt: state.activeGroup.createdAt ?? now()
      };
      state = {
        ...state,
        rawInput,
        exercises: nextExercises,
        parseErrors: result.errors,
        view: nextExercises.length === 0 ? "workbench" : state.view
      };
      saveLibrary(nextGroup);
      recordAction("set-plan-input");
    };
    const setSettings = (nextSettings) => {
      const settings = { ...state.settings, ...nextSettings };
      const nextGroup = { ...state.activeGroup, settings, updatedAt: now() };
      state = { ...state, settings };
      saveLibrary(nextGroup);
      recordAction("set-settings");
    };
    const setPlanInfo = (info) => {
      const nextGroup = {
        ...state.activeGroup,
        ...typeof info.title === "string" ? { title: info.title } : {},
        ...typeof info.author === "string" ? { author: info.author } : {},
        ...typeof info.notes === "string" ? { notes: info.notes } : {},
        updatedAt: now()
      };
      saveLibrary(nextGroup);
      recordAction("future:plan-info");
    };
    const insertTimestamp = (kind) => {
      const currentTime = Number.isFinite(video == null ? void 0 : video.currentTime) ? Math.max(0, (video == null ? void 0 : video.currentTime) ?? 0) : 0;
      const timestamp = formatTimestamp(currentTime);
      const line = kind === "start" ? `动作 ${timestamp}-` : `${timestamp} 3x8-12 rest45`;
      const rawInput = state.rawInput ? `${state.rawInput.trimEnd()}${kind === "start" ? "\n" : ""}${line}` : line;
      setPlanInput(rawInput);
      recordAction(`future:insert-${kind}`);
    };
    const setPreviewLocked = (locked) => {
      state = { ...state, previewLocked: locked };
      try {
        const saved = storage == null ? void 0 : storage.getItem(defaultPreferencesStorageKey);
        const parsed2 = saved ? JSON.parse(saved) : {};
        writeStorage(storage, defaultPreferencesStorageKey, {
          ...parsed2 && typeof parsed2 === "object" ? parsed2 : {},
          previewLocked: locked
        });
      } catch {
        writeStorage(storage, defaultPreferencesStorageKey, { previewLocked: locked });
      }
      recordAction(`future:preview-locked:${locked}`);
    };
    const requestRuntimeRecovery = () => {
      const snapshot = state.runtimeSnapshot;
      if (!snapshot || !isRuntimeSnapshotCompatible(snapshot, state)) {
        return null;
      }
      state = {
        ...state,
        selectedExerciseIndex: snapshot.runtime.exerciseIndex,
        view: "training"
      };
      transition(snapshot.runtime);
      recordAction("future:runtime-recovered");
      return snapshot;
    };
    const createImportedLibrary = (imported, fallbackTitle) => {
      const usedIds = /* @__PURE__ */ new Set();
      const importedBvid = imported.bvid ?? bvid;
      const groups = imported.groups.map((group, index) => {
        const parsed2 = parsePlan(group.rawInput);
        if (parsed2.errors.length > 0) {
          const label = group.title ?? `子分组 ${index + 1}`;
          throw new Error(`${label} 时间戳格式错误：${parsed2.errors[0]}`);
        }
        let id = group.id ?? "";
        while (!id || usedIds.has(id)) {
          id = createGroupId();
        }
        usedIds.add(id);
        const title = group.title ?? (imported.groups.length === 1 ? imported.title ?? fallbackTitle : `${fallbackTitle} ${index + 1}`);
        const importedGroup = normalizeStoredPlan(
          {
            id,
            rawInput: group.rawInput,
            settings: group.settings ?? state.settings,
            savedExercises: parsed2.exercises.length > 0 ? parsed2.exercises : group.exercises,
            bvid: importedBvid,
            title,
            author: group.author ?? imported.author ?? void 0,
            notes: group.notes ?? imported.notes ?? void 0,
            createdAt: now(),
            updatedAt: now()
          },
          title,
          index,
          bvid
        );
        if (!importedGroup) {
          throw new Error(`第 ${index + 1} 个子分组格式无效`);
        }
        return importedGroup;
      });
      const activeGroup2 = groups[0];
      if (!activeGroup2) {
        throw new Error("JSON 缺少子分组");
      }
      return {
        schemaVersion: 2,
        bvid: bvid ?? importedBvid,
        activeGroupId: activeGroup2.id,
        groups,
        updatedAt: now()
      };
    };
    const applyImportedLibrary = (nextLibrary, status) => {
      const nextActiveGroup = nextLibrary.groups.find((group) => group.id === nextLibrary.activeGroupId) ?? nextLibrary.groups[0];
      if (!nextActiveGroup) {
        throw new Error("JSON 缺少可用子分组");
      }
      const parsed2 = parsePlan(nextActiveGroup.rawInput);
      const nextExercises = nextActiveGroup.savedExercises.length > 0 ? nextActiveGroup.savedExercises : parsed2.exercises;
      state = {
        ...state,
        library: nextLibrary,
        activeGroup: nextActiveGroup,
        activeGroupId: nextActiveGroup.id,
        rawInput: nextActiveGroup.rawInput,
        exercises: nextExercises,
        parseErrors: parsed2.errors,
        settings: { ...nextActiveGroup.settings },
        selectedExerciseIndex: 0,
        view: nextExercises.length > 0 ? "training" : "workbench",
        resetConfirmation: false
      };
      writeStorage(storage, planKey, nextLibrary);
      transition(createIdleRuntime(0));
      recordAction(status);
    };
    const exportPlan = () => {
      try {
        const contents = JSON.stringify(state.library, null, 2);
        const safeId = (bvid ?? storageId).replace(/[^0-9A-Za-z_-]+/g, "-");
        const filename = `bili-fitness-timer-${safeId || "plan"}-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
        downloadJson(filename, contents);
        recordAction("已导出本地 JSON");
      } catch (error) {
        recordAction(`导出失败：${importErrorMessage(error, "当前环境不支持 JSON 导出")}`);
      }
    };
    const importPlan = async () => {
      const operation = ++importOperation;
      state = { ...state, lastAction: "正在选择本地 JSON" };
      publish();
      try {
        const contents = await readJsonFile();
        if (operation !== importOperation || disposed) {
          return;
        }
        if (contents === null) {
          recordAction("已取消本地导入");
          return;
        }
        const imported = normalizeImportedPlanData(JSON.parse(contents));
        const nextLibrary = createImportedLibrary(imported, "导入计划");
        applyImportedLibrary(nextLibrary, `已导入本地 JSON：${nextLibrary.groups.length} 个子分组`);
      } catch (error) {
        if (operation === importOperation && !disposed) {
          recordAction(`导入失败：${importErrorMessage(error, "请选择有效的 JSON 计划文件")}`);
        }
      }
    };
    const importOnlinePlan = async () => {
      const operation = ++importOperation;
      if (!bvid) {
        recordAction("在线导入失败：未识别到当前视频 BV 号");
        return;
      }
      if (!fetchJson) {
        recordAction("在线导入失败：当前环境不支持网络请求");
        return;
      }
      state = { ...state, lastAction: `正在在线导入 ${bvid}` };
      publish();
      try {
        const response = await fetchJson(getTimestampLibraryUrl(bvid));
        if (response.status === 404) {
          throw new Error("未找到该视频的在线时间戳");
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const imported = normalizeImportedPlanData(await response.json());
        if (imported.bvid && imported.bvid !== bvid) {
          throw new Error(`在线文件 BV 号不匹配：${imported.bvid}`);
        }
        const nextLibrary = createImportedLibrary(imported, getDefaultTitle());
        if (operation !== importOperation || disposed) {
          return;
        }
        applyImportedLibrary(nextLibrary, `已在线导入 ${bvid}：${nextLibrary.groups.length} 个子分组`);
      } catch (error) {
        if (operation === importOperation && !disposed) {
          recordAction(`在线导入失败：${importErrorMessage(error, "网络请求或 JSON 格式无效")}`);
        }
      }
    };
    const requestReset = () => {
      if (state.runtime.mode !== "idle" && state.runtime.mode !== "complete") {
        state = { ...state, resetConfirmation: true };
        publish();
        return;
      }
      transition(resetRuntime(state.selectedExerciseIndex));
    };
    const createGroup = () => {
      const title = uniqueGroupTitle(`子分组 ${state.library.groups.length + 1}`, state.library.groups);
      const group = createEmptyGroup(bvid, title, now);
      const nextLibrary = {
        ...state.library,
        activeGroupId: group.id,
        groups: [...state.library.groups, group],
        updatedAt: now()
      };
      activateGroup(nextLibrary, group, "future:create-group");
    };
    const duplicateActiveGroup = () => {
      var _a3;
      const source = state.activeGroup;
      const title = uniqueGroupTitle(`${((_a3 = source.title) == null ? void 0 : _a3.trim()) || "子分组"} 副本`, state.library.groups);
      const timestamp = now();
      const group = {
        ...source,
        id: createGroupId(),
        title,
        savedExercises: source.savedExercises.map((exercise) => ({ ...exercise })),
        settings: { ...source.settings },
        createdAt: timestamp,
        updatedAt: timestamp
      };
      const nextLibrary = {
        ...state.library,
        activeGroupId: group.id,
        groups: [...state.library.groups, group],
        updatedAt: timestamp
      };
      activateGroup(nextLibrary, group, "future:duplicate-group");
    };
    const switchGroup = (groupId) => {
      const target = state.library.groups.find((group) => group.id === groupId);
      if (!target) {
        recordAction(`future:switch-group-not-found:${groupId}`);
        return;
      }
      if (target.id === state.activeGroupId) {
        recordAction(`future:switch-group:${groupId}`);
        return;
      }
      const nextLibrary = {
        ...state.library,
        activeGroupId: target.id,
        updatedAt: now()
      };
      activateGroup(nextLibrary, target, `future:switch-group:${groupId}`);
    };
    const renameGroup = (groupId, title) => {
      const target = state.library.groups.find((group) => group.id === groupId);
      const nextTitle = title.trim();
      if (!target || !nextTitle) {
        recordAction(`future:rename-group-invalid:${groupId}`);
        return;
      }
      const nextGroup = { ...target, title: nextTitle, updatedAt: now() };
      const nextLibrary = {
        ...state.library,
        groups: state.library.groups.map((group) => group.id === groupId ? nextGroup : group),
        updatedAt: now()
      };
      if (groupId === state.activeGroupId) {
        state = { ...state, activeGroup: nextGroup };
      }
      persistLibrary(nextLibrary);
      recordAction(`future:rename-group:${groupId}`);
    };
    const deleteGroup = (groupId) => {
      if (state.library.groups.length <= 1) {
        recordAction("future:delete-group-blocked-last");
        return;
      }
      const targetIndex = state.library.groups.findIndex((group) => group.id === groupId);
      if (targetIndex < 0) {
        recordAction(`future:delete-group-not-found:${groupId}`);
        return;
      }
      const nextGroups = state.library.groups.filter((group) => group.id !== groupId);
      if (groupId !== state.activeGroupId) {
        persistLibrary({
          ...state.library,
          groups: nextGroups,
          updatedAt: now()
        });
        recordAction(`future:delete-group:${groupId}`);
        return;
      }
      const nextActive = nextGroups[Math.min(targetIndex, nextGroups.length - 1)];
      if (!nextActive) {
        recordAction("future:delete-group-blocked-last");
        return;
      }
      activateGroup(
        {
          ...state.library,
          activeGroupId: nextActive.id,
          groups: nextGroups,
          updatedAt: now()
        },
        nextActive,
        `future:delete-group:${groupId}`
      );
    };
    const future = {
      createGroup,
      duplicateActiveGroup,
      switchGroup,
      renameGroup,
      deleteGroup,
      importPlan,
      exportPlan,
      importOnlinePlan,
      setPlanInfo,
      insertTimestamp,
      setPreviewLocked,
      requestRuntimeRecovery
    };
    function dispatch(action) {
      if (disposed) {
        return;
      }
      switch (action.type) {
        case "start-training": {
          const selectedExerciseIndex = action.exerciseIndex ?? state.selectedExerciseIndex;
          state = { ...state, view: "training" };
          state = { ...state, selectedExerciseIndex };
          transition(startTraining(state.exercises, selectedExerciseIndex));
          return;
        }
        case "complete-set":
          transition(completeSet(state.exercises, state.runtime));
          return;
        case "tick-rest": {
          const next = tickRest(state.exercises, state.runtime);
          transition(next, state.runtime.mode === "rest" && next.mode !== "rest");
          return;
        }
        case "skip-rest":
          transition(skipRest(state.exercises, state.runtime));
          return;
        case "pause":
          transition(pauseRuntime(state.runtime));
          return;
        case "resume":
          transition(resumeRuntime(state.runtime));
          return;
        case "reset":
          requestReset();
          return;
        case "confirm-reset":
          transition(resetRuntime(state.selectedExerciseIndex));
          return;
        case "cancel-reset":
          state = { ...state, resetConfirmation: false };
          publish();
          return;
        case "switch-exercise":
          if (state.previewLocked && state.runtime.mode !== "idle" && state.runtime.mode !== "complete") {
            recordAction("switch-exercise-blocked-preview-locked");
            return;
          }
          if (!state.exercises[action.exerciseIndex]) {
            transition(switchToExercise(state.exercises, state.runtime, action.exerciseIndex));
            return;
          }
          state = { ...state, selectedExerciseIndex: action.exerciseIndex };
          transition(switchToExercise(state.exercises, state.runtime, action.exerciseIndex));
          return;
        case "set-plan-input":
          setPlanInput(action.rawInput);
          return;
        case "set-settings":
          setSettings(action.settings);
          return;
        case "set-view":
          state = { ...state, view: action.view, resetConfirmation: false };
          publish();
          return;
        case "set-group-page":
          state = {
            ...state,
            groupPage: Math.max(1, Math.min(Math.trunc(action.page), Math.ceil(state.library.groups.length / state.groupPageSize) || 1))
          };
          publish();
          return;
        case "future": {
          const futureAction = future[action.action];
          if (futureAction) {
            futureAction();
          }
          return;
        }
      }
    }
    const actions = {
      startTraining: (exerciseIndex) => dispatch({ type: "start-training", exerciseIndex }),
      completeSet: () => dispatch({ type: "complete-set" }),
      tickRest: () => dispatch({ type: "tick-rest" }),
      skipRest: () => dispatch({ type: "skip-rest" }),
      pause: () => dispatch({ type: "pause" }),
      resume: () => dispatch({ type: "resume" }),
      reset: () => dispatch({ type: "reset" }),
      confirmReset: () => dispatch({ type: "confirm-reset" }),
      cancelReset: () => dispatch({ type: "cancel-reset" }),
      switchToExercise: (exerciseIndex) => dispatch({ type: "switch-exercise", exerciseIndex }),
      setPlanInput: (rawInput) => dispatch({ type: "set-plan-input", rawInput }),
      setSettings: (next) => dispatch({ type: "set-settings", settings: next }),
      setView: (view) => dispatch({ type: "set-view", view }),
      setGroupPage: (page) => dispatch({ type: "set-group-page", page })
    };
    return {
      getState: () => state,
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      dispatch,
      attachVideo: (nextVideo) => {
        video = nextVideo;
        state = {
          ...state,
          currentVideoTime: Number.isFinite(nextVideo.currentTime) ? Math.max(0, nextVideo.currentTime) : 0
        };
        nextVideo.addEventListener("timeupdate", () => {
          const currentTime = Number.isFinite(nextVideo.currentTime) ? Math.max(0, nextVideo.currentTime) : 0;
          if (currentTime === state.currentVideoTime) {
            return;
          }
          state = { ...state, currentVideoTime: currentTime };
          publish();
        });
        bindVideoLoopGuard(nextVideo, currentSegment);
        if (state.runtime.mode === "exercise") {
          seekAndPlay();
        }
      },
      dispose: () => {
        disposed = true;
        importOperation += 1;
        clearRestTimer();
        listeners.clear();
        video = null;
      },
      actions,
      future
    };
  }
  function StatusHeader({
    status,
    title,
    statusLabel,
    statusNote,
    phase,
    groupName,
    currentSet,
    totalSets
  }) {
    return /* @__PURE__ */ u$1("header", { className: `status-header status-header--${status}`, children: [
      /* @__PURE__ */ u$1("div", { className: "status-header__line", children: [
        /* @__PURE__ */ u$1("span", { className: "panel-kicker", children: [
          "BILI FITNESS / ",
          phase
        ] }),
        /* @__PURE__ */ u$1("span", { className: "status-pill", children: [
          /* @__PURE__ */ u$1("span", { className: "status-pill__dot", "aria-hidden": "true" }),
          statusLabel
        ] })
      ] }),
      /* @__PURE__ */ u$1("div", { className: "status-header__copy", children: [
        /* @__PURE__ */ u$1("div", { children: [
          groupName && /* @__PURE__ */ u$1("p", { className: "status-header__group", children: groupName }),
          /* @__PURE__ */ u$1("h1", { children: title })
        ] }),
        typeof currentSet === "number" && typeof totalSets === "number" && totalSets > 0 && /* @__PURE__ */ u$1("strong", { className: "set-counter", children: [
          "第 ",
          currentSet,
          " / ",
          totalSets,
          " 组"
        ] }),
        /* @__PURE__ */ u$1("p", { children: statusNote })
      ] })
    ] });
  }
  function Metrics({ metrics }) {
    return /* @__PURE__ */ u$1("section", { className: "metric-grid", "aria-label": "训练指标", children: metrics.map((metric) => /* @__PURE__ */ u$1("div", { className: `metric metric--${metric.accent ?? "neutral"}`, children: [
      /* @__PURE__ */ u$1("span", { className: "metric__label", children: metric.label }),
      /* @__PURE__ */ u$1("strong", { className: "metric__value", children: metric.value }),
      /* @__PURE__ */ u$1("span", { className: "metric__detail", children: metric.detail })
    ] }, metric.label)) });
  }
  function PrimaryAction({ action, onAction }) {
    return /* @__PURE__ */ u$1("section", { className: "primary-action-block", "aria-label": "主要操作", children: [
      /* @__PURE__ */ u$1(
        "button",
        {
          className: "primary-action",
          type: "button",
          disabled: action.disabled,
          onClick: () => onAction == null ? void 0 : onAction(action),
          children: [
            /* @__PURE__ */ u$1("span", { children: action.label }),
            /* @__PURE__ */ u$1("span", { className: "primary-action__arrow", "aria-hidden": "true", children: "→" })
          ]
        }
      ),
      action.note && /* @__PURE__ */ u$1("p", { className: "primary-action__note", children: action.note })
    ] });
  }
  function SecondaryControlRow({ actions, onAction }) {
    if (actions.length === 0) return null;
    return /* @__PURE__ */ u$1("section", { className: "control-row", "aria-label": "次要控制", children: actions.map((action) => /* @__PURE__ */ u$1(
      "button",
      {
        className: `control-button control-button--${action.tone ?? "secondary"}`,
        type: "button",
        disabled: action.disabled,
        onClick: () => onAction == null ? void 0 : onAction(action),
        children: [
          /* @__PURE__ */ u$1("span", { children: action.label }),
          action.note && /* @__PURE__ */ u$1("small", { children: action.note })
        ]
      },
      action.id
    )) });
  }
  function SafetyActionZone({ safety, onAction }) {
    if (!safety) return null;
    return /* @__PURE__ */ u$1("aside", { className: `safety-zone${safety.confirm ? " safety-zone--confirm" : ""}`, children: [
      /* @__PURE__ */ u$1("div", { children: [
        /* @__PURE__ */ u$1("span", { className: "safety-zone__label", children: "安全操作" }),
        /* @__PURE__ */ u$1("strong", { children: safety.confirm ? "确认重置训练？" : safety.title }),
        /* @__PURE__ */ u$1("p", { children: safety.confirm ? "当前训练进度会回到未开始状态。" : safety.description })
      ] }),
      /* @__PURE__ */ u$1("div", { className: "safety-zone__actions", children: [
        /* @__PURE__ */ u$1(
          "button",
          {
            type: "button",
            className: "control-button control-button--danger",
            onClick: () => onAction == null ? void 0 : onAction(safety.confirm ? { id: "confirm-reset", label: "确认重置", tone: "danger" } : safety.action),
            children: safety.confirm ? "确认重置" : safety.action.label
          }
        ),
        safety.confirm && /* @__PURE__ */ u$1(
          "button",
          {
            type: "button",
            className: "control-button control-button--quiet",
            onClick: () => onAction == null ? void 0 : onAction({ id: "cancel-reset", label: "取消重置", tone: "quiet" }),
            children: "取消"
          }
        )
      ] })
    ] });
  }
  function PreviewList({ items, locked, onAction }) {
    return /* @__PURE__ */ u$1("section", { className: "content-section preview-queue", "aria-labelledby": "preview-title", children: [
      /* @__PURE__ */ u$1("div", { className: "section-heading", children: [
        /* @__PURE__ */ u$1("div", { children: [
          /* @__PURE__ */ u$1("span", { className: "panel-kicker", children: "EXERCISE QUEUE" }),
          /* @__PURE__ */ u$1("h2", { id: "preview-title", children: "动作队列" })
        ] }),
        /* @__PURE__ */ u$1("span", { className: "section-heading__count", children: locked ? "训练中已锁定" : "可切换" })
      ] }),
      items.length > 0 ? /* @__PURE__ */ u$1("div", { className: "preview-list", children: items.map((item, index) => {
        const selectable = !locked;
        const content = /* @__PURE__ */ u$1(S, { children: [
          /* @__PURE__ */ u$1("span", { className: "preview-item__index", children: String(index + 1).padStart(2, "0") }),
          /* @__PURE__ */ u$1("span", { className: "preview-item__body", children: [
            /* @__PURE__ */ u$1("strong", { children: item.name }),
            /* @__PURE__ */ u$1("small", { children: [
              item.sets,
              " · ",
              item.time
            ] })
          ] }),
          /* @__PURE__ */ u$1("span", { className: "preview-item__state", children: [
            item.status === "done" ? "完成" : item.status === "current" ? "当前" : "待训练",
            item.locked || locked ? " · 锁定" : ""
          ] })
        ] });
        return selectable ? /* @__PURE__ */ u$1(
          "button",
          {
            className: `preview-item preview-item--${item.status}`,
            type: "button",
            onClick: () => onAction == null ? void 0 : onAction({ id: `select-${item.id}`, label: `切换到${item.name}` }),
            children: content
          },
          item.id
        ) : /* @__PURE__ */ u$1("div", { className: `preview-item preview-item--${item.status}`, "aria-current": item.status === "current" ? "step" : void 0, children: content }, item.id);
      }) }) : /* @__PURE__ */ u$1("div", { className: "empty-state", children: [
        /* @__PURE__ */ u$1("strong", { children: "还没有动作" }),
        /* @__PURE__ */ u$1("span", { children: "打开工作台录入一行计划后，这里会出现动作队列。" })
      ] })
    ] });
  }
  function EntrySection({
    entry,
    readOnly = true,
    currentTimeLabel = "当前视频 08:24",
    onValueChange,
    onAction
  }) {
    const descriptionId = entry.error ? "entry-error" : "entry-helper";
    return /* @__PURE__ */ u$1("section", { className: "workbench-section entry-section", "aria-labelledby": "entry-title", children: [
      /* @__PURE__ */ u$1("div", { className: "section-heading", children: [
        /* @__PURE__ */ u$1("div", { children: [
          /* @__PURE__ */ u$1("span", { className: "panel-kicker", children: "PLAN INPUT" }),
          /* @__PURE__ */ u$1("h2", { id: "entry-title", children: "录入训练计划" })
        ] }),
        /* @__PURE__ */ u$1("span", { className: "section-heading__count", children: "实时解析" })
      ] }),
      /* @__PURE__ */ u$1("label", { className: "field-label", htmlFor: "plan-text", children: "动作、时间段、组数与休息" }),
      /* @__PURE__ */ u$1(
        "textarea",
        {
          id: "plan-text",
          className: `plan-textarea${entry.error ? " plan-textarea--error" : ""}`,
          value: entry.value,
          placeholder: entry.placeholder,
          readOnly,
          onInput: (event) => onValueChange == null ? void 0 : onValueChange(event.currentTarget.value),
          "aria-describedby": descriptionId
        }
      ),
      entry.error ? /* @__PURE__ */ u$1("div", { className: "entry-error", id: "entry-error", role: "alert", children: [
        /* @__PURE__ */ u$1("strong", { children: entry.error.title }),
        /* @__PURE__ */ u$1("p", { children: entry.error.message }),
        /* @__PURE__ */ u$1("span", { children: entry.error.hint })
      ] }) : /* @__PURE__ */ u$1("p", { className: "field-helper", id: "entry-helper", children: entry.helper }),
      /* @__PURE__ */ u$1("div", { className: "insert-row", "aria-label": "插入视频时间", children: [
        /* @__PURE__ */ u$1("span", { children: currentTimeLabel }),
        /* @__PURE__ */ u$1("button", { type: "button", className: "control-button", onClick: () => onAction == null ? void 0 : onAction({ id: "insert-start", label: "插入开始" }), children: "插入开始" }),
        /* @__PURE__ */ u$1("button", { type: "button", className: "control-button", onClick: () => onAction == null ? void 0 : onAction({ id: "insert-end", label: "插入结束" }), children: "插入结束" })
      ] })
    ] });
  }
  function GroupList({ groups, page, pageCount, pageSize, onPageChange, onAction }) {
    const start = (page - 1) * pageSize;
    const visibleGroups = groups.slice(start, start + pageSize);
    return /* @__PURE__ */ u$1("section", { className: "workbench-section", "aria-labelledby": "groups-title", children: [
      /* @__PURE__ */ u$1("div", { className: "section-heading", children: [
        /* @__PURE__ */ u$1("div", { children: [
          /* @__PURE__ */ u$1("span", { className: "panel-kicker", children: "GROUP LIBRARY" }),
          /* @__PURE__ */ u$1("h2", { id: "groups-title", children: "训练分组" })
        ] }),
        /* @__PURE__ */ u$1("span", { className: "section-heading__count", children: [
          groups.length,
          " 个版本"
        ] })
      ] }),
      /* @__PURE__ */ u$1("div", { className: "section-actions", children: [
        /* @__PURE__ */ u$1("button", { type: "button", className: "control-button control-button--secondary", onClick: () => onAction == null ? void 0 : onAction({ id: "new-group", label: "新建分组" }), children: "+ 新建" }),
        /* @__PURE__ */ u$1("button", { type: "button", className: "control-button control-button--quiet", onClick: () => onAction == null ? void 0 : onAction({ id: "copy-group", label: "复制当前分组" }), children: "复制当前" })
      ] }),
      /* @__PURE__ */ u$1("div", { className: "group-list", children: visibleGroups.length > 0 ? visibleGroups.map((group) => /* @__PURE__ */ u$1("div", { className: "group-item-row", children: [
        /* @__PURE__ */ u$1(
          "button",
          {
            className: `group-item${group.active ? " group-item--active" : ""}`,
            type: "button",
            onClick: () => onAction == null ? void 0 : onAction({ id: `switch-${group.id}`, label: `切换到${group.name}` }),
            children: [
              /* @__PURE__ */ u$1("span", { className: "group-item__marker", "aria-hidden": "true" }),
              /* @__PURE__ */ u$1("span", { className: "group-item__body", children: [
                /* @__PURE__ */ u$1("strong", { children: group.name }),
                /* @__PURE__ */ u$1("small", { children: group.meta })
              ] }),
              /* @__PURE__ */ u$1("span", { className: "group-item__progress", children: [
                /* @__PURE__ */ u$1("span", { children: group.progress }),
                group.locked && /* @__PURE__ */ u$1("small", { children: "已锁定" })
              ] }),
              /* @__PURE__ */ u$1("span", { className: "group-item__more", "aria-hidden": "true", children: "···" })
            ]
          }
        ),
        /* @__PURE__ */ u$1("div", { className: "group-item-actions", "aria-label": `${group.name} 操作`, children: [
          /* @__PURE__ */ u$1(
            "button",
            {
              type: "button",
              className: "group-item-action",
              "aria-label": `改名 ${group.name}`,
              title: "改名",
              onClick: () => onAction == null ? void 0 : onAction({ id: `rename-${group.id}`, label: `改名${group.name}` }),
              children: "改名"
            }
          ),
          /* @__PURE__ */ u$1(
            "button",
            {
              type: "button",
              className: "group-item-action group-item-action--danger",
              "aria-label": `删除 ${group.name}`,
              title: "删除",
              onClick: () => onAction == null ? void 0 : onAction({ id: `delete-${group.id}`, label: `删除${group.name}`, tone: "danger" }),
              children: "删除"
            }
          )
        ] })
      ] }, group.id)) : /* @__PURE__ */ u$1("div", { className: "empty-state", children: [
        /* @__PURE__ */ u$1("strong", { children: "还没有分组" }),
        /* @__PURE__ */ u$1("span", { children: "新建一套动作计划开始。" })
      ] }) }),
      /* @__PURE__ */ u$1(Pagination, { page, pageCount, onPageChange })
    ] });
  }
  function Pagination({ page, pageCount, onPageChange }) {
    return /* @__PURE__ */ u$1("div", { className: "pagination", "aria-label": "分组分页", children: [
      /* @__PURE__ */ u$1("button", { type: "button", className: "pagination__button", disabled: page <= 1, onClick: () => onPageChange == null ? void 0 : onPageChange(page - 1), children: "上一页" }),
      /* @__PURE__ */ u$1("span", { children: [
        "第 ",
        page,
        " / ",
        pageCount,
        " 页"
      ] }),
      /* @__PURE__ */ u$1("button", { type: "button", className: "pagination__button", disabled: page >= pageCount, onClick: () => onPageChange == null ? void 0 : onPageChange(page + 1), children: "下一页" })
    ] });
  }
  function PlanInfoSection({ info, readOnly = true, onChange }) {
    return /* @__PURE__ */ u$1("section", { className: "workbench-section", "aria-labelledby": "plan-info-title", children: [
      /* @__PURE__ */ u$1("div", { className: "section-heading", children: /* @__PURE__ */ u$1("div", { children: [
        /* @__PURE__ */ u$1("span", { className: "panel-kicker", children: "PLAN DETAILS" }),
        /* @__PURE__ */ u$1("h2", { id: "plan-info-title", children: "计划信息" })
      ] }) }),
      /* @__PURE__ */ u$1("div", { className: "form-grid", children: [
        /* @__PURE__ */ u$1("label", { children: [
          /* @__PURE__ */ u$1("span", { children: "标题" }),
          /* @__PURE__ */ u$1("input", { value: info.title, readOnly, onInput: (event) => onChange == null ? void 0 : onChange({ title: event.currentTarget.value }) })
        ] }),
        /* @__PURE__ */ u$1("label", { children: [
          /* @__PURE__ */ u$1("span", { children: "作者" }),
          /* @__PURE__ */ u$1("input", { value: info.author, readOnly, onInput: (event) => onChange == null ? void 0 : onChange({ author: event.currentTarget.value }) })
        ] }),
        /* @__PURE__ */ u$1("label", { className: "form-grid__wide", children: [
          /* @__PURE__ */ u$1("span", { children: "备注" }),
          /* @__PURE__ */ u$1("textarea", { value: info.notes, readOnly, rows: 3, onInput: (event) => onChange == null ? void 0 : onChange({ notes: event.currentTarget.value }) })
        ] })
      ] })
    ] });
  }
  function DataActionsSection({ data, onAction }) {
    return /* @__PURE__ */ u$1("section", { className: "workbench-section", "aria-labelledby": "data-title", children: [
      /* @__PURE__ */ u$1("div", { className: "section-heading", children: /* @__PURE__ */ u$1("div", { children: [
        /* @__PURE__ */ u$1("span", { className: "panel-kicker", children: "DATA" }),
        /* @__PURE__ */ u$1("h2", { id: "data-title", children: "数据" })
      ] }) }),
      /* @__PURE__ */ u$1("div", { className: "data-actions", children: [
        /* @__PURE__ */ u$1("button", { type: "button", className: "control-button", onClick: () => onAction == null ? void 0 : onAction({ id: "import", label: "导入计划" }), children: "导入" }),
        /* @__PURE__ */ u$1("button", { type: "button", className: "control-button", onClick: () => onAction == null ? void 0 : onAction({ id: "export", label: "导出计划" }), children: "导出" }),
        /* @__PURE__ */ u$1("button", { type: "button", className: "control-button control-button--secondary", onClick: () => onAction == null ? void 0 : onAction({ id: "online-import", label: data.onlineLabel }), children: data.onlineLabel })
      ] }),
      /* @__PURE__ */ u$1("p", { className: "field-helper", children: data.helper })
    ] });
  }
  function SettingsPanel({ settings, onBeepDurationChange, onAction }) {
    return /* @__PURE__ */ u$1("section", { className: "workbench-section", "aria-labelledby": "settings-title", children: [
      /* @__PURE__ */ u$1("div", { className: "section-heading", children: /* @__PURE__ */ u$1("div", { children: [
        /* @__PURE__ */ u$1("span", { className: "panel-kicker", children: "SESSION SETTINGS" }),
        /* @__PURE__ */ u$1("h2", { id: "settings-title", children: "设置" })
      ] }) }),
      /* @__PURE__ */ u$1("div", { className: "settings-list", children: [
        /* @__PURE__ */ u$1("label", { className: "setting-row", children: [
          /* @__PURE__ */ u$1("span", { children: [
            /* @__PURE__ */ u$1("strong", { children: "休息提示音时长" }),
            /* @__PURE__ */ u$1("small", { children: "倒计时结束时播放" })
          ] }),
          /* @__PURE__ */ u$1(
            "select",
            {
              value: settings.beepDuration,
              onChange: (event) => {
                const duration = Number(event.currentTarget.value);
                if (duration === 1 || duration === 2 || duration === 3 || duration === 5) {
                  onBeepDurationChange == null ? void 0 : onBeepDurationChange(duration);
                }
                onAction == null ? void 0 : onAction({ id: "beep-duration", label: "调整提示音时长" });
              },
              children: [1, 2, 3, 5].map((seconds) => /* @__PURE__ */ u$1("option", { value: seconds, children: [
                seconds,
                "s"
              ] }, seconds))
            }
          )
        ] }),
        /* @__PURE__ */ u$1("label", { className: "setting-row setting-row--toggle", children: [
          /* @__PURE__ */ u$1("span", { children: [
            /* @__PURE__ */ u$1("strong", { children: "锁定预览" }),
            /* @__PURE__ */ u$1("small", { children: settings.note })
          ] }),
          /* @__PURE__ */ u$1("input", { type: "checkbox", checked: settings.locked, onChange: () => onAction == null ? void 0 : onAction({ id: "toggle-preview-lock", label: "切换预览锁定" }) })
        ] })
      ] })
    ] });
  }
  function TrainingProgress({
    completedExercises,
    totalExercises,
    currentExercise
  }) {
    const progress = totalExercises > 0 ? Math.min(100, Math.max(0, completedExercises / totalExercises * 100)) : 0;
    return /* @__PURE__ */ u$1("section", { className: "training-progress", "data-testid": "training-progress", "aria-label": "整份训练进度", children: [
      /* @__PURE__ */ u$1("div", { className: "training-progress__copy", children: [
        /* @__PURE__ */ u$1("span", { children: "全局进度" }),
        /* @__PURE__ */ u$1("strong", { children: [
          "已完成 ",
          completedExercises,
          " / ",
          totalExercises,
          " 个动作"
        ] }),
        /* @__PURE__ */ u$1("small", { children: totalExercises > 0 ? `当前第 ${currentExercise} 项` : "暂无动作" })
      ] }),
      /* @__PURE__ */ u$1(
        "div",
        {
          className: "training-progress__track",
          role: "progressbar",
          "aria-valuemin": 0,
          "aria-valuemax": totalExercises,
          "aria-valuenow": completedExercises,
          children: /* @__PURE__ */ u$1("span", { style: { width: `${progress}%` } })
        }
      )
    ] });
  }
  function RuntimeRecoveryPrompt({
    exerciseName,
    currentExercise,
    totalExercises,
    currentSet,
    totalSets,
    onConfirm,
    onDismiss
  }) {
    return /* @__PURE__ */ u$1("div", { className: "runtime-recovery", "data-testid": "runtime-recovery", children: /* @__PURE__ */ u$1("section", { className: "runtime-recovery__dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "runtime-recovery-title", children: [
      /* @__PURE__ */ u$1("span", { className: "panel-kicker", children: "SESSION RECOVERY" }),
      /* @__PURE__ */ u$1("h2", { id: "runtime-recovery-title", children: "继续上次训练" }),
      /* @__PURE__ */ u$1("p", { children: [
        exerciseName,
        " · 第 ",
        currentSet,
        " / ",
        totalSets,
        " 组"
      ] }),
      /* @__PURE__ */ u$1("small", { children: [
        "动作 ",
        currentExercise,
        " / ",
        totalExercises
      ] }),
      /* @__PURE__ */ u$1("div", { className: "runtime-recovery__actions", children: [
        /* @__PURE__ */ u$1("button", { type: "button", className: "control-button control-button--quiet", onClick: onDismiss, children: "不继续" }),
        /* @__PURE__ */ u$1("button", { type: "button", className: "control-button control-button--secondary", onClick: onConfirm, children: "继续上次训练" })
      ] })
    ] }) });
  }
  function TrainingDeck({ data, trainingProgress, onAction }) {
    return /* @__PURE__ */ u$1("section", { className: `training-deck training-deck--${data.status}`, "data-testid": "training-deck", "data-status": data.status, children: [
      /* @__PURE__ */ u$1("div", { className: "training-deck__scrim", "aria-hidden": "true" }),
      data.status === "rest" && /* @__PURE__ */ u$1("div", { className: "training-deck__rest-overlay", "aria-hidden": "true", children: [
        /* @__PURE__ */ u$1("strong", { children: data.restRemaining }),
        /* @__PURE__ */ u$1("span", { children: "休息" })
      ] }),
      /* @__PURE__ */ u$1("div", { className: "training-deck__panel", children: [
        /* @__PURE__ */ u$1("div", { className: "training-deck__eyebrow", children: [
          /* @__PURE__ */ u$1("span", { children: "TRAINING DECK" }),
          /* @__PURE__ */ u$1("span", { children: "视频保留 · 其余已遮罩" })
        ] }),
        trainingProgress,
        /* @__PURE__ */ u$1(
          StatusHeader,
          {
            status: data.status,
            title: data.title,
            statusLabel: data.statusLabel,
            statusNote: data.statusNote,
            phase: data.phase,
            groupName: data.groupName,
            currentSet: data.currentSet,
            totalSets: data.totalSets
          }
        ),
        /* @__PURE__ */ u$1(Metrics, { metrics: data.metrics }),
        /* @__PURE__ */ u$1(PrimaryAction, { action: data.primaryAction, onAction }),
        /* @__PURE__ */ u$1(SecondaryControlRow, { actions: data.secondaryActions, onAction }),
        /* @__PURE__ */ u$1(PreviewList, { items: data.previewItems, locked: data.lockedPreview, onAction }),
        /* @__PURE__ */ u$1(SafetyActionZone, { safety: data.safety, onAction })
      ] })
    ] });
  }
  function PlanWorkbench({
    data,
    readOnlyEntry = true,
    currentTimeLabel,
    onPlanInputChange,
    onPlanInfoChange,
    onBeepDurationChange,
    onAction
  }) {
    return /* @__PURE__ */ u$1("section", { className: "plan-workbench", "data-testid": "plan-workbench", children: [
      /* @__PURE__ */ u$1("div", { className: "plan-workbench__veil", "aria-hidden": "true" }),
      /* @__PURE__ */ u$1("aside", { className: "plan-workbench__drawer", children: [
        /* @__PURE__ */ u$1("header", { className: "drawer-header", children: [
          /* @__PURE__ */ u$1("div", { children: [
            /* @__PURE__ */ u$1("span", { className: "panel-kicker", children: "PLAN WORKBENCH" }),
            /* @__PURE__ */ u$1("h1", { children: "准备训练" }),
            /* @__PURE__ */ u$1("p", { children: data.groupName })
          ] }),
          /* @__PURE__ */ u$1("button", { type: "button", className: "icon-button", "aria-label": "收起工作台", onClick: () => onAction == null ? void 0 : onAction({ id: "close-workbench", label: "收起工作台" }), children: "×" })
        ] }),
        /* @__PURE__ */ u$1("div", { className: "drawer-scroll", children: [
          /* @__PURE__ */ u$1("div", { className: "drawer-start", children: /* @__PURE__ */ u$1(PrimaryAction, { action: { id: "start-training", label: "开始训练", note: "关闭工作台并进入训练舱", tone: "primary" }, onAction }) }),
          /* @__PURE__ */ u$1(
            EntrySection,
            {
              entry: data.entry,
              readOnly: readOnlyEntry,
              currentTimeLabel,
              onValueChange: onPlanInputChange,
              onAction
            }
          ),
          /* @__PURE__ */ u$1(GroupList, { groups: data.groups, page: data.groupPage, pageCount: data.groupPageCount, pageSize: data.groupPageSize, onPageChange: (page) => onAction == null ? void 0 : onAction({ id: `group-page-${page}`, label: `查看第 ${page} 页` }), onAction }),
          /* @__PURE__ */ u$1(PlanInfoSection, { info: data.planInfo, readOnly: readOnlyEntry, onChange: onPlanInfoChange }),
          /* @__PURE__ */ u$1(DataActionsSection, { data: data.dataActions, onAction }),
          /* @__PURE__ */ u$1(
            SettingsPanel,
            {
              settings: data.settings,
              onBeepDurationChange,
              onAction
            }
          )
        ] })
      ] })
    ] });
  }
  function DockBar({ view, groupName, onViewChange, onAction }) {
    return /* @__PURE__ */ u$1("nav", { className: "dock-bar", "data-testid": "dock-bar", "aria-label": "常驻控制条", children: [
      /* @__PURE__ */ u$1("div", { className: "dock-bar__brand", children: [
        /* @__PURE__ */ u$1("strong", { children: "BF" }),
        /* @__PURE__ */ u$1("span", { children: [
          "· ",
          groupName
        ] })
      ] }),
      /* @__PURE__ */ u$1("div", { className: "dock-bar__actions", children: [
        /* @__PURE__ */ u$1("button", { type: "button", className: view === "workbench" ? "dock-button dock-button--active" : "dock-button", onClick: () => onViewChange == null ? void 0 : onViewChange(view === "workbench" ? "dock" : "workbench"), children: "工作台" }),
        /* @__PURE__ */ u$1("button", { type: "button", className: view === "training" ? "dock-button dock-button--active" : "dock-button", onClick: () => onViewChange == null ? void 0 : onViewChange(view === "training" ? "dock" : "training"), children: view === "training" ? "训练中" : "训练舱" }),
        view === "dock" && /* @__PURE__ */ u$1("button", { type: "button", className: "dock-button dock-button--accent", onClick: () => onAction == null ? void 0 : onAction({ id: "open-workbench", label: "打开工作台" }), children: "打开" })
      ] })
    ] });
  }
  function App({
    data,
    view = "training",
    connected = false,
    slots,
    onViewChange,
    onAction,
    onGroupPageChange,
    onPlanInputChange,
    onPlanInfoChange,
    onBeepDurationChange
  }) {
    const handleAction = (action) => {
      if (action.id.startsWith("group-page-")) {
        onGroupPageChange == null ? void 0 : onGroupPageChange(Number(action.id.replace("group-page-", "")));
      }
      onAction == null ? void 0 : onAction(action.id);
    };
    return /* @__PURE__ */ u$1(
      "div",
      {
        className: `ui-shell ui-shell--${view}${connected ? " ui-shell--connected" : ""}`,
        "data-testid": "ui-shell",
        "data-view": view,
        children: [
          slots == null ? void 0 : slots.runtimeRecovery,
          view === "training" && /* @__PURE__ */ u$1(TrainingDeck, { data, trainingProgress: slots == null ? void 0 : slots.trainingProgress, onAction: handleAction }),
          view === "workbench" && /* @__PURE__ */ u$1(
            PlanWorkbench,
            {
              data,
              readOnlyEntry: !connected,
              currentTimeLabel: data.currentTimeLabel,
              onPlanInputChange,
              onPlanInfoChange,
              onBeepDurationChange,
              onAction: handleAction
            }
          ),
          /* @__PURE__ */ u$1(DockBar, { view, groupName: data.groupName, onViewChange, onAction: handleAction })
        ]
      }
    );
  }
  function formatRest(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safe / 60);
    return `${String(minutes).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }
  function getExerciseCount(group) {
    if (group.savedExercises.length > 0) {
      return group.savedExercises.length;
    }
    return parsePlan(group.rawInput).exercises.length;
  }
  function getCompletedExerciseCount(state) {
    const total = state.exercises.length;
    if (total === 0 || state.runtime.mode === "idle") {
      return 0;
    }
    if (state.runtime.mode === "complete") {
      return total;
    }
    const currentExercise = state.exercises[state.runtime.exerciseIndex];
    const completedBeforeCurrent = Math.min(state.runtime.exerciseIndex, total);
    const mode = state.runtime.mode === "paused" ? state.runtime.beforePauseMode : state.runtime.mode;
    const currentIsComplete = mode === "rest" && currentExercise ? state.runtime.setIndex + 1 >= currentExercise.sets : false;
    return Math.min(total, completedBeforeCurrent + (currentIsComplete ? 1 : 0));
  }
  function createConnectedData(state) {
    const currentExercise = state.exercises[state.runtime.exerciseIndex];
    const status = state.runtime.mode;
    const currentSet = currentExercise ? Math.min(state.runtime.setIndex + 1, currentExercise.sets) : 0;
    const totalSets = (currentExercise == null ? void 0 : currentExercise.sets) ?? 0;
    const currentName = (currentExercise == null ? void 0 : currentExercise.name) ?? (state.exercises.length > 0 ? "当前动作" : "还没有训练计划");
    const statusCopy = {
      idle: {
        label: state.exercises.length > 0 ? "准备开始" : "等待录入",
        note: state.exercises.length > 0 ? "从指定动作开始，视频会循环播放动作片段。" : "打开工作台录入动作，训练舱会在这里显示队列。",
        phase: "READY"
      },
      exercise: { label: "训练中", note: "保持节奏，完成这一组后进入休息。", phase: "EXERCISE" },
      rest: { label: "休息中", note: "倒计时结束后自动进入下一组或下一动作。", phase: "REST" },
      paused: { label: "已暂停", note: "训练状态与视频位置都已保留。", phase: "PAUSED" },
      complete: { label: "已完成", note: "全部动作与组次已经完成。", phase: "COMPLETE" }
    };
    const copy = statusCopy[status];
    const totalSetsInPlan = state.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
    const completedSets = state.runtime.mode === "complete" ? totalSetsInPlan : state.exercises.slice(0, state.runtime.exerciseIndex).reduce((sum, exercise) => sum + exercise.sets, 0) + state.runtime.setIndex;
    const previewItems = state.exercises.map((exercise, index) => ({
      id: exercise.id,
      name: exercise.name,
      time: `${formatTimestamp(exercise.start)} — ${formatTimestamp(exercise.end)}`,
      sets: `${exercise.sets} 组`,
      status: state.runtime.mode === "complete" || index < state.runtime.exerciseIndex ? "done" : index === state.runtime.exerciseIndex ? "current" : "upcoming",
      locked: state.previewLocked && status !== "idle" && status !== "complete"
    }));
    const lockedPreview = state.previewLocked && status !== "idle" && status !== "complete";
    return {
      scenarioId: `connected-${status}`,
      status,
      groupName: state.activeGroup.title ?? "当前分组",
      title: status === "complete" ? "训练完成" : currentName,
      statusLabel: copy.label,
      statusNote: copy.note,
      phase: copy.phase,
      currentSet,
      totalSets,
      currentExercise: state.exercises.length > 0 ? state.runtime.exerciseIndex + 1 : 0,
      totalExercises: state.exercises.length,
      restRemaining: formatRest(state.runtime.restRemaining),
      currentTimeLabel: `当前视频 ${formatTimestamp(state.currentVideoTime)}`,
      metrics: [
        { label: "当前动作", value: state.exercises.length > 0 ? `${state.runtime.exerciseIndex + 1} / ${state.exercises.length}` : "0", detail: currentName, accent: "teal" },
        { label: "组次", value: totalSets > 0 ? `${currentSet} / ${totalSets}` : "—", detail: status === "rest" ? "倒计时中" : status === "complete" ? "全部完成" : "当前动作", accent: "pink" },
        { label: "总进度", value: totalSetsInPlan > 0 ? `${completedSets} / ${totalSetsInPlan}` : "—", detail: "整套计划", accent: "amber" }
      ],
      primaryAction: status === "idle" ? { id: "start-training", label: state.exercises.length > 0 ? "开始训练" : "先录入动作", note: state.exercises.length > 0 ? `从${currentName}第 1 组开始` : "打开工作台填写计划", tone: "primary", disabled: state.exercises.length === 0 } : status === "exercise" ? { id: "complete-set", label: "完成本组", note: `完成后进入 ${(currentExercise == null ? void 0 : currentExercise.restSeconds) ?? 0} 秒休息`, tone: "primary" } : status === "rest" ? { id: "resting", label: `休息 ${state.runtime.restRemaining}s`, note: "倒计时结束后自动继续", tone: "primary", disabled: true } : status === "paused" ? { id: "resume", label: "继续", note: "回到暂停前的训练状态", tone: "primary" } : { id: "completed", label: "训练已完成", note: "可以重置后再次开始", tone: "primary", disabled: true },
      secondaryActions: status === "exercise" ? [{ id: "pause", label: "暂停", note: "保留当前进度", tone: "secondary" }] : status === "rest" ? [{ id: "pause-rest", label: "暂停", note: "暂停倒计时", tone: "quiet" }, { id: "skip-rest", label: "跳过休息", note: "立即进入下一组", tone: "secondary" }] : status === "paused" ? [{ id: "open-workbench", label: "打开工作台", note: "训练状态不会清除", tone: "quiet" }] : [],
      safety: state.exercises.length > 0 ? { title: "重置训练", description: "训练中点击后需要再次确认。", action: { id: "reset", label: "重置训练", tone: "danger" }, confirm: state.resetConfirmation } : void 0,
      previewItems,
      entry: {
        value: state.rawInput,
        placeholder: "例如：深蹲 00:12-00:40 3x12 rest45",
        helper: state.parseErrors.length === 0 ? `已解析 ${state.exercises.length} 个动作。每行包含时间段与组数次数。` : "每行一个动作；时间段和组数次数为必填。",
        error: state.parseErrors[0] ? { title: "计划解析有误", message: state.parseErrors[0], hint: "修正后会自动更新动作队列。" } : void 0
      },
      groups: state.library.groups.map((group) => ({
        id: group.id,
        name: group.title ?? "未命名分组",
        meta: `${getExerciseCount(group)} 个动作`,
        progress: `${getExerciseCount(group)} 个动作`,
        active: group.id === state.activeGroupId,
        locked: status !== "idle"
      })),
      groupPage: state.groupPage,
      groupPageCount: Math.max(1, Math.ceil(state.library.groups.length / state.groupPageSize)),
      groupPageSize: state.groupPageSize,
      planInfo: {
        title: state.activeGroup.title ?? "",
        author: state.activeGroup.author ?? "",
        notes: state.activeGroup.notes ?? ""
      },
      dataActions: { helper: "本地 JSON 与旧版单计划格式兼容；在线导入按当前 BV 查询。", onlineLabel: "在线导入" },
      settings: {
        beepDuration: state.settings.beepDuration === 1 || state.settings.beepDuration === 3 || state.settings.beepDuration === 5 ? state.settings.beepDuration : 2,
        locked: state.previewLocked,
        note: state.previewLocked ? "训练中不可切换动作" : "训练中允许切换动作"
      },
      lockedPreview,
      lastActionLabel: state.lastAction ?? void 0,
      tabCounts: { entry: String(state.exercises.length), groups: String(state.library.groups.length), preview: String(state.exercises.length), settings: "2" }
    };
  }
  function ConnectedApp({ store, slots }) {
    const [state, setState] = d(store.getState());
    const [recoveryCandidate, setRecoveryCandidate] = d(() => {
      const initialState = store.getState();
      return isRuntimeSnapshotCompatible(initialState.runtimeSnapshot, initialState) ? initialState.runtimeSnapshot : null;
    });
    h(() => {
      setState(store.getState());
      const initialState = store.getState();
      setRecoveryCandidate(
        isRuntimeSnapshotCompatible(initialState.runtimeSnapshot, initialState) ? initialState.runtimeSnapshot : null
      );
      return store.subscribe(setState);
    }, [store]);
    const data = T(() => createConnectedData(state), [state]);
    const recoveryExercise = recoveryCandidate ? state.exercises[recoveryCandidate.runtime.exerciseIndex] : void 0;
    const recoveryProgress = recoveryCandidate && recoveryExercise ? {
      exerciseName: recoveryExercise.name,
      currentExercise: recoveryCandidate.runtime.exerciseIndex + 1,
      totalExercises: state.exercises.length,
      currentSet: Math.min(recoveryCandidate.runtime.setIndex + 1, recoveryExercise.sets),
      totalSets: recoveryExercise.sets
    } : null;
    const handleAction = (actionId) => {
      if (actionId === "start-training" || actionId === "start") store.actions.startTraining();
      else if (actionId === "complete-set") store.actions.completeSet();
      else if (actionId === "pause" || actionId === "pause-rest") store.actions.pause();
      else if (actionId === "resume") store.actions.resume();
      else if (actionId === "skip-rest") store.actions.skipRest();
      else if (actionId === "reset") store.actions.reset();
      else if (actionId === "confirm-reset") store.actions.confirmReset();
      else if (actionId === "cancel-reset") store.actions.cancelReset();
      else if (actionId === "open-workbench") store.actions.setView("workbench");
      else if (actionId === "close-workbench") store.actions.setView("dock");
      else if (actionId === "insert-start" || actionId === "insert-end") store.future.insertTimestamp(actionId === "insert-start" ? "start" : "end");
      else if (actionId === "import") store.future.importPlan();
      else if (actionId === "export") store.future.exportPlan();
      else if (actionId === "online-import") store.future.importOnlinePlan();
      else if (actionId.startsWith("select-")) {
        const id = actionId.slice("select-".length);
        const index = state.exercises.findIndex((exercise) => exercise.id === id);
        if (index >= 0) store.actions.switchToExercise(index);
      } else if (actionId.startsWith("switch-")) {
        store.future.switchGroup(actionId.slice("switch-".length));
      } else if (actionId === "new-group") store.future.createGroup();
      else if (actionId === "copy-group") store.future.duplicateActiveGroup();
      else if (actionId.startsWith("rename-")) {
        const id = actionId.slice("rename-".length);
        const group = state.library.groups.find((item) => item.id === id);
        if (group && typeof globalThis.prompt === "function") {
          const title = globalThis.prompt("请输入分组名称", group.title ?? "");
          if (title !== null) store.future.renameGroup(id, title);
        }
      } else if (actionId.startsWith("delete-")) {
        const id = actionId.slice("delete-".length);
        const group = state.library.groups.find((item) => item.id === id);
        if (group && (typeof globalThis.confirm !== "function" || globalThis.confirm(`确定删除“${group.title ?? "未命名分组"}”吗？`))) {
          store.future.deleteGroup(id);
        }
      } else if (actionId === "toggle-preview-lock") store.future.setPreviewLocked(!data.settings.locked);
    };
    const connectedSlots = {
      trainingProgress: /* @__PURE__ */ u$1(S, { children: [
        slots == null ? void 0 : slots.trainingProgress,
        /* @__PURE__ */ u$1(
          TrainingProgress,
          {
            completedExercises: getCompletedExerciseCount(state),
            totalExercises: state.exercises.length,
            currentExercise: state.exercises.length > 0 ? Math.min(state.runtime.exerciseIndex + 1, state.exercises.length) : 0
          }
        )
      ] }),
      runtimeRecovery: /* @__PURE__ */ u$1(S, { children: [
        slots == null ? void 0 : slots.runtimeRecovery,
        recoveryProgress && /* @__PURE__ */ u$1(
          RuntimeRecoveryPrompt,
          {
            ...recoveryProgress,
            onConfirm: () => {
              if (store.future.requestRuntimeRecovery()) {
                setRecoveryCandidate(null);
              }
            },
            onDismiss: () => {
              setRecoveryCandidate(null);
              store.actions.reset();
            }
          }
        )
      ] })
    };
    return /* @__PURE__ */ u$1(
      App,
      {
        data,
        view: state.view,
        connected: true,
        slots: connectedSlots,
        onViewChange: (view) => store.actions.setView(view),
        onAction: handleAction,
        onGroupPageChange: (page) => store.actions.setGroupPage(page),
        onPlanInputChange: (value) => store.actions.setPlanInput(value),
        onPlanInfoChange: (info) => store.future.setPlanInfo(info),
        onBeepDurationChange: (duration) => store.actions.setSettings({ beepDuration: duration })
      }
    );
  }
  const rootId = "bili-fitness-timer-v2-root";
  const styleId = "bili-fitness-timer-v2-style";
  const teardownKey = "__biliFitnessTimerV2Teardown__";
  let activeMount = null;
  let navigationGeneration = 0;
  let stopNavigationWatcher = null;
  function injectStyles() {
    if (document.getElementById(styleId)) {
      return;
    }
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = uiStyles;
    document.head.append(style);
  }
  function createRoot(bvid) {
    var _a2;
    (_a2 = document.getElementById(rootId)) == null ? void 0 : _a2.remove();
    const root = document.createElement("div");
    root.id = rootId;
    root.dataset.bvid = bvid;
    Object.assign(root.style, {
      position: "fixed",
      inset: "0",
      width: "100vw",
      height: "100dvh",
      zIndex: "2147483647",
      pointerEvents: "none",
      isolation: "isolate"
    });
    document.body.append(root);
    return root;
  }
  function teardownMount() {
    var _a2;
    const mount = activeMount;
    activeMount = null;
    if (!mount) {
      (_a2 = document.getElementById(rootId)) == null ? void 0 : _a2.remove();
      return;
    }
    mount.unsubscribe();
    mount.takeover.destroy();
    mount.store.dispose();
    R(null, mount.root);
    mount.root.remove();
  }
  async function mountForBvid(bvid) {
    const generation = ++navigationGeneration;
    teardownMount();
    if (!bvid) {
      return;
    }
    const video = await waitForVideo();
    if (generation !== navigationGeneration || !video || extractBvidFromUrl(window.location.href) !== bvid) {
      return;
    }
    injectStyles();
    const root = createRoot(bvid);
    const store = createWorkoutStore({ bvid, storageId: bvid });
    store.attachVideo(video);
    R(k$1(ConnectedApp, { store }), root);
    const takeover = createPageTakeover(video, root);
    const syncTakeover = () => {
      takeover.setActive(store.getState().view === "training");
    };
    const unsubscribe = store.subscribe(syncTakeover);
    syncTakeover();
    if (generation !== navigationGeneration) {
      unsubscribe();
      takeover.destroy();
      store.dispose();
      R(null, root);
      root.remove();
      return;
    }
    activeMount = { store, takeover, unsubscribe, root };
  }
  function stopRuntime() {
    navigationGeneration += 1;
    stopNavigationWatcher == null ? void 0 : stopNavigationWatcher();
    stopNavigationWatcher = null;
    teardownMount();
  }
  const runtimeWindow = window;
  (_a = runtimeWindow[teardownKey]) == null ? void 0 : _a.call(runtimeWindow);
  runtimeWindow[teardownKey] = stopRuntime;
  void mountForBvid(extractBvidFromUrl(window.location.href));
  stopNavigationWatcher = watchBvidChanges(({ bvid }) => {
    void mountForBvid(bvid);
  });
})();
