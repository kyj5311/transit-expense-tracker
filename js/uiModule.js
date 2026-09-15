/* ============================================================
   UIModule (FR-04, 설계서 4.2)
   화면 렌더링과 이벤트 바인딩을 담당한다.
   다른 모듈(TemplateModule/LogModule/PaymentCalcModule/FareModule)이 만든
   데이터를 가져다 화면(DOM)에 그리고, 버튼 클릭 등 사용자 입력을 받아
   다시 그 모듈들의 함수를 호출하는 "다리" 역할만 한다 — 계산이나 저장 로직은
   여기에 두지 않는다.
   ============================================================ */

// 내부 코드값(Train/Bus, Child/Youth/Adult)을 화면에 보여줄 한글 이름으로 바꾸는 표.
const TYPE_LABELS = { Train: '지하철', Bus: '버스' };
const AGE_LABELS = { Child: '어린이', Youth: '청소년', Adult: '성인' };

// 템플릿 등록 화면에서 "구간 추가"를 누를 때마다 여기 임시로 쌓인다.
// "템플릿으로 저장"을 눌러야 실제로 TemplateModule.addTemplate()에 전달되고 비워진다.
let draftSegments = [];

// 사용 내역 목록 화면에서 체크박스로 선택한 내역들의 Time 값 모음.
let selectedLogTimes = new Set();

// "선택한 내역만 지불 계산하기"로 넘어온 내역 배열. null이면 지불 계산 화면은
// 조회 단위(이번 달/전체) 기준으로 계산한다.
let selectedForPayment = null;

// 사용 내역 목록에서 지금 수정 중인 내역의 Time. null이면 아무 것도 수정 중이 아니다.
let editingLogTime = null;

/* ---------- 공통 유틸리티 ---------- */

// 사용자가 입력한 문자열(노선명 등)을 화면에 넣기 전에 이스케이프한다.
// innerHTML로 직접 문자열을 조립하기 때문에, 이 처리가 없으면 사용자가
// "<script>..." 같은 값을 노선명에 입력했을 때 그대로 실행되어 버릴 수 있다.
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}

// 숫자를 "1,500원" 형태로 표시한다.
function formatWon(amount) {
  return amount.toLocaleString('ko-KR') + '원';
}

// 한 자리 수 앞에 0을 붙인다 (5 -> "05").
function pad2(n) {
  return String(n).padStart(2, '0');
}

// ISO 시각 문자열을 "09-05 11:05" 형태로 바꾼다 (7.2 목업의 표시 형식).
function formatDateTime(isoString) {
  const d = new Date(isoString);
  return pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

// Date(혹은 ISO 문자열)를 "연-월" 키로 바꾼다. 예: "2026-09".
// log.Time은 UTC 기준 ISO 문자열이라 문자열을 그대로 잘라 쓰면(slice) 한국 시간 기준
// 월과 어긋날 수 있어서(자정 근처 시각), 항상 Date 객체로 만들어 "로컬 시간" 기준으로 비교한다.
function getYearMonthKey(isoStringOrDate) {
  const d = isoStringOrDate instanceof Date ? isoStringOrDate : new Date(isoStringOrDate);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1);
}

// scope('all' | 'month')에 따라 logList에서 계산/조회 대상 내역만 골라 반환한다.
function filterLogsByScope(scope) {
  if (scope === 'month') {
    const currentKey = getYearMonthKey(new Date());
    return logList.filter(function (log) {
      return getYearMonthKey(log.Time) === currentKey;
    });
  }
  return logList.slice();
}

// 내역 한 건의 기본요금/환승할인율/실제금액을 함께 반환한다 (상세 내역 표 표시용).
// 실제 지불 금액(finalFare)은 PaymentCalcModule의 calculateSingleFare를 그대로 재사용해서,
// 여기서 따로 계산한 값과 총 합계 계산 로직이 어긋나지 않도록 한다.
function getFareDetail(log, fareData) {
  const region = fareData.Region.find(function (r) {
    return r.Name === log.Region;
  });
  const fareTable = region[log.Type];

  return {
    baseFare: fareTable[log.AgeType],
    transferDC: fareTable.TransferDC,
    finalFare: calculateSingleFare(log, fareData)
  };
}

/* ---------- 화면 전환 ---------- */

