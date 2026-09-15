/* ============================================================
   LogModule (FR-03, FR-06, 설계서 4.2)
   템플릿을 통해 일괄로, 또는 직접 입력으로 "실제 사용 내역"을 기록한다.
   내역 하나의 필드 구성은 템플릿 구간(TPList 항목)과 동일하다 — 등록 시각(Time)만 더 붙는다.
   ============================================================ */

// 런타임에 올려두고 쓰는 사용 내역 목록 (5.1의 in-memory 변수 `logList`에 해당).
let logList = [];

// 앱 실행 시마다 호출한다. LocalStorage에 저장된 logData가 있으면 불러오고, 없으면 빈 배열로 시작한다.
function initLogData() {
  const loaded = load('logData');
  logList = loaded ? loaded : [];
  return logList;
}

// 템플릿 하나를 선택해서, 그 안의 구간(TPList) 수만큼 사용 내역을 한 번에 등록한다. (6.1 IF-02)
// 예: "출근길" 템플릿에 구간이 2개면 → 사용 내역도 2건 생성됨 (FR-03 검증 기준: 템플릿 구간 수 = 생성된 내역 수)
//
// 처리 로직 (설계서 6.2 그대로):
//   ① templateList에서 templateName으로 템플릿 조회
//   ② TP List를 순회하며 구간마다 내역 객체 생성
//   ③ logList에 추가 후 저장
//
// 템플릿을 찾지 못하면 false를 반환한다 (예외 처리).
function addLogFromTemplate(templateName) {
  const template = getTemplateByName(templateName);

  if (!template) {
    return false;
  }

  // 같은 템플릿의 구간들을 한 번에 등록하므로, 등록 시각(Time)이 전부 똑같아지지 않도록
  // 구간 순서(i)만큼 1밀리초씩 밀어서 각 내역을 구분할 수 있는 고유한 Time 값을 만든다.
  template.TPList.forEach(function (segment, i) {
    logList.push({
      Time: new Date(Date.now() + i).toISOString(),
      Name: segment.Name,
      Type: segment.Type,
      Region: segment.Region,
      AgeType: segment.AgeType,
      IsTransfer: segment.IsTransfer
    });
  });

  save('logData', logList);
  return true;
}

// 템플릿을 거치지 않고 사용 내역 1건을 직접 등록한다. (4.1 표의 "입력: 템플릿 또는 직접 입력값" 중 후자)
// logObj 형태: { Name, Type, Region, AgeType, IsTransfer }
// Name은 사용자가 직접 타이핑하는 값이라 trim() 처리한다 (EH-01).
function addLog(logObj) {
  const name = logObj.Name.trim();

  if (!name || !logObj.Type || !logObj.Region || !logObj.AgeType) {
    return false;
  }

  logList.push({
    Time: new Date().toISOString(),
    Name: name,
    Type: logObj.Type,
    Region: logObj.Region,
    AgeType: logObj.AgeType,
    IsTransfer: !!logObj.IsTransfer
  });

  save('logData', logList);
  return true;
}

// 등록 시각(Time)으로 사용 내역 1건을 찾아 필드를 수정한다. (FR-06)
// updatedFields에 들어있는 값만 덮어쓰고, 나머지 필드는 그대로 유지한다.
// 성공하면 true, 해당 Time의 내역이 없으면 false를 반환한다.
function updateLog(time, updatedFields) {
  const target = logList.find(function (log) {
    return log.Time === time;
  });

  if (!target) {
    return false;
  }

  if (typeof updatedFields.Name === 'string') {
    target.Name = updatedFields.Name.trim();
  }
  if (updatedFields.Type) target.Type = updatedFields.Type;
  if (updatedFields.Region) target.Region = updatedFields.Region;
  if (updatedFields.AgeType) target.AgeType = updatedFields.AgeType;
  if (typeof updatedFields.IsTransfer === 'boolean') target.IsTransfer = updatedFields.IsTransfer;

  save('logData', logList);
  return true;
}

// 등록 시각(Time)으로 사용 내역 1건을 삭제한다. (FR-06)
// 성공하면 true, 해당 Time의 내역이 없으면 false를 반환한다.
function deleteLog(time) {
  const index = logList.findIndex(function (log) {
    return log.Time === time;
  });

  if (index === -1) {
    return false;
  }

  logList.splice(index, 1);
  save('logData', logList);
  return true;
}
