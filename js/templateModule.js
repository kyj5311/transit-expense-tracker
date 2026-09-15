/* ============================================================
   TemplateModule (FR-02, FR-06, 설계서 4.2)
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
function addTemplate(templateObj) {
  const name = templateObj.Name.trim();

  if (!name || !templateObj.TPList || templateObj.TPList.length === 0) {
    return false;
  }

  templateList.push({ Name: name, TPList: templateObj.TPList });
  save('templateData', templateList);
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
// 성공하면 true, 해당 이름의 템플릿이 없으면 false를 반환한다.
function deleteTemplate(templateName) {
  const index = templateList.findIndex(function (template) {
    return template.Name === templateName;
  });

  if (index === -1) {
    return false;
  }

  templateList.splice(index, 1);
  save('templateData', templateList);
  return true;
}
