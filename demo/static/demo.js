document.addEventListener('click', function (e) {
  var k = e.target.closest('[aria-disabled="true"]');
  if (!k) return;
  e.preventDefault(); e.stopPropagation();
  var t = document.getElementById('demo-toast');
  t.textContent = 'In der Demo gesperrt';
  t.classList.add('sichtbar');
  clearTimeout(t.zeit);
  t.zeit = setTimeout(function () { t.classList.remove('sichtbar'); }, 1800);
}, true);