// 탭 버튼(data-tab) 또는 바로가기 버튼(data-goto)에서 지정한 화면으로 전환한다.
// 전환할 때마다 해당 화면을 최신 데이터로 다시 그린다.
function switchTab(tabName) {
  document.querySelectorAll('.view').forEach(function (view) {
    view.hidden = view.id !== 'view-' + tabName;
  });
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  if (tabName === 'dashboard') renderDashboard();
  else if (tabName === 'template') renderTemplateScreen();
  else if (tabName === 'log') renderLogScreen();
  else if (tabName === 'payment') renderPaymentScreen();
}

/* ---------- UI-01 대시보드 ---------- */

function renderDashboard() {
  const monthLogs = filterLogsByScope('month');
  const total = calculatePayment(monthLogs, fareData);

  document.getElementById('dashTotal').textContent = formatWon(total);
  document.getElementById('dashTemplateCount').textContent = templateList.length + '개';
  document.getElementById('dashLogCount').textContent = monthLogs.length + '건';

  const recentLogs = logList.slice().sort(function (a, b) {
    return b.Time.localeCompare(a.Time);
  }).slice(0, 5);

  const tbody = document.getElementById('dashRecentLogs');
  tbody.innerHTML = recentLogs.map(function (log) {
    return '<tr><td>' + formatDateTime(log.Time) + '</td><td>' + escapeHtml(log.Name) + '</td><td>' +
      TYPE_LABELS[log.Type] + (log.IsTransfer ? ' · 환승' : '') + '</td></tr>';
  }).join('');
}

/* ---------- UI-02 노선 템플릿 등록 ---------- */

// fareData.Region의 지역명으로 "지역" select의 option을 채운다. (앱 시작 시 1회 호출)
function populateRegionOptions() {
  const select = document.getElementById('segmentRegion');
  select.innerHTML = fareData.Region.map(function (region) {
    return '<option value="' + escapeHtml(region.Name) + '">' + escapeHtml(region.Name) + '</option>';
  }).join('');
}

// "템플릿으로 저장" 버튼은 구간이 하나 이상 추가되어 있고, 템플릿 이름도 입력되어 있어야 눌린다.
function updateSaveTemplateBtnState() {
  const nameFilled = document.getElementById('templateNameInput').value.trim().length > 0;
  document.getElementById('saveTemplateBtn').disabled = !(draftSegments.length > 0 && nameFilled);
}

function renderTemplateScreen() {
  const draftEl = document.getElementById('draftSegmentList');

  if (draftSegments.length === 0) {
    draftEl.innerHTML = '<p class="empty">추가된 구간이 없습니다.</p>';
  } else {
    draftEl.innerHTML = draftSegments.map(function (seg, i) {
      return '<div class="draft-item"><span>' + escapeHtml(seg.Name) + ' (' + TYPE_LABELS[seg.Type] + ' · ' +
        escapeHtml(seg.Region) + ' · ' + AGE_LABELS[seg.AgeType] + (seg.IsTransfer ? ' · 환승' : '') +
        ')</span><button type="button" class="remove-draft-btn" data-index="' + i + '">제거</button></div>';
    }).join('');
  }

  const tbody = document.getElementById('templateListBody');
  tbody.innerHTML = templateList.map(function (tpl) {
    return '<tr><td>' + escapeHtml(tpl.Name) + '</td><td>' + tpl.TPList.length + '구간</td><td>' +
      '<button type="button" class="register-log-btn" data-name="' + escapeHtml(tpl.Name) + '">내역등록</button>' +
      '<button type="button" class="delete-template-btn" data-name="' + escapeHtml(tpl.Name) + '">삭제</button></td></tr>';
  }).join('');

  updateSaveTemplateBtnState();
}

