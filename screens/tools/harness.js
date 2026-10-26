// Minimal renderer for the screens' .dc.html format: x-import, {{holes}}, sc-for, sc-if, helmet.
window.__renderDC = function (src) {
  var doc = new DOMParser().parseFromString(src, 'text/html');
  var xdc = doc.querySelector('x-dc');
  var helmet = xdc.querySelector('helmet');
  if (helmet) { helmet.querySelectorAll('style').forEach(function (s) { var st = document.createElement('style'); st.textContent = s.textContent; document.head.appendChild(st); }); helmet.remove(); }
  var code = (doc.querySelector('script[data-dc-script]') || {}).textContent || 'class Component extends DCLogic { renderVals(){ return {}; } }';
  window.DCLogic = function () { this.props = {}; this.state = {}; }; DCLogic.prototype.setState = function () {};
  var Comp = new Function(code + '\nreturn Component;')();
  var vals = new Comp().renderVals() || {};
  function get(path, scope) { var parts = path.trim().split('.'); var cur = (parts[0] in scope) ? scope : vals; for (var i = 0; i < parts.length; i++) { if (cur == null) return undefined; cur = cur[parts[i]]; } return cur; }
  var WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/, ANY = /\{\{\s*([^}]+?)\s*\}\}/g;
  function interp(s, scope) { return s.replace(ANY, function (_, p) { var v = get(p, scope); return v == null ? '' : String(v); }); }
  function val(s, scope) { var m = s.match(WHOLE); if (m) { var p = m[1]; if (/^(true|false)$/.test(p)) return p === 'true'; if (/^-?\d+(\.\d+)?$/.test(p)) return +p; return get(p, scope); } return interp(s, scope); }
  var camel = function (k) { return k.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); };
  var mounts = [];
  function walk(node, scope) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) { if (n.nodeValue.indexOf('{{') >= 0) n.nodeValue = interp(n.nodeValue, scope); return; }
      if (n.nodeType !== 1) return;
      var tag = n.tagName.toLowerCase();
      if (tag === 'sc-for') {
        var list = val(n.getAttribute('list') || '', scope) || [], as = n.getAttribute('as') || 'item', frag = document.createDocumentFragment();
        list.forEach(function (it, i) { var c = n.cloneNode(true); var sc = Object.assign({}, scope); sc[as] = it; sc.$index = i; walk(c, sc); while (c.firstChild) frag.appendChild(c.firstChild); });
        n.replaceWith(frag); return;
      }
      if (tag === 'sc-if') { var ok = val(n.getAttribute('value') || '', scope); if (!ok) { n.remove(); return; } walk(n, scope); var f = document.createDocumentFragment(); while (n.firstChild) f.appendChild(n.firstChild); n.replaceWith(f); return; }
      if (tag === 'x-import') {
        var path = n.getAttribute('component-from-global-scope'), props = {}, style = n.getAttribute('style');
        Array.prototype.slice.call(n.attributes).forEach(function (a) { if (a.name === 'component-from-global-scope' || a.name === 'style') return; props[camel(a.name)] = val(a.value, scope); });
        walk(n, scope);
        var inner = n.innerHTML.trim();
        var slot = document.createElement('span'); slot.setAttribute('data-x-import', path);
        if (style) slot.setAttribute('style', 'display: contents; ' + style); else slot.style.display = 'contents';
        n.replaceWith(slot); mounts.push([slot, path, props, inner]); return;
      }
      Array.prototype.slice.call(n.attributes).forEach(function (a) { if (a.value.indexOf('{{') >= 0) n.setAttribute(a.name, interp(a.value, scope)); });
      walk(n, scope);
    });
  }
  var root = document.createElement('div'); root.innerHTML = xdc.innerHTML; walk(root, {});
  while (root.firstChild) document.body.appendChild(root.firstChild);
  var errors = [];
  mounts.forEach(function (m) {
    var C = m[1].split('.').reduce(function (o, k) { return o && o[k]; }, window);
    if (!C) { errors.push('missing component ' + m[1]); return; }
    var kids = m[3] ? React.createElement('span', { dangerouslySetInnerHTML: { __html: m[3] }, style: { display: 'contents' } }) : undefined;
    try { ReactDOM.createRoot(m[0]).render(React.createElement(C, m[2], kids)); } catch (e) { errors.push(m[1] + ': ' + e.message); }
  });
  return errors;
};
