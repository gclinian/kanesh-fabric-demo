/* i18n.js — 前端中英切換(classic top-level script,全域函式)。
 *
 * 用法:在畫面字串裡把中文段落換成  ${t('中文','English')}
 *   例:`<h1>${t('首頁','Home')}</h1>`
 * 語言存 localStorage 的 dpp_demo:lang,平台與工廠共用、跨分頁同步。
 * platform.html 與 factory.html 都在自己的主程式之前載入本檔。
 */
(function () {
  var KEY = 'dpp_demo:lang';

  window.getLang = function () {
    try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'zh'; }
    catch (e) { return 'zh'; }
  };
  window.setLang = function (l) {
    l = (l === 'en') ? 'en' : 'zh';
    try { localStorage.setItem(KEY, l); } catch (e) {}
    try { document.documentElement.lang = (l === 'en') ? 'en' : 'zh-Hant'; } catch (e) {}
  };
  /* 依目前語言回傳字串;en 省略時退回 zh */
  window.t = function (zh, en) {
    return getLang() === 'en' ? (en == null ? zh : en) : zh;
  };
  /* 切換並重繪(平台/工廠都有全域 render())。 */
  window.toggleLang = function () {
    setLang(getLang() === 'en' ? 'zh' : 'en');
    if (typeof render === 'function') render();
  };
  /* 放進 topbar 的切換鈕 HTML;顯示目前語言,點擊切換。 */
  window.langChipHTML = function () {
    return '<span class="chip" style="cursor:pointer" onclick="toggleLang()" title="中文 / English">🌐 '
      + (getLang() === 'en' ? 'EN' : '中') + '</span>';
  };

  // 開頁先套用 <html lang>
  try { document.documentElement.lang = (window.getLang() === 'en') ? 'en' : 'zh-Hant'; } catch (e) {}
})();
