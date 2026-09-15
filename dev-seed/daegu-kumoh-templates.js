/* ============================================================
   개발/테스트용 더미 데이터 시드 스크립트 (앱 배포물이 아님)
   ------------------------------------------------------------
   대구에서 통학하는 팀원의 실제 경로를 가정해 템플릿 3개를 만든다.
     1. 대구-금오공과대학교 통학(왕복)  — 등교 3구간 + 하교 3구간
     2. 대구-금오공과대학교 등교(편도)  — 위 왕복 템플릿의 등교 구간만
     3. 대구-금오공과대학교 하교(편도)  — 위 왕복 템플릿의 하교 구간만
   index.html/style.css/js/*.js 는 실제 제출 산출물이고, 이 파일은 거기에
   포함되지 않는다(<script> 태그로 안 걸려 있음) — 테스트할 때만 수동으로 실행한다.

   사용 방법
   1. index.html을 평소처럼 브라우저로 연다 (더블클릭).
   2. 이전에 이미 이 스크립트를 실행해본 적이 있다면(템플릿이 이미 등록돼 있다면),
      addTemplate()은 같은 이름이 있어도 중복 체크를 하지 않으므로 다시 실행하면
      템플릿이 중복으로 쌓인다. 개발자 도구(F12) 콘솔에서 localStorage.clear()를
      먼저 실행하고 페이지를 새로고침한 뒤 아래 3번부터 다시 진행한다.
   3. 개발자 도구 콘솔에 "allow pasting"을 먼저 입력해 붙여넣기를 허용한다
      (Chrome의 self-XSS 방지 경고일 뿐, 이 스크립트와는 무관하다).
   4. 이 파일 내용을 전체 복사해서 콘솔에 붙여넣고 Enter.
   5. "템플릿 등록" 화면에 템플릿 3개가 보이면 성공.
   ============================================================ */

// 등교(집→금오공대) 3구간 — 왕복 템플릿의 앞쪽 절반과 동일
const TO_SCHOOL = [
  { Name: '지하철 1호선 (집→대구역)',                Type: 'Train', Region: '대구', AgeType: 'Adult', IsTransfer: false },
  { Name: '대경선 (대구역→구미역)',                   Type: 'Train', Region: '구미', AgeType: 'Adult', IsTransfer: true },
  { Name: '구미역 셔틀버스 (구미역→금오공과대학교)',   Type: 'Bus',   Region: '구미', AgeType: 'Adult', IsTransfer: true }
];

// 하교(금오공대→집) 3구간 — 왕복 템플릿의 뒤쪽 절반과 동일
const TO_HOME = [
  { Name: '구미역 셔틀버스 (금오공과대학교→구미역)',   Type: 'Bus',   Region: '구미', AgeType: 'Adult', IsTransfer: false },
  { Name: '대경선 (구미역→대구역)',                   Type: 'Train', Region: '구미', AgeType: 'Adult', IsTransfer: true },
  { Name: '지하철 1호선 (대구역→집)',                 Type: 'Train', Region: '대구', AgeType: 'Adult', IsTransfer: true }
];

const results = {
  왕복: addTemplate({ Name: '대구-금오공과대학교 통학(왕복)', TPList: TO_SCHOOL.concat(TO_HOME) }),
  등교: addTemplate({ Name: '대구-금오공과대학교 등교(편도)', TPList: TO_SCHOOL }),
  하교: addTemplate({ Name: '대구-금오공과대학교 하교(편도)', TPList: TO_HOME })
};

console.log('[seed] 결과:', results);