function bindTemplateFormEvents() {
  const segmentNameInput = document.getElementById('segmentName');
  const addSegmentBtn = document.getElementById('addSegmentBtn');

  // 노선명이 비어 있으면(trim 기준) 구간 추가 버튼을 눌러도 아무 일도 못 하게 막는다 (EH-01).
  segmentNameInput.addEventListener('input', function () {
    addSegmentBtn.disabled = segmentNameInput.value.trim().length === 0;
  });

  addSegmentBtn.addEventListener('click', function () {
    const name = segmentNameInput.value.trim();
    if (!name) return;

    draftSegments.push({
      Name: name,
      Type: document.getElementById('segmentType').value,
      Region: document.getElementById('segmentRegion').value,
      AgeType: document.getElementById('segmentAgeType').value,
      IsTransfer: document.getElementById('segmentIsTransfer').checked
    });

    segmentNameInput.value = '';
    document.getElementById('segmentIsTransfer').checked = false;
    addSegmentBtn.disabled = true;
    renderTemplateScreen();
  });

  const templateNameInput = document.getElementById('templateNameInput');
  templateNameInput.addEventListener('input', updateSaveTemplateBtnState);

  document.getElementById('saveTemplateBtn').addEventListener('click', function () {
    const messageEl = document.getElementById('templateMessage');
    const ok = addTemplate({ Name: templateNameInput.value, TPList: draftSegments });

    if (ok) {
      draftSegments = [];
      templateNameInput.value = '';
      messageEl.textContent = '템플릿이 등록되었습니다.';
    } else {
      messageEl.textContent = '템플릿 등록에 실패했습니다. 이름과 구간을 확인하세요.';
    }
    renderTemplateScreen();
  });

  // 구간 미리보기 목록의 [제거] 버튼들 — 이벤트 위임(delegation)으로 부모 요소 하나에만 리스너를 건다.
  // renderTemplateScreen()이 innerHTML을 통째로 다시 그릴 때마다 버튼도 새로 생기는데,
  // 매번 각 버튼에 리스너를 다시 붙이는 대신 부모(draftSegmentList)에 한 번만 걸어두면
  // 그 안에서 일어나는 클릭을 전부 잡아낼 수 있다.
  document.getElementById('draftSegmentList').addEventListener('click', function (e) {
    if (e.target.classList.contains('remove-draft-btn')) {
      draftSegments.splice(Number(e.target.dataset.index), 1);
      renderTemplateScreen();
    }
  });

  // 등록된 템플릿 목록의 [내역등록]/[삭제] 버튼도 같은 이유로 이벤트 위임을 사용한다.
  document.getElementById('templateListBody').addEventListener('click', function (e) {
    const name = e.target.dataset.name;

    if (e.target.classList.contains('register-log-btn')) {
      const ok = addLogFromTemplate(name);
      document.getElementById('templateMessage').textContent =
        ok ? '"' + name + '" 템플릿으로 사용 내역이 등록되었습니다.' : '내역 등록에 실패했습니다.';
    } else if (e.target.classList.contains('delete-template-btn')) {
      deleteTemplate(name);
      renderTemplateScreen();
    }
  });
}

/* ---------- UI-03 사용 내역 목록 ---------- */

function renderLogScreen() {
  const scope = document.getElementById('logFilterSelect').value;
  const logs = filterLogsByScope(scope).slice().sort(function (a, b) {
    return b.Time.localeCompare(a.Time);
  });

  const tbody = document.getElementById('logListBody');

  tbody.innerHTML = logs.map(function (log) {
    if (log.Time === editingLogTime) {
      // 수정 모드: 노선명/구분/환승만 화면에서 바로 고칠 수 있게 입력 요소로 바꿔서 그린다.
      // (일시는 등록 시각이라 그대로 두고, 지역/요금등급은 목록 화면에 컬럼 자체가 없어 그대로 유지)
      return '<tr>' +
        '<td></td>' +
        '<td>' + formatDateTime(log.Time) + '</td>' +
        '<td><input type="text" class="edit-name-input" value="' + escapeHtml(log.Name) + '"></td>' +
        '<td><select class="edit-type-select">' +
          '<option value="Train"' + (log.Type === 'Train' ? ' selected' : '') + '>지하철</option>' +
          '<option value="Bus"' + (log.Type === 'Bus' ? ' selected' : '') + '>버스</option>' +
        '</select></td>' +
        '<td><input type="checkbox" class="edit-transfer-checkbox"' + (log.IsTransfer ? ' checked' : '') + '></td>' +
        '<td>' +
          '<button type="button" class="save-log-btn" data-time="' + log.Time + '">저장</button>' +
          '<button type="button" class="cancel-edit-btn">취소</button>' +
        '</td></tr>';
    }

    return '<tr>' +
      '<td><input type="checkbox" class="log-select-checkbox" data-time="' + log.Time + '"' +
        (selectedLogTimes.has(log.Time) ? ' checked' : '') + '></td>' +
      '<td>' + formatDateTime(log.Time) + '</td>' +
      '<td>' + escapeHtml(log.Name) + '</td>' +
      '<td>' + TYPE_LABELS[log.Type] + '</td>' +
      '<td>' + (log.IsTransfer ? '환승' : '-') + '</td>' +
      '<td>' +
        '<button type="button" class="edit-log-btn" data-time="' + log.Time + '">수정</button>' +
        '<button type="button" class="delete-log-btn" data-time="' + log.Time + '">삭제</button>' +
      '</td></tr>';
  }).join('');
}

