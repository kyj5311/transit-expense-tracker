/* ============================================================
   StorageModule (EH-02, 설계서 4.2)
   모든 모듈의 LocalStorage 저장/로드를 한 곳에서 공통으로 처리한다.
   다른 모듈은 전부 이 파일의 save()/load()를 거쳐서만 LocalStorage에 접근한다.
   ============================================================ */

// 객체를 JSON 문자열로 바꿔 LocalStorage에 저장한다. (6.1 IF-04)
// key: 저장할 키 이름 (예: 'fareData') / data: 저장할 객체
// 성공하면 true를 반환한다. 저장 중 오류(용량 초과 등)가 나면 콘솔에 경고를 남기고 false를 반환한다 —
// 이 경우 LocalStorage에는 이전 데이터가 그대로 남아있으므로 데이터가 깨지지 않는다 (EH-02).
function save(key, data) {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(key, json);
    return true;
  } catch (error) {
    console.warn('[StorageModule] 저장 실패:', key, error);
    return false;
  }
}

// LocalStorage에서 key에 해당하는 데이터를 읽어와 원래 객체 형태로 돌려준다.
// 저장된 값이 없거나, 저장된 문자열이 손상되어 파싱에 실패하면 null을 반환하고 콘솔에 경고를 남긴다.
// 호출하는 쪽(FareModule 등)은 null을 "저장된 데이터 없음"으로 판단해 기본값 등을 채워 넣으면 된다.
function load(key) {
  try {
    const json = localStorage.getItem(key);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.warn('[StorageModule] 로드 실패:', key, error);
    return null;
  }
}
