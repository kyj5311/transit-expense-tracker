/* ============================================================
   개발/테스트용 더미 데이터 시드 스크립트 (앱 배포물이 아님)
   ------------------------------------------------------------
   대구에서 통학하는 팀원의 실제 경로를 가정한 "왕복 통학" 템플릿을 만든다.
   index.html/style.css/js/*.js 는 실제 제출 산출물이고, 이 파일은 거기에
   포함되지 않는다(<script> 태그로 안 걸려 있음) — 테스트할 때만 수동으로 실행한다.

   사용 방법
   1. index.html을 평소처럼 브라우저로 연다 (더블클릭).
   2. 이 파일이 만들어지기 전에 이미 사용해봤다면(LocalStorage에 fareData가 저장돼 있다면)
      새로 추가된 "구미" 지역이 반영되지 않는다. 개발자 도구(F12) 콘솔에서
      localStorage.clear() 를 먼저 실행하고 페이지를 새로고침한다.
      (완전히 새로 시작하는 게 아니라 기존 데이터를 유지하고 싶다면 대신
       initFareData() 를 다시 호출해도 되지만, 그러면 여전히 저장된 값이 우선이라
       구미가 안 보인다 — 가장 간단한 방법은 localStorage.clear()다.)
   3. 개발자 도구 콘솔에 이 파일 내용을 전체 복사해서 붙여넣고 Enter.
      (콘솔이 "Don't paste code you don't understand..." 경고를 띄우면,
       콘솔 자체의 자기방어 기능일 뿐 이 파일과는 무관하다. 콘솔에 그대로
       allow pasting 이라고 입력하고 Enter를 한 번 누른 뒤, 이 파일 내용을
       다시 붙여넣으면 된다.)
   4. "사용 내역" 화면을 보면 템플릿 등록 화면에 "대구-금오공과대학교 통학(왕복)"
      템플릿이 생겨 있다. [내역등록]을 누르면 구간 6개가 사용 내역으로 한 번에 등록된다.
   ============================================================ */

const ok = addTemplate({
  Name: '대구-금오공과대학교 통학(왕복)',
  TPList: [
    // 등교: 집(대구 시내) → 대구역 → 구미역 → 금오공과대학교
    { Name: '지하철 1호선 (집→대구역)',                Type: 'Train', Region: '대구', AgeType: 'Adult', IsTransfer: false },
    { Name: '대경선 (대구역→구미역)',                   Type: 'Train', Region: '구미', AgeType: 'Adult', IsTransfer: true },
    { Name: '구미역 셔틀버스 (구미역→금오공과대학교)',   Type: 'Bus',   Region: '구미', AgeType: 'Adult', IsTransfer: true },

    // 하교: 금오공과대학교 → 구미역 → 대구역 → 집(대구 시내)
    { Name: '구미역 셔틀버스 (금오공과대학교→구미역)',   Type: 'Bus',   Region: '구미', AgeType: 'Adult', IsTransfer: false },
    { Name: '대경선 (구미역→대구역)',                   Type: 'Train', Region: '구미', AgeType: 'Adult', IsTransfer: true },
    { Name: '지하철 1호선 (대구역→집)',                 Type: 'Train', Region: '대구', AgeType: 'Adult', IsTransfer: true }
  ]
});

console.log(ok ? '[seed] 템플릿 등록 완료' : '[seed] 템플릿 등록 실패 — "구미" 지역이 fareData에 있는지 확인하세요');