function bindLogScreenEvents() {
  document.getElementById('logFilterSelect').addEventListener('change', renderLogScreen);

  document.getElementById('calcSelectedBtn').addEventListener('click', function () {
    if (selectedLogTimes.size === 0) {
      alert('선택된 내역이 없습니다.');
      return;
    }
    selectedForPayment = logList.filter(function (log) {
      return selectedLogTimes.has(log.Time);
    });
    switchTab('payment');
  });

  const tbody = document.getElementById('logListBody');

  // 수정/삭제/저장/취소 버튼 전부 이벤트 위임으로 처리 (renderLogScreen이 매번 행을 새로 그리므로).
  tbody.addEventListener('click', function (e) {
    const time = e.target.dataset.time;

    if (e.target.classList.contains('edit-log-btn')) {
      editingLogTime = time;
      renderLogScreen();
    } else if (e.target.classList.contains('cancel-edit-btn')) {
      editingLogTime = null;
      renderLogScreen();
    } else if (e.target.classList.contains('delete-log-btn')) {
      deleteLog(time);
      selectedLogTimes.delete(time);
      renderLogScreen();
    } else if (e.target.classList.contains('save-log-btn')) {
      const row = e.target.closest('tr');
      updateLog(time, {
        Name: row.querySelector('.edit-name-input').value,
        Type: row.querySelector('.edit-type-select').value,
        IsTransfer: row.querySelector('.edit-transfer-checkbox').checked
      });
      editingLogTime = null;
      renderLogScreen();
    }
  });

  // 체크박스는 click이 아니라 change 이벤트로 상태를 잡는다 (체크 상태가 실제로 바뀐 뒤 발생).
  tbody.addEventListener('change', function (e) {
    if (e.target.classList.contains('log-select-checkbox')) {
      const time = e.target.dataset.time;
      if (e.target.checked) selectedLogTimes.add(time);
      else selectedLogTimes.delete(time);
    }
  });
}

/* ---------- UI-04 지불 금액 계산 ---------- */

function renderPaymentScreen() {
  const noticeEl = document.getElementById('paymentSelectedNotice');
  let targetLogs;

  if (selectedForPayment) {
    targetLogs = selectedForPayment;
    noticeEl.hidden = false;
    noticeEl.textContent = '선택한 ' + targetLogs.length + '건 내역 기준으로 계산했습니다. ' +
      '(조회 단위로 다시 계산하려면 "계산하기" 버튼을 누르세요)';
  } else {
    noticeEl.hidden = true;
    targetLogs = filterLogsByScope(document.getElementById('paymentScopeSelect').value);
  }

  const total = calculatePayment(targetLogs, fareData);
  document.getElementById('paymentTotal').textContent = formatWon(total);

  const tbody = document.getElementById('paymentDetailBody');
  tbody.innerHTML = targetLogs.map(function (log) {
    const detail = getFareDetail(log, fareData);
    const transferText = log.IsTransfer ? '× ' + Math.round(detail.transferDC * 100) + '%' : '-';

    return '<tr><td>' + escapeHtml(log.Name) + '</td><td>' + formatWon(detail.baseFare) + '</td><td>' +
      transferText + '</td><td>' + formatWon(detail.finalFare) + '</td></tr>';
  }).join('');
}

function bindPaymentScreenEvents() {
  // "계산하기"를 누르면 선택 모드(selectedForPayment)를 해제하고 조회 단위(select) 기준으로 되돌아간다.
  document.getElementById('calcPaymentBtn').addEventListener('click', function () {
    selectedForPayment = null;
    renderPaymentScreen();
  });
}

/* ---------- 앱 시작 ---------- */

function bindTabEvents() {
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchTab(btn.dataset.tab);
    });
  });

  document.querySelectorAll('[data-goto]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchTab(btn.dataset.goto);
    });
  });
}

// 앱이 처음 열렸을 때 딱 한 번 실행된다: 각 모듈의 데이터를 불러오고, 화면을 준비하고,
// 이벤트를 연결한 뒤 첫 화면(대시보드)을 그린다.
function initApp() {
  initFareData();
  initTemplateData();
  initLogData();

  populateRegionOptions();
  bindTabEvents();
  bindTemplateFormEvents();
  bindLogScreenEvents();
  bindPaymentScreenEvents();

  switchTab('dashboard');
}

document.addEventListener('DOMContentLoaded', initApp);
