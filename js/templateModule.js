/* ============================================================
   TemplateModule (FR-02, FR-06, 설계서 4.2) — 템플릿 등록·수정·삭제
   사용자가 자주 쓰는 노선을 "템플릿"으로 등록해두고 재사용한다.
   템플릿 하나 = 이름(Name) + 여러 개의 구간(TPList).
   예: "출근길" 템플릿 = [ 대구3호선 지하철 구간, 724번 버스 구간 ]
   ============================================================ */

// 런타임에 올려두고 쓰는 템플릿 목록 (5.1의 in-memory 변수 `templateList`에 해당).
// initTemplateData()가 호출되기 전에는 빈 배열로 시작한다.
let templateList = [];

// 앱 실행 시마다 호출한다. LocalStorage에 저장된 templateData가 있으면 불러오고,
// 없으면(최초 실행) 빈 배열로 시작한다.
// FareModule과 달리 템플릿은 "기본으로 내장된 값"이 없다 — 전부 사용자가 화면에서 등록한 것이기 때문.
function initTemplateData() {
  const loaded = load('templateData');
  templateList = loaded ? loaded : [];
  return templateList;
}

// 새 템플릿을 등록한다. (6.1 IF-01: UIModule → TemplateModule)
// templateObj 형태: { Name: '출근길', TPList: [ { Name, Type, Region, AgeType, IsTransfer }, ... ] }
// - Name: 템플릿명(노선명), 유일하게 사용자가 직접 글자를 입력하는 항목이라 trim()으로 앞뒤 공백을 제거한다.
// - TPList: 구간 배열. 각 구간의 Type/Region/AgeType/IsTransfer는 버튼·선택 목록으로만 받으므로(EH-01)
//           여기서는 문자열 정제가 필요 없다.
// 이름이 비어 있거나 구간이 하나도 없으면 등록하지 않고 false를 반환한다.
// (화면에서는 이 조건일 때 등록 버튼 자체를 비활성화하지만, 데이터 계층에서도 한 번 더 방어한다.)
// 같은 이름(trim 후 기준)의 템플릿이 이미 있어도 false를 반환한다. 템플릿명은 템플릿을 찾는
// 식별 키(5.2)라서, 중복되면 getTemplateByName()/deleteTemplate()이 항상 첫 번째 것만 찾게 되어
// 두 번째 템플릿은 내역 등록도 삭제도 할 수 없게 되기 때문이다.
//
// 저장 순서 (EH-02, 5.1 ⑤ "LocalStorage와 런타임 데이터를 항상 일치"):
// templateList를 바로 고치지 않고, 변경을 반영한 "새 배열"을 먼저 만들어 저장해본다.
// 저장에 성공했을 때만 templateList를 새 배열로 바꾸고, 실패하면 false를 반환한다.
// 이렇게 하면 저장이 실패해도 templateList는 한 번도 바뀌지 않았으므로 되돌릴 필요가 없고,
// "화면엔 등록됐는데 새로고침하면 사라지는" 불일치가 생기지 않는다. (아래 deleteTemplate도 동일)
function addTemplate(templateObj) {
  const name = templateObj.Name.trim();

  if (!name || !templateObj.TPList || templateObj.TPList.length === 0) {
    return false;
  }

  if (getTemplateByName(name)) {
    return false;
  }

  const nextList = templateList.concat([{ Name: name, TPList: templateObj.TPList }]);

  if (!save('templateData', nextList)) {
    return false;
  }

  templateList = nextList;
  return true;
}

// 기존 템플릿(originalName)의 이름과 구간 목록을 templateObj 내용으로 바꾼다. (FR-06)
// templateObj 형태는 addTemplate()과 같다: { Name, TPList }
// - 이름이 비었거나 구간이 하나도 없으면 false (addTemplate과 같은 검증, EH-01)
// - 이름을 바꾸는데 그 이름을 이미 "다른" 템플릿이 쓰고 있으면 false (식별 키 중복 방지)
//   이름을 그대로 두고 구간만 고치는 경우는 자기 자신과 이름이 같은 것이므로 허용한다.
// - 저장 순서는 addTemplate과 같다: 새 배열을 먼저 저장해보고, 성공했을 때만 templateList를 교체 (EH-02)
// 이미 이 템플릿으로 등록해둔 사용 내역은 등록 시점에 값을 복사해둔 것이라 바뀌지 않는다.
// 성공하면 true, 대상 템플릿이 없거나 위 조건에 걸리거나 저장에 실패하면 false를 반환한다.
function updateTemplate(originalName, templateObj) {
  const index = templateList.findIndex(function (template) {
    return template.Name === originalName;
  });
  const name = templateObj.Name.trim();

  if (index === -1 || !name || !templateObj.TPList || templateObj.TPList.length === 0) {
    return false;
  }

  if (name !== originalName && getTemplateByName(name)) {
    return false;
  }

  const nextList = templateList.map(function (template, i) {
    return i === index ? { Name: name, TPList: templateObj.TPList } : template;
  });

  if (!save('templateData', nextList)) {
    return false;
  }

  templateList = nextList;
  return true;
}

// 템플릿명으로 템플릿 객체 하나를 찾아 반환한다. 없으면 undefined.
// LogModule의 addLogFromTemplate()이 "템플릿 기반으로 사용 내역을 만들 때" 이 함수로 템플릿을 조회한다.
function getTemplateByName(templateName) {
  return templateList.find(function (template) {
    return template.Name === templateName;
  });
}

// 템플릿명으로 템플릿을 목록에서 삭제한다. (FR-06)
// 성공하면 true, 해당 이름의 템플릿이 없거나 저장에 실패하면 false를 반환한다 (저장 실패 시 목록은 그대로).
function deleteTemplate(templateName) {
  const index = templateList.findIndex(function (template) {
    return template.Name === templateName;
  });

  if (index === -1) {
    return false;
  }

  const nextList = templateList.filter(function (template, i) {
    return i !== index;
  });

  if (!save('templateData', nextList)) {
    return false;
  }

  templateList = nextList;
  return true;
}
